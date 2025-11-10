import { Icon } from "@stellar/design-system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";

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

  // Mock quests data - En el futuro esto vendrá de un hook o estado global
  const [quests, setQuests] = useState<Quest[]>([
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
  ]);

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
    <div className="rewards-page min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Rewards & Quests
              </h1>
              <p className="text-white/60">
                Complete quests to earn exclusive NFTs
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-[#202020] rounded-2xl p-6 border border-[#333333]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold">Overall Progress</span>
              <span className="text-white/60">
                {completedQuests} / {totalQuests} completed
              </span>
            </div>
            <div className="w-full h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercentage}%`,
                  background:
                    "linear-gradient(135deg, #00BBFF 0%, #0051FF 100%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`rewards-quest-card bg-[#202020] rounded-2xl overflow-hidden border border-[#333333] cursor-pointer transition-all duration-300 hover:border-[#444444] hover:shadow-lg ${
                quest.completed ? "border-green-500/50" : ""
              } ${selectedQuest === quest.id ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => handleQuestClick(quest)}
            >
              {/* Image Section with Overlay */}
              <div className="relative w-full aspect-square overflow-hidden">
                {/* NFT Image */}
                <img
                  src={`/nfts/${quest.nftReward}.png`}
                  alt={`NFT ${quest.nftReward}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />

                {/* Overlay Gradient */}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                  {quest.completed ? (
                    <div className="px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-green-100 text-xs font-bold rounded-full border border-green-400/50">
                      Completed
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm text-blue-100 text-xs font-bold rounded-full border border-blue-400/50">
                      Active
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    {quest.completed ? (
                      <Icon.CheckCircle size="sm" className="text-green-400" />
                    ) : (
                      <div className="text-white/80">{quest.icon}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Details Section */}
              <div className="p-4 bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white/50 text-xs mb-1">NFT Reward</p>
                    <p className="text-white font-semibold text-sm">
                      NFT #{quest.nftReward}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/50 text-xs mb-1">Status</p>
                    <p
                      className={`text-xs font-semibold ${
                        quest.completed ? "text-green-400" : "text-blue-400"
                      }`}
                    >
                      {quest.completed ? "Claimed" : "Available"}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                {!quest.completed && quest.actionPath && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(quest.actionPath!);
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <span>{quest.action}</span>
                    <Icon.ArrowRight size="sm" />
                  </button>
                )}

                {quest.completed && (
                  <div className="w-full py-2.5 px-4 bg-green-500/20 text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm">
                    <Icon.CheckCircle size="sm" />
                    <span>Quest Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Quest Details Modal */}
        {selectedQuest && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#202020] rounded-2xl p-8 max-w-md w-full border border-[#333333] relative">
              <button
                onClick={() => setSelectedQuest(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#333333] hover:bg-[#444444] flex items-center justify-center text-white transition-all"
              >
                <Icon.XClose size="md" />
              </button>

              {(() => {
                const quest = quests.find((q) => q.id === selectedQuest);
                if (!quest) return null;

                return (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                        <Icon.Trophy01 size="xl" className="text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {quest.title}
                        </h2>
                        <p className="text-green-400 text-sm font-semibold">
                          Quest Completed!
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-white/80 mb-4">{quest.description}</p>
                      <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#333333]">
                        <p className="text-white/60 text-sm mb-2">
                          Your NFT Reward
                        </p>
                        <div className="w-full aspect-square rounded-lg overflow-hidden">
                          <img
                            src={`/nfts/${quest.nftReward}.png`}
                            alt={`NFT ${quest.nftReward}`}
                            className="w-full h-full object-cover"
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
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
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
