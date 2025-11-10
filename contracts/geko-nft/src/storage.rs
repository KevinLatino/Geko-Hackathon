#![allow(dead_code)]

use soroban_sdk::{panic_with_error, Address, Env, String};

use crate::errors::Error;
use crate::types::{ContractConfig, DataKey};

/// Storage operations for the NFT contract
pub struct Storage;

impl Storage {
    /// Get the contract configuration
    pub fn get_config(env: &Env) -> ContractConfig {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .map(|owner: Address| {
                let base_uri = Self::get_base_uri(env);
                let max_supply = Self::get_max_supply(env);
                let minting_paused = Self::get_minting_paused(env);
                ContractConfig {
                    owner,
                    base_uri,
                    max_supply,
                    minting_paused,
                }
            })
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    /// Get the contract owner
    pub fn get_owner(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    /// Set the contract owner
    pub fn set_owner(env: &Env, owner: &Address) {
        env.storage().instance().set(&DataKey::Owner, owner);
    }

    /// Get the base URI
    pub fn get_base_uri(env: &Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::BaseUri)
            .unwrap_or_else(|| String::from_str(env, ""))
    }

    /// Set the base URI
    pub fn set_base_uri(env: &Env, base_uri: &String) {
        env.storage().instance().set(&DataKey::BaseUri, base_uri);
    }

    /// Get the maximum supply
    pub fn get_max_supply(env: &Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::MaxSupply)
            .unwrap_or(0)
    }

    /// Set the maximum supply
    pub fn set_max_supply(env: &Env, max_supply: u32) {
        env.storage().instance().set(&DataKey::MaxSupply, &max_supply);
    }

    /// Get the total supply
    pub fn get_total_supply(env: &Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Increment the total supply
    pub fn increment_total_supply(env: &Env) -> u32 {
        let current = Self::get_total_supply(env);
        let new_total = current.checked_add(1).unwrap();
        env.storage().instance().set(&DataKey::TotalSupply, &new_total);
        new_total
    }

    /// Get whether minting is paused
    pub fn get_minting_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::MintingPaused)
            .unwrap_or(false)
    }

    /// Set whether minting is paused
    pub fn set_minting_paused(env: &Env, paused: bool) {
        env.storage().instance().set(&DataKey::MintingPaused, &paused);
    }

    /// Get the token URI for a specific token ID
    pub fn get_token_uri(env: &Env, token_id: u32) -> Option<String> {
        env.storage().instance().get(&DataKey::TokenUri(token_id))
    }

    /// Set the token URI for a specific token ID
    pub fn set_token_uri(env: &Env, token_id: u32, uri: &String) {
        env.storage().instance().set(&DataKey::TokenUri(token_id), uri);
    }

    /// Get the IPFS hash for a specific token ID (following Stellar best practices)
    pub fn get_ipfshash(env: &Env, token_id: u32) -> Option<String> {
        env.storage().instance().get(&DataKey::Ipfshash(token_id))
    }

    /// Set the IPFS hash for a specific token ID
    pub fn set_ipfshash(env: &Env, token_id: u32, hash: &String) {
        env.storage().instance().set(&DataKey::Ipfshash(token_id), hash);
    }

    /// Check if the contract is initialized
    pub fn is_initialized(env: &Env) -> bool {
        env.storage().instance().has(&DataKey::Owner)
    }
}

