import { PoolContractV2 } from '@blend-capital/blend-sdk';
import { AddressBook } from '../utils/address-book.js';
import { config } from '../utils/env_config.js';
import { TxParams, invokeSorobanOperation, signWithKeypair } from '../utils/tx.js';

/**
 * Set the status of a Blend lending pool
 * 
 * Status values:
 *   0 = Admin Active (requires backstop threshold to be met, allows deposits and borrowing)
 *      ⚠️  Cannot be set if backstop_take_rate is 0 or backstop threshold not met
 *   2 = Admin On Ice (allows deposits but not borrowing)
 *      ✅ Can be set even without backstop
 *   3 = On Ice (allows deposits but not borrowing)
 *   4 = Admin Frozen (does not allow deposits or borrowing)
 * 
 * Usage:
 *   npm run pool:status testnet admin Geko-Pool 2
 * 
 * Or directly:
 *   tsx src/blend/pool/set-status.ts testnet admin Geko-Pool 2
 */

if (process.argv.length < 5) {
  throw new Error('Arguments required: `network` `user` `pool` `status`');
}

const network = process.argv[2];
const userKey = process.argv[3];
const poolName = process.argv[4];
const status = parseInt(process.argv[5]);

const addressBook = AddressBook.loadFromFile(network);
const user = config.getUser(userKey);

const txParams: TxParams = {
  account: await config.rpc.getAccount(user.publicKey()),
  txBuilderOptions: {
    fee: '10000',
    timebounds: {
      minTime: 0,
      maxTime: 0,
    },
    networkPassphrase: config.passphrase,
  },
  signerFunction: async (txXDR: string) => {
    return signWithKeypair(txXDR, config.passphrase, user);
  },
};

async function setStatus(poolName: string, status: number, txParams: TxParams) {
  const pool = new PoolContractV2(addressBook.getContractId(poolName));
  await invokeSorobanOperation(pool.setStatus(status), PoolContractV2.parsers.setStatus, txParams);
  
  const statusNames: Record<number, string> = {
    0: 'Admin Active',
    2: 'Admin On Ice',
    3: 'On Ice',
    4: 'Admin Frozen',
  };
  
  console.log(`Set ${poolName} pool status to: ${status} (${statusNames[status] || 'Unknown'})`);
}

await setStatus(poolName, status, txParams);

