import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./useWallet";
import { horizonUrl } from "../contracts/util";
import contracts from "../../testnet.contracts.json";

export interface Transaction {
  id: string;
  hash: string;
  created_at: string;
  type: "sent" | "received" | "deposit" | "withdraw";
  amount: string;
  asset_type: string;
  asset_code?: string;
  counterparty: string;
  category?: "payment" | "investment";
  label?: string;
}

const POOL_CONTRACT_ID = (contracts as any).ids?.["Geko-Pool"] as string;

export function useTransactions() {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch regular payments
      const paymentsResponse = await fetch(
        `${horizonUrl}/accounts/${address}/payments?order=desc&limit=50`
      );
      const paymentsData = await paymentsResponse.json();

      // Fetch all transactions to catch contract interactions
      const transactionsResponse = await fetch(
        `${horizonUrl}/accounts/${address}/transactions?order=desc&limit=50`
      );
      const transactionsData = await transactionsResponse.json();

      const allTransactions: Transaction[] = [];

      // Parse regular payments
      if (paymentsData._embedded && paymentsData._embedded.records) {
        const paymentTxs: Transaction[] = paymentsData._embedded.records
          .filter((record: any) => 
            (record.type === "payment" || record.type === "create_account") &&
            record.transaction_hash
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
              category: "payment" as const,
            };
          })
          .filter((tx: Transaction) => tx.counterparty && tx.counterparty !== "Unknown");
        
        allTransactions.push(...paymentTxs);
      }

      // Parse contract interactions
      if (transactionsData._embedded && transactionsData._embedded.records) {
        for (const tx of transactionsData._embedded.records) {
          try {
            // Fetch operations for this transaction
            const opsResponse = await fetch(`${horizonUrl}/transactions/${tx.hash}/operations`);
            const opsData = await opsResponse.json();

            if (opsData._embedded && opsData._embedded.records) {
              for (const op of opsData._embedded.records) {
                // Look for invoke_host_function operations
                if (op.type === "invoke_host_function" && op.function === "HostFunctionTypeHostFunctionTypeInvokeContract") {
                  // Check if this is interacting with our pool contract
                  const isPoolInteraction = JSON.stringify(op).includes(POOL_CONTRACT_ID);
                  
                  if (isPoolInteraction) {
                    // Try to extract amount and determine action from the transaction effects
                    let amount = "0";
                    let assetCode = "XLM";
                    let isWithdraw = false;
                    
                    // Fetch transaction details to get effects
                    try {
                      const effectsResponse = await fetch(`${horizonUrl}/transactions/${tx.hash}/effects`);
                      const effectsData = await effectsResponse.json();
                      
                      if (effectsData._embedded && effectsData._embedded.records) {
                        for (const effect of effectsData._embedded.records) {
                          if (effect.account === address) {
                            // account_debited = money OUT = DEPOSIT to pool
                            // account_credited = money IN = WITHDRAW from pool
                            if (effect.type === "account_debited") {
                              amount = effect.amount || "0";
                              assetCode = effect.asset_type === "native" ? "XLM" : (effect.asset_code || "USDC");
                              isWithdraw = false; // Money going OUT = Deposit
                              break;
                            } else if (effect.type === "account_credited") {
                              amount = effect.amount || "0";
                              assetCode = effect.asset_type === "native" ? "XLM" : (effect.asset_code || "USDC");
                              isWithdraw = true; // Money coming IN = Withdraw
                              break;
                            }
                          }
                        }
                      }
                    } catch (e) {
                      console.error("Error fetching effects:", e);
                    }

                    // Create more specific labels based on asset type and action
                    const actionLabel = isWithdraw ? "Withdraw" : "Deposit";
                    const label = `${actionLabel} ${assetCode} in Pool`;

                    allTransactions.push({
                      id: op.id,
                      hash: tx.hash,
                      created_at: op.created_at || tx.created_at,
                      type: isWithdraw ? "withdraw" : "deposit",
                      amount,
                      asset_type: assetCode === "XLM" ? "native" : "credit_alphanum4",
                      asset_code: assetCode === "XLM" ? undefined : assetCode,
                      counterparty: "Pool",
                      category: "investment" as const,
                      label,
                    });
                  }
                }
              }
            }
          } catch (error) {
            // Skip this transaction if there's an error
            console.error("Error parsing contract transaction:", error);
          }
        }
      }

      // Sort by date and limit to 20 most recent
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(allTransactions.slice(0, 20));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refetch: fetchTransactions };
}

