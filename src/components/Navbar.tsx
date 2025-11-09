import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@stellar/design-system";
import WalletModal from "./WalletModal";
import { ChevronsRight, ChevronsLeft, Menu, X } from 'lucide-react';

interface NavbarProps {
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isWalletDrawerOpen, setIsWalletDrawerOpen }) => {
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
      path: "/rewards",
      icon: <Icon.Stars02 size="lg" />,
      label: "Rewards",
    },
    {
      path: "/analytics",
      icon: <Icon.BarChart07 size="lg" />,
      label: "Analytics",
    }
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="mobile-header-title">Geko</div>
        
        <button
          className="mobile-wallet-btn"
          onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
        >
          {isWalletDrawerOpen ? (
            <ChevronsLeft size={20} />
          ) : (
            <ChevronsRight size={20} />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Desktop Navbar / Mobile Menu */}
      <nav className={`navbar-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        {/* Logo - Opens Wallet Modal (Desktop only) */}
        <div className="navbar-logo desktop-only">
          <button
            className="logo-icon"
            onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
            title={isWalletDrawerOpen ? "Close Wallet" : "Open Wallet"}
          >
            {isWalletDrawerOpen ? (
              <ChevronsLeft className="w-5 h-5"/>
            ) : (
              <ChevronsRight className="w-5 h-5"/>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="navbar-divider desktop-only" />

        {/* Navigation Items */}
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

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletDrawerOpen}
        onClose={() => setIsWalletDrawerOpen(false)}
      />
    </>
  );
};

export default Navbar;


