use soroban_sdk::{contractevent, Address, String};

/// Event emitted when the contract is initialized
#[contractevent]
pub struct Initialize {
    pub owner: Address,
    pub name: String,
    pub symbol: String,
    pub base_uri: String,
    pub max_supply: u32,
}

/// Event emitted when the base URI is updated
#[contractevent]
pub struct BaseUriUpdated {
    pub old_uri: String,
    pub new_uri: String,
}

/// Event emitted when minting is paused/unpaused
#[contractevent]
pub struct MintingPaused {
    pub paused: bool,
}

/// Event emitted when the maximum supply is updated
#[contractevent]
pub struct MaxSupplyUpdated {
    pub old_max: u32,
    pub new_max: u32,
}

/// Event emitted when ownership is transferred
#[contractevent]
pub struct OwnershipTransferred {
    pub old_owner: Address,
    pub new_owner: Address,
}

/// Event emitted when IPFS hash is set for a token
#[contractevent]
pub struct IpfshashSet {
    pub token_id: u32,
    pub ipfshash: String,
}

