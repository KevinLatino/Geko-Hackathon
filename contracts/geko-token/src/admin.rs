use soroban_sdk::{assert_with_error, panic_with_error, Address, Env, String};

use crate::events::Events;
use crate::errors::Error;
use crate::storage::{BalanceStorage, MetadataStorage};
use crate::types::TokenStorage;

/// Administrative functions for the token contract
pub struct Admin;

impl Admin {
    /// Initialize the token with metadata
    pub fn initialize(
        env: &Env,
        admin: &Address,
        name: &String,
        symbol: &String,
        decimals: u32,
    ) {
        if MetadataStorage::is_initialized(env) {
            panic_with_error!(env, Error::AlreadyInitialized);
        }

        let token = TokenStorage {
            admin: admin.clone(),
            name: name.clone(),
            symbol: symbol.clone(),
            decimals,
        };
        MetadataStorage::set_token(env, &token);
    }

    /// Get the admin address
    pub fn get_admin(env: &Env) -> Address {
        MetadataStorage::get_admin(env)
    }

    /// Mint tokens to an address
    pub fn mint(env: &Env, to: &Address, amount: i128) {
        // Check admin authorization
        let admin = Self::get_admin(env);
        admin.require_auth();

        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Add balance
        BalanceStorage::add(env, to, amount);

        // Emit mint event
        Events::mint(env, to, amount);
    }

    /// Clawback tokens from an address
    pub fn clawback(env: &Env, from: &Address, amount: i128) {
        // Check admin authorization
        let admin = Self::get_admin(env);
        admin.require_auth();

        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Subtract balance
        BalanceStorage::subtract(env, from, amount);

        // Emit clawback event
        Events::clawback(env, from, amount);
    }
}

