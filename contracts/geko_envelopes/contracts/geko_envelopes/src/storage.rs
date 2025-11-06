use soroban_sdk::{Env, Address, Map, Symbol};
use crate::types::{Envelope, DataKey};
use crate::errors::Error;
use soroban_sdk::panic_with_error;

pub fn get_all(env: &Env, user: &Address) -> Map<Symbol, Envelope> {
    env.storage()
        .persistent()
        .get(&DataKey::Envelopes(user.clone()))
        .unwrap_or(Map::new(env))
}

pub fn save_all(env: &Env, user: &Address, map: &Map<Symbol, Envelope>) {
    env.storage()
        .persistent()
        .set(&DataKey::Envelopes(user.clone()), map);
}

pub fn get(env: &Env, user: &Address, name: &Symbol) -> Envelope {
    let map = get_all(env, user);
    map.get(name.clone()).unwrap_or_else(|| {
        panic_with_error!(env, Error::EnvelopeNotFound)
    })
}

pub fn set(env: &Env, user: &Address, name: &Symbol, envelope: Envelope) {
    let mut map = get_all(env, user);
    map.set(name.clone(), envelope);
    save_all(env, user, &map);
}
