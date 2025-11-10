import { Icon } from "@stellar/design-system";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import "./Rewards.css";

interface Quest {
  id: string;
  title: string;
  description: string;
  action: string;
  actionPath?: string;
  nftReward: number; // NFT index (0-25)
  completed: boolean;
  icon: React.ReactNode;
}

const Rewards: React.FC = () => {
  const { address } = useWallet();
  const navigate = useNavigate();
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);

  const quests = useMemo<Quest[]>(
    () => [
      {
        id: "connect-wallet",
        title: "First Connection",
        description: "Connect your wallet to start earning rewards",
        action: "Connect Wallet",
        nftReward: 0,
        completed: !!address,
        icon: <Icon.Wallet01 size="lg" />,
      },
      {
        id: "create-envelope",
        title: "Envelope Creator",
        description: "Create your first envelope",
        action: "Create Envelope",
        actionPath: "/envelopes",
        nftReward: 10,
        completed: false,
        icon: <Icon.PiggyBank02 size="lg" />,
      },
      {
        id: "send-transaction",
        title: "First Send",
        description: "Send XLM or USDC to another wallet",
        action: "Send Now",
        actionPath: "/send",
        nftReward: 11,
        completed: false,
        icon: <Icon.Send01 size="lg" />,
      },
      {
        id: "receive-transaction",
        title: "First Receive",
        description: "Receive XLM or USDC in your wallet",
        action: "View QR",
        actionPath: "/receive",
        nftReward: 26,
        completed: false,
        icon: <Icon.Receipt size="lg" />,
      },
      {
        id: "buy-crypto",
        title: "Crypto Buyer",
        description: "Buy crypto using MoonPay",
        action: "Buy Crypto",
        actionPath: "/moonpay",
        nftReward: 27,
        completed: false,
        icon: <Icon.CreditCard02 size="lg" />,
      },
      {
        id: "pool-deposit",
        title: "Pool Investor",
        description: "Deposit funds into the liquidity pool",
        action: "Invest Now",
        actionPath: "/pool/Test",
        nftReward: 28,
        completed: false,
        icon: <Icon.CoinsStacked02 size="lg" />,
      },
      {
        id: "envelope-deposit",
        title: "Envelope Saver",
        description: "Deposit funds into an envelope",
        action: "View Envelopes",
        actionPath: "/envelopes",
        nftReward: 29,
        completed: false,
        icon: <Icon.PiggyBank02 size="lg" />,
      },
      {
        id: "multiple-envelopes",
        title: "Envelope Master",
        description: "Create 3 or more envelopes",
        action: "Create More",
        actionPath: "/envelopes",
        nftReward: 30,
        completed: false,
        icon: <Icon.PiggyBank02 size="lg" />,
      },
    ],
    [address],
  );

  const handleQuestClick = (quest: Quest) => {
    if (quest.completed) {
      setSelectedQuest(quest.id === selectedQuest ? null : quest.id);
    } else if (quest.actionPath) {
      navigate(quest.actionPath);
    }
  };

  const completedQuests = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;
  const progressPercentage = (completedQuests / totalQuests) * 100;

  return (
    <div className="rewards-page">
      <div className="rewards-container">
        <div className="rewards-header">
          <div className="rewards-header-text">
            <h1 className="rewards-title">Rewards & Quests</h1>
            <p className="rewards-subtitle">
              Complete quests to earn exclusive NFTs
            </p>
          </div>
        </div>

        <div className="rewards-progress-card">
          <div className="rewards-progress-header">
            <span className="rewards-progress-title">Overall Progress</span>
            <span className="rewards-progress-summary">
              {completedQuests} / {totalQuests} completed
            </span>
          </div>
          <div className="rewards-progress-track">
            <div
              className="rewards-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="rewards-grid">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`rewards-quest-card ${
                quest.completed ? "completed" : ""
              } ${selectedQuest === quest.id ? "selected" : ""}`}
              onClick={() => handleQuestClick(quest)}
            >
              <div className="rewards-card-image">
                <img
                  src={`/nfts/${quest.nftReward}.png`}
                  alt={`NFT ${quest.nftReward}`}
                  className="rewards-card-image-src"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              <div className="rewards-card-details">
                <div className="rewards-card-meta">
                  <div className="rewards-card-meta-group">
                    <p className="rewards-card-meta-label">NFT Reward</p>
                    <p className="rewards-card-meta-value">
                      NFT #{quest.nftReward}
                    </p>
                  </div>
                  <div className="rewards-card-meta-group align-right">
                    <p className="rewards-card-status-label">Status</p>
                    <p
                      className={`rewards-card-status ${
                        quest.completed ? "completed" : ""
                      }`}
                    >
                      {quest.completed ? "Completed" : "Available"}
                    </p>
                  </div>
                </div>

                <p className="rewards-card-description">{quest.description}</p>

                {!quest.completed && quest.actionPath && (
                  <div className="rewards-card-action">
                    <span>{quest.action}</span>
                    <Icon.ArrowRight size="sm" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedQuest && (
          <div className="rewards-modal-backdrop">
            <div className="rewards-modal">
              <button
                onClick={() => setSelectedQuest(null)}
                className="rewards-modal-close"
              >
                <Icon.XClose size="md" />
              </button>

              {(() => {
                const quest = quests.find((q) => q.id === selectedQuest);
                if (!quest) return null;

                return (
                  <>
                    <div className="rewards-modal-header">
                      <div className="rewards-modal-icon">
                        <Icon.Trophy01 size="xl" className="rewards-icon" />
                      </div>
                      <div>
                        <h2 className="rewards-modal-title">{quest.title}</h2>
                        <p className="rewards-modal-subtitle">
                          Quest Completed!
                        </p>
                      </div>
                    </div>

                    <div className="rewards-modal-body">
                      <p className="rewards-modal-description">
                        {quest.description}
                      </p>
                      <div className="rewards-modal-reward">
                        <p className="rewards-modal-reward-label">
                          Your NFT Reward
                        </p>
                        <div className="rewards-modal-reward-image">
                          <img
                            src={`/nfts/${quest.nftReward}.png`}
                            alt={`NFT ${quest.nftReward}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedQuest(null)}
                      className="rewards-modal-button"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
