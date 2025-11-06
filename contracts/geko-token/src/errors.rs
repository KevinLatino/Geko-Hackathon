use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    NotPositive = 2,
    InsufficientBalance = 3,
    InsufficientAllowance = 4,
    AllowanceExpired = 5,
    InvalidLedgerSequence = 6,
    NotInitialized = 7,
    ArithmeticError = 8,
}


