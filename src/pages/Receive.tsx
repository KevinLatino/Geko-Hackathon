import { Icon } from "@stellar/design-system";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

export default function Receive() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (address && navigator.share) {
      try {
        await navigator.share({
          title: "My Stellar Wallet Address",
          text: `Send tokens to my Stellar wallet: ${address}`,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
  };

  if (!address) {
    return (
      <div className="receive-page-empty">
        <p>Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="receive-page">
      <div className="receive-page-container">
        <div className="receive-page-icon">
          <Icon.CoinsStacked02
            size="lg"
            color="#FFFFFF"
            style={{ width: "28px", height: "28px" }}
          />
        </div>

        <div className="receive-page-title">
          <h1 className="receive-page-title-text">Crypto</h1>
          <p className="receive-page-subtitle">Receive from crypto wallet</p>
        </div>

        <div className="receive-page-qr-container">
          <div className="receive-page-qr-inner">
            <QRCodeSVG
              value={address}
              size={256}
              level="H"
              includeMargin={false}
              fgColor="#FFFFFF80"
              bgColor="#202020"
              imageSettings={{
                src: "/designs/qr-geko.svg",
                height: 60,
                width: 60,
                excavate: true,
              }}
            />
          </div>
        </div>

        <div className="receive-page-description">
          <p>
            Use this{" "}
            <span className="receive-page-description-highlight">QR code</span>{" "}
            to receive tokens and collections with{" "}
            <span className="receive-page-description-highlight">Stellar</span>
          </p>
        </div>

        <div className="receive-page-buttons">
          <button
            onClick={handleShare}
            className="receive-page-button receive-page-button-primary"
          >
            <Icon.Share01 size="md" />
            Share
          </button>
          <button
            onClick={handleCopy}
            className="receive-page-button receive-page-button-secondary"
          >
            {copied ? (
              <>
                <Icon.Check size="md" />
                Copied!
              </>
            ) : (
              <>
                <Icon.Copy01 size="md" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="receive-page-address">
          <p className="receive-page-address-text">{address}</p>
        </div>
      </div>
    </div>
  );
}
