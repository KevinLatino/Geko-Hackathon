import { PoolContractV2, RequestType } from "@blend-capital/blend-sdk";
import {
  Transaction,
  TransactionBuilder,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import React, { useMemo, useState } from "react";
import contracts from "../../testnet.contracts.json";
import { networkPassphrase, rpcUrl, stellarNetwork } from "../contracts/util";
import { useNotification } from "../hooks/useNotification";
import { useTransactions } from "../hooks/useTransactions";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { getUSDCIssuer } from "../util/assets";

const POOL_NAME = "Test";
const XLM_ID = (contracts as any).ids?.["XLM"] as string;
const USDC_ID = (contracts as any).ids?.["USDC"] as string;

async function signAndSubmit(
  signer:
    | ((
        xdr: string,
        opts?: { networkPassphrase?: string; address?: string }
      ) => Promise<{ signedTxXdr: string }>)
    | undefined,
  opXdrBase64: string,
  address: string
) {
  if (!signer) throw new Error("Wallet not connected");
  const server = new rpc.Server(rpcUrl, {
    allowHttp: rpcUrl.startsWith("http://"),
  });
  const userAccount = await server.getAccount(address);
  const txBuilder = new TransactionBuilder(userAccount, {
    fee: "10000",
    timebounds: { minTime: 0, maxTime: 0 },
    networkPassphrase,
  }).addOperation(xdr.Operation.fromXDR(opXdrBase64, "base64"));
  const built = txBuilder.build();
  const sim = await server.simulateTransaction(built);
  if (!rpc.Api.isSimulationSuccess(sim) && !rpc.Api.isSimulationRestore(sim)) {
    throw new Error("Simulation failed");
  }
  const assembled = rpc.assembleTransaction(built, sim).build();
  const { signedTxXdr } = await signer(assembled.toXDR(), {
    networkPassphrase,
    address,
  });
  const tx = TransactionBuilder.fromXDR(
    signedTxXdr,
    networkPassphrase
  ) as Transaction;
  const sent = await server.sendTransaction(tx);
  if (sent.status !== "PENDING") throw new Error("Failed to send");
  let res = await server.getTransaction(sent.hash);
  while (res.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    res = await server.getTransaction(sent.hash);
  }
  if (res.status !== "SUCCESS") throw new Error("Transaction failed");
  return sent.hash;
}

const Pool: React.FC = () => {
  const { address, signTransaction, triggerCurrencyChange } = useWallet();
  const { updateBalance, balances } = useWalletBalance();
  const { refetch: refetchTransactions } = useTransactions();
  const { addNotification } = useNotification();
  const poolAddress = (contracts as any).ids?.[POOL_NAME] ?? "";
  const pool = useMemo(() => new PoolContractV2(poolAddress), [poolAddress]);

  const [selectedCurrency, setSelectedCurrency] = useState<"XLM" | "USDC">(
    "XLM"
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);

  const toFixed7 = (v: string) => BigInt(Math.round(Number(v) * 1e7));

  const checkUSDCTrustline = async (): Promise<boolean> => {
    if (!address) return false;

    try {
      const network =
        stellarNetwork.toUpperCase() === "PUBLIC" ? "PUBLIC" : "TESTNET";
      const usdcIssuer = getUSDCIssuer(network);
      const horizonUrl =
        network === "PUBLIC"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org";

      const response = await fetch(`${horizonUrl}/accounts/${address}`);
      if (!response.ok) {
        return false;
      }

      const account = await response.json();

      // Check if account has USDC trustline
      const hasUsdcTrustline = account.balances?.some(
        (balance: any) =>
          balance.asset_code === "USDC" && balance.asset_issuer === usdcIssuer
      );

      return hasUsdcTrustline || false;
    } catch (error) {
      console.error("Error checking trustline:", error);
      return false;
    }
  };

  const handleCurrencySelect = (currency: "XLM" | "USDC") => {
    if (currency === selectedCurrency) return;

    setSelectedCurrency(currency);

    // Trigger animated currency change in wallet card
    if (currency === "USDC") {
      triggerCurrencyChange("USD");
    } else {
      triggerCurrencyChange("XLM");
    }
  };

  const handleDeposit = async () => {
    if (!address || !depositAmount) return;

    // Check if it's USDC and validate trustline and balance
    if (selectedCurrency === "USDC") {
      const hasTrustline = await checkUSDCTrustline();
      const usdcBalance = balances.find(
        (b) =>
          b.asset_type !== "native" &&
          b.asset_type !== "liquidity_pool_shares" &&
          b.asset_code === "USDC"
      );
      const hasBalance = usdcBalance && parseFloat(usdcBalance.balance) > 0;

      if (!hasTrustline) {
        addNotification(
          "You don't have a USDC trustline. Please add a USDC trustline first to deposit USDC.",
          "error",
          true
        );
        return;
      }

      if (!hasBalance) {
        addNotification(
          "You don't have USDC balance. Please acquire USDC first to make a deposit.",
          "error",
          true
        );
        return;
      }

      const depositAmountNum = parseFloat(depositAmount);
      const availableBalance = parseFloat(usdcBalance.balance);

      if (depositAmountNum > availableBalance) {
        addNotification(
          `Insufficient USDC balance. You have ${availableBalance.toFixed(2)} USDC available.`,
          "error",
          true
        );
        return;
      }
    }

    setBusy("deposit");
    try {
      const isXLM = selectedCurrency === "XLM";
      const assetId = isXLM ? XLM_ID : USDC_ID;
      const requestType = isXLM
        ? RequestType.SupplyCollateral
        : RequestType.Supply;

      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          {
            address: assetId,
            amount: toFixed7(depositAmount),
            request_type: requestType,
          },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      setDepositAmount("");

      // Update balance and transactions immediately and retry a few times to ensure it's updated
      await updateBalance();
      await refetchTransactions();
      setTimeout(() => {
        updateBalance();
        refetchTransactions();
      }, 2000);
      setTimeout(() => {
        updateBalance();
        refetchTransactions();
      }, 4000);
      addNotification("Deposit successful!", "success");
    } catch (error) {
      console.error("Error in handleDeposit:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addNotification(
        `Error depositing ${selectedCurrency}: ${errorMessage}`,
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) return;
    setBusy("withdraw");
    try {
      const isXLM = selectedCurrency === "XLM";
      const assetId = isXLM ? XLM_ID : USDC_ID;
      const requestType = isXLM
        ? RequestType.WithdrawCollateral
        : RequestType.Withdraw;

      const op = pool.submit({
        from: address,
        spender: address,
        to: address,
        requests: [
          {
            address: assetId,
            amount: toFixed7(withdrawAmount),
            request_type: requestType,
          },
        ],
      });
      const hash = await signAndSubmit(signTransaction as any, op, address);
      setLastHash(hash);
      setWithdrawAmount("");

      // Update balance and transactions immediately and retry a few times to ensure it's updated
      await updateBalance();
      await refetchTransactions();
      setTimeout(() => {
        updateBalance();
        refetchTransactions();
      }, 2000);
      setTimeout(() => {
        updateBalance();
        refetchTransactions();
      }, 4000);
      addNotification("Withdraw successful!", "success");
    } catch (error) {
      console.error("Error in handleWithdraw:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addNotification(
        `Error withdrawing ${selectedCurrency}: ${errorMessage}`,
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="pool-container lg:p-1 md:p-5 sm:p-5">
      {/* Currency Selection Cards */}
      <div className="currency-cards ">
        <button
          className={`currency-card ${selectedCurrency === "XLM" ? "active" : ""}`}
          onClick={() => handleCurrencySelect("XLM")}
          style={{
            backgroundImage:
              selectedCurrency === "XLM"
                ? `url(/designs/Stellar-FullColor.svg)`
                : `url(/designs/Stellar-WhiteBlack.svg)`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom -10px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="card-content">
            <span className="invest-label">Invest in</span>
            <span className="currency-name">XLM - Stellar</span>
          </div>
        </button>

        <button
          className={`currency-card ${selectedCurrency === "USDC" ? "active" : ""}`}
          onClick={() => handleCurrencySelect("USDC")}
          style={{
            backgroundImage:
              selectedCurrency === "USDC"
                ? `url(/designs/USDC-FullColor.svg)`
                : `url(/designs/USDC-WhiteBlack.svg)`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom -10px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="card-content">
            <span className="invest-label">Invest in</span>
            <span className="currency-name">USDC - USD Coin</span>
          </div>
        </button>
      </div>

      {/* Deposit Section */}
      <div className="action-section">
        <div className="action-header">
          <div className="action-info">
            <div className="action-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4V20M12 4L8 8M12 4L16 8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3>Please select an amount</h3>
              <p className="action-description">
                This is the amount of currency you are investing
              </p>
            </div>
          </div>
        </div>
        <div className="action-input-row">
          <input
            type="number"
            placeholder={selectedCurrency === "USDC" ? "$0.00" : "0.00 XLM"}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="amount-input"
          />
          <button
            className="action-button"
            onClick={handleDeposit}
            disabled={!address || busy === "deposit" || !depositAmount}
          >
            {busy === "deposit" ? "Processing..." : "Deposit"}
          </button>
        </div>
      </div>

      {/* Swap Icon */}
      <div className="swap-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 10L12 15L17 10M7 6L12 11L17 6"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Withdraw Section */}
      <div className="action-section">
        <div className="action-header">
          <div className="action-info">
            <div className="action-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 20V4M12 20L8 16M12 20L16 16"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3>Please select an amount</h3>
              <p className="action-description">
                This is the amount of currency you are withdrawing from your
                investment
              </p>
            </div>
          </div>
        </div>
        <div className="action-input-row">
          <input
            type="number"
            placeholder={selectedCurrency === "USDC" ? "$0.00" : "0.00 XLM"}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="amount-input"
          />
          <button
            className="action-button"
            onClick={handleWithdraw}
            disabled={!address || busy === "withdraw" || !withdrawAmount}
          >
            {busy === "withdraw" ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {!address && (
        <p style={{ color: "#ff9800", textAlign: "center", marginTop: "2rem" }}>
          ⚠️ Please connect your wallet to use this pool
        </p>
      )}
      {lastHash && (
        <p
          style={{
            color: "#4caf50",
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "0.875rem",
          }}
        >
          ✅ Transaction successful: {lastHash.slice(0, 8)}...
          {lastHash.slice(-8)}
        </p>
      )}
    </div>
  );
};

export default Pool;
