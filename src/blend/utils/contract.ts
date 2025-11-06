import {
  Address,
  Keypair,
  Operation,
  rpc,
  SorobanDataBuilder,
  StrKey,
  hash,
  xdr,
} from '@stellar/stellar-sdk';
import { config } from './env_config.js';
import { TxParams, invokeSorobanOperation } from './tx.js';

export async function bumpContractInstance(contractAddress: string, txParams: TxParams) {
  const address = Address.fromString(contractAddress);
  const contractInstanceXDR = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: address.toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
  const sorobanData = new SorobanDataBuilder().setReadOnly([contractInstanceXDR]).build();
  await invokeSorobanOperation(
    Operation.extendFootprintTtl({ extendTo: 535670 }).toXDR('base64'),
    () => undefined,
    txParams,
    sorobanData
  );
}

export async function airdropAccount(user: Keypair) {
  try {
    await config.rpc.requestAirdrop(user.publicKey(), config.friendbot);
  } catch (e) {
  }
}

