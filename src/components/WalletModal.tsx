import React from "react";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { Send, ArrowDownToLine, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { stellarNetwork } from "../contracts/util";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen }) => {
  const { address } = useWallet();
  const { xlm } = useWalletBalance();
  const { transactions, loading } = useTransactions();
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today - ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days === 1) {
      return `Yesterday - ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleTransactionClick = (hash: string) => {
    const networkPath = stellarNetwork.toLowerCase() === "public" ? "public" : "testnet";
    window.open(`https://stellar.expert/explorer/${networkPath}/tx/${hash}`, '_blank');
  };

  return (
    <>
      {/* Modal Content */}
      <div className={`wallet-modal ${isOpen ? "open" : ""}`}>
        {/* Card with SVG Background */}
        <div className="wallet-card">
          <img
            src="/designs/GekoCard.svg"
            alt="Wallet Card"
            className="wallet-card-bg"
          />
          <div className="wallet-card-content">
            <div className="wallet-card-balance">
              <span className="wallet-balance-label">Balance</span>
              <span className="wallet-balance-amount">
                ${xlm || "0.00"}
              </span>
            </div>
            <div className="wallet-card-owner">
              <span className="wallet-owner-label">Owner</span>
              <span className="wallet-owner-name">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Send & Receive Buttons */}
        <div className="wallet-actions">
          <button 
            className="wallet-action-btn"
            onClick={() => navigate("/send")}
            style={{ backgroundColor: '#FFFFFF0F' }}
          >
            <Send size={18} />
            <span>Send</span>
          </button>
          <button 
            className="wallet-action-btn"
            onClick={() => navigate("/receive")}
            style={{ backgroundColor: '#FFFFFF0F' }}
          >
            <ArrowDownToLine size={18} />
            <span>Receive</span>
          </button>
        </div>

        {/* Transactions Title */}
        <div className="wallet-transactions-header">
          <h3 className="text-white text-sm font-semibold">All Transactions</h3>
        </div>

        {/* Transactions List */}
        <div className="wallet-transactions">
          {loading ? (
            <div className="text-white/60 text-sm text-center py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-white/60 text-sm text-center py-8">No transactions yet</div>
          ) : (
            transactions.map((tx) => {
              // Safety check
              if (!tx.hash || !tx.id) return null;
              
              return (
                <div 
                  key={tx.id} 
                  className="wallet-transaction-item"
                  onClick={() => handleTransactionClick(tx.hash)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="transaction-icon">
                    {tx.type === "sent" ? (
                      <ArrowUpRight size={20} className="text-red-500" />
                    ) : (
                      <ArrowDownLeft size={20} className="text-green-500" />
                    )}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-time">{formatDate(tx.created_at)}</div>
                    <div className="transaction-name">
                      {tx.counterparty && tx.counterparty.length >= 8
                        ? `${tx.counterparty.slice(0, 4)}...${tx.counterparty.slice(-4)}`
                        : "Unknown"
                      }
                    </div>
                  </div>
                  <div className={`transaction-amount ${tx.type === "received" ? "positive" : "negative"}`}>
                    {tx.type === "received" ? "+" : "-"}
                    {tx.asset_type === "native" 
                      ? `${parseFloat(tx.amount || "0").toFixed(2)} XLM`
                      : `$${parseFloat(tx.amount || "0").toFixed(2)}`
                    }
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

