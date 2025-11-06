use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Error {
    NotAuthorized = 1,
    InvalidInput = 2,
    InsufficientFunds = 3,
    EnvelopeExists = 4,
    EnvelopeNotFound = 5,
}
