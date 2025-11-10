import React, { useState } from "react";
import { Icon, Tooltip } from "@stellar/design-system";
import type { Envelope } from "geko_envelopes";
import { useEnvelopes } from "../hooks/useEnvelopes";
import { getTokenSymbol } from "../components/modules/envelopes/utils/tokenUtils";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useNotification } from "../hooks/useNotification";
import { getUSDCIssuer } from "../util/assets";
import { stellarNetwork } from "../contracts/util";

interface EnvelopeWithDate extends Envelope {
  createdAt?: string;
}

interface EnvelopeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  envelope: EnvelopeWithDate | null;
  onUpdate?: () => void;
}

const CONTRACT_ID = "CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ";

/**
 * Convierte snake_case a formato legible para mostrar en la UI
 * Ejemplo: "trip_to_europe" -> "Trip to Europe"
 */
const toReadableFormat = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const EnvelopeEditModal: React.FC<EnvelopeEditModalProps> = ({
  isOpen,
  onClose,
  envelope,
  onUpdate,
}) => {
  const { deposit, withdraw, getBalance, loading } = useEnvelopes(CONTRACT_ID);
  const { address } = useWallet();
  const { balances } = useWalletBalance();
  const { addNotification } = useNotification();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<bigint | null>(null);
  const [actionType, setActionType] = useState<"deposit" | "withdraw">("deposit");
  const [hasYield, setHasYield] = useState(false);
  const [isYieldTooltipVisible, setIsYieldTooltipVisible] = useState(false);

  // Load balance when envelope changes
  React.useEffect(() => {
    if (envelope && isOpen) {
      void (async () => {
        const b = await getBalance(envelope.id);
        if (b !== undefined) setBalance(b);
      })();
    }
  }, [envelope, isOpen, getBalance]);

  const formatBalance = (
    balance: bigint | string | number,
    tokenContract: string
  ): string => {
    const balanceNum =
      typeof balance === "bigint"
        ? Number(balance)
        : typeof balance === "string"
          ? Number(balance)
          : balance;

    // Convert from stroops to XLM (divide by 10,000,000)
    const xlm = balanceNum / 10000000;
    const tokenSymbol = getTokenSymbol(tokenContract);

    // Format with proper decimals and show token symbol
    return `${xlm.toFixed(7)} ${tokenSymbol}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString)
      return new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const checkUSDCTrustline = async (): Promise<boolean> => {
    if (!address) return false;
    
    try {
      const network = stellarNetwork.toUpperCase() === "PUBLIC" ? "PUBLIC" : "TESTNET";
      const usdcIssuer = getUSDCIssuer(network);
      const horizonUrl = network === "PUBLIC" 
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
          balance.asset_code === "USDC" && 
          balance.asset_issuer === usdcIssuer
      );
      
      return hasUsdcTrustline || false;
    } catch (error) {
      console.error("Error checking trustline:", error);
      return false;
    }
  };

  const handleDeposit = async () => {
    if (!envelope || !amount) return;
    
    const tokenContract = envelope.token_contract as string;
    const tokenSymbol = getTokenSymbol(tokenContract);
    
    // Check if it's USDC and validate trustline and balance
    if (tokenSymbol === "USDC") {
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
      
      const depositAmount = parseFloat(amount);
      const availableBalance = parseFloat(usdcBalance.balance);
      
      if (depositAmount > availableBalance) {
        addNotification(
          `Insufficient USDC balance. You have ${availableBalance.toFixed(2)} USDC available.`,
          "error",
          true
        );
        return;
      }
    }
    
    try {
      await deposit(envelope.id, BigInt(Math.round(Number(amount) * 10000000)));
      setAmount("");
      // Refresh balance
      const b = await getBalance(envelope.id);
      if (b !== undefined) setBalance(b);
      addNotification("Deposit successful!", "success");
      onUpdate?.();
    } catch (e) {
      console.error("Error depositing:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      addNotification(`Error depositing: ${errorMessage}`, "error");
    }
  };

  const handleWithdraw = async () => {
    if (!envelope || !amount) return;
    try {
      await withdraw(envelope.id, BigInt(Math.round(Number(amount) * 10000000)));
      setAmount("");
      // Refresh balance
      const b = await getBalance(envelope.id);
      if (b !== undefined) setBalance(b);
      addNotification("Withdraw successful!", "success");
      onUpdate?.();
    } catch (e) {
      console.error("Error withdrawing:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      addNotification(`Error withdrawing: ${errorMessage}`, "error");
    }
  };

  const handleAction = () => {
    if (actionType === "deposit") {
      void handleDeposit();
    } else {
      void handleWithdraw();
    }
  };

  const tokenContract = envelope?.token_contract as string;

  return (
    <div className={`envelope-edit-modal ${isOpen ? "open" : ""}`}>
      {envelope && (
      <div className="envelope-edit-modal-content">
        <div className="envelope-edit-header">
          <div>
            <h2 className="envelope-edit-title">
              {toReadableFormat(envelope.name)}
            </h2>
            <p className="envelope-edit-subtitle">
              {formatDate(envelope.createdAt)}
            </p>
          </div>
          <button className="envelope-edit-close" onClick={onClose}>
            <Icon.XClose size="md" />
          </button>
        </div>

        <div className="envelope-edit-info">
          <div className="envelope-edit-balance-section">
            <span className="envelope-edit-balance-label">Balance</span>
            <span className="envelope-edit-balance-amount">
              {balance !== null
                ? formatBalance(balance, tokenContract)
                : "Loading..."}
            </span>
          </div>
          <div className="envelope-edit-status">
            <span className="status-badge">Saved</span>
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: "24px" }}>
          <div className="form-label-row yield-field-row">
            <div className="yield-label-container">
              <label className="form-label">Yield</label>
              <div
                onMouseEnter={() => setIsYieldTooltipVisible(true)}
                onMouseLeave={() => setIsYieldTooltipVisible(false)}
              >
                <Tooltip
                  isVisible={isYieldTooltipVisible}
                  isContrast
                  title="What is Yield?"
                  placement="top"
                  triggerEl={
                    <div className="yield-tooltip-trigger" role="button">
                      <Icon.InfoCircle size="sm" />
                    </div>
                  }
                >
                  <div style={{ maxWidth: "250px" }}>
                    Yield allows your envelope to earn interest over time.
                    When enabled, your funds will be automatically invested
                    to generate returns.
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="yield-switch-container">
              <button
                className={`yield-switch ${hasYield ? "active" : ""}`}
                onClick={() => setHasYield(!hasYield)}
                type="button"
              >
                <span
                  className={`yield-switch-slider ${hasYield ? "active" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="envelope-edit-actions">
          <div className="envelope-edit-action-tabs">
            <button
              className={`envelope-edit-tab ${actionType === "deposit" ? "active" : ""}`}
              onClick={() => setActionType("deposit")}
            >
              Deposit
            </button>
            <button
              className={`envelope-edit-tab ${actionType === "withdraw" ? "active" : ""}`}
              onClick={() => setActionType("withdraw")}
            >
              Withdraw
            </button>
          </div>

          <div className="envelope-edit-input-section">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={getTokenSymbol(tokenContract) === "USDC" ? "$0.00" : "0.00 XLM"}
            />
          </div>

          <button
            className="create-button"
            onClick={handleAction}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading
              ? "Processing..."
              : actionType === "deposit"
                ? "Deposit"
                : "Withdraw"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default EnvelopeEditModal;

