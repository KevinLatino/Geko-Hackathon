import { Icon } from "@stellar/design-system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { disconnectWallet } from "../util/wallet";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { address } = useWallet();
  const navigate = useNavigate();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!address) return;

    setIsDisconnecting(true);
    try {
      await disconnectWallet();
      onClose();
      // Redirect to home page after disconnecting
      navigate("/");
      // Reload the page to reset all state
      window.location.reload();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setIsDisconnecting(false);
    }
  };

  return (
    <div className={`profile-modal ${isOpen ? "open" : ""}`}>
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h2>Profile</h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close profile"
          >
            <Icon.XClose size="md" />
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-section">
            <div className="profile-info">
              <div className="profile-avatar">
                <Icon.Wallet03
                  size="xl"
                  style={{ width: "25px", height: "25px" }}
                />
              </div>
              <div className="profile-details">
                <h3>Wallet Address</h3>
                <p className="profile-address">{address || "Not connected"}</p>
              </div>
            </div>
          </div>

          {address && (
            <div className="profile-section">
              <h3 className="profile-section-title">Wallet</h3>
              <div className="profile-settings-list">
                <button
                  className="profile-setting-item profile-disconnect-btn"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  <Icon.LogOut01 size="md" />
                  <span>
                    {isDisconnecting ? "Disconnecting..." : "Disconnect Wallet"}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="profile-section">
            <h3 className="profile-section-title">About</h3>
            <div className="profile-about">
              <p>Geko Wallet</p>
              <p className="profile-version">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
