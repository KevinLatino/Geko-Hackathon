#![no_std]

mod errors;
mod types;
mod storage;

use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, panic_with_error};
use crate::errors::Error;
use crate::types::Envelope;

#[contract]
pub struct GekoEnvelopes;

#[contractimpl]
impl GekoEnvelopes {
    pub fn create(env: Env, user: Address, name: Symbol, description: Symbol) {
        user.require_auth();
    
        if name == Symbol::new(&env, "") {
            panic_with_error!(&env, Error::InvalidInput);
        }
    
        let mut map = storage::get_all(&env, &user);
        if map.contains_key(name.clone()) {
            panic_with_error!(&env, Error::EnvelopeExists);
        }
    
        let envelope = Envelope {
            name: name.clone(),
            description,
            balance: 0,
        };
    
        map.set(name.clone(), envelope);
        storage::save_all(&env, &user, &map);
    }
    

    pub fn deposit(env: Env, user: Address, name: Symbol, amount: i128) {
        user.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envp = storage::get(&env, &user, &name);
        envp.balance += amount;
        storage::set(&env, &user, &name, envp);
    }

    pub fn withdraw(env: Env, user: Address, name: Symbol, amount: i128) {
        user.require_auth();
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envp = storage::get(&env, &user, &name);
        if envp.balance < amount {
            panic_with_error!(&env, Error::InsufficientFunds);
        }

        envp.balance -= amount;
        storage::set(&env, &user, &name, envp);
    }

    pub fn get_balance(env: Env, user: Address, name: Symbol) -> i128 {
        let envp = storage::get(&env, &user, &name);
        envp.balance
    }
}
