use soroban_sdk::{contracttype, Address, Symbol};

#[derive(Clone)]
#[contracttype]
pub struct Envelope {
    pub id: u64,
    pub name: Symbol,
    pub description: Symbol,
    pub balance: i128,
    pub token_contract: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Envelopes(Address),
    NextEnvelopeId(Address),
}
