import { Icon, Tooltip } from "@stellar/design-system";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import WalletModal from "./WalletModal";

interface NavbarProps {
  isWalletDrawerOpen: boolean;
  setIsWalletDrawerOpen: (isOpen: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isWalletDrawerOpen,
  setIsWalletDrawerOpen,
  isProfileModalOpen,
  setIsProfileModalOpen,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tooltipStates, setTooltipStates] = useState<Record<string, boolean>>({});

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
          <div
            onMouseEnter={() => setTooltipStates({ ...tooltipStates, wallet: true })}
            onMouseLeave={() => setTooltipStates({ ...tooltipStates, wallet: false })}
          >
            <Tooltip
              isVisible={tooltipStates.wallet}
              isContrast
              title={isWalletDrawerOpen ? "Close Wallet" : "Open Wallet"}
              placement="right"
              triggerEl={
                <button
                  className="logo-icon"
                  onClick={() => setIsWalletDrawerOpen(!isWalletDrawerOpen)}
                >
                  {isWalletDrawerOpen ? (
                    <Icon.ChevronLeft size="md" />
                  ) : (
                    <Icon.ChevronRight size="md" />
                  )}
                </button>
              }
            />
          </div>
        </div>

        <div className="navbar-divider desktop-only" />

        <div className="navbar-items">
          {navItems.map((item) => (
            <div
              key={item.path}
              onMouseEnter={() => setTooltipStates({ ...tooltipStates, [item.path]: true })}
              onMouseLeave={() => setTooltipStates({ ...tooltipStates, [item.path]: false })}
            >
              <Tooltip
                isVisible={tooltipStates[item.path]}
                isContrast
                title={item.label}
                placement="right"
                triggerEl={
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `navbar-item ${isActive ? "navbar-item-active" : ""}`
                    }
                    onClick={handleNavClick}
                  >
                    {item.icon}
                    <span className="navbar-item-label">{item.label}</span>
                  </NavLink>
                }
              />
            </div>
          ))}
        </div>

        <div className="navbar-profile">
          <div
            onMouseEnter={() => setTooltipStates({ ...tooltipStates, profile: true })}
            onMouseLeave={() => setTooltipStates({ ...tooltipStates, profile: false })}
          >
            <Tooltip
              isVisible={tooltipStates.profile}
              isContrast
              title="Profile"
              placement="right"
              triggerEl={
                <button
                  className="navbar-profile-btn"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <Icon.User01 size="lg" />
                  <span className="navbar-item-label">Profile</span>
                </button>
              }
            />
          </div>
        </div>
      </nav>

      <WalletModal
        isOpen={isWalletDrawerOpen}
        onClose={() => setIsWalletDrawerOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
