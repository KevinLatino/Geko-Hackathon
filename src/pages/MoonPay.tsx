import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { MoonPayBuyWidget } from "@moonpay/moonpay-react";

const MoonPay = () => {
  const { address, isPending } = useWallet();
  const [showWidget, setShowWidget] = useState(false);

  if (isPending || !address) {
    return (
      <div className="h-full w-full min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-[#202020] rounded-3xl p-12 text-center max-w-md">
          <h1 className="text-2xl font-semibold text-white mb-3">Connect your wallet</h1>
          <p className="text-white/60">You need to connect your wallet to buy crypto</p>
        </div>
      </div>
    );
  }

  if (showWidget) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999 p-4">
        <div className="relative w-full max-w-lg bg-[#141414] rounded-2xl overflow-hidden shadow-2xl" style={{ height: '85vh', maxHeight: '700px' }}>
          <button
            onClick={() => setShowWidget(false)}
            className="absolute top-4 right-4 z-10000 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white text-2xl transition-all backdrop-blur-sm"
          >
            ×
          </button>
          <div className="w-full h-full overflow-y-auto">
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
    <div className="h-full w-full min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="text-6xl font-black text-white mb-2">
              MoonPay
            </div>
            <div className="h-1 bg-linear-to-r from-blue-500 to-cyan-400 rounded-full"></div>
          </div>
          <p className="text-xl text-white/70 max-w-xl mx-auto leading-relaxed">
            Buy XLM and USDC instantly with your card or bank account
          </p>
        </div>

        <div className="space-y-4 mb-12">
          <div className="bg-[#202020] rounded-2xl p-6 border-l-4 border-blue-500">
            <div className="text-white font-semibold mb-1">Instant</div>
            <div className="text-white/60 text-sm">Crypto arrives in your wallet within minutes</div>
          </div>
          <div className="bg-[#202020] rounded-2xl p-6 border-l-4 border-cyan-400">
            <div className="text-white font-semibold mb-1">Secure</div>
            <div className="text-white/60 text-sm">Regulated and trusted by millions worldwide</div>
          </div>
          <div className="bg-[#202020] rounded-2xl p-6 border-l-4 border-sky-400">
            <div className="text-white font-semibold mb-1">Simple</div>
            <div className="text-white/60 text-sm">Card, bank transfer, Apple Pay, Google Pay</div>
          </div>
        </div>

        <button
          onClick={() => setShowWidget(true)}
          className="w-full bg-linear-to-r from-blue-600 to-cyan-400 hover:from-blue-700 hover:to-cyan-500 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          Buy Crypto Now
        </button>

        <div className="mt-8 text-center text-white/40 text-sm">
          Powered by MoonPay • Available in 160+ countries
        </div>
      </div>
    </div>
  );
};

export default MoonPay;

