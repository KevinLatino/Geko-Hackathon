import { useState, useEffect } from "react";
import { useNFTMint } from "../hooks/useNFTMint";
import { useWallet } from "../hooks/useWallet";

export default function NFTMintPage() {
  const { address } = useWallet();
  const { loading, totalSupply, error, mintNFT, getTotalSupply } = useNFTMint();
  const [mintResult, setMintResult] = useState<{ tokenId: number; ipfsHash: string } | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");

  // Load total supply when component mounts
  useEffect(() => {
    getTotalSupply().catch((err) => {
      console.error("Failed to load total supply:", err);
      // Don't show error to user, just log
    });
  }, [getTotalSupply]);

  // Use connected user's address as default if available
  useEffect(() => {
    if (address && !recipientAddress) {
      setRecipientAddress(address);
    }
  }, [address, recipientAddress]);

  const handleMint = async () => {
    if (!recipientAddress) {
      alert("Please enter a recipient address");
      return;
    }

    const result = await mintNFT(recipientAddress);
    if (result) {
      setMintResult({
        tokenId: result.tokenId,
        ipfsHash: result.ipfsHash,
      });
    }
  };

  return (
    <div style={{ 
      padding: "40px 20px", 
      maxWidth: "800px", 
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#ffffff"
    }}>
      <div style={{
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        padding: "32px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)"
      }}>
        <h1 style={{ 
          fontSize: "32px", 
          marginBottom: "8px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Mint NFT
        </h1>
        <p style={{ color: "#888", marginBottom: "32px" }}>
          Mint an NFT when a user completes a task
        </p>

        <div style={{ 
          marginBottom: "24px",
          padding: "20px",
          backgroundColor: "#0f0f0f",
          borderRadius: "8px",
          border: "1px solid #333"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "4px" }}>
              Current Total Supply
            </p>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#667eea" }}>
              {totalSupply !== null ? totalSupply : "Loading..."}
            </p>
          </div>
          {totalSupply !== null && (
            <div>
              <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "4px" }}>
                Next NFT to mint
              </p>
              <p style={{ fontSize: "20px", fontWeight: "600" }}>
                NFT #{totalSupply}
              </p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px",
            color: "#ccc",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="G..."
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "16px",
              backgroundColor: "#0f0f0f",
              border: "1px solid #333",
              borderRadius: "8px",
              color: "#fff",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
          />
        </div>

        <button
          onClick={handleMint}
          disabled={loading || !recipientAddress}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "18px",
            fontWeight: "600",
            backgroundColor: loading || !recipientAddress ? "#333" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            background: loading || !recipientAddress ? "#333" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading || !recipientAddress ? "not-allowed" : "pointer",
            transition: "opacity 0.2s, transform 0.2s",
            opacity: loading || !recipientAddress ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading && recipientAddress) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 12px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? "Minting..." : "Mint NFT"}
        </button>

        {error && (
          <div style={{ 
            marginTop: "24px", 
            padding: "16px", 
            backgroundColor: "#2a1a1a",
            border: "1px solid #ff4444",
            borderRadius: "8px",
            color: "#ff6666"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {mintResult && (
          <div style={{ 
            marginTop: "24px", 
            padding: "20px", 
            backgroundColor: "#1a2a1a",
            border: "1px solid #44ff44",
            borderRadius: "8px",
            color: "#66ff66"
          }}>
            <strong style={{ fontSize: "18px", display: "block", marginBottom: "12px" }}>
              ✅ NFT Minted Successfully!
            </strong>
            <div style={{ marginTop: "12px" }}>
              <p style={{ marginBottom: "8px" }}>
                <strong>Token ID:</strong> {mintResult.tokenId}
              </p>
              <p style={{ marginBottom: "8px" }}>
                <strong>IPFS Hash:</strong> {mintResult.ipfsHash}
              </p>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${mintResult.ipfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#667eea",
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#0f0f0f",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  transition: "border-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#667eea"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#333"}
              >
                View Metadata →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

