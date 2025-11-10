use soroban_sdk::contracterror;

/// Custom errors for the NFT contract
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Contract has not been initialized
    NotInitialized = 1,
    /// Contract has already been initialized
    AlreadyInitialized = 2,
    /// Caller is not authorized (not the owner/admin)
    Unauthorized = 3,
    /// Minting is paused
    MintingPaused = 4,
    /// Maximum supply has been reached
    MaxSupplyReached = 5,
    /// Invalid token ID
    InvalidTokenId = 6,
    /// Invalid base URI length
    InvalidBaseUri = 7,
    /// Invalid metadata
    InvalidMetadata = 8,
}

