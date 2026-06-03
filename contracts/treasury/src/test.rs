#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

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
