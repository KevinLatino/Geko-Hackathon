import { useState, useCallback, useMemo } from "react";
import { Client as GekoEnvelopesClient, type Envelope } from "geko_envelopes";
import { useWallet } from "./useWallet";
import { rpcUrl } from "../contracts/util";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { POOL_CONTRACT_ID } from "../components/modules/envelopes/constants";

function isValidSymbol(str: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(str);
}

export function useEnvelopes(contractId: string) {
  const { address, networkPassphrase, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  if (!address || !signTransaction || !networkPassphrase) {
    console.warn("Wallet not connected or missing network info");
  }

  // Contract client configured
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

  // Sign and send transactions (generic for any result)
  const handleTx = useCallback(
    async <T>(assembled: AssembledTransaction<T>) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }
      try {
        console.log("XDR before signing:", assembled.toXDR());
        const response = await assembled.signAndSend();
        console.log("Transaction sent:", response);
        return response;
      } catch (err) {
        console.error("Error sending transaction:", err);
        throw err;
      }
    },
    [contract]
  );

  /** Create a new envelope
   *  - name and description validated (only alphanumeric and _)
   *  - tokenContract: token address (XLM native => wrapper contract if applicable, or USDC contract)
   *  - create returns u64 -> bindings use bigint as result type
   */
  const createEnvelope = useCallback(
    async (name: string, description: string, tokenContract: string) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }
      if (!isValidSymbol(name) || !isValidSymbol(description)) {
        console.error(
          "Invalid 'name' or 'description'. Use only alphanumeric or underscore."
        );
        return;
      }

      console.log("Using user:", address, "for createEnvelope");
      setLoading(true);
      try {
        const poolContractId = POOL_CONTRACT_ID;
        const assembled = await contract.create({
          user: address,
          name,
          description,
          token_contract: tokenContract,
          pool_contract: poolContractId,
        } as any);

        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("Envelope created:", hash);
        return res;
      } catch (e) {
        console.error("Error creating envelope:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  /** Deposit tokens into an envelope (id: u64 -> bigint in TS) */
  const deposit = useCallback(
    async (id: bigint, amount: bigint) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }

      console.log("Using user:", address, "for deposit");
      setLoading(true);
      try {
        const assembled = await contract.deposit({ user: address, id, amount });
        console.log("XDR before signing:", assembled.result);
        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("Deposit successful:", hash);
        return res;
      } catch (e) {
        console.error("Deposit failed:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  /** Withdraw tokens */
  const withdraw = useCallback(
    async (id: bigint, amount: bigint) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }

      console.log("Using user:", address, "for withdraw");
      setLoading(true);
      try {
        const assembled = await contract.withdraw({
          user: address,
          id,
          amount,
        });
        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("Withdrawal successful:", hash);
        return res;
      } catch (e) {
        console.error("Withdrawal failed:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  /** Get balance (view) */
  const getBalance = useCallback(
    async (id: bigint): Promise<bigint | undefined> => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }

      console.log("Using user:", address, "for getBalance");
      try {
        const assembled = await contract.get_balance({ user: address, id });
        const result = assembled.result;
        console.log("Balance for envelope", id, "is", result);
        return result;
      } catch (e) {
        console.error("Get balance failed:", e);
      }
    },
    [address, contract]
  );

  /** List envelopes (view) */
  const listEnvelopes = useCallback(async (): Promise<Envelope[]> => {
    if (!contract || !address) {
      console.error("Contract not ready or wallet address missing");
      console.error("Contract not ready or wallet address missing");
      return [];
    }
    try {
      const assembled = await contract.list_envelopes({ user: address });
      const result = assembled.result || [];
      console.log("User envelopes:", result);
      return result;
    } catch (e) {
      console.error("Error listing envelopes:", e);
      return [];
    }
  }, [address, contract]);

  return {
    loading,
    createEnvelope,
    deposit,
    withdraw,
    getBalance,
    listEnvelopes,
  };
}
