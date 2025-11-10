//! Geko NFT Contract
//!
//! A Non-Fungible Token contract following Stellar best practices:
//! - Uses OpenZeppelin's stellar-tokens library for standard NFT functionality
//! - Supports IPFS hash storage for metadata (following SEP-0001 and best practices)
//! - Implements burnable, enumerable, and other standard extensions
//! - Follows Stellar ecosystem standards for interoperability

#![allow(dead_code)]

use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env, String};
use stellar_macros::default_impl;
use stellar_tokens::non_fungible::{
    burnable::NonFungibleBurnable,
    enumerable::{Enumerable, NonFungibleEnumerable},
    Base, NonFungibleToken,
};

use crate::errors::Error;
use crate::events::{
    BaseUriUpdated, IpfshashSet, Initialize, MaxSupplyUpdated, MintingPaused, OwnershipTransferred,
};
use crate::storage::Storage;

#[contract]
pub struct GekoNft;

#[contractimpl]
impl GekoNft {
    /// Initialize the NFT contract
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `owner` - The address that will own and control the contract
    /// * `name` - The name of the NFT collection
    /// * `symbol` - The symbol of the NFT collection
    /// * `base_uri` - Base URI for token metadata (IPFS gateway)
    /// * `max_supply` - Maximum number of NFTs that can be minted (0 = unlimited)
    ///
    /// # Errors
    ///
    /// * `Error::AlreadyInitialized` - If the contract has already been initialized
    pub fn initialize(
        e: Env,
        owner: Address,
        name: String,
        symbol: String,
        base_uri: String,
        max_supply: u32,
    ) {
        // Check if already initialized
        if Storage::is_initialized(&e) {
            panic_with_error!(&e, Error::AlreadyInitialized);
        }

        // Set the owner
        Storage::set_owner(&e, &owner);

        // Set metadata using OpenZeppelin's Base implementation
        Base::set_metadata(&e, base_uri.clone(), name.clone(), symbol.clone());

        // Set contract-specific storage
        Storage::set_base_uri(&e, &base_uri);
        Storage::set_max_supply(&e, max_supply);
        Storage::set_minting_paused(&e, false);

        // Emit initialization event
        Initialize {
            owner: owner.clone(),
            name,
            symbol,
            base_uri,
            max_supply,
        }
        .publish(&e);
    }

    /// Mint a new NFT to the specified address
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `to` - The address that will receive the NFT
    ///
    /// # Returns
    ///
    /// The token ID of the newly minted NFT
    ///
    /// # Errors
    ///
    /// * `Error::NotInitialized` - If the contract has not been initialized
    /// * `Error::Unauthorized` - If the caller is not the owner
    /// * `Error::MintingPaused` - If minting is currently paused
    /// * `Error::MaxSupplyReached` - If the maximum supply has been reached
    pub fn mint(e: Env, to: Address) -> u32 {
        Self::internal_mint(&e, &to)
    }

    /// Mint a new NFT with IPFS hash
    ///
    /// This function allows minting an NFT and immediately setting its IPFS hash,
    /// following the best practice of storing metadata on IPFS and referencing it
    /// via the `_ipfshash_` data entry pattern.
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `to` - The address that will receive the NFT
    /// * `ipfshash` - The IPFS hash (CID) for the token metadata
    ///
    /// # Returns
    ///
    /// The token ID of the newly minted NFT
    pub fn mint_with_ipfshash(e: Env, to: Address, ipfshash: String) -> u32 {
        let token_id = Self::internal_mint(&e, &to);

        // Set the IPFS hash
        Storage::set_ipfshash(&e, token_id, &ipfshash);

        // Emit event
        IpfshashSet {
            token_id,
            ipfshash,
        }
        .publish(&e);

        token_id
    }

    /// Internal helper function for minting NFTs
    ///
    /// This function contains the core minting logic that is shared between
    /// `mint` and `mint_with_ipfshash`. Using a helper function avoids the
    /// overhead of calling a contract function internally.
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `to` - The address that will receive the NFT
    ///
    /// # Returns
    ///
    /// The token ID of the newly minted NFT
    ///
    /// # Errors
    ///
    /// * `Error::NotInitialized` - If the contract has not been initialized
    /// * `Error::Unauthorized` - If the caller is not the owner
    /// * `Error::MintingPaused` - If minting is currently paused
    /// * `Error::MaxSupplyReached` - If the maximum supply has been reached
    fn internal_mint(e: &Env, to: &Address) -> u32 {
        // Verify contract is initialized
        let owner = Storage::get_owner(e);
        owner.require_auth();

        // Check if minting is paused
        if Storage::get_minting_paused(e) {
            panic_with_error!(e, Error::MintingPaused);
        }

        // Check max supply using Enumerable's total supply
        let max_supply = Storage::get_max_supply(e);
        let current_supply = Enumerable::total_supply(e);
        if max_supply > 0 && current_supply >= max_supply {
            panic_with_error!(e, Error::MaxSupplyReached);
        }

        // Mint the token using OpenZeppelin's sequential mint (Enumerable extension)
        // This automatically increments Enumerable's total supply
        Enumerable::sequential_mint(e, to)
    }

    /// Set the IPFS hash for an existing token
    ///
    /// Following Stellar best practices, this allows setting the IPFS hash
    /// for a token's metadata after minting.
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `token_id` - The token ID
    /// * `ipfshash` - The IPFS hash (CID) for the token metadata
    ///
    /// # Errors
    ///
    /// * `Error::Unauthorized` - If the caller is not the owner
    /// * `Error::InvalidTokenId` - If the token does not exist
    pub fn set_ipfshash(e: Env, token_id: u32, ipfshash: String) {
        // Verify contract is initialized and caller is owner
        let owner = Storage::get_owner(&e);
        owner.require_auth();

        // Verify token exists
        let _owner = Base::owner_of(&e, token_id);

        // Set the IPFS hash
        Storage::set_ipfshash(&e, token_id, &ipfshash);

        // Emit event
        IpfshashSet {
            token_id,
            ipfshash,
        }
        .publish(&e);
    }

    /// Get the IPFS hash for a token
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `token_id` - The token ID
    ///
    /// # Returns
    ///
    /// The IPFS hash if set, None otherwise
    pub fn get_ipfshash(e: Env, token_id: u32) -> Option<String> {
        Storage::get_ipfshash(&e, token_id)
    }

    /// Update the base URI for token metadata
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `new_base_uri` - The new base URI
    ///
    /// # Errors
    ///
    /// * `Error::Unauthorized` - If the caller is not the owner
    pub fn set_base_uri(e: Env, new_base_uri: String) {
        let owner = Storage::get_owner(&e);
        owner.require_auth();

        let old_uri = Storage::get_base_uri(&e);
        Storage::set_base_uri(&e, &new_base_uri);

        // Update OpenZeppelin's metadata as well
        let name = Base::name(&e);
        let symbol = Base::symbol(&e);
        Base::set_metadata(&e, new_base_uri.clone(), name, symbol);

        // Emit event
        BaseUriUpdated {
            old_uri,
            new_uri: new_base_uri,
        }
        .publish(&e);
    }

    /// Pause or unpause minting
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `paused` - Whether to pause (true) or unpause (false) minting
    ///
    /// # Errors
    ///
    /// * `Error::Unauthorized` - If the caller is not the owner
    pub fn set_minting_paused(e: Env, paused: bool) {
        let owner = Storage::get_owner(&e);
        owner.require_auth();

        Storage::set_minting_paused(&e, paused);

        // Emit event
        MintingPaused { paused }.publish(&e);
    }

    /// Update the maximum supply
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `new_max_supply` - The new maximum supply (0 = unlimited)
    ///
    /// # Errors
    ///
    /// * `Error::Unauthorized` - If the caller is not the owner
    /// * `Error::MaxSupplyReached` - If the new max supply is less than current supply
    pub fn set_max_supply(e: Env, new_max_supply: u32) {
        let owner = Storage::get_owner(&e);
        owner.require_auth();

        let old_max = Storage::get_max_supply(&e);
        let current_supply = Enumerable::total_supply(&e);

        // Validate new max supply
        if new_max_supply > 0 && new_max_supply < current_supply {
            panic_with_error!(&e, Error::MaxSupplyReached);
        }

        Storage::set_max_supply(&e, new_max_supply);

        // Emit event
        MaxSupplyUpdated {
            old_max,
            new_max: new_max_supply,
        }
        .publish(&e);
    }

    /// Transfer ownership of the contract
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `new_owner` - The new owner address
    ///
    /// # Errors
    ///
    /// * `Error::Unauthorized` - If the caller is not the current owner
    pub fn transfer_ownership(e: Env, new_owner: Address) {
        let old_owner = Storage::get_owner(&e);
        old_owner.require_auth();

        Storage::set_owner(&e, &new_owner);

        // Emit event
        OwnershipTransferred {
            old_owner,
            new_owner,
        }
        .publish(&e);
    }

    /// Get the contract owner
    ///
    /// # Returns
    ///
    /// The address of the contract owner
    pub fn owner(e: Env) -> Address {
        Storage::get_owner(&e)
    }

    /// Get the maximum supply
    ///
    /// # Returns
    ///
    /// The maximum supply (0 = unlimited)
    pub fn max_supply(e: Env) -> u32 {
        Storage::get_max_supply(&e)
    }

    /// Check if minting is paused
    ///
    /// # Returns
    ///
    /// True if minting is paused, false otherwise
    pub fn minting_paused(e: Env) -> bool {
        Storage::get_minting_paused(&e)
    }
}

// Implement the NonFungibleToken trait using OpenZeppelin's default implementation
#[default_impl]
#[contractimpl]
impl NonFungibleToken for GekoNft {
    type ContractType = Enumerable;
}

// Implement the NonFungibleEnumerable trait for enumeration capabilities
#[default_impl]
#[contractimpl]
impl NonFungibleEnumerable for GekoNft {}

// Implement the NonFungibleBurnable trait to allow token burning
// Enumerable::burn already handles total supply decrement and enumeration updates
#[contractimpl]
impl NonFungibleBurnable for GekoNft {
    /// Burns a token from the specified address
    ///
    /// This function uses `Enumerable::burn` which:
    /// - Removes the token from the owner's enumeration
    /// - Removes the token from the global enumeration
    /// - Decrements the total supply
    /// - Emits a burn event
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `from` - The address that owns the token to burn
    /// * `token_id` - The token ID to burn
    ///
    /// # Errors
    ///
    /// * `NonFungibleTokenError::NonExistentToken` - If the token does not exist
    /// * `NonFungibleTokenError::IncorrectOwner` - If `from` is not the owner
    fn burn(e: &Env, from: Address, token_id: u32) {
        // Use Enumerable's burn which handles all enumeration updates
        Enumerable::burn(e, &from, token_id);
    }

    /// Burns a token from the specified address using spender's approval
    ///
    /// This function uses `Enumerable::burn_from` which:
    /// - Checks and consumes the spender's approval
    /// - Removes the token from the owner's enumeration
    /// - Removes the token from the global enumeration
    /// - Decrements the total supply
    /// - Emits a burn event
    ///
    /// # Arguments
    ///
    /// * `e` - The Soroban environment
    /// * `spender` - The address authorized to burn the token
    /// * `from` - The address that owns the token to burn
    /// * `token_id` - The token ID to burn
    ///
    /// # Errors
    ///
    /// * `NonFungibleTokenError::NonExistentToken` - If the token does not exist
    /// * `NonFungibleTokenError::IncorrectOwner` - If `from` is not the owner
    /// * `NonFungibleTokenError::InsufficientApproval` - If spender doesn't have approval
    fn burn_from(e: &Env, spender: Address, from: Address, token_id: u32) {
        // Use Enumerable's burn_from which handles all enumeration updates
        Enumerable::burn_from(e, &spender, &from, token_id);
    }
}

