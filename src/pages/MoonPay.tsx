import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { MoonPayBuyWidget } from "@moonpay/moonpay-react";
import { CreditCard, Shield, Zap, Globe, ArrowRight } from "lucide-react";

const MoonPay = () => {
  const { address, isPending } = useWallet();
  const [showWidget, setShowWidget] = useState(false);

  if (isPending || !address) {
    return (
      <div className="h-full w-full min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-[#202020] rounded-3xl p-12 text-center max-w-md">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">Address required.</h1>
          <p className="text-white/60">Please connect your wallet to use this feature.</p>
        </div>
      </div>
    );
  }

  if (showWidget) {
    return (
      <MoonPayBuyWidget
        variant="overlay"
        theme="dark"
        baseCurrencyCode="usd"
        baseCurrencyAmount="100"
        defaultCurrencyCode="xlm"
        walletAddress={address}
        visible
      />
    );
  }

  return (
    <div className="h-full w-full min-h-screen flex flex-col items-center justify-start p-8">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Buy Crypto Instantly
          </h1>
          <p className="text-xl text-white/60">
            Purchase XLM and USDC with your credit card or bank transfer
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#202020] rounded-2xl p-8">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Instant Deposits
            </h3>
            <p className="text-white/60">
              Your crypto arrives in minutes. No waiting, no delays—start investing immediately.
            </p>
          </div>

          <div className="bg-[#202020] rounded-2xl p-8">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Secure & Compliant
            </h3>
            <p className="text-white/60">
              Fully licensed and regulated payment provider trusted by millions worldwide.
            </p>
          </div>

          <div className="bg-[#202020] rounded-2xl p-8">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Multiple Payment Methods
            </h3>
            <p className="text-white/60">
              Use credit cards, debit cards, Apple Pay, Google Pay, or bank transfers.
            </p>
          </div>

          <div className="bg-[#202020] rounded-2xl p-8">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Available Worldwide
            </h3>
            <p className="text-white/60">
              Purchase crypto from over 160 countries with local payment options.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-linear-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Your wallet is connected and ready. Click below to open MoonPay and purchase XLM or USDC instantly.
          </p>
          <button
            onClick={() => setShowWidget(true)}
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Buy Crypto Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-12 bg-[#202020] rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                1
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Choose Amount</h4>
                <p className="text-white/60 text-sm">Select how much crypto you want to buy</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                2
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Enter Payment</h4>
                <p className="text-white/60 text-sm">Add your payment details securely</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                3
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Receive Crypto</h4>
                <p className="text-white/60 text-sm">Crypto arrives in your wallet instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoonPay;

