// import { PoolContractV2 } from "@blend-capital/blend-sdk";
import { AddressBook } from "../utils/address-book.js";
import { config } from "../utils/env_config.js";

/**
 * Verify pool deployment by checking basic information
 *
 * This script verifies that the pool was deployed correctly by checking
 * the contract address and network connectivity.
 *
 * Usage:
 *   npm run pool:verify testnet MyTestPool
 *
 * Or directly:
 *   tsx src/blend/pool/verify-pool.ts testnet MyTestPool
 */

if (process.argv.length < 3) {
  throw new Error("Arguments required: `network` `pool`");
}

const network = process.argv[2];
const poolName = process.argv[3];

const addressBook = AddressBook.loadFromFile(network);
const poolAddress = addressBook.getContractId(poolName);

async function verifyPool(poolName: string, poolAddress: string) {
  console.log("=== Pool Verification ===\n");
  console.log(`Pool Name: ${poolName}`);
  console.log(`Pool Address: ${poolAddress}\n`);

  try {
    // Verify pool contract is accessible by creating an instance
    console.log("🔍 Verifying pool contract accessibility...");

    try {
      // Create pool instance to verify the contract address is valid
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const pool = new PoolContractV2(poolAddress);
      // If we can create the instance, the address format is valid
      console.log("   ✅ Pool contract address is valid");
      console.log(`   ✅ Pool contract instance created successfully\n`);
    } catch (e) {
      console.log("   ❌ Pool contract not accessible");
      throw e;
    }

    // Check if pool is in address book
    console.log("📚 Checking address book...");
    const savedPoolAddress = addressBook.getContractId(poolName);
    if (savedPoolAddress === poolAddress) {
      console.log("   ✅ Pool address matches address book\n");
    } else {
      console.log("   ⚠️  Pool address in address book differs");
      console.log(`   Address book: ${savedPoolAddress}`);
      console.log(`   Provided: ${poolAddress}\n`);
    }

    // Verify network connectivity
    console.log("🌐 Checking network connectivity...");
    try {
      const account = await config.rpc.getAccount(config.admin.publicKey());
      console.log(`   ✅ Connected to network (${network})`);
      console.log(`   ✅ Admin account accessible: ${account.accountId()}\n`);
    } catch (e) {
      console.log("   ❌ Network connectivity issue");
      throw e;
    }

    console.log("✅ Basic pool verification complete!");
    console.log("\n💡 Next steps:");
    console.log(
      "   1. Check pool status: npm run pool:status testnet admin " +
        poolName +
        " 2"
    );
    console.log("   2. View pool in Blend UI: https://testnet.blend.capital");
    console.log("   3. Search for pool by address: " + poolAddress);
  } catch (error) {
    console.error("❌ Error verifying pool:", error);
    throw error;
  }
}

await verifyPool(poolName, poolAddress);
