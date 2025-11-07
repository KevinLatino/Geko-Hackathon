use soroban_sdk::{Env, Address, Map};
use crate::types::{Envelope, DataKey};
use crate::errors::Error;
use soroban_sdk::panic_with_error;

pub fn get_all(env: &Env, user: &Address) -> Map<u64, Envelope> {
    env.storage()
        .persistent()
        .get(&DataKey::Envelopes(user.clone()))
        .unwrap_or_else(|| Map::new(env))
}

pub fn save_all(env: &Env, user: &Address, map: &Map<u64, Envelope>) {
    env.storage()
        .persistent()
        .set(&DataKey::Envelopes(user.clone()), map);
}

pub fn get_next_id(env: &Env, user: &Address) -> u64 {
    let key = DataKey::NextEnvelopeId(user.clone());
    let next_id: u64 = env.storage().persistent().get(&key).unwrap_or(0);
    let new_id = next_id + 1;
    env.storage().persistent().set(&key, &new_id);
    new_id
}

pub fn get(env: &Env, user: &Address, id: &u64) -> Envelope {
    let map = get_all(env, user);
    map.get(id.clone()).unwrap_or_else(|| panic_with_error!(env, Error::EnvelopeNotFound))
}

pub fn set(env: &Env, user: &Address, id: &u64, envelope: Envelope) {
    let mut map = get_all(env, user);
    map.set(id.clone(), envelope);
    save_all(env, user, &map);
}
