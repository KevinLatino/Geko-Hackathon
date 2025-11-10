use soroban_sdk::{contracttype, Address, String};

#[derive(Clone)]
#[contracttype]
pub struct Envelope {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub balance: i128,
    pub token_contract: Address,
    pub pool_contract: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Envelopes(Address),
    NextEnvelopeId(Address),
}
