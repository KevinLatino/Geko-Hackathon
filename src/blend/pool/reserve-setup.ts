import { PoolContractV2, SetReserveV2Args } from '@blend-capital/blend-sdk';
import { TxParams, invokeSorobanOperation } from '../utils/tx.js';

export async function setupReserve(
  poolAddress: string,
  initReserveArgs: SetReserveV2Args,
  txParams: TxParams
) {
  const pool = new PoolContractV2(poolAddress);

  await invokeSorobanOperation(
    pool.queueSetReserve(initReserveArgs),
    PoolContractV2.parsers.queueSetReserve,
    txParams
  );

  try {
    await invokeSorobanOperation(
      pool.setReserve(initReserveArgs.asset),
      PoolContractV2.parsers.setReserve,
      txParams
    );
  } catch (e) {
  }
}

