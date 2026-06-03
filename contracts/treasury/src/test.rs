#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

/// Deploy a fresh treasury + test token (funded with 500 units) and return the
/// handles the tests need. `daily_limit` / `per_task_limit` go to the constructor.
fn setup<'a>(
    env: &'a Env,
    daily_limit: i128,
    per_task_limit: i128,
) -> (Address, TreasuryClient<'a>, TokenClient<'a>) {
    let admin = Address::generate(env);
    let agent = Address::generate(env);
    let payee = Address::generate(env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let token_admin = StellarAssetClient::new(env, &token_addr);
    let token = TokenClient::new(env, &token_addr);

    let id = env.register(
        Treasury,
        (admin, agent, token_addr, daily_limit, per_task_limit),
    );
    let client = TreasuryClient::new(env, &id);
    token_admin.mint(&id, &500_i128);

    (payee, client, token)
}

#[test]
fn pay_accounting_and_rejections() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let agent = Address::generate(&env);
    let payee = Address::generate(&env);
    let attacker = Address::generate(&env);

    // Deploy a test token (Stellar Asset Contract) with `admin` as issuer.
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let token_admin = StellarAssetClient::new(&env, &token_addr);
    let token = TokenClient::new(&env, &token_addr);

    // Deploy the treasury: daily_limit = 1000, per_task_limit = 100.
    let id = env.register(
        Treasury,
        (
            admin.clone(),
            agent.clone(),
            token_addr.clone(),
            1000_i128,
            100_i128,
        ),
    );
    let client = TreasuryClient::new(&env, &id);

    // Fund the treasury with 500 units.
    token_admin.mint(&id, &500_i128);
    assert_eq!(client.balance(), 500);

    // Whitelist the payee.
    client.add_payee(&payee);
    assert!(client.is_payee(&payee));

    // Legit payment within limits.
    client.pay(&1_u64, &payee, &50_i128);
    assert_eq!(token.balance(&payee), 50);
    assert_eq!(client.task_spent(&1), 50);
    assert_eq!(client.day_spent(), 50);

    // Reject: recipient not whitelisted (the "rogue / prompt-injected" case).
    assert_eq!(
        client.try_pay(&2_u64, &attacker, &10_i128),
        Err(Ok(Error::PayeeNotWhitelisted))
    );
    assert_eq!(token.balance(&attacker), 0);

    // Reject: exceeds per-task limit.
    assert_eq!(
        client.try_pay(&3_u64, &payee, &200_i128),
        Err(Ok(Error::ExceedsTaskLimit))
    );

    // Second valid payment accumulates daily + task spend.
    client.pay(&1_u64, &payee, &30_i128);
    assert_eq!(client.task_spent(&1), 80);
    assert_eq!(client.day_spent(), 80);
}

/// The daily limit is enforced even when each individual payment is within the
/// per-task limit. (This path — Error #4 — was previously untested.)
#[test]
fn exceeds_daily_limit_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (payee, client, token) = setup(&env, 100_i128, 60_i128);

    client.add_payee(&payee);
    client.pay(&1_u64, &payee, &60_i128);
    assert_eq!(client.day_spent(), 60);

    // 50 is within per-task (60) but would push the day to 110 > 100 → rejected.
    assert_eq!(
        client.try_pay(&2_u64, &payee, &50_i128),
        Err(Ok(Error::ExceedsDailyLimit))
    );

    // Hitting the daily limit exactly (60 + 40 = 100) is still allowed.
    client.pay(&3_u64, &payee, &40_i128);
    assert_eq!(client.day_spent(), 100);
    assert_eq!(token.balance(&payee), 100);
}

/// The daily counter is keyed by UTC day, so it resets when the ledger crosses
/// a day boundary. (Documents the calendar-day semantics explicitly.)
#[test]
fn daily_limit_resets_on_new_utc_day() {
    let env = Env::default();
    env.mock_all_auths();
    let (payee, client, token) = setup(&env, 100_i128, 100_i128);

    client.add_payee(&payee);
    client.pay(&1_u64, &payee, &100_i128);
    assert_eq!(client.day_spent(), 100);
    assert_eq!(
        client.try_pay(&2_u64, &payee, &1_i128),
        Err(Ok(Error::ExceedsDailyLimit))
    );

    // Advance the ledger one full UTC day; a fresh day key means a fresh allowance.
    env.ledger().with_mut(|li| li.timestamp = SECONDS_PER_DAY);
    client.pay(&3_u64, &payee, &100_i128);
    assert_eq!(client.day_spent(), 100);
    assert_eq!(token.balance(&payee), 200);
}

/// Once a payee is removed from the whitelist, payments to it are rejected.
#[test]
fn rejects_payment_after_payee_removed() {
    let env = Env::default();
    env.mock_all_auths();
    let (payee, client, _token) = setup(&env, 1000_i128, 100_i128);

    client.add_payee(&payee);
    client.pay(&1_u64, &payee, &10_i128);

    client.remove_payee(&payee);
    assert!(!client.is_payee(&payee));
    assert_eq!(
        client.try_pay(&2_u64, &payee, &10_i128),
        Err(Ok(Error::PayeeNotWhitelisted))
    );
}

/// Zero and negative amounts are rejected before any transfer is attempted.
#[test]
fn rejects_zero_and_negative_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let (payee, client, _token) = setup(&env, 1000_i128, 100_i128);

    client.add_payee(&payee);
    assert_eq!(
        client.try_pay(&1_u64, &payee, &0_i128),
        Err(Ok(Error::InvalidAmount))
    );
    assert_eq!(
        client.try_pay(&2_u64, &payee, &-5_i128),
        Err(Ok(Error::InvalidAmount))
    );
}

/// A payment exactly at the per-task limit is allowed; one unit over is rejected.
#[test]
fn per_task_limit_boundary() {
    let env = Env::default();
    env.mock_all_auths();
    let (payee, client, token) = setup(&env, 1000_i128, 100_i128);

    client.add_payee(&payee);
    client.pay(&1_u64, &payee, &100_i128);
    assert_eq!(token.balance(&payee), 100);
    assert_eq!(
        client.try_pay(&2_u64, &payee, &101_i128),
        Err(Ok(Error::ExceedsTaskLimit))
    );
}
