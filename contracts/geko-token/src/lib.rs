#![no_std]

mod admin;
mod events;
mod errors;
mod interfaces;
mod storage;
mod types;

use soroban_sdk::{
    contract, contractimpl, Address, Env, String,
};

use admin::Admin;
use interfaces::{TokenInterface, TokenInterfaceImpl};

#[contract]
pub struct GekoToken;

#[contractimpl]
impl GekoToken {
    /// Initialize the token with metadata
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) {
        Admin::initialize(&env, &admin, &name, &symbol, decimals);
    }

    /// Get the admin address
    pub fn admin(env: Env) -> Address {
        Admin::get_admin(&env)
    }

    /// Mint tokens to an address
    pub fn mint(env: Env, to: Address, amount: i128) {
        Admin::mint(&env, &to, amount);
    }

    /// Clawback tokens from an address
    pub fn clawback(env: Env, from: Address, amount: i128) {
        Admin::clawback(&env, &from, amount);
    }
}

#[contractimpl]
impl TokenInterface for GekoToken {
    fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        TokenInterfaceImpl::allowance(&env, &from, &spender)
    }

    fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        live_until_ledger: u32,
    ) {
        TokenInterfaceImpl::approve(&env, &from, &spender, amount, live_until_ledger);
    }

    fn balance(env: Env, id: Address) -> i128 {
        TokenInterfaceImpl::balance(&env, &id)
    }

    fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        TokenInterfaceImpl::transfer(&env, &from, &to, amount);
    }

    fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        TokenInterfaceImpl::transfer_from(&env, &spender, &from, &to, amount);
    }

    fn burn(env: Env, from: Address, amount: i128) {
        TokenInterfaceImpl::burn(&env, &from, amount);
    }

    fn burn_from(env: Env, spender: Address, from: Address, amount: i128) {
        TokenInterfaceImpl::burn_from(&env, &spender, &from, amount);
    }

    fn decimals(env: Env) -> u32 {
        TokenInterfaceImpl::decimals(&env)
    }

    fn name(env: Env) -> String {
        TokenInterfaceImpl::name(&env)
    }

    fn symbol(env: Env) -> String {
        TokenInterfaceImpl::symbol(&env)
    }
}

#[cfg(test)]
mod test;
