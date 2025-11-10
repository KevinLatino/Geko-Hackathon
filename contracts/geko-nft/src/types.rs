use soroban_sdk::{contracttype, Address, String};

/// Storage keys for the NFT contract
#[contracttype]
pub enum DataKey {
    /// Contract owner/admin address
    Owner,
    /// Base URI for token metadata (IPFS or other decentralized storage)
    BaseUri,
    /// Maximum supply of NFTs (0 = unlimited)
    MaxSupply,
    /// Current total supply
    TotalSupply,
    /// Whether minting is paused
    MintingPaused,
    /// Token URI for a specific token ID
    TokenUri(u32),
    /// IPFS hash stored for a token (following Stellar best practices)
    Ipfshash(u32),
}

/// Contract configuration stored in instance storage
#[contracttype]
pub struct ContractConfig {
    /// Owner/admin of the contract
    pub owner: Address,
    /// Base URI for token metadata
    pub base_uri: String,
    /// Maximum supply (0 = unlimited)
    pub max_supply: u32,
    /// Whether minting is paused
    pub minting_paused: bool,
}

