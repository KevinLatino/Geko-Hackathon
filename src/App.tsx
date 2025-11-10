import { MoonPayProvider } from "@moonpay/moonpay-react";
import { useState } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import "./App.module.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import FloatingChatbot from "./components/FloatingChatbot.tsx";
import Navbar from "./components/Navbar.tsx";
import Analytics from "./pages/Analytics.tsx";
import Debugger from "./pages/Debugger.tsx";
import Envelopes from "./pages/Envelopes.tsx";
import Home from "./pages/Home";
import MoonPayPage from "./pages/MoonPay.tsx";
import NFTMint from "./pages/NFTMint.tsx";
import Pool from "./pages/Pool.tsx";
import EnvelopePoolTest from "./pages/EnvelopePoolTest.tsx";
import Receive from "./pages/Receive.tsx";
import Rewards from "./pages/Rewards.tsx";
import Send from "./pages/Send.tsx";

const AppLayout: React.FC = () => {
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className={`app-layout ${isWalletDrawerOpen ? "drawer-open" : ""} ${isProfileModalOpen ? "profile-open" : ""}`}>
      <Navbar
        isWalletDrawerOpen={isWalletDrawerOpen}
        setIsWalletDrawerOpen={setIsWalletDrawerOpen}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
      />
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">{/* Reserved for breadcrumbs */}</div>
          <div className="top-bar-right">
            <ConnectAccount />
          </div>
        </div>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
      <FloatingChatbot />
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    {/* Route without navbar */}
    <Route path="/" element={<Home />} />

    {/* Routes with navbar */}
    <Route element={<AppLayout />}>
      <Route path="/receive" element={<Receive />} />
      <Route path="/send" element={<Send />} />
      <Route path="/pool/Test" element={<Pool />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/moonpay" element={<MoonPayPage />} />
      <Route path="/envelopes" element={<Envelopes />} />
      <Route path="/envelopes-pool-test" element={<EnvelopePoolTest />} />
      <Route path="/nft-mint" element={<NFTMint />} />
      <Route path="/debug" element={<Debugger />} />
      <Route path="/debug/:contractName" element={<Debugger />} />
    </Route>
  </Routes>
);

function App() {
  const moonPayApiKey =
    import.meta.env.VITE_MOONPAY_API_KEY ??
    import.meta.env.PUBLIC_MOONPAY_API_KEY;

  if (!moonPayApiKey) {
    console.warn(
      "MoonPay API key is missing; rendering app without MoonPay provider."
    );

    return <AppRoutes />;
  }

  return (
    <MoonPayProvider apiKey={moonPayApiKey} debug>
      <AppRoutes />
    </MoonPayProvider>
  );
}

export default App;
