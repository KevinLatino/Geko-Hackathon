#![cfg(test)]

extern crate std;

use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String,
};

use crate::contract::{GekoNft, GekoNftClient};

fn create_client<'a>(
    e: &Env,
    owner: &Address,
    name: &String,
    symbol: &String,
    base_uri: &String,
    max_supply: u32,
) -> GekoNftClient<'a> {
    let address = e.register(GekoNft, ());
    let client = GekoNftClient::new(e, &address);
    e.mock_all_auths();
    client.initialize(owner, name, symbol, base_uri, &max_supply);
    client
}

#[test]
fn test_initialize() {
    let e = Env::default();
    e.mock_all_auths();

    let owner = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let contract_id = e.register(GekoNft, ());
    let client = GekoNftClient::new(&e, &contract_id);

    client.initialize(&owner, &name, &symbol, &base_uri, &max_supply);

    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.owner(), owner);
    assert_eq!(client.max_supply(), max_supply);
    assert_eq!(client.total_supply(), 0);
    assert_eq!(client.minting_paused(), false);
}

#[test]
#[should_panic]
fn test_initialize_twice() {
    let e = Env::default();
    e.mock_all_auths();

    let owner = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let contract_id = e.register(GekoNft, ());
    let client = GekoNftClient::new(&e, &contract_id);

    client.initialize(&owner, &name, &symbol, &base_uri, &max_supply);
    // Second initialization should fail with AlreadyInitialized error
    client.initialize(&owner, &name, &symbol, &base_uri, &max_supply);
}

#[test]
fn test_mint() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint(&recipient);

    assert_eq!(token_id, 0);
    assert_eq!(client.balance(&recipient), 1);
    assert_eq!(client.owner_of(&token_id), recipient);
    assert_eq!(client.total_supply(), 1);
}

#[test]
fn test_mint_multiple() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id_1 = client.mint(&recipient);
    let token_id_2 = client.mint(&recipient);
    let token_id_3 = client.mint(&recipient);

    assert_eq!(token_id_1, 0);
    assert_eq!(token_id_2, 1);
    assert_eq!(token_id_3, 2);
    assert_eq!(client.balance(&recipient), 3);
    assert_eq!(client.total_supply(), 3);
}

#[test]
fn test_mint_with_ipfshash() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;
    let ipfshash = String::from_str(&e, "QmZM3EYeamVihFFVd5kZmG35ua19DcKT4gNh4aofaPQ2H6");

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint_with_ipfshash(&recipient, &ipfshash);

    assert_eq!(token_id, 0);
    assert_eq!(client.balance(&recipient), 1);
    assert_eq!(client.get_ipfshash(&token_id), Some(ipfshash));
}

#[test]
fn test_set_ipfshash() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;
    let ipfshash = String::from_str(&e, "QmZM3EYeamVihFFVd5kZmG35ua19DcKT4gNh4aofaPQ2H6");

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint(&recipient);

    client.set_ipfshash(&token_id, &ipfshash);

    assert_eq!(client.get_ipfshash(&token_id), Some(ipfshash));
}

#[test]
fn test_transfer() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let from = Address::generate(&e);
    let to = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint(&from);

    client.transfer(&from, &to, &token_id);

    assert_eq!(client.balance(&from), 0);
    assert_eq!(client.balance(&to), 1);
    assert_eq!(client.owner_of(&token_id), to);
}

#[test]
fn test_approve_and_transfer_from() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let from = Address::generate(&e);
    let spender = Address::generate(&e);
    let to = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint(&from);

    // Approve spender
    let live_until_ledger = e.ledger().sequence() + 1000;
    client.approve(&from, &spender, &token_id, &live_until_ledger);

    // Transfer from using spender
    client.transfer_from(&spender, &from, &to, &token_id);

    assert_eq!(client.balance(&from), 0);
    assert_eq!(client.balance(&to), 1);
    assert_eq!(client.owner_of(&token_id), to);
}

#[test]
fn test_burn() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id = client.mint(&recipient);

    assert_eq!(client.balance(&recipient), 1);
    assert_eq!(client.total_supply(), 1);

    client.burn(&recipient, &token_id);

    assert_eq!(client.balance(&recipient), 0);
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_set_base_uri() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let new_base_uri = String::from_str(&e, "ipfs://QmNewHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    // Mint a token first so we can test token_uri
    let token_id = client.mint(&recipient);
    
    // Update base URI
    client.set_base_uri(&new_base_uri);

    // Verify token_uri uses the new base URI
    // OpenZeppelin's token_uri concatenates base_uri + token_id (without separator)
    let expected_uri = String::from_str(&e, "ipfs://QmNewHash0");
    assert_eq!(client.token_uri(&token_id), expected_uri);
}

#[test]
fn test_set_minting_paused() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    client.set_minting_paused(&true);

    assert_eq!(client.minting_paused(), true);

    // Try to mint while paused - should fail
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.mint(&recipient);
    }));
    assert!(result.is_err());
}

#[test]
fn test_max_supply() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 2;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    let token_id_1 = client.mint(&recipient);
    let token_id_2 = client.mint(&recipient);

    assert_eq!(token_id_1, 0);
    assert_eq!(token_id_2, 1);
    assert_eq!(client.total_supply(), 2);

    // Try to mint beyond max supply - should fail
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.mint(&recipient);
    }));
    assert!(result.is_err());
}

#[test]
fn test_set_max_supply() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;
    let new_max_supply: u32 = 2000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    client.set_max_supply(&new_max_supply);

    assert_eq!(client.max_supply(), new_max_supply);
}

#[test]
fn test_transfer_ownership() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let new_owner = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    e.mock_all_auths();
    client.transfer_ownership(&new_owner);

    assert_eq!(client.owner(), new_owner);
}

#[test]
#[should_panic]
fn test_unauthorized_mint() {
    let e = Env::default();
    let owner = Address::generate(&e);
    let unauthorized = Address::generate(&e);
    let recipient = Address::generate(&e);
    let name = String::from_str(&e, "Geko NFT");
    let symbol = String::from_str(&e, "GEKO");
    let base_uri = String::from_str(&e, "ipfs://QmTestHash");
    let max_supply: u32 = 1000;

    let client = create_client(&e, &owner, &name, &symbol, &base_uri, max_supply);

    // Try to mint with unauthorized address (should fail with require_auth)
    e.mock_all_auths();
    // Set unauthorized as the contract caller
    e.as_contract(&unauthorized, || {
        // This should fail because unauthorized is not the owner
        client.mint(&recipient);
    });
}

