import { Icon } from "@stellar/design-system";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import WalletModal from "./WalletModal";

interface NavbarProps {
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isWalletDrawerOpen,
  setIsWalletDrawerOpen,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: "/",
      icon: <Icon.Home01 size="lg" />,
      label: "Home",
    },
    {
      path: "/pool/Test",
      icon: <Icon.CoinsStacked02 size="lg" />,
      label: "Pool",
    },
    {
      path: "/moonpay",
      icon: <Icon.CreditCard02 size="lg" />,
      label: "Buy Crypto",
    },
    {
      path: "/envelopes",
      icon: <Icon.PiggyBank02 size="lg" />,
      label: "Envelopes",
    },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <Icon.XClose size="lg" />
          ) : (
            <Icon.Menu01 size="lg" />
          )}
        </button>

        <div className="mobile-header-title">Geko</div>

        <button
          className="mobile-wallet-btn"
          onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
        >
          {isWalletDrawerOpen ? (
            <Icon.ChevronLeft size="md" />
          ) : (
            <Icon.ChevronRight size="md" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav
        className={`navbar-container ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}
      >
        <div className="navbar-logo desktop-only">
          <button
            className="logo-icon"
            onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
            title={isWalletDrawerOpen ? "Close Wallet" : "Open Wallet"}
          >
            {isWalletDrawerOpen ? (
              <Icon.ChevronLeft size="md" />
            ) : (
              <Icon.ChevronRight size="md" />
            )}
          </button>
        </div>

        <div className="navbar-divider desktop-only" />

        <div className="navbar-items">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `navbar-item ${isActive ? "navbar-item-active" : ""}`
              }
              title={item.label}
              onClick={handleNavClick}
            >
              {item.icon}
              <span className="navbar-item-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <WalletModal
        isOpen={isWalletDrawerOpen}
        onClose={() => setIsWalletDrawerOpen(false)}
      />
    </>
  );
};

export default Navbar;
