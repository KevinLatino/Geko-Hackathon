import { Icon } from "@stellar/design-system";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stellarNetwork } from "../contracts/util";
import { useTransactions } from "../hooks/useTransactions";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransactionFilter = "all" | "investments" | "received" | "sent";

const WalletModal: React.FC<WalletModalProps> = ({ isOpen }) => {
  const { address, currencyView, setCurrencyView, pendingCurrencyChange } =
    useWallet();
  const { xlm, balances } = useWalletBalance();
  const { transactions, loading } = useTransactions();
  const navigate = useNavigate();
  const [isFlipping, setIsFlipping] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>("all");

  // Calculate total balance in USD
  const usdcBalance = balances.find(
    (b) =>
      b.asset_type !== "native" &&
      b.asset_type !== "liquidity_pool_shares" &&
      b.asset_code === "USDC"
  );
  const totalUSD =
    parseFloat(xlm || "0") * 0.1 + parseFloat(usdcBalance?.balance || "0"); // Assuming XLM = $0.10 for demo

  // Trigger flip animation when pendingCurrencyChange is set (from Pool page)
  useEffect(() => {
    if (pendingCurrencyChange !== null) {
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
      }, 600);
    }
  }, [pendingCurrencyChange]);

  const handleCurrencySwitch = () => {
    setIsFlipping(true);

    setTimeout(() => {
      setCurrencyView(currencyView === "XLM" ? "USD" : "XLM");
    }, 300); // Switch content when opacity is 0 (middle of flip)

    setTimeout(() => {
      setIsFlipping(false);
    }, 600);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today - ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    } else if (days === 1) {
      return `Yesterday - ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleTransactionClick = (hash: string) => {
    const networkPath =
      stellarNetwork.toLowerCase() === "public" ? "public" : "testnet";
    window.open(
      `https://stellar.expert/explorer/${networkPath}/tx/${hash}`,
      "_blank"
    );
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "investments")
      return tx.type === "deposit" || tx.type === "withdraw";
    if (filter === "received") return tx.type === "received";
    if (filter === "sent") return tx.type === "sent";
    return true;
  });

  return (
    <>
      <div className={`wallet-modal ${isOpen ? "open" : ""}`}>
        <div className="wallet-card-container">
          <div className={`wallet-card ${isFlipping ? "flipping" : ""}`}>
            <img
              src={
                currencyView === "XLM"
                  ? "/designs/GekoCard.svg"
                  : "/designs/GekoCardRed.svg"
              }
              alt="Wallet Card"
              className="wallet-card-bg"
            />
            <div className="wallet-card-content">
              <div className="wallet-card-balance">
                <span className="wallet-balance-label">Balance</span>
                <span className="wallet-balance-amount">
                  {currencyView === "XLM"
                    ? `${xlm} XLM`
                    : `$${totalUSD.toFixed(2)}`}
                </span>
              </div>
              <div className="wallet-card-owner">
                <span className="wallet-owner-label">Owner</span>
                <span className="wallet-owner-name">
                  {address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : "Not Connected"}
                </span>
              </div>
            </div>

            <button
              className="wallet-card-switcher"
              onClick={handleCurrencySwitch}
              disabled={isFlipping}
            >
              <Icon.RefreshCw01
                size="sm"
                className={isFlipping ? "rotating" : ""}
              />
            </button>
          </div>
        </div>

        <div className="wallet-actions">
          <button
            className="wallet-action-btn"
            onClick={() => navigate("/send")}
            style={{ backgroundColor: "#FFFFFF0F" }}
          >
            <Icon.Send01 size="md" style={{ width: "20px", height: "20px" }} />
            <span>Send</span>
          </button>
          <button
            className="wallet-action-btn"
            onClick={() => navigate("/receive")}
            style={{ backgroundColor: "#FFFFFF0F" }}
          >
            <Icon.ArrowDown
              size="md"
              style={{ width: "25px", height: "25px" }}
            />
            <span>Receive</span>
          </button>
        </div>

        <div className="wallet-transactions-header">
          <h3 className="text-white text-sm font-semibold">All Transactions</h3>
        </div>

        <div className="transaction-filters">
          <button
            onClick={() => setFilter("all")}
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("investments")}
            className={`filter-btn ${filter === "investments" ? "active" : ""}`}
          >
            Investments
          </button>
          <button
            onClick={() => setFilter("received")}
            className={`filter-btn ${filter === "received" ? "active" : ""}`}
          >
            Received
          </button>
          <button
            onClick={() => setFilter("sent")}
            className={`filter-btn ${filter === "sent" ? "active" : ""}`}
          >
            Sent
          </button>
        </div>

        <div className="wallet-transactions">
          {loading ? (
            <div className="text-white/60 text-sm text-center py-8">
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-white/60 text-sm text-center py-8">
              No transactions yet
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              // Safety check
              if (!tx.hash || !tx.id) return null;

              // Determine icon and color based on transaction type
              const getTransactionIcon = () => {
                switch (tx.type) {
                  case "sent":
                    return <Icon.ArrowUpRight size="md" color="#EF4444" />;
                  case "received":
                    return <Icon.ArrowDownLeft size="md" color="#10B981" />;
                  case "deposit":
                    // Deposit = money OUT = red
                    return <Icon.TrendUp01 size="md" color="#EF4444" />;
                  case "withdraw":
                    // Withdraw = money IN = green
                    return <Icon.TrendDown01 size="md" color="#10B981" />;
                  default:
                    return <Icon.ArrowUpRight size="md" color="#9CA3AF" />;
                }
              };

              const getAmountPrefix = () => {
                // Withdraw and received = money coming IN (+)
                // Deposit and sent = money going OUT (-)
                if (tx.type === "received" || tx.type === "withdraw")
                  return "+";
                return "-";
              };

              const getAmountColor = () => {
                // Withdraw and received = money coming IN (green/positive)
                // Deposit and sent = money going OUT (red/negative)
                if (tx.type === "received" || tx.type === "withdraw")
                  return "positive";
                return "negative";
              };

              // Format amount with proper asset display
              const formatAmount = () => {
                const amount = parseFloat(tx.amount || "0").toFixed(2);
                if (tx.asset_type === "native") {
                  return `${amount} XLM`;
                } else {
                  // Show asset_code if available, otherwise default to USDC
                  const assetCode = tx.asset_code || "USDC";
                  return `${amount} ${assetCode}`;
                }
              };

              return (
                <div
                  key={tx.id}
                  className="wallet-transaction-item"
                  onClick={() => handleTransactionClick(tx.hash)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="transaction-icon">{getTransactionIcon()}</div>
                  <div className="transaction-info">
                    <div className="transaction-time">
                      {formatDate(tx.created_at)}
                    </div>
                    <div className="transaction-name">
                      {tx.category === "investment" ? (
                        // For investment transactions, show the label prominently
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-medium text-sm">
                            {tx.label}
                          </span>
                          <span className="text-white/50 text-xs">
                            Pool Contract
                          </span>
                        </div>
                      ) : (
                        // For regular transactions, show counterparty
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-medium text-sm">
                            {tx.type === "sent" ? "Sent to" : "Received from"}
                          </span>
                          <span className="text-white/70 text-xs">
                            {tx.counterparty && tx.counterparty.length >= 8
                              ? `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`
                              : tx.counterparty || "Unknown"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`transaction-amount ${getAmountColor()}`}>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      {getAmountPrefix()}
                      {formatAmount()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default WalletModal;
