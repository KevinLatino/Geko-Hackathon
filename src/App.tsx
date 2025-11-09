import { useState } from "react";
import "./App.module.css";
import Navbar from "./components/Navbar.tsx";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Debugger from "./pages/Debugger.tsx";
import Pool from "./pages/Pool.tsx";
import Rewards from "./pages/Rewards.tsx";
import Analytics from "./pages/Analytics.tsx";
import Receive from "./pages/Receive.tsx";
import Send from "./pages/Send.tsx";
import MoonPayPage from "./pages/MoonPay.tsx";
import { MoonPayProvider } from "@moonpay/moonpay-react";

const AppLayout: React.FC = () => {
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(true);

  return (
    <div className={`app-layout ${isWalletDrawerOpen ? "drawer-open" : ""}`}>
      <Navbar 
        isWalletDrawerOpen={isWalletDrawerOpen}
        setIsWalletDrawerOpen={setIsWalletDrawerOpen}
      />
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            {/* You can add title or breadcrumbs here */}
          </div>
          <div className="top-bar-right">
            <ConnectAccount />
          </div>
        </div>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/pool/Test" element={<Pool />} />
      <Route path="/debug" element={<Debugger />} />
      <Route path="/debug/:contractName" element={<Debugger />} />
      <Route path="/moonpay" element={<MoonPayPage />} />
    </Route>
  </Routes>
);

function App() {
  const moonPayApiKey =
    import.meta.env.VITE_MOONPAY_API_KEY ??
    import.meta.env.PUBLIC_MOONPAY_API_KEY;

  if (!moonPayApiKey) {
    console.warn("MoonPay API key is missing; rendering app without MoonPay provider.");

    return <AppRoutes />;
  }

  return (
    <MoonPayProvider apiKey={moonPayApiKey} debug>
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
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
        </Route>
      </Routes>
    </MoonPayProvider>
  );
}

export default App;
