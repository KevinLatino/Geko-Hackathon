import { useCallback, useMemo, useState } from "react";
import { Client as GekoEnvelopesClient } from "geko_envelopes";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { useWallet } from "./useWallet";
import { rpcUrl } from "../contracts/util";

type TxResponse = Awaited<ReturnType<AssembledTransaction<any>["signAndSend"]>>;

export function useEnvelopePool(contractId: string) {
  const { address, networkPassphrase, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    if (!networkPassphrase || !address || !signTransaction) return null;
    return new GekoEnvelopesClient({
      contractId,
      networkPassphrase,
      rpcUrl,
      publicKey: address,
      signTransaction,
    });
  }, [contractId, networkPassphrase, address, signTransaction]);

  const handleTx = useCallback(
    async <T,>(assembled: AssembledTransaction<T>): Promise<TxResponse> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }
      const res = await assembled.signAndSend();
      const hash = res.sendTransactionResponse?.hash ?? null;
      setLastHash(hash);
      return res;
    },
    [contract]
  );

  const depositToPool = useCallback(
    async (id: bigint, amount: bigint) => {
      if (!contract || !address) return;
      setLoading(true);
      setError(null);
      try {
        const assembled = await (contract as any).deposit_to_pool({
          user: address,
          id,
          amount,
        });
        return await handleTx(assembled);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  /** Create a new envelope (name, description as string; token & pool contract ids) */
  const createEnvelope = useCallback(
    async (name: string, description: string, tokenContract: string, poolContract: string) => {
      if (!contract || !address) return;
      setLoading(true);
      setError(null);
      try {
        const assembled = await (contract as any).create({
          user: address,
          name,
          description,
          token_contract: tokenContract,
          pool_contract: poolContract,
        });
        return await handleTx(assembled);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  const withdrawFromPool = useCallback(
    async (id: bigint, amount: bigint) => {
      if (!contract || !address) return;
      setLoading(true);
      setError(null);
      try {
        const assembled = await (contract as any).withdraw_from_pool({
          user: address,
          id,
          amount,
        });
        return await handleTx(assembled);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  return {
    loading,
    lastHash,
    error,
    createEnvelope,
    depositToPool,
    withdrawFromPool,
  };
}


