use soroban_sdk::{contracttype, symbol_short, Address, String, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Balance(Address),
    Allowance(AllowanceKey),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BalanceValue {
    pub amount: i128,
    pub authorized: bool,
}

// Instance storage key for consolidated token metadata
pub const STORAGE: Symbol = symbol_short!("STOR");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenStorage {
    pub admin: Address,
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

