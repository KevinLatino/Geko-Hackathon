import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { CircleDollarSign, Share2, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Receive() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (address && navigator.share) {
      try {
        await navigator.share({
          title: "My Stellar Wallet Address",
          text: `Send tokens to my Stellar wallet: ${address}`,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <p className="text-white text-lg">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 py-20">
        <div className="max-w-md w-full flex flex-col items-center gap-6 pointer-events-auto">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <CircleDollarSign className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white mb-2">Crypto</h1>
            <p className="text-white/60 text-sm">Receive from crypto wallet</p>
          </div>

          {/* QR Code */}
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 w-full">
            <div className="bg-[#0F0F0F] rounded-2xl p-6 flex items-center justify-center">
              <QRCodeSVG
                value={address}
                size={256}
                level="H"
                includeMargin={false}
                fgColor="#FFFFFF80"
                bgColor="#0F0F0F"
                imageSettings={{
                  src: "/designs/qr-geko.svg",
                  height: 60,
                  width: 60,
                  excavate: true,
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="text-center max-w-sm">
            <p className="text-white/60 text-sm">
              Use this <span className="text-white font-semibold">QR code</span> to receive tokens
              and collections with <span className="text-white font-semibold">Stellar</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 w-full">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-200"
            >
              <Share2 size={20} />
              Share
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full font-semibold transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Address Display */}
          <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
            <p className="text-white/80 text-xs text-center break-all font-mono">
              {address}
            </p>
          </div>
        </div>
    </div>
  );
}

