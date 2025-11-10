import { PoolContractV2 } from '@blend-capital/blend-sdk';
import { Operation } from '@stellar/stellar-sdk';
import { AddressBook } from '../utils/address-book.js';
import { config } from '../utils/env_config.js';
import {
  TxParams,
  invokeClassicOp,
  invokeSorobanOperation,
  signWithKeypair,
} from '../utils/tx.js';

/**
 * Revoke a pool's admin by transferring ownership to a new account and revoking its signing power
 * 
 * This makes the pool immutable - no further changes can be made to the pool configuration.
 * 
 * Usage:
 *   npm run pool:revoke-admin testnet Geko-Pool newAdmin
 * 
 * Or directly:
 *   tsx src/blend/pool/revoke-admin.ts testnet Geko-Pool newAdmin
 * 
 * IMPORTANT: This action is irreversible. Make sure the pool is fully configured before revoking admin.
 */

if (process.argv.length < 5) {
  throw new Error('Arguments required: `network` `pool_name` `new_admin_user_key`');
}

const network = process.argv[2];
const pool_name = process.argv[3];
const newAdminUserKey = process.argv[4];

const addressBook = AddressBook.loadFromFile(network);
const poolAddress = addressBook.getContractId(pool_name);
const newAdmin = config.getUser(newAdminUserKey);
const currentAdmin = config.admin;

// Airdrop new admin if on testnet
if (network !== 'mainnet') {
  const { airdropAccount } = await import('../utils/contract.js');
  await airdropAccount(newAdmin);
}

const txParams: TxParams = {
  account: await config.rpc.getAccount(currentAdmin.publicKey()),
  txBuilderOptions: {
    fee: '10000',
    timebounds: { minTime: 0, maxTime: 0 },
    networkPassphrase: config.passphrase,
  },
  signerFunction: async (txXDR: string) => {
    return signWithKeypair(txXDR, config.passphrase, currentAdmin);
  },
};

async function revokeAdmin() {
  const pool = new PoolContractV2(poolAddress);

  console.log('Step 1: Proposing new admin...');
  // Propose new admin
  await invokeSorobanOperation(
    pool.proposeAdmin(newAdmin.publicKey()),
    PoolContractV2.parsers.proposeAdmin,
    txParams
  );
  console.log(`Proposed ${newAdmin.publicKey()} as new admin`);

  console.log('\nStep 2: Accepting new admin...');
  // Accept new admin
  const newAdminTxParams: TxParams = {
    ...txParams,
    account: await config.rpc.getAccount(newAdmin.publicKey()),
    signerFunction: async (txXDR: string) => {
      return signWithKeypair(txXDR, config.passphrase, newAdmin);
    },
  };
  await invokeSorobanOperation(
    pool.acceptAdmin(),
    PoolContractV2.parsers.acceptAdmin,
    newAdminTxParams
  );
  console.log('New admin accepted');

  console.log('\nStep 3: Revoking admin signing power...');
  // Revoke new admin signing power (makes pool immutable)
  const revokeOp = Operation.setOptions({
    masterWeight: 0,
  });
  newAdminTxParams.account = await config.rpc.getAccount(newAdmin.publicKey());
  await invokeClassicOp(revokeOp.toXDR('base64'), newAdminTxParams);
  
  console.log('\n✅ Admin revoked successfully');
  console.log(`Pool ${pool_name} is now immutable`);
  console.log(`New admin: ${newAdmin.publicKey()}`);
}

await revokeAdmin();

