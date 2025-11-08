import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";
import { horizonUrl } from "../contracts/util";

export interface Transaction {
  id: string;
  hash: string;
  created_at: string;
  type: "sent" | "received";
  amount: string;
  asset_type: string;
  asset_code?: string;
  counterparty: string;
}

export function useTransactions() {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${horizonUrl}/accounts/${address}/payments?order=desc&limit=20`
        );
        const data = await response.json();

        if (!data._embedded || !data._embedded.records) {
          setTransactions([]);
          return;
        }

        const parsedTransactions: Transaction[] = data._embedded.records
          .filter((record: any) => 
            (record.type === "payment" || record.type === "create_account") &&
            record.transaction_hash // Ensure we have a transaction hash
          )
          .map((record: any) => {
            const isSent = record.from === address;
            const counterparty = isSent ? (record.to || "Unknown") : (record.from || "Unknown");

            return {
              id: record.id,
              hash: record.transaction_hash,
              created_at: record.created_at,
              type: isSent ? "sent" : "received",
              amount: record.amount || record.starting_balance || "0",
              asset_type: record.asset_type || "native",
              asset_code: record.asset_code,
              counterparty,
            };
          })
          .filter((tx: Transaction) => tx.counterparty && tx.counterparty !== "Unknown"); // Filter out transactions without counterparty

        setTransactions(parsedTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [address]);

  return { transactions, loading };
}

