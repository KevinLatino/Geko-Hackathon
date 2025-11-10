import { Address, Contract, nativeToScVal, Operation, rpc, Transaction, TransactionBuilder, scValToNative, xdr } from '@stellar/stellar-sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { AddressBook } from '../blend/utils/address-book.js';
import { bumpContractInstance } from '../blend/utils/contract.js';
import { config } from '../blend/utils/env_config.js';
import { TxParams, invokeSorobanOperation, signWithKeypair } from '../blend/utils/tx.js';

/**
 * Deploy and initialize the GekoNFT contract
 * 
 * Usage:
 *   npm run nft:deploy testnet admin "Geko NFT" GEKO "https://gateway.pinata.cloud/ipfs/" 25
 * 
 * Or directly:
 *   tsx src/geko-nft/deploy-nft.ts testnet admin "Geko NFT" GEKO "https://gateway.pinata.cloud/ipfs/" 25
 * 
 * IMPORTANT: Make sure to:
 *   1. Compile the contract first: cd contracts/geko-nft && cargo build --target wasm32-unknown-unknown --release
 *   2. Set the following in your .env file:
 *      - RPC_URL=https://soroban-testnet.stellar.org
 *      - NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
 *      - FRIENDBOT_URL=https://friendbot.stellar.org
 *      - ADMIN=S<your-secret-key>
 * 
 */

if (process.argv.length < 8) {
  throw new Error('Arguments required: `network` `user` `name` `symbol` `base_uri` `max_supply`');
}

const network = process.argv[2];
const userKey = process.argv[3];
const nftName = process.argv[4];
const nftSymbol = process.argv[5];
const baseUri = process.argv[6];
const maxSupply = parseInt(process.argv[7]);

const addressBook = AddressBook.loadFromFile(network);
const user = config.getUser(userKey);

const getTxParams = async (): Promise<TxParams> => {
  return {
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
};

async function deployNFT() {
  console.log('=== Deploying GekoNFT ===\n');
  console.log(`Network: ${network}`);
  console.log(`NFT Name: ${nftName}`);
  console.log(`NFT Symbol: ${nftSymbol}`);
  console.log(`Base URI: ${baseUri}`);
  console.log(`Max Supply: ${maxSupply}\n`);

  // Step 1: Load WASM
  console.log('Step 1: Loading WASM contract...');
  const wasmPathCandidates = [
    join(process.cwd(), 'contracts', 'geko-nft', 'target', 'wasm32v1-none', 'release', 'geko_nft.wasm'),
    join(process.cwd(), 'contracts', 'geko-nft', 'target', 'wasm32-unknown-unknown', 'release', 'geko_nft.wasm'),
    join(process.cwd(), 'target', 'wasm32v1-none', 'release', 'geko_nft.wasm'),
    join(process.cwd(), 'target', 'wasm32-unknown-unknown', 'release', 'geko_nft.wasm'),
  ];
  const wasmPath = wasmPathCandidates.find((p) => existsSync(p));
  let wasm: Buffer;
  try {
    if (!wasmPath) {
      throw new Error('WASM artifact not found in known target folders');
    }
    wasm = readFileSync(wasmPath);
  } catch (e) {
    throw new Error(
      `WASM file not found. Tried:\n  - ${wasmPathCandidates.join('\n  - ')}\nPlease compile the contract first:\n  cd contracts/geko-nft && cargo build --target wasm32-unknown-unknown --release\nOr with v1 target:\n  cargo build --target wasm32v1-none --release`
    );
  }
  console.log(`WASM loaded (${wasm.length} bytes)\n`);

  // Step 2: Upload WASM
  console.log('Step 2: Uploading WASM to network...');
  const txParams = await getTxParams();
  
  const uploadOp = Operation.uploadContractWasm({ wasm: wasm });
  const uploadTx = new TransactionBuilder(txParams.account, txParams.txBuilderOptions)
    .addOperation(uploadOp)
    .build();

  const uploadSim = await config.rpc.simulateTransaction(uploadTx);
  if (!rpc.Api.isSimulationSuccess(uploadSim) && !rpc.Api.isSimulationRestore(uploadSim)) {
    throw new Error('WASM upload simulation failed');
  }

  const simRetVal = (rpc.Api.isSimulationSuccess(uploadSim) ? uploadSim.result?.retval : undefined);
  if (!simRetVal) {
    throw new Error('Missing retval from WASM upload simulation');
  }
  const wasmHashBytes = scValToNative(simRetVal) as Uint8Array;
  if (!wasmHashBytes || wasmHashBytes.length === 0) {
    throw new Error('Failed to extract WASM hash from simulation');
  }

  const uploadAssembled = rpc.assembleTransaction(uploadTx, uploadSim).build();
  const uploadSigned = new Transaction(
    await txParams.signerFunction(uploadAssembled.toXDR()),
    config.passphrase
  );

  const uploadResult = await config.rpc.sendTransaction(uploadSigned);
  if (uploadResult.status !== 'PENDING') {
    throw new Error(`Failed to upload WASM: ${uploadResult.status}`);
  }

  let uploadTxResult = await config.rpc.getTransaction(uploadResult.hash);
  while (uploadTxResult.status === 'NOT_FOUND') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    uploadTxResult = await config.rpc.getTransaction(uploadResult.hash);
  }

  if (uploadTxResult.status !== 'SUCCESS') {
    throw new Error(`WASM upload transaction failed: ${uploadTxResult.status}`);
  }

  console.log(`WASM uploaded successfully (hash: ${Buffer.from(wasmHashBytes).toString('hex')})\n`);

  // Step 3: Deploy contract from WASM
  console.log('Step 3: Deploying contract from WASM...');
  const salt = randomBytes(32);
  const hostFunction = xdr.HostFunction.hostFunctionTypeCreateContract(
    new xdr.CreateContractArgs({
      contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
        new xdr.ContractIdPreimageFromAddress({
          address: Address.fromString(user.publicKey()).toScAddress(),
          salt: salt,
        })
      ),
      executable: xdr.ContractExecutable.contractExecutableWasm(Buffer.from(wasmHashBytes)),
    })
  );

  const deployOp = Operation.invokeHostFunction({ func: hostFunction });
  
  let deployTx = new TransactionBuilder(txParams.account, txParams.txBuilderOptions)
    .addOperation(deployOp)
    .build();

  let deploySim = await config.rpc.simulateTransaction(deployTx);
  if (rpc.Api.isSimulationRestore(deploySim)) {
    const fee = (Number(deploySim.restorePreamble.minResourceFee) + 1000).toString();
    const restoreAccount = await config.rpc.getAccount(txParams.account.accountId());
    const restoreTx = new TransactionBuilder(restoreAccount, { fee })
      .setNetworkPassphrase(config.passphrase)
      .setTimeout(0)
      .setSorobanData(deploySim.restorePreamble.transactionData.build())
      .addOperation(Operation.restoreFootprint({}))
      .build();
    const restoreSigned = new Transaction(
      await txParams.signerFunction(restoreTx.toXDR()),
      config.passphrase
    );
    await config.rpc.sendTransaction(restoreSigned);
    // refresh account & rebuild deploy tx
    const fresh = await config.rpc.getAccount(txParams.account.accountId());
    deployTx = new TransactionBuilder(fresh, txParams.txBuilderOptions)
      .addOperation(deployOp)
      .build();
    deploySim = await config.rpc.simulateTransaction(deployTx);
  }
  if (!rpc.Api.isSimulationSuccess(deploySim)) {
    const msg = rpc.Api.isSimulationError(deploySim)
      ? `Contract deployment simulation failed: ${JSON.stringify(deploySim, null, 2)}`
      : 'Contract deployment simulation failed';
    throw new Error(msg);
  }

  const deploySimRetVal = deploySim.result?.retval;
  if (!deploySimRetVal) {
    throw new Error('Missing retval from contract deployment simulation');
  }
  const contractId = scValToNative(deploySimRetVal) as string;

  const deployAssembled = rpc.assembleTransaction(deployTx, deploySim).build();
  const deploySigned = new Transaction(
    await txParams.signerFunction(deployAssembled.toXDR()),
    config.passphrase
  );

  const deployResult = await config.rpc.sendTransaction(deploySigned);
  if (deployResult.status !== 'PENDING') {
    throw new Error(`Failed to deploy contract: ${deployResult.status}`);
  }

  let deployTxResult = await config.rpc.getTransaction(deployResult.hash);
  while (deployTxResult.status === 'NOT_FOUND') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    deployTxResult = await config.rpc.getTransaction(deployResult.hash);
  }

  if (deployTxResult.status !== 'SUCCESS') {
    throw new Error(`Contract deployment transaction failed: ${deployTxResult.status}`);
  }

  console.log(`Contract deployed at address: ${contractId}\n`);

  // Step 4: Initialize contract
  console.log('Step 4: Initializing contract...');
  const deployedContract = new Contract(contractId);
  const adminAddress = Address.fromString(user.publicKey());
  
  const initializeOp = deployedContract.call('initialize',
    nativeToScVal(adminAddress, { type: 'address' }),
    nativeToScVal(nftName, { type: 'string' }),
    nativeToScVal(nftSymbol, { type: 'string' }),
    nativeToScVal(baseUri, { type: 'string' }),
    nativeToScVal(maxSupply, { type: 'u32' })
  );

  const initializeOpXdr = initializeOp.toXDR('base64');
  const initializeTxParams = await getTxParams();
  
  await invokeSorobanOperation(
    initializeOpXdr,
    () => undefined,
    initializeTxParams
  );
  console.log('Contract initialized successfully.\n');

  // Step 5: Bump contract instance
  console.log('Step 5: Bumping contract instance...');
  await bumpContractInstance(contractId, await getTxParams());
  console.log('Contract instance bumped.\n');

  // Step 6: Save to address book
  const contractKey = nftSymbol.toUpperCase();
  addressBook.setContractId(contractKey, contractId);
  addressBook.writeToFile();

  console.log('=== NFT Deployment Complete ===\n');
  console.log(`NFT Name: ${nftName}`);
  console.log(`NFT Symbol: ${nftSymbol}`);
  console.log(`Base URI: ${baseUri}`);
  console.log(`Max Supply: ${maxSupply}`);
  console.log(`Contract Address: ${contractId}`);
  console.log(`Saved to address book as: ${contractKey}\n`);
}

await deployNFT();
