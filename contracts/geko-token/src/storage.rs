use soroban_sdk::{panic_with_error, Address, Env, String};

use crate::errors::Error;
use crate::types::{AllowanceKey, AllowanceValue, BalanceValue, DataKey, TokenStorage, STORAGE};

/// Metadata storage operations
pub struct MetadataStorage;

impl MetadataStorage {
    pub fn get_admin(env: &Env) -> Address {
        match env.storage().instance().get::<_, TokenStorage>(&STORAGE) {
            Some(st) => st.admin,
            None => panic_with_error!(env, Error::NotInitialized),
        }
    }

    // Convenience getters backed by consolidated TokenStorage
    pub fn get_name(env: &Env) -> String {
        match env.storage().instance().get::<_, TokenStorage>(&STORAGE) {
            Some(st) => st.name,
            None => panic_with_error!(env, Error::NotInitialized),
        }
    }
    pub fn get_symbol(env: &Env) -> String {
        match env.storage().instance().get::<_, TokenStorage>(&STORAGE) {
            Some(st) => st.symbol,
            None => panic_with_error!(env, Error::NotInitialized),
        }
    }
    pub fn get_decimals(env: &Env) -> u32 {
        match env.storage().instance().get::<_, TokenStorage>(&STORAGE) {
            Some(st) => st.decimals,
            None => panic_with_error!(env, Error::NotInitialized),
        }
    }
    pub fn set_token(env: &Env, storage: &TokenStorage) {
        env.storage().instance().set(&STORAGE, storage);
    }
    pub fn is_initialized(env: &Env) -> bool {
        env.storage().instance().has(&STORAGE)
    }
}

/// Balance storage operations
pub struct BalanceStorage;

impl BalanceStorage {
    pub fn get(env: &Env, id: &Address) -> BalanceValue {
        let key = DataKey::Balance(id.clone());
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(BalanceValue {
                amount: 0,
                authorized: false,
            })
    }

    pub fn set(env: &Env, id: &Address, balance: &BalanceValue) {
        let key = DataKey::Balance(id.clone());
        env.storage()
            .persistent()
            .set(&key, balance);
        let ttl = env.storage().max_ttl();
        env.storage().persistent().extend_ttl(&key, ttl, ttl);
    }

    pub fn add(env: &Env, id: &Address, amount: i128) {
        let mut balance = Self::get(env, id);
        balance.amount = match balance.amount.checked_add(amount) {
            Some(v) => v,
            None => panic_with_error!(env, Error::ArithmeticError),
        };
        balance.authorized = true;
        Self::set(env, id, &balance);
    }

    pub fn subtract(env: &Env, id: &Address, amount: i128) {
        let mut balance = Self::get(env, id);
        if balance.amount < amount {
            panic_with_error!(env, Error::InsufficientBalance);
        }
        balance.amount = match balance.amount.checked_sub(amount) {
            Some(v) => v,
            None => panic_with_error!(env, Error::ArithmeticError),
        };
        Self::set(env, id, &balance);
    }
}

/// Allowance storage operations
pub struct AllowanceStorage;

impl AllowanceStorage {
    pub fn get(env: &Env, from: &Address, spender: &Address) -> AllowanceValue {
        let key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(AllowanceValue {
                amount: 0,
                expiration_ledger: 0,
            })
    }

    pub fn set(
        env: &Env,
        from: &Address,
        spender: &Address,
        amount: i128,
        expiration_ledger: u32,
    ) {
        let key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let allowance = AllowanceValue {
            amount,
            expiration_ledger,
        };
        env.storage()
            .persistent()
            .set(&key, &allowance);
        let ttl = env.storage().max_ttl();
        env.storage().persistent().extend_ttl(&key, ttl, ttl);
    }

    pub fn subtract(env: &Env, from: &Address, spender: &Address, amount: i128) {
        let mut allowance = Self::get(env, from, spender);
        if allowance.amount < amount {
            panic_with_error!(env, Error::InsufficientAllowance);
        }
        allowance.amount = allowance.amount.checked_sub(amount).unwrap();
        Self::set(env, from, spender, allowance.amount, allowance.expiration_ledger);
    }

    pub fn is_valid(env: &Env, allowance: &AllowanceValue) -> bool {
        let current_ledger = env.ledger().sequence();
        allowance.expiration_ledger >= current_ledger || allowance.expiration_ledger == 0
    }
}

