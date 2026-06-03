#![no_std]
//! Prism Agent Treasury
//!
//! A non-custodial treasury that lets a business delegate spending to an AI agent
//! while the *contract* — not the model's good behaviour — enforces hard limits.
//! Every payment is checked against a policy (payee whitelist, per-task limit,
//! daily limit) and rejected on-chain if it violates the policy. Spend is
//! accounted per task so each agent payment is automatically attributable.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    PayeeNotWhitelisted = 2,
    ExceedsTaskLimit = 3,
    ExceedsDailyLimit = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct Config {
    /// Owner of the funds; the only one who can change the policy.
    pub admin: Address,
    /// The agent allowed to trigger payments (must sign each `pay`).
    pub agent: Address,
    /// SEP-41 / SAC token the treasury holds and spends (e.g. USDC).
    pub token: Address,
    /// Max total spend allowed per UTC calendar day (resets at 00:00 UTC).
    pub daily_limit: i128,
    /// Max spend allowed in a single payment.
    pub per_task_limit: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    Payee(Address),
    DaySpent(u64),
    TaskSpent(u64),
}

const SECONDS_PER_DAY: u64 = 86_400;

#[contract]
pub struct Treasury;

#[contractimpl]
impl Treasury {
    /// Atomic init at deploy time (no front-runnable `initialize`).
    pub fn __constructor(
        env: Env,
        admin: Address,
        agent: Address,
        token: Address,
        daily_limit: i128,
        per_task_limit: i128,
    ) {
        let cfg = Config {
            admin,
            agent,
            token,
            daily_limit,
            per_task_limit,
        };
        env.storage().instance().set(&DataKey::Config, &cfg);
    }

    /// Whitelist a payee. Admin-only.
    pub fn add_payee(env: Env, payee: Address) {
        let cfg = Self::cfg(&env);
        cfg.admin.require_auth();
        env.storage().persistent().set(&DataKey::Payee(payee), &true);
    }

    /// Remove a payee from the whitelist. Admin-only.
    pub fn remove_payee(env: Env, payee: Address) {
        let cfg = Self::cfg(&env);
        cfg.admin.require_auth();
        env.storage().persistent().remove(&DataKey::Payee(payee));
    }

    /// The agent asks the treasury to pay `amount` to `to` for `task_id`.
    /// The contract enforces the policy and rejects any violation on-chain.
    pub fn pay(env: Env, task_id: u64, to: Address, amount: i128) -> Result<(), Error> {
        let cfg = Self::cfg(&env);
        cfg.agent.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // ---- POLICY GATE ----------------------------------------------------
        // (ERC-8004 trust check slots in here: require `to` to be a registered
        //  agent with reputation >= threshold before the whitelist check.)
        if !Self::is_payee(env.clone(), to.clone()) {
            return Err(Error::PayeeNotWhitelisted);
        }
        if amount > cfg.per_task_limit {
            return Err(Error::ExceedsTaskLimit);
        }
        let day = env.ledger().timestamp() / SECONDS_PER_DAY;
        let spent_today = Self::day_spent_on(&env, day);
        if spent_today + amount > cfg.daily_limit {
            return Err(Error::ExceedsDailyLimit);
        }
        // ---------------------------------------------------------------------

        // ---- EFFECTS: record the spend BEFORE moving funds (checks-effects-interactions).
        // per-day enforces the daily limit; per-task is the attribution ledger.
        let task_spent = Self::task_spent(env.clone(), task_id);
        env.storage()
            .persistent()
            .set(&DataKey::DaySpent(day), &(spent_today + amount));
        env.storage()
            .persistent()
            .set(&DataKey::TaskSpent(task_id), &(task_spent + amount));

        // ---- INTERACTION: move the treasury's own balance out last. If the transfer
        // panics, the whole tx reverts and the accounting above is rolled back atomically.
        token::TokenClient::new(&env, &cfg.token).transfer(
            &env.current_contract_address(),
            &to,
            &amount,
        );

        env.events()
            .publish((symbol_short!("paid"), task_id), (to, amount));
        Ok(())
    }

    // ---- views -------------------------------------------------------------

    pub fn get_config(env: Env) -> Config {
        Self::cfg(&env)
    }

    pub fn is_payee(env: Env, payee: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Payee(payee))
            .unwrap_or(false)
    }

    pub fn task_spent(env: Env, task_id: u64) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TaskSpent(task_id))
            .unwrap_or(0)
    }

    pub fn day_spent(env: Env) -> i128 {
        let day = env.ledger().timestamp() / SECONDS_PER_DAY;
        Self::day_spent_on(&env, day)
    }

    pub fn balance(env: Env) -> i128 {
        let cfg = Self::cfg(&env);
        token::TokenClient::new(&env, &cfg.token).balance(&env.current_contract_address())
    }
}

// Non-exported helpers (separate impl block so they are not part of the ABI).
impl Treasury {
    fn cfg(env: &Env) -> Config {
        env.storage().instance().get(&DataKey::Config).unwrap()
    }

    fn day_spent_on(env: &Env, day: u64) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::DaySpent(day))
            .unwrap_or(0)
    }
}

mod test;
