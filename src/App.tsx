import { useState } from "react";
import "./App.module.css";
import Navbar from "./components/Navbar.tsx";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Debugger from "./pages/Debugger.tsx";
import Pool from "./pages/Pool.tsx";
import EnvelopesPage from "./components/modules/envelopes/pages/EnvelopesPage.tsx";


const AppLayout: React.FC = () => (
  <main>
    <Layout.Header
      projectId="My App"
      projectTitle="My App"
      contentRight={
        <>
          <nav>
            <NavLink
              to="/pool/Test"
              style={{
                textDecoration: "none",
              }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Pool
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/envelopes"
              style={{
                textDecoration: "none",
                marginLeft: "0.5rem",
              }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  Envelopes
                </Button>
              )}
            </NavLink>
            <NavLink
              to="/debug"
              style={{
                textDecoration: "none",
                marginLeft: "0.5rem",
              }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <Button variant="tertiary" size="md" disabled={isActive}>
                  <Icon.Code02 size="md" />
                  Debugger
                </Button>
              )}
            </NavLink>
          </nav>
          <ConnectAccount />
        </>
      }
    />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} My App. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
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
          <Route path="/envelopes" element={<EnvelopesPage />} />
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
        </Route>
      </Routes>
    </MoonPayProvider>
  );
}

export default App;
