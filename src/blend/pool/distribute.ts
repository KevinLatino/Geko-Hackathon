import { EmitterContract, PoolContractV2 } from '@blend-capital/blend-sdk';
import { AddressBook } from '../utils/address-book.js';
import { config } from '../utils/env_config.js';
import { TxParams, invokeSorobanOperation, signWithKeypair } from '../utils/tx.js';

/**
 * Distribute emissions to pools
 * 
 * This script distributes emissions from the emitter contract to the specified pools.
 * The pools will receive their configured emissions share.
 * 
 * Usage:
 *   npm run pool:distribute testnet admin '["Test"]'
 * 
 * Or directly:
 *   tsx src/blend/pool/distribute.ts testnet admin '["Test"]'
 * 
 * Note: You can specify multiple pools: '["Pool1","Pool2","Pool3"]'
 */

if (process.argv.length < 4) {
  throw new Error('Arguments required: `network` `user` `pools`');
}

const network = process.argv[2];
const userKey = process.argv[3];
const poolsJson = process.argv[4];

const addressBook = AddressBook.loadFromFile(network);
const pools = (JSON.parse(poolsJson) as string[]).map((pool) =>
  addressBook.getContractId(pool)
);
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

async function distribute(pools: string[], txParams: TxParams) {
  // Step 1: Distribute from emitter
  const emitter = new EmitterContract(addressBook.getContractId('emitter'));
  await invokeSorobanOperation(
    emitter.distribute(),
    EmitterContract.parsers.distribute,
    txParams
  );
  console.log('Emitter distributed');

  // Step 2: Gulp emissions for each pool
  for (const poolId of pools) {
    const pool = new PoolContractV2(poolId);
    await invokeSorobanOperation(
      pool.gulpEmissions(),
      PoolContractV2.parsers.gulpEmissions,
      txParams
    );
    console.log(`Gulped emissions for pool: ${poolId}`);
  }
  
  console.log('\n✅ Emissions distribution complete');
}

await distribute(pools, txParams);

