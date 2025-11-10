import {
  I128MAX,
  PoolContractV2,
  ReserveConfigV2,
  ReserveEmissionMetadata,
} from '@blend-capital/blend-sdk';
import { randomBytes } from 'crypto';
import { setupPool } from './pool-setup.js';
import { setupReserve } from './reserve-setup.js';
import { AddressBook } from '../utils/address-book.js';
import { config } from '../utils/env_config.js';
import { TxParams, invokeSorobanOperation, signWithKeypair } from '../utils/tx.js';

/**
 * Deploy a pool with the following parameters
 * 
 * Usage: 
 *   npm run pool:deploy testnet
 * 
 * Or directly:
 *   tsx src/blend/pool/deploy-pool.ts testnet
 * 
 * IMPORTANT: Make sure to set the following in your .env file:
 *   - RPC_URL=https://soroban-testnet.stellar.org
 *   - NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
 *   - FRIENDBOT_URL=https://friendbot.stellar.org
 *   - ADMIN=S<your-secret-key>
 */

if (process.argv.length < 3) {
  throw new Error('Arguments required: `network` (e.g., testnet)');
}

const network = process.argv[2];
// Load address book for the specified network
const addressBook = AddressBook.loadFromFile(network);

// Get fresh account for each transaction
const getTxParams = async (): Promise<TxParams> => {
  return {
    account: await config.rpc.getAccount(config.admin.publicKey()),
    txBuilderOptions: {
      fee: '10000',
      timebounds: {
        minTime: 0,
        maxTime: 0,
      },
      networkPassphrase: config.passphrase,
    },
    signerFunction: async (txXDR: string) => {
      return signWithKeypair(txXDR, config.passphrase, config.admin);
    },
  };
};

/// Deployment Constants
const pool_name = 'Test';
// Backstop take rate: 0 = no backstop, 0.5e7 = 50% of interest goes to backstop
// Set to 0 if you don't want to use backstop
const backstop_take_rate = 0; // 0% = no backstop (no interest goes to backstop)
const max_positions = 8; // Maximum number of positions in the pool
const min_collateral = BigInt(1000000); // Minimum collateral ($1 worth, scaled to 7 decimals)

// Assets to add to the pool (must be defined in testnet.contracts.json)
const reserves = ['XLM', 'USDC'];

// Reserve configurations
const reserve_configs: ReserveConfigV2[] = [
  {
    index: 0, // Does not matter, will be assigned by set_reserve
    decimals: 7, // XLM has 7 decimals
    c_factor: 980_0000, // 98% collateral factor (scaled to 7 decimals)
    l_factor: 980_0000, // 98% liability factor (scaled to 7 decimals)
    util: 900_0000, // 90% target utilization (must be under max_util)
    max_util: 980_0000, // 98% maximum utilization
    r_base: 50000, // 0.5% base interest rate (scaled to 7 decimals)
    r_one: 500000, // 5% interest rate increase below target util
    r_two: 1000000, // 10% interest rate increase above target util
    r_three: 1_0000000, // 100% interest rate increase above 95% util
    reactivity: 1000, // Reactivity constant (must be <= 1000)
    supply_cap: I128MAX, // Maximum supply cap (use I128MAX for unlimited)
    enabled: true,
  },
  {
    index: 0,
    decimals: 7, // USDC has 7 decimals
    c_factor: 980_0000, // 98% collateral factor
    l_factor: 980_0000, // 98% liability factor
    util: 900_0000, // 90% target utilization
    max_util: 980_0000, // 98% maximum utilization
    r_base: 50000, // 0.5% base interest rate
    r_one: 500000, // 5% interest rate increase below target util
    r_two: 1000000, // 10% interest rate increase above target util
    r_three: 1_0000000, // 100% interest rate increase above 95% util
    reactivity: 1000,
    supply_cap: I128MAX,
    enabled: true,
  },
];

// Pool emission metadata - governs how pool emissions are distributed
const poolEmissionMetadata: ReserveEmissionMetadata[] = [
  {
    res_index: 0, // First reserve (XLM)
    res_type: 1, // 0 for borrow emissions, 1 for supply (lender) emissions
    share: BigInt(0.5e7), // 50% of total emissions (scaled to 7 decimals)
  },
  {
    res_index: 1, // Second reserve (USDC)
    res_type: 1, // Supply emissions for lenders
    share: BigInt(0.5e7), // 50% of total emissions
  },
];

async function deploy() {
  console.log('=== Deploying Blend Pool ===\n');
  console.log(`Pool Name: ${pool_name}`);
  console.log(`Network: ${network}`);
  console.log(`Reserves: ${reserves.join(', ')}\n`);

  const poolSalt = randomBytes(32);

  // Step 1: Deploy the pool
  console.log('Step 1: Deploying pool contract...');
  const newPool = await setupPool(
    {
      admin: config.admin.publicKey(),
      name: pool_name,
      salt: poolSalt,
      oracle: addressBook.getContractId('oracle'),
      backstop_take_rate: backstop_take_rate,
      max_positions: max_positions,
      min_collateral: min_collateral,
    },
    await getTxParams(),
    addressBook
  );

  const poolAddress = newPool.contractId();
  console.log(`Pool deployed at address: ${poolAddress}\n`);

  // Step 2: Add reserves
  console.log('Step 2: Setting up pool reserves and emissions...\n');

  for (let i = 0; i < reserves.length; i++) {
    const reserve_name = reserves[i];
    const reserve_config = reserve_configs[i];
    console.log(`Adding reserve ${i + 1}/${reserves.length}: ${reserve_name}`);
    await setupReserve(
      poolAddress,
      {
        asset: addressBook.getContractId(reserve_name),
        metadata: reserve_config,
      },
      await getTxParams()
    );
  }

  // Step 3: Set emissions configuration
  console.log('\nStep 3: Setting emissions configuration...');
  await invokeSorobanOperation(
    newPool.setEmissionsConfig(poolEmissionMetadata),
    PoolContractV2.parsers.setEmissionsConfig,
    await getTxParams()
  );
  console.log('Emissions configuration set successfully.\n');

  // Update address book with the new pool
  addressBook.setContractId(pool_name, poolAddress);
  addressBook.writeToFile();

  console.log('=== Pool Deployment Complete ===\n');
  console.log(`Pool Name: ${pool_name}`);
  console.log(`Pool Address: ${poolAddress}`);
  console.log(`Backstop Take Rate: ${backstop_take_rate === 0 ? 'Disabled (0%)' : `${(backstop_take_rate / 1e7 * 100).toFixed(2)}%`}`);
  console.log('\nNext steps:');
  if (backstop_take_rate === 0) {
    console.log('⚠️  Backstop is disabled - pool can only be set to "Admin On Ice" (deposits only, no borrowing)');
    console.log('1. Set pool status to "Admin On Ice" (status 2) - allows deposits but not borrowing');
    console.log(`   Run: npm run pool:status testnet admin ${pool_name} 2`);
    console.log('2. Note: Pool cannot be activated to "Admin Active" without backstop threshold');
  } else {
    console.log('1. Set pool status to active');
    console.log(`   Run: npm run pool:status testnet admin ${pool_name} 0`);
    console.log('2. Note: If backstop threshold is not met, use update-status instead');
    console.log(`   Run: npm run pool:update-status testnet admin ${pool_name}`);
  }
}

await deploy();

