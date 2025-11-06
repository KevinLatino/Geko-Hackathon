use soroban_sdk::{contracttype, Address, Symbol};

#[derive(Clone)]
#[contracttype]
pub struct Envelope {
    pub name: Symbol,
    pub description: Symbol,
    pub balance: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Envelopes(Address),
}
