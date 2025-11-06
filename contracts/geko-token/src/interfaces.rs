use soroban_sdk::{assert_with_error, panic_with_error, Address, Env, String};

use crate::events::Events;
use crate::errors::Error;
use crate::storage::{AllowanceStorage, BalanceStorage, MetadataStorage};

/// TokenInterface trait definition according to SEP-0041
#[allow(clippy::module_name_repetitions)]
pub trait TokenInterface {
    fn allowance(env: Env, from: Address, spender: Address) -> i128;
    fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        live_until_ledger: u32,
    );
    fn balance(env: Env, id: Address) -> i128;
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128);
    fn burn(env: Env, from: Address, amount: i128);
    fn burn_from(env: Env, spender: Address, from: Address, amount: i128);
    fn decimals(env: Env) -> u32;
    fn name(env: Env) -> String;
    fn symbol(env: Env) -> String;
}

/// TokenInterface implementation
pub struct TokenInterfaceImpl;

impl TokenInterfaceImpl {
    pub fn allowance(env: &Env, from: &Address, spender: &Address) -> i128 {
        let allowance_val = AllowanceStorage::get(env, from, spender);
        let current_ledger = env.ledger().sequence();

        if allowance_val.expiration_ledger < current_ledger && allowance_val.expiration_ledger != 0 {
            return 0;
        }

        allowance_val.amount
    }

    pub fn approve(
        env: &Env,
        from: &Address,
        spender: &Address,
        amount: i128,
        live_until_ledger: u32,
    ) {
        from.require_auth();

        let current_ledger = env.ledger().sequence();
        if live_until_ledger < current_ledger && amount != 0 {
            panic_with_error!(env, Error::InvalidLedgerSequence);
        }

        AllowanceStorage::set(env, from, spender, amount, live_until_ledger);

        // Emit approve event
        Events::approve(env, from, spender, amount, live_until_ledger);
    }

    pub fn balance(env: &Env, id: &Address) -> i128 {
        BalanceStorage::get(env, id).amount
    }

    pub fn transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
        from.require_auth();
        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Get and validate from balance
        let from_balance = BalanceStorage::get(env, from);
        if from_balance.amount < amount {
            panic!("insufficient balance");
        }

        // Update balances
        BalanceStorage::subtract(env, from, amount);
        BalanceStorage::add(env, to, amount);

        // Emit transfer event
        Events::transfer(env, from, to, amount);
    }

    pub fn transfer_from(
        env: &Env,
        spender: &Address,
        from: &Address,
        to: &Address,
        amount: i128,
    ) {
        spender.require_auth();
        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Check and consume allowance
        let allowance_val = AllowanceStorage::get(env, from, spender);
        if !AllowanceStorage::is_valid(env, &allowance_val) {
            panic_with_error!(env, Error::AllowanceExpired);
        }

        AllowanceStorage::subtract(env, from, spender, amount);

        // Get and validate from balance
        let from_balance = BalanceStorage::get(env, from);
        if from_balance.amount < amount {
            panic!("insufficient balance");
        }

        // Update balances
        BalanceStorage::subtract(env, from, amount);
        BalanceStorage::add(env, to, amount);

        // Emit transfer event
        Events::transfer(env, from, to, amount);
    }

    pub fn burn(env: &Env, from: &Address, amount: i128) {
        from.require_auth();
        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Subtract balance
        BalanceStorage::subtract(env, from, amount);

        // Emit burn event
        Events::burn(env, from, amount);
    }

    pub fn burn_from(env: &Env, spender: &Address, from: &Address, amount: i128) {
        spender.require_auth();
        assert_with_error!(env, amount > 0, Error::NotPositive);

        // Check and consume allowance
        let allowance_val = AllowanceStorage::get(env, from, spender);
        if !AllowanceStorage::is_valid(env, &allowance_val) {
            panic!("allowance expired");
        }

        AllowanceStorage::subtract(env, from, spender, amount);

        // Subtract balance
        BalanceStorage::subtract(env, from, amount);

        // Emit burn event
        Events::burn(env, from, amount);
    }

    pub fn decimals(env: &Env) -> u32 {
        MetadataStorage::get_decimals(env)
    }

    pub fn name(env: &Env) -> String {
        MetadataStorage::get_name(env)
    }

    pub fn symbol(env: &Env) -> String {
        MetadataStorage::get_symbol(env)
    }
}

