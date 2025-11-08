import React, { useState } from "react";
import { Icon } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimeFilter = "Today" | "Week" | "Month";

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { address } = useWallet();
  const { xlm } = useWalletBalance();
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("Month");

  // Mock transactions data - replace with real data later
  const transactions = [
    { id: 1, name: "Jose Sanchez", amount: "+$30.00", time: "Today - 6:22 AM" },
    { id: 2, name: "Jose Sanchez", amount: "+$30.00", time: "Today - 6:22 AM" },
    { id: 3, name: "Jose Sanchez", amount: "+$30.00", time: "Today - 6:22 AM" },
    { id: 4, name: "Jose Sanchez", amount: "+$30.00", time: "Today - 6:22 AM" },
  ];

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
                ${xlm ? parseFloat(xlm).toFixed(2) : "0.00"}
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
          <button className="wallet-action-btn">
            <Icon.Send02 size="lg" />
            <span>Send</span>
          </button>
          <button className="wallet-action-btn">
            <Icon.Download01 size="lg" />
            <span>Receive</span>
          </button>
        </div>

        {/* Time Filter */}
        <div className="wallet-filter">
          {(["Today", "Week", "Month"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              className={`wallet-filter-btn ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="wallet-transactions">
          {transactions.map((tx) => (
            <div key={tx.id} className="wallet-transaction-item">
              <div className="transaction-icon">
                <Icon.RefreshCcw01 size="md" />
              </div>
              <div className="transaction-info">
                <div className="transaction-time">{tx.time}</div>
                <div className="transaction-name">{tx.name}</div>
              </div>
              <div className="transaction-amount positive">{tx.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default WalletModal;

