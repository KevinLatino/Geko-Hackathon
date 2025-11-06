import { DeployV2Args, PoolContractV2, PoolFactoryContractV2 } from '@blend-capital/blend-sdk';
import { AddressBook } from '../utils/address-book.js';
import { bumpContractInstance } from '../utils/contract.js';
import { TxParams, invokeSorobanOperation } from '../utils/tx.js';

export async function setupPool(
  deployPoolArgs: DeployV2Args,
  txParams: TxParams,
  addressBook: AddressBook
): Promise<PoolContractV2> {
  const poolFactory = new PoolFactoryContractV2(addressBook.getContractId('poolFactoryV2'));
  const poolAddress = await invokeSorobanOperation(
    poolFactory.deployPool(deployPoolArgs),
    PoolFactoryContractV2.parsers.deployPool,
    txParams
  );
  if (!poolAddress) {
    throw new Error('Failed to deploy pool');
  }
  addressBook.setContractId(deployPoolArgs.name, poolAddress);
  addressBook.writeToFile();
  await bumpContractInstance(poolAddress, txParams);
  return new PoolContractV2(poolAddress);
}

