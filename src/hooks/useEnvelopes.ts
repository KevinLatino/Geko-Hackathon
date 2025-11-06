import { useState, useCallback, useMemo } from "react";
import { Client as GekoEnvelopesClient } from "geko_envelopes";
import { useWallet } from "./useWallet";
import { rpcUrl } from "../contracts/util";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";

function isValidSymbol(str: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(str);
}

export function useEnvelopes(contractId: string) {
  const { address, networkPassphrase, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  if (!address || !signTransaction || !networkPassphrase) {
    console.warn("⚠️ Wallet not connected or missing network info");
  }

  // CORRECCIÓN: Pasar publicKey y signTransaction al constructor del Cliente
  const contract = useMemo(() => {
    if (!networkPassphrase || !address || !signTransaction) return null;

    return new GekoEnvelopesClient({
      contractId,
      networkPassphrase,
      rpcUrl,
      publicKey: address, // ← IMPORTANTE: Pasar el publicKey aquí
      signTransaction, // ← IMPORTANTE: Pasar signTransaction aquí
    });
  }, [contractId, networkPassphrase, address, signTransaction]);

  // Ahora signAndSend NO recibe el callback, ya está en el cliente
  const handleTx = useCallback(
    async (assembled: AssembledTransaction<null>) => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        console.log("📄 XDR before signing:", assembled.toXDR());

        // signAndSend ya tiene acceso al signTransaction del cliente
        const response = await assembled.signAndSend();

        console.log("✅ Transaction sent:", response);
        return response;
      } catch (err) {
        console.error("❌ Error sending transaction:", err);
        throw err;
      }
    },
    [contract]
  );

  const createEnvelope = useCallback(
    async (name: string, description: string) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }
      if (!isValidSymbol(name)) {
        console.error(
          "Invalid 'name'. Use only alphanumeric or underscore, no spaces."
        );
        return;
      }
      if (!isValidSymbol(description)) {
        console.error(
          "Invalid 'description'. Use only alphanumeric or underscore, no spaces."
        );
        return;
      }

      console.log("👤 Using user:", address, "for createEnvelope");
      setLoading(true);
      try {
        const assembled: AssembledTransaction<null> = await contract.create(
          {
            user: address,
            name,
            description,
          },
          {
            simulate: true,
          }
        );
        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("✅ Envelope created:", hash);
        return res;
      } catch (e) {
        console.error("❌ Error creating envelope:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  const deposit = useCallback(
    async (name: string, amount: bigint) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }
      if (!isValidSymbol(name)) {
        console.error(
          "Invalid 'name'. Use only alphanumeric or underscore, no spaces."
        );
        return;
      }

      console.log("👤 Using user:", address, "for deposit");
      setLoading(true);
      try {
        const assembled: AssembledTransaction<null> = await contract.deposit({
          user: address,
          name,
          amount,
        });
        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("💰 Deposit successful:", hash);
        return res;
      } catch (e) {
        console.error("❌ Deposit failed:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  const withdraw = useCallback(
    async (name: string, amount: bigint) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }
      if (!isValidSymbol(name)) {
        console.error(
          "Invalid 'name'. Use only alphanumeric or underscore, no spaces."
        );
        return;
      }

      console.log("👤 Using user:", address, "for withdraw");
      setLoading(true);
      try {
        const assembled: AssembledTransaction<null> = await contract.withdraw({
          user: address,
          name,
          amount,
        });
        const res = await handleTx(assembled);
        const hash = res.sendTransactionResponse?.hash;
        console.log("🏦 Withdrawal successful:", hash);
        return res;
      } catch (e) {
        console.error("❌ Withdrawal failed:", e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [address, contract, handleTx]
  );

  const getBalance = useCallback(
    async (name: string) => {
      if (!contract || !address) {
        console.error("Contract not ready or wallet address missing");
        return;
      }
      if (!isValidSymbol(name)) {
        console.error("Invalid 'name'.");
        return;
      }

      console.log("👤 Using user:", address, "for getBalance");
      try {
        const assembled = await contract.get_balance({ user: address, name });
        const result = assembled.result;
        console.log("📊 Balance for", name, "is", result);
        return result;
      } catch (e) {
        console.error("❌ Get balance failed:", e);
      }
    },
    [address, contract]
  );

  return { loading, createEnvelope, deposit, withdraw, getBalance };
}
