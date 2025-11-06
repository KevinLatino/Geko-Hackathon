#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

use crate::{GekoToken, GekoTokenClient};

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.decimals(), decimals);
    assert_eq!(client.admin(), admin);
}

#[test]
fn test_mint() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&user, &amount);

    assert_eq!(client.balance(&user), amount);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    let transfer_amount: i128 = 500 * 10i128.pow(decimals);
    client.transfer(&from, &to, &transfer_amount);

    assert_eq!(client.balance(&from), mint_amount - transfer_amount);
    assert_eq!(client.balance(&to), transfer_amount);
}

#[test]
fn test_approve_and_transfer_from() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    let approve_amount: i128 = 500 * 10i128.pow(decimals);
    let current_ledger = env.ledger().sequence();
    let expiration_ledger = current_ledger + 1000u32;
    client.approve(&from, &spender, &approve_amount, &expiration_ledger);

    assert_eq!(client.allowance(&from, &spender), approve_amount);

    let transfer_amount: i128 = 300 * 10i128.pow(decimals);
    client.transfer_from(&spender, &from, &to, &transfer_amount);

    assert_eq!(client.balance(&from), mint_amount - transfer_amount);
    assert_eq!(client.balance(&to), transfer_amount);
    assert_eq!(
        client.allowance(&from, &spender),
        approve_amount - transfer_amount
    );
}

#[test]
fn test_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&user, &mint_amount);

    let burn_amount: i128 = 300 * 10i128.pow(decimals);
    client.burn(&user, &burn_amount);

    assert_eq!(client.balance(&user), mint_amount - burn_amount);
}

#[test]
fn test_burn_from() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    let approve_amount: i128 = 500 * 10i128.pow(decimals);
    let current_ledger = env.ledger().sequence();
    let expiration_ledger = current_ledger + 1000u32;
    client.approve(&from, &spender, &approve_amount, &expiration_ledger);

    let burn_amount: i128 = 300 * 10i128.pow(decimals);
    client.burn_from(&spender, &from, &burn_amount);

    assert_eq!(client.balance(&from), mint_amount - burn_amount);
    assert_eq!(
        client.allowance(&from, &spender),
        approve_amount - burn_amount
    );
}

#[test]
fn test_clawback() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&user, &mint_amount);

    let clawback_amount: i128 = 300 * 10i128.pow(decimals);
    client.clawback(&user, &clawback_amount);

    assert_eq!(client.balance(&user), mint_amount - clawback_amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_initialize_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);
    // Should panic on second initialization
    client.initialize(&admin, &name, &symbol, &decimals);
}

#[test]
#[should_panic]
fn test_transfer_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    let transfer_amount: i128 = 2000 * 10i128.pow(decimals);
    // Should panic - insufficient balance
    client.transfer(&from, &to, &transfer_amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_transfer_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    // Should panic - zero amount
    client.transfer(&from, &to, &0);
}

#[test]
#[should_panic]
fn test_transfer_from_expired_allowance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let to = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&from, &mint_amount);

    let approve_amount: i128 = 500 * 10i128.pow(decimals);
    let current_ledger = env.ledger().sequence();
    // Set expiration to a future ledger first
    let expiration_ledger = current_ledger + 100;
    client.approve(&from, &spender, &approve_amount, &expiration_ledger);

    // Advance ledger past expiration
    let mut ledger_info = env.ledger().get();
    ledger_info.sequence_number = expiration_ledger + 1;
    env.ledger().set(ledger_info);

    let transfer_amount: i128 = 300 * 10i128.pow(decimals);
    // Should panic - allowance expired
    client.transfer_from(&spender, &from, &to, &transfer_amount);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")]
fn test_approve_invalid_ledger() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let approve_amount: i128 = 500 * 10i128.pow(decimals);
    let current_ledger = env.ledger().sequence();
    // Set expiration to a ledger that's already passed (invalid for non-zero amount)
    // Advance ledger first to ensure we have a past ledger
    let mut ledger_info = env.ledger().get();
    ledger_info.sequence_number = current_ledger + 10;
    env.ledger().set(ledger_info);
    
    // Now try to approve with expiration in the past
    let expiration_ledger = current_ledger + 5; // This is now in the past
    // Should panic - invalid ledger sequence
    client.approve(&from, &spender, &approve_amount, &expiration_ledger);
}

#[test]
fn test_approve_zero_allows_past_ledger() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let current_ledger = env.ledger().sequence();
    // Advance ledger first
    let mut ledger_info = env.ledger().get();
    ledger_info.sequence_number = current_ledger + 10;
    env.ledger().set(ledger_info);
    
    // Setting amount to 0 allows past ledger expiration
    let expiration_ledger = current_ledger + 5; // This is now in the past
    client.approve(&from, &spender, &0, &expiration_ledger);

    assert_eq!(client.allowance(&from, &spender), 0);
}

#[test]
fn test_multiple_mints_and_transfers() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    // Multiple mints
    let mint1: i128 = 1000 * 10i128.pow(decimals);
    let mint2: i128 = 500 * 10i128.pow(decimals);
    client.mint(&user1, &mint1);
    client.mint(&user1, &mint2);
    client.mint(&user2, &mint1);

    assert_eq!(client.balance(&user1), mint1 + mint2);
    assert_eq!(client.balance(&user2), mint1);

    // Multiple transfers
    let transfer1: i128 = 300 * 10i128.pow(decimals);
    let transfer2: i128 = 200 * 10i128.pow(decimals);
    client.transfer(&user1, &user2, &transfer1);
    client.transfer(&user1, &user2, &transfer2);

    assert_eq!(client.balance(&user1), mint1 + mint2 - transfer1 - transfer2);
    assert_eq!(client.balance(&user2), mint1 + transfer1 + transfer2);
}

#[test]
fn test_allowance_update() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let from = Address::generate(&env);
    let spender = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let approve_amount1: i128 = 500 * 10i128.pow(decimals);
    let current_ledger = env.ledger().sequence();
    let expiration_ledger = current_ledger + 1000u32;
    client.approve(&from, &spender, &approve_amount1, &expiration_ledger);

    assert_eq!(client.allowance(&from, &spender), approve_amount1);

    // Update allowance
    let approve_amount2: i128 = 800 * 10i128.pow(decimals);
    let new_expiration_ledger = current_ledger + 2000u32;
    client.approve(&from, &spender, &approve_amount2, &new_expiration_ledger);

    assert_eq!(client.allowance(&from, &spender), approve_amount2);
}

#[test]
fn test_burn_all_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let name = String::from_str(&env, "Geko Token");
    let symbol = String::from_str(&env, "GEKO");
    let decimals: u32 = 7;

    let contract_id = env.register(GekoToken, ());
    let client = GekoTokenClient::new(&env, &contract_id);

    client.initialize(&admin, &name, &symbol, &decimals);

    let mint_amount: i128 = 1000 * 10i128.pow(decimals);
    client.mint(&user, &mint_amount);

    // Burn all balance
    client.burn(&user, &mint_amount);

    assert_eq!(client.balance(&user), 0);
}

