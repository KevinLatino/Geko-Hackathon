import React from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@stellar/design-system";
import WalletModal from "./WalletModal";
import { ChevronsRight, ChevronsLeft } from 'lucide-react';

interface NavbarProps {
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isWalletDrawerOpen, setIsWalletDrawerOpen }) => {

  const navItems = [
    {
      path: "/",
      icon: <Icon.Home01 size="lg" />,
      label: "Home",
    },
    {
      path: "/pool/Test",
      icon: <Icon.CreditCard02 size="lg" />,
      label: "Pool",
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

  return (
    <>
      <nav className="navbar-container">
        {/* Logo - Opens Wallet Modal */}
        <div className="navbar-logo">
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
        <div className="navbar-divider" />

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
            >
              {item.icon}
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


