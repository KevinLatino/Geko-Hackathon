// src/lib.rs
#![no_std]
mod errors;
mod types;
mod storage;

use soroban_sdk::{
    contract, contractimpl, contractevent, Env, Address, Symbol, Vec, panic_with_error, token,
};
use crate::errors::Error;
use crate::types::Envelope;

// ==========================================================
// Eventos definidos con #[contractevent] (API moderna)
// ==========================================================

#[contractevent]
pub struct EnvelopeCreated {
    pub user: Address,
    pub id: u64,
    pub name: Symbol,
    pub token_contract: Address,
}

#[contractevent]
pub struct DepositMade {
    pub user: Address,
    pub id: u64,
    pub amount: i128,
    pub token_contract: Address,
}

#[contractevent]
pub struct WithdrawalMade {
    pub user: Address,
    pub id: u64,
    pub amount: i128,
    pub token_contract: Address,
}

// ==========================================================
// Contrato principal
// ==========================================================

#[contract]
pub struct GekoEnvelopes;

#[contractimpl]
impl GekoEnvelopes {
    /// Crea un nuevo sobre asociado al usuario y al contrato del token.
    pub fn create(
        env: Env,
        user: Address,
        name: Symbol,
        description: Symbol,
        token_contract: Address,
    ) -> u64 {
        user.require_auth();

        if name == Symbol::new(&env, "") {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let new_id = storage::get_next_id(&env, &user);
        let mut map = storage::get_all(&env, &user);

        let envelope = Envelope {
            id: new_id,
            name: name.clone(),
            description,
            balance: 0,
            token_contract: token_contract.clone(),
        };

        map.set(new_id, envelope.clone());
        storage::save_all(&env, &user, &map);

        // 📢 Emitir evento moderno
        EnvelopeCreated {
            user: user.clone(),
            id: new_id,
            name: name.clone(),
            token_contract: token_contract.clone(),
        }
        .publish(&env);

        new_id
    }

    /// Deposita `amount` en el sobre identificado por `id`.
    pub fn deposit(env: Env, user: Address, id: u64, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envelope = storage::get(&env, &user, &id);
        let token_contract = envelope.token_contract.clone();

        token::Client::new(&env, &token_contract)
            .transfer(&user, &env.current_contract_address(), &amount);

        envelope.balance += amount;
        storage::set(&env, &user, &id, envelope.clone());

        // 📢 Evento moderno
        DepositMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
        }
        .publish(&env);
    }

    /// Retira `amount` del sobre identificado por `id`.
    pub fn withdraw(env: Env, user: Address, id: u64, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envelope = storage::get(&env, &user, &id);
        if envelope.balance < amount {
            panic_with_error!(&env, Error::InsufficientFunds);
        }

        let token_contract = envelope.token_contract.clone();
        envelope.balance -= amount;
        storage::set(&env, &user, &id, envelope.clone());

        token::Client::new(&env, &token_contract)
            .transfer(&env.current_contract_address(), &user, &amount);

        // 📢 Evento moderno
        WithdrawalMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
        }
        .publish(&env);
    }

    /// Retorna el balance actual del sobre por `id`.
    pub fn get_balance(env: Env, user: Address, id: u64) -> i128 {
        let envelope = storage::get(&env, &user, &id);
        envelope.balance
    }

    /// Lista todos los sobres asociados al usuario.
    pub fn list_envelopes(env: Env, user: Address) -> Vec<Envelope> {
        let map = storage::get_all(&env, &user);
        let mut list = Vec::new(&env);

        for (_id, envelope) in map.into_iter() {
            list.push_back(envelope);
        }

        list
    }
}
