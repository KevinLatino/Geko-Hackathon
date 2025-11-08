import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { Send, ArrowDownToLine, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { stellarNetwork } from "../contracts/util";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CurrencyView = "XLM" | "USD";

const WalletModal: React.FC<WalletModalProps> = ({ isOpen }) => {
  const { address } = useWallet();
  const { xlm, balances } = useWalletBalance();
  const { transactions, loading } = useTransactions();
  const navigate = useNavigate();
  const [currencyView, setCurrencyView] = useState<CurrencyView>("XLM");
  const [isFlipping, setIsFlipping] = useState(false);

  // Calculate total balance in USD
  const usdcBalance = balances.find(b => 
    b.asset_type !== "native" && b.asset_type !== "liquidity_pool_shares" && b.asset_code === "USDC"
  );
  const totalUSD = (parseFloat(xlm || "0") * 0.1) + parseFloat(usdcBalance?.balance || "0"); // Assuming XLM = $0.10 for demo

  const handleCurrencySwitch = () => {
    setIsFlipping(true);
    
    setTimeout(() => {
      setCurrencyView(prev => prev === "XLM" ? "USD" : "XLM");
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
        {/* Card with SVG Background and Flip Animation */}
        <div className="wallet-card-container">
          <div className={`wallet-card ${isFlipping ? 'flipping' : ''}`}>
            <img
              src={currencyView === "XLM" ? "/designs/GekoCard.svg" : "/designs/GekoCardRed.svg"}
              alt="Wallet Card"
              className="wallet-card-bg"
            />
            <div className="wallet-card-content">
              <div className="wallet-card-balance">
                <span className="wallet-balance-label">Balance</span>
                <span className="wallet-balance-amount">
                  {currencyView === "XLM" 
                    ? `${xlm} XLM`
                    : `$${totalUSD.toFixed(2)}`
                  }
                </span>
              </div>
              <div className="wallet-card-owner">
                <span className="wallet-owner-label">Owner</span>
                <span className="wallet-owner-name">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}
                </span>
              </div>
            </div>
            
            {/* Currency Switcher Button */}
            <button 
              className="wallet-card-switcher"
              onClick={handleCurrencySwitch}
              disabled={isFlipping}
            >
              <RefreshCw size={16} className={isFlipping ? 'rotating' : ''} />
            </button>
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

