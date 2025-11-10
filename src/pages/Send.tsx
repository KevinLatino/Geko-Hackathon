import { Icon } from "@stellar/design-system";
import {
  Asset,
  BASE_FEE,
  Memo,
  Networks,
  Operation,
  rpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useMemo, useState } from "react";
import { rpcUrl, stellarNetwork } from "../contracts/util";
import { useTransactions } from "../hooks/useTransactions";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { getUSDCIssuer } from "../util/assets";
import storage from "../util/storage";

type Step = 1 | 2 | 3;
type Currency = "XLM" | "USDC";

export default function Send() {
  const { address, signTransaction } = useWallet();
  const { xlm, balances, updateBalance } = useWalletBalance();
  const { refetch: refetchTransactions } = useTransactions();
  const [step, setStep] = useState<Step>(1);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("XLM");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [sendAll, setSendAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  // Get network from storage or use stellarNetwork
  const network = useMemo(() => {
    const storedNetwork = storage.getItem("walletNetwork");
    return storedNetwork || stellarNetwork;
  }, []);

  // Get USDC issuer based on network
  const usdcIssuer = useMemo(() => getUSDCIssuer(network), [network]);

  // Get network passphrase
  const networkPassphrase = useMemo(() => {
    const storedPassphrase = storage.getItem("networkPassphrase");
    if (storedPassphrase) return storedPassphrase;
    return network.toUpperCase() === "PUBLIC"
      ? Networks.PUBLIC
      : Networks.TESTNET;
  }, [network]);

  const usdcBalance = balances.find(
    (b) =>
      b.asset_type !== "native" &&
      b.asset_type !== "liquidity_pool_shares" &&
      b.asset_code === "USDC"
  );
  const availableBalance =
    selectedCurrency === "XLM" ? xlm : usdcBalance?.balance || "0";

  // Validate if destination account has trustline for USDC
  const validateDestinationAccount = async () => {
    if (selectedCurrency === "XLM") return true; // XLM doesn't need trustline

    try {
      // Use Horizon API to check trustlines (RPC doesn't have balances)
      const horizonUrl =
        network.toUpperCase() === "PUBLIC"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org";

      const response = await fetch(
        `${horizonUrl}/accounts/${destinationAddress}`
      );
      if (!response.ok) {
        throw new Error("Account not found");
      }

      const destAccount = await response.json();

      // Check if account has USDC trustline
      const hasUsdcTrustline = destAccount.balances?.some(
        (balance: any) =>
          balance.asset_code === "USDC" && balance.asset_issuer === usdcIssuer
      );

      if (!hasUsdcTrustline) {
        setWarningMessage(
          "⚠️ The destination account doesn't have a trustline for USDC. The transaction will fail. The recipient needs to add a USDC trustline first."
        );
        setShowWarningModal(true);
        return false;
      }

      return true;
    } catch (error) {
      setWarningMessage(
        "⚠️ Could not verify destination account. It might not exist or be invalid."
      );
      setShowWarningModal(true);
      return false;
    }
  };

  const handleNext = async () => {
    if (step === 1 && destinationAddress) {
      setStep(2);
    } else if (step === 2 && amount) {
      // Validate destination account before proceeding to step 3
      const isValid = await validateDestinationAccount();
      if (isValid) {
        setStep(3);
      }
    }
  };

  const handleSend = async () => {
    if (!address || !signTransaction || !destinationAddress || !amount) return;

    setLoading(true);
    try {
      const server = new rpc.Server(rpcUrl, {
        allowHttp: rpcUrl.startsWith("http://"),
      });
      const sourceAccount = await server.getAccount(address);

      let operation;
      if (selectedCurrency === "XLM") {
        operation = Operation.payment({
          destination: destinationAddress,
          asset: Asset.native(),
          amount: amount,
        });
      } else {
        // USDC on Stellar
        const usdcAsset = new Asset("USDC", usdcIssuer);
        operation = Operation.payment({
          destination: destinationAddress,
          asset: usdcAsset,
          amount: amount,
        });
      }

      const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase,
      }).addOperation(operation);

      if (memo) {
        transactionBuilder.addMemo(Memo.text(memo));
      }

      const transaction = transactionBuilder.setTimeout(180).build();

      const signedResult = await signTransaction(transaction.toXDR(), {
        networkPassphrase: networkPassphrase,
        address,
      });

      const transactionToSubmit = TransactionBuilder.fromXDR(
        signedResult.signedTxXdr,
        networkPassphrase
      );

      const result = await server.sendTransaction(transactionToSubmit);

      if (result.status === "PENDING") {
        setTxHash(result.hash);
        setShowSuccessModal(true);

        // Update balance and transactions
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

        // Reset form
        setTimeout(() => {
          setStep(1);
          setDestinationAddress("");
          setAmount("");
          setMemo("");
          setSendAll(false);
        }, 3000);
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error("Error sending transaction:", error);

      let errorMsg = "Unknown error occurred";
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }

      // Check for common errors
      if (errorMsg.includes("trustline")) {
        setWarningMessage(
          "❌ Transaction Failed: The destination account doesn't have a trustline for USDC. The recipient must add a USDC trustline before they can receive USDC."
        );
      } else if (
        errorMsg.includes("Account not found") ||
        errorMsg.includes("does not exist")
      ) {
        setWarningMessage(
          "❌ Transaction Failed: The destination account does not exist or is invalid."
        );
      } else if (errorMsg.includes("Insufficient balance")) {
        setWarningMessage(
          "❌ Transaction Failed: Insufficient balance to complete this transaction."
        );
      } else {
        setWarningMessage(`❌ Transaction Failed: ${errorMsg}`);
      }

      setShowWarningModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAll = (checked: boolean) => {
    if (checked) {
      const balance = parseFloat(availableBalance || "0");
      const fee = selectedCurrency === "XLM" ? 1 : 0; // Reserve 1 XLM for fees
      const sendableAmount = Math.max(0, balance - fee);
      setAmount(sendableAmount.toFixed(7));
    } else {
      setAmount("");
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8 overflow-hidden">
        <p className="text-white text-lg">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="send-page flex flex-col items-center justify-center h-screen px-8 overflow-hidden">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">
        <div className="flex items-center justify-center w-full gap-4 mb-12">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                step >= 1
                  ? step === 1
                    ? "bg-blue-600"
                    : "bg-green-500"
                  : "bg-gray-700"
              }`}
            >
              <Icon.Wallet01
                size="lg"
                color="#FFFFFF"
                style={{ width: "24px", height: "24px" }}
              />
            </div>
            <div className="text-center flex flex-col gap-3">
              <p className="text-xs text-white/60">STEP 1</p>
              <p className="text-sm text-white font-medium">
                Wallet Information
              </p>
            </div>
          </div>

          <div
            className={`h-0.5 w-24 ${step >= 2 ? "bg-blue-600" : "bg-gray-700"} -mt-10`}
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                step >= 2
                  ? step === 2
                    ? "bg-blue-600"
                    : "bg-green-500"
                  : "bg-gray-700"
              }`}
            >
              <Icon.CoinsStacked02
                size="lg"
                color="#FFFFFF"
                style={{ width: "24px", height: "24px" }}
              />
            </div>
            <div className="text-center flex flex-col gap-3">
              <p className="text-xs text-white/60">STEP 2</p>
              <p className="text-sm text-white font-medium">Select Currency</p>
            </div>
          </div>

          <div
            className={`h-0.5 w-24 ${step >= 3 ? "bg-blue-600" : "bg-gray-700"} -mt-10`}
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                step >= 3 ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              <Icon.ReceiptCheck
                size="lg"
                color="#FFFFFF"
                style={{ width: "24px", height: "24px" }}
              />
            </div>
            <div className="text-center flex flex-col gap-3">
              <p className="text-xs text-white/60">STEP 3</p>
              <p className="text-sm text-white font-medium">Memo & Receipt</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Wallet Direction
                </label>
                <input
                  type="text"
                  placeholder="Wallet information goes here..."
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                onClick={handleNext}
                disabled={!destinationAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full transition-all"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Currency
                </label>
                <div className="flex gap-2 bg-[#202020] border border-white/10 rounded-full p-2">
                  <button
                    onClick={() => setSelectedCurrency("XLM")}
                    className={`flex-1 py-3 rounded-full font-medium transition-all ${
                      selectedCurrency === "XLM"
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    XLM
                  </button>
                  <button
                    onClick={() => setSelectedCurrency("USDC")}
                    className={`flex-1 py-3 rounded-full font-medium transition-all ${
                      selectedCurrency === "USDC"
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    USDC
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  placeholder="Enter the amount here..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">
                  Available: {parseFloat(availableBalance || "0").toFixed(4)}{" "}
                  {selectedCurrency}
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendAll}
                    onChange={(e) => {
                      setSendAll(e.target.checked);
                      handleSendAll(e.target.checked);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-white/60 text-sm">Send All?</span>
                </label>
              </div>

              <button
                onClick={handleNext}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full transition-all"
              >
                Send
              </button>

              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-all"
              >
                <Icon.ArrowLeft size="md" />
                Go back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Amount
                </label>
                <div className="bg-[#202020] border border-white/10 rounded-xl px-6 py-8 text-center">
                  <p className="text-4xl font-bold text-white">
                    {amount}{" "}
                    <span className="text-white/60 text-2xl">
                      {selectedCurrency}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Transaction memo
                </label>
                <input
                  type="text"
                  placeholder="Enter transaction memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full transition-all"
              >
                {loading ? "Sending..." : "Send"}
              </button>

              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-all"
              >
                <Icon.ArrowLeft size="md" />
                Go back
              </button>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202020] border border-white/10 rounded-3xl p-8 max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
              <Icon.Check size="lg" color="#FFFFFF" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Transaction Sent!
              </h2>
              <p className="text-white/60">
                Your transaction has been successfully submitted to the network.
              </p>
            </div>
            <div className="w-full bg-[#202020] rounded-xl px-4 py-3">
              <p className="text-white/60 text-xs mb-1">Transaction Hash:</p>
              <p className="text-white text-xs font-mono break-all">{txHash}</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202020] border border-red-500/30 rounded-3xl p-8 max-w-md w-full flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Warning</h2>
              <p className="text-white/80 text-sm">{warningMessage}</p>
            </div>
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <p className="text-yellow-500/80 text-xs">
                <strong>What is a trustline?</strong> In Stellar, accounts must
                establish a trustline before receiving any asset other than XLM.
                The recipient needs to create a USDC trustline in their wallet
                first.
              </p>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-full transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
