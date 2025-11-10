// src/lib.rs
#![no_std]
mod errors;
mod storage;
mod types;

use soroban_sdk::{
    contract, contractevent, contractimpl, panic_with_error, token, Address, Env, Symbol, Vec,
};

use crate::errors::Error;
use crate::types::Envelope;

mod pool {
    use soroban_sdk::{contractclient, contracttype, Address, Vec};

    pub const REQUEST_TYPE_SUPPLY: u32 = 0;
    pub const REQUEST_TYPE_WITHDRAW: u32 = 1;

    #[derive(Clone)]
    #[contracttype]
    pub struct Request {
        pub request_type: u32,
        pub address: Address,
        pub amount: i128,
    }

    #[allow(dead_code)]
    #[contractclient(name = "PoolClient")]
    pub trait PoolContract {
        fn submit(
            from: Address,
            spender: Address,
            to: Address,
            requests: Vec<Request>,
        ) -> soroban_sdk::Val;
    }
}

// ==========================================================
// Events defined with #[contractevent] (modern API)
// ==========================================================

#[contractevent]
pub struct EnvelopeCreated {
    pub user: Address,
    pub id: u64,
    pub name: Symbol,
    pub token_contract: Address,
    pub pool_contract: Address,
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

#[contractevent]
pub struct PoolDepositMade {
    pub user: Address,
    pub id: u64,
    pub amount: i128,
    pub token_contract: Address,
    pub pool_contract: Address,
}

#[contractevent]
pub struct PoolWithdrawalMade {
    pub user: Address,
    pub id: u64,
    pub amount: i128,
    pub token_contract: Address,
    pub pool_contract: Address,
}

// ==========================================================
// Main contract
// ==========================================================

#[contract]
pub struct GekoEnvelopes;

#[contractimpl]
impl GekoEnvelopes {
    /// Create a new envelope associated with the user and the token contract.
    pub fn create(
        env: Env,
        user: Address,
        name: Symbol,
        description: Symbol,
        token_contract: Address,
        pool_contract: Address,
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
            pool_contract: pool_contract.clone(),
        };

        map.set(new_id, envelope.clone());
        storage::save_all(&env, &user, &map);

        // Emit event
        EnvelopeCreated {
            user: user.clone(),
            id: new_id,
            name: name.clone(),
            token_contract: token_contract.clone(),
            pool_contract: pool_contract.clone(),
        }
        .publish(&env);

        new_id
    }

    /// Deposit `amount` into the envelope identified by `id`.
    pub fn deposit(env: Env, user: Address, id: u64, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envelope = storage::get(&env, &user, &id);
        let token_contract = envelope.token_contract.clone();

        token::Client::new(&env, &token_contract)
            .transfer(&user, &env.current_contract_address(), &amount);

        envelope.balance = envelope.balance.saturating_add(amount);
        storage::set(&env, &user, &id, envelope.clone());

        // Emit event
        DepositMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
        }
        .publish(&env);
    }

    /// Withdraw `amount` from the envelope identified by `id`.
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

        WithdrawalMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
        }
        .publish(&env);
    }

    /// Deposit funds from the user directly into the associated pool.
    pub fn deposit_to_pool(env: Env, user: Address, id: u64, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envelope = storage::get(&env, &user, &id);
        let token_contract = envelope.token_contract.clone();
        let pool_contract = envelope.pool_contract.clone();

        let mut requests = Vec::new(&env);
        requests.push_back(pool::Request {
            request_type: pool::REQUEST_TYPE_SUPPLY,
            address: token_contract.clone(),
            amount,
        });

        let pool_client = pool::PoolClient::new(&env, &pool_contract);
        let _ = pool_client.submit(&user, &user, &user, &requests);

        envelope.balance = envelope.balance.saturating_add(amount);
        storage::set(&env, &user, &id, envelope.clone());

        PoolDepositMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
            pool_contract,
        }
        .publish(&env);
    }

    /// Withdraw funds from the associated pool.
    pub fn withdraw_from_pool(env: Env, user: Address, id: u64, amount: i128) {
        user.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidInput);
        }

        let mut envelope = storage::get(&env, &user, &id);
        if envelope.balance < amount {
            panic_with_error!(&env, Error::InsufficientFunds);
        }

        let token_contract = envelope.token_contract.clone();
        let pool_contract = envelope.pool_contract.clone();

        let mut requests = Vec::new(&env);
        requests.push_back(pool::Request {
            request_type: pool::REQUEST_TYPE_WITHDRAW,
            address: token_contract.clone(),
            amount,
        });

        let pool_client = pool::PoolClient::new(&env, &pool_contract);
        let _ = pool_client.submit(&user, &user, &user, &requests);

        envelope.balance -= amount;
        storage::set(&env, &user, &id, envelope.clone());

        PoolWithdrawalMade {
            user: user.clone(),
            id,
            amount,
            token_contract: token_contract.clone(),
            pool_contract,
        }
        .publish(&env);
    }

    /// Return the current balance of the envelope by `id`.
    pub fn get_balance(env: Env, user: Address, id: u64) -> i128 {
        let envelope = storage::get(&env, &user, &id);
        envelope.balance
    }

    /// List all envelopes associated with the user.
    pub fn list_envelopes(env: Env, user: Address) -> Vec<Envelope> {
        let map = storage::get_all(&env, &user);
        let mut list = Vec::new(&env);

        for (_id, envelope) in map.into_iter() {
            list.push_back(envelope);
        }

        list
    }
}
