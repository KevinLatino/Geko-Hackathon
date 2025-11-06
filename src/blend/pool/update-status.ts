import { PoolContractV2 } from '@blend-capital/blend-sdk';
import { AddressBook } from '../utils/address-book.js';
import { config } from '../utils/env_config.js';
import { TxParams, invokeSorobanOperation, signWithKeypair } from '../utils/tx.js';

/**
 * Update the status of a non-owned pool
 * This function will update the pool status based on backstop threshold requirements
 * 
 * Usage:
 *   npm run pool:update-status testnet admin Test
 * 
 * Or directly:
 *   tsx src/blend/pool/update-status.ts testnet admin Test
 */

if (process.argv.length < 4) {
  throw new Error('Arguments required: `network` `user` `pool`');
}

const network = process.argv[2];
const userKey = process.argv[3];
const poolName = process.argv[4];

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

async function updateStatus(poolName: string, txParams: TxParams) {
  const pool = new PoolContractV2(addressBook.getContractId(poolName));
  await invokeSorobanOperation(
    pool.updateStatus(),
    PoolContractV2.parsers.updateStatus,
    txParams
  );
  console.log(`Updated ${poolName} pool status`);
}

await updateStatus(poolName, txParams);

