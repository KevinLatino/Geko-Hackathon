import { CircleDollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LiquidBackgroundLayout } from "../components/layout/liquid-background-layout";
import HeaderText from "../components/ui/HeaderText";
import { useWallet } from "../hooks/useWallet";
import { connectWallet } from "../util/wallet";

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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none h-screen">
        <div className="container mx-auto px-4 pointer-events-none max-w-5xl flex flex-col items-center gap-8">
          <HeaderText
            tag="Start your financial freedom"
            title="The app that educates saves and invests for you"
            subtitle="Don't just manage your money, make it grow. With Geko, your financial education and your investment power come together in one app, designed for your success"
            icon={TrendingUp}
            align="center"
          />
          <div className="flex gap-4 justify-center pointer-events-auto">
            <button
              onClick={handleGetStarted}
              className="flex gap-2 bg-white text-black p-2 rounded-full hover:bg-gray-100">
              <CircleDollarSign size={20} />
              <span className="text-black group-hover:text-black">{address ? "Launch App" : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      </div>
    </LiquidBackgroundLayout>
  );
}
