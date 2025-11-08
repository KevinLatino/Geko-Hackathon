import { LiquidBackgroundLayout } from "../components/layout/liquid-background-layout";
import { useWallet } from "../hooks/useWallet";
import { useNavigate } from "react-router-dom";
import { CircleDollarSign, TrendingUp } from "lucide-react";
import { connectWallet } from "../util/wallet";
import HeaderText from "../components/ui/HeaderText";

export default function Home() {
  const { address } = useWallet();
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (address) {
      navigate("/pool/Test");
    } else {
      await connectWallet();
    }
  };

  return (
    <LiquidBackgroundLayout className="h-screen">
      {/* Top Button */}
      <button 
        onClick={handleGetStarted}
        className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-3xl text-white text-sm font-medium cursor-pointer transition-all duration-300 backdrop-blur-md hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5 z-50 pointer-events-auto"
      >
        <CircleDollarSign size={16} />
        <span>{address ? "Go to App" : "Connect Wallet"}</span>
      </button>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="container mx-auto px-4 pointer-events-none max-w-5xl flex flex-col items-center gap-8">
          {/* Header Text Component with Animation */}
          <HeaderText
            tag="Start your financial freedom"
            title="The app that educates, saves and invests for you"
            subtitle="Don't just manage your money, make it grow. With Geko, your financial education and your investment power come together in one app, designed for your success"
            icon={TrendingUp}
            align="center"
          />

          <div className="flex gap-4 justify-center pointer-events-auto">
            <button 
              onClick={handleGetStarted}
              className="flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 bg-white text-black hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]"
            >
              <CircleDollarSign size={20} />
              <span>{address ? "Launch App" : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      </div>
    </LiquidBackgroundLayout>
  );
}