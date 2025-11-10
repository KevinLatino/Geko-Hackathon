import { Address, Operation, Transaction, TransactionBuilder, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

import { AddressBook } from "../blend/utils/address-book.js";
import { bumpContractInstance } from "../blend/utils/contract.js";
import { config } from "../blend/utils/env_config.js";
import { TxParams, signWithKeypair } from "../blend/utils/tx.js";

/**
 * Deploy the Geko Envelopes contract (no initializer)
 *
 * Usage:
 *   npm run envelopes:deploy testnet admin Geko-Envelopes
 *
 * Or directly:
 *   tsx src/geko-envelopes/deploy-envelopes.ts testnet admin Geko-Envelopes
 *
 * IMPORTANT: Make sure to:
 *   1. Compile the contract first:
 *        cd contracts/geko-envelopes
 *        cargo build --target wasm32-unknown-unknown --release
 *        # or: cargo build --target wasm32v1-none --release
 *   2. Set the following in your .env file:
 *        RPC_URL=https://soroban-testnet.stellar.org
 *        NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
 *        ADMIN=S<your-secret-key>
 */

if (process.argv.length < 4) {
  throw new Error("Arguments required: `network` `user` `[alias]`");
}

const network = process.argv[2];
const userKey = process.argv[3];
const aliasArg = process.argv[4];

const addressBook = AddressBook.loadFromFile(network);
const deployer = config.getUser(userKey);

const CONTRACT_ALIAS = aliasArg ?? "GEKO_ENVELOPES";

const getTxParams = async (): Promise<TxParams> => {
  return {
    account: await config.rpc.getAccount(deployer.publicKey()),
    txBuilderOptions: {
      fee: "10000",
      timebounds: {
        minTime: 0,
        maxTime: 0,
      },
      networkPassphrase: config.passphrase,
    },
    signerFunction: async (txXDR: string) => {
      return signWithKeypair(txXDR, config.passphrase, deployer);
    },
  };
};

async function deployEnvelopes() {
  console.log("=== Deploying Geko Envelopes Contract ===\n");
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployer.publicKey()}`);
  console.log(`Alias: ${CONTRACT_ALIAS}\n`);

  // Step 1: Load WASM artifact
  console.log("Step 1: Loading WASM artifact...");
  const wasmCandidates = [
    join(process.cwd(), "contracts", "geko-envelopes", "target", "wasm32v1-none", "release", "geko_envelopes.wasm"),
    join(process.cwd(), "contracts", "geko-envelopes", "target", "wasm32-unknown-unknown", "release", "geko_envelopes.wasm"),
    join(process.cwd(), "target", "wasm32v1-none", "release", "geko_envelopes.wasm"),
    join(process.cwd(), "target", "wasm32-unknown-unknown", "release", "geko_envelopes.wasm"),
  ];

  const wasmPath = wasmCandidates.find((candidate) => existsSync(candidate));
  if (!wasmPath) {
    throw new Error(
      `WASM file not found. Searched:\n  - ${wasmCandidates.join(
        "\n  - ",
      )}\nCompile the contract first:\n  cd contracts/geko-envelopes && cargo build --target wasm32-unknown-unknown --release`,
    );
  }
  const wasm = readFileSync(wasmPath);
  console.log(`WASM loaded (${wasm.length} bytes)\n`);

  // Step 2: Upload WASM
  console.log("Step 2: Uploading WASM to network...");
  const uploadParams = await getTxParams();

  const uploadOp = Operation.uploadContractWasm({ wasm });
  const uploadTx = new TransactionBuilder(uploadParams.account, uploadParams.txBuilderOptions)
    .addOperation(uploadOp)
    .build();

  const uploadSim = await config.rpc.simulateTransaction(uploadTx);
  if (!rpc.Api.isSimulationSuccess(uploadSim) && !rpc.Api.isSimulationRestore(uploadSim)) {
    throw new Error("WASM upload simulation failed");
  }

  const uploadRetval = rpc.Api.isSimulationSuccess(uploadSim) ? uploadSim.result?.retval : undefined;
  if (!uploadRetval) {
    throw new Error("Missing retval from WASM upload simulation");
  }

  const wasmHash = scValToNative(uploadRetval) as Uint8Array;
  if (!wasmHash || wasmHash.length === 0) {
    throw new Error("Failed to extract WASM hash from simulation");
  }

  const assembledUpload = rpc.assembleTransaction(uploadTx, uploadSim).build();
  const signedUpload = new Transaction(await uploadParams.signerFunction(assembledUpload.toXDR()), config.passphrase);

  const uploadResult = await config.rpc.sendTransaction(signedUpload);
  if (uploadResult.status !== "PENDING") {
    throw new Error(`Failed to upload WASM: ${uploadResult.status}`);
  }

  let uploadStatus = await config.rpc.getTransaction(uploadResult.hash);
  while (uploadStatus.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    uploadStatus = await config.rpc.getTransaction(uploadResult.hash);
  }
  if (uploadStatus.status !== "SUCCESS") {
    throw new Error(`WASM upload transaction failed: ${uploadStatus.status}`);
  }
  console.log(`WASM uploaded successfully (hash: ${Buffer.from(wasmHash).toString("hex")})\n`);

  // Step 3: Deploy contract instance
  console.log("Step 3: Deploying contract from uploaded WASM...");
  const salt = randomBytes(32);
  const createArgs = new xdr.CreateContractArgs({
    contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
      new xdr.ContractIdPreimageFromAddress({
        address: Address.fromString(deployer.publicKey()).toScAddress(),
        salt,
      }),
    ),
    executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.from(wasmHash)),
  });

  const deployHostFn = xdr.HostFunction.hostFunctionTypeCreateContract(createArgs);
  const deployOp = Operation.invokeHostFunction({ func: deployHostFn });

  let deployTx = new TransactionBuilder(uploadParams.account, uploadParams.txBuilderOptions)
    .addOperation(deployOp)
    .build();

  let deploySim = await config.rpc.simulateTransaction(deployTx);
  if (rpc.Api.isSimulationRestore(deploySim)) {
    const fee = (Number(deploySim.restorePreamble.minResourceFee) + 1000).toString();
    const restoreAccount = await config.rpc.getAccount(uploadParams.account.accountId());
    const restoreTx = new TransactionBuilder(restoreAccount, { fee })
      .setNetworkPassphrase(config.passphrase)
      .setTimeout(0)
      .setSorobanData(deploySim.restorePreamble.transactionData.build())
      .addOperation(Operation.restoreFootprint({}))
      .build();
    const restoreSigned = new Transaction(await uploadParams.signerFunction(restoreTx.toXDR()), config.passphrase);
    await config.rpc.sendTransaction(restoreSigned);

    const refreshed = await config.rpc.getAccount(uploadParams.account.accountId());
    deployTx = new TransactionBuilder(refreshed, uploadParams.txBuilderOptions)
      .addOperation(deployOp)
      .build();
    deploySim = await config.rpc.simulateTransaction(deployTx);
  }

  if (!rpc.Api.isSimulationSuccess(deploySim)) {
    const msg = rpc.Api.isSimulationError(deploySim)
      ? `Contract deployment simulation failed: ${JSON.stringify(deploySim, null, 2)}`
      : "Contract deployment simulation failed";
    throw new Error(msg);
  }

  const deployRetval = deploySim.result?.retval;
  if (!deployRetval) {
    throw new Error("Missing retval from contract deployment simulation");
  }
  const contractId = scValToNative(deployRetval) as string;

  const assembledDeploy = rpc.assembleTransaction(deployTx, deploySim).build();
  const signedDeploy = new Transaction(await uploadParams.signerFunction(assembledDeploy.toXDR()), config.passphrase);
  const deployResult = await config.rpc.sendTransaction(signedDeploy);
  if (deployResult.status !== "PENDING") {
    throw new Error(`Failed to deploy contract: ${deployResult.status}`);
  }

  let deployStatus = await config.rpc.getTransaction(deployResult.hash);
  while (deployStatus.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    deployStatus = await config.rpc.getTransaction(deployResult.hash);
  }
  if (deployStatus.status !== "SUCCESS") {
    throw new Error(`Contract deployment transaction failed: ${deployStatus.status}`);
  }
  console.log(`Contract deployed at address: ${contractId}\n`);

  // Step 4: Bump contract instance (optional but recommended)
  console.log("Step 4: Bumping contract instance...");
  await bumpContractInstance(contractId, await getTxParams());
  console.log("Contract instance bumped.\n");

  // Step 5: Save to address book
  addressBook.setContractId(CONTRACT_ALIAS, contractId);
  addressBook.writeToFile();

  console.log("=== Geko Envelopes Deployment Complete ===\n");
  console.log(`Contract ID: ${contractId}`);
  console.log(`Saved as: ${CONTRACT_ALIAS}`);
}

await deployEnvelopes();


