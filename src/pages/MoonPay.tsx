import { MoonPayBuyWidget } from "@moonpay/moonpay-react";
import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

const MoonPay = () => {
  const { address, isPending } = useWallet();
  const [showWidget, setShowWidget] = useState(false);

  if (isPending || !address) {
    return (
      <div className="moonpay-page h-screen w-full flex flex-col items-center justify-center p-8 overflow-hidden bg-[#1f1f1f]">
        <div className="bg-[#2a2a2a] rounded-3xl p-12 text-center max-w-md">
          <h1 className="text-2xl font-semibold text-white mb-3">
            Connect your wallet
          </h1>
          <p className="text-white/60">
            You need to connect your wallet to buy crypto
          </p>
        </div>
      </div>
    );
  }

  if (showWidget) {
    return (
      <div className="moonpay-page fixed inset-0 flex items-center justify-center bg-[#1f1f1f] bg-opacity-80 backdrop-blur-sm z-9999 p-4">
        <div
          className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-[#2a2a2a]"
          style={{ height: "85vh", maxHeight: "700px" }}
        >
          <button
            onClick={() => setShowWidget(false)}
            className="absolute top-4 right-4 z-10000 w-10 h-10 rounded-full bg-[#3a3a3a] hover:bg-[#444444] flex items-center justify-center text-white text-2xl transition-all"
          >
            ×
          </button>
          <div className="w-full h-full overflow-hidden">
            <MoonPayBuyWidget
              variant="embedded"
              theme="dark"
              baseCurrencyCode="usd"
              baseCurrencyAmount="100"
              defaultCurrencyCode="xlm"
              walletAddress={address}
              visible
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="moonpay-page h-screen w-full flex items-center justify-center p-8 overflow-hidden ">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="text-5xl font-black text-white mb-2">Buy Crypto</div>
          </div>
          <p className="text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
            Buy XLM and USDC instantly with your card or bank account
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-[#2a2a2a] rounded-2xl p-6">
            <div className="text-white font-semibold mb-1">Instant</div>
            <div className="text-white/60 text-sm">
              Crypto arrives in your wallet within minutes
            </div>
          </div>
          <div className="bg-[#2a2a2a] rounded-2xl p-6">
            <div className="text-white font-semibold mb-1">Secure</div>
            <div className="text-white/60 text-sm">
              Regulated and trusted by millions worldwide
            </div>
          </div>
          <div className="bg-[#2a2a2a] rounded-2xl p-6">
            <div className="text-white font-semibold mb-1">Simple</div>
            <div className="text-white/60 text-sm">
              Card, bank transfer, Apple Pay, Google Pay
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowWidget(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Buy Crypto Now
        </button>

        <div className="mt-6 text-center text-white/40 text-sm">
          Powered by MoonPay • Available in 160+ countries
        </div>
      </div>
    </div>
  );
};

export default MoonPay;
