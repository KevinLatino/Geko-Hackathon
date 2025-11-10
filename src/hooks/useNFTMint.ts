import { useState, useCallback, useMemo } from "react";
import { Address, Contract, nativeToScVal, scValToNative, rpc, TransactionBuilder, Operation, Keypair, Transaction } from "@stellar/stellar-sdk";
import { useWallet } from "./useWallet";
import { rpcUrl, networkPassphrase, stellarNetwork } from "../contracts/util";
import { useNotification } from "./useNotification";

const NFT_CONTRACT_ID = "CBVMUCF3RA4QYPPG4YFG6T2RNSLAX2AH4UUHX5W2WO2657KNDQTFTE6D";

const getOwnerKeypair = (): Keypair | null => {
  const ownerSecret = import.meta.env.PUBLIC_ADMIN;
  
  if (!ownerSecret) {
    console.warn("PUBLIC_ADMIN not found in environment variables. Add PUBLIC_ADMIN= to your .env file (with the same value as ADMIN=).");
    return null;
  }
  
  try {
    return Keypair.fromSecret(ownerSecret);
  } catch (error) {
    console.error("Failed to create owner keypair from secret:", error);
    return null;
  }
};

interface MintNFTResult {
  tokenId: number;
  ipfsHash: string;
  recipient: string;
  transactionHash: string;
}

interface UseNFTMintReturn {
  loading: boolean;
  totalSupply: number | null;
  error: string | null;
  mintNFT: (recipientAddress: string) => Promise<MintNFTResult | null>;
  getTotalSupply: () => Promise<number>;
  getIPFSHashForToken: (tokenId: number) => Promise<string>;
}

/**
 * Hook for minting NFTs
 * 
 * This hook:
 * 1. Gets the current total_supply from the contract
 * 2. Uses that number to determine which NFT to mint (e.g., if total_supply = 5, mints NFT #5)
 * 3. Gets the IPFS hash from the corresponding metadata JSON
 * 4. Allows minting the NFT to the user's wallet
 * 
 * @returns {UseNFTMintReturn} Functions and state for minting NFTs
 */
export function useNFTMint(): UseNFTMintReturn {
  const { address, networkPassphrase: walletPassphrase } = useWallet();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // RPC server
  const rpcServer = useMemo(() => {
    return new rpc.Server(rpcUrl, {
      allowHttp: new URL(rpcUrl).hostname === "localhost",
    });
  }, []);

  // Contract instance
  const contract = useMemo(() => {
    return new Contract(NFT_CONTRACT_ID);
  }, []);

  /**
   * Gets the total_supply from the contract
   */
  const getTotalSupply = useCallback(async (): Promise<number> => {
    try {
      let accountAddress: string | null = null;
      
      const ownerKeypair = getOwnerKeypair();
      if (ownerKeypair) {
        accountAddress = ownerKeypair.publicKey();
      } else if (address) {
        // If no owner keypair, use the connected user's wallet
        accountAddress = address;
      } else {
        // If no account is available, we can't read total_supply
        console.warn("No account available to read total_supply. Need owner keypair or connected wallet.");
        return 0;
      }

      if (!accountAddress) {
        return 0;
      }

      try {
        const account = await rpcServer.getAccount(accountAddress);
        
        const totalSupplyOp = contract.call("total_supply");
        const tx = new TransactionBuilder(account, {
          fee: "10000",
          networkPassphrase: walletPassphrase || networkPassphrase,
          timebounds: {
            minTime: 0,
            maxTime: 0,
          },
        })
          .addOperation(totalSupplyOp)
          .build();

        const simulation = await rpcServer.simulateTransaction(tx);
        
        if (rpc.Api.isSimulationError(simulation)) {
          throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
        }

        const retval = simulation.result?.retval;
        if (!retval) {
          throw new Error("No result from simulation");
        }

        const scVal = retval;
        const native = scValToNative(scVal);
        const supply = typeof native === "number" ? native : parseInt(native as string);

        setTotalSupply(supply);
        return supply;
      } catch (accountError: any) {
        // If account fetch fails, return 0 without error
        console.warn("Could not get account for total_supply:", accountError.message);
        return 0;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to get total supply";
      // Don't throw error, just log
      console.warn("Error getting total supply:", errorMsg);
      return 0; // Return 0 as fallback
    }
  }, [contract, rpcServer, walletPassphrase, address]);

  /**
   * Gets the IPFS hash from the metadata JSON for a token ID
   * 
   * Attempts to get the hash from:
   * 1. A static JSON file at /public/nfts/metadata-hashes.json
   * 2. An API endpoint (if configured)
   * 3. A static metadata JSON file
   */
  const getIPFSHashForToken = useCallback(async (tokenId: number): Promise<string> => {
    try {
      // Option 1: Try to read from a static JSON file with all hashes
      try {
        const hashesResponse = await fetch("/nfts/metadata-hashes.json");
        if (hashesResponse.ok) {
          const hashes = await hashesResponse.json() as string[];
          if (hashes[tokenId]) {
            const hash = hashes[tokenId].replace(/^ipfs:\/\//, "").trim();
            return hash;
          }
        }
      } catch (e) {
        // If file doesn't exist, continue with other options
      }

      // Option 2: Try to read from individual metadata JSON file
      try {
        const metadataResponse = await fetch(`/nfts/metadata/${tokenId}.json`);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json() as any;
          
          // Look for hash in metadataHash field
          if (metadata.metadataHash) {
            return metadata.metadataHash.replace(/^ipfs:\/\//, "").trim();
          }
          
          // Fallback: use image hash (not ideal, but works)
          if (metadata.image && metadata.image.startsWith("ipfs://")) {
            return metadata.image.replace("ipfs://", "").trim();
          }
        }
      } catch (e) {
        // If file doesn't exist, throw error
      }

      throw new Error(`No IPFS hash found for token ${tokenId}`);
    } catch (err: any) {
      throw new Error(`Failed to get IPFS hash: ${err.message}`);
    }
  }, []);

  /**
   * Mints an NFT to the user's address
   * 
   * @param recipientAddress - Stellar address that will receive the NFT
   * @returns {Promise<MintNFTResult | null>} Mint result or null if it fails
   */
  const mintNFT = useCallback(
    async (recipientAddress: string): Promise<MintNFTResult | null> => {
      // Get owner keypair from .env
      const ownerKeypair = getOwnerKeypair();
      if (!ownerKeypair) {
        const errorMsg = "NFT owner secret key not configured. Please set PUBLIC_ADMIN= in your .env file (with the same value as ADMIN=).";
        setError(errorMsg);
        addNotification(errorMsg, "error");
        return null;
      }

      const ownerAddress = ownerKeypair.publicKey();

      setLoading(true);
      setError(null);

      try {
        // Step 1: Get total_supply
        const currentSupply = await getTotalSupply();
        const nextTokenId = currentSupply;

        // Step 2: Get IPFS hash from metadata JSON
        const ipfsHash = await getIPFSHashForToken(nextTokenId);

        // Step 3: Prepare mint operation
        // IMPORTANT: The NFT is minted to recipientAddress (user's address), NOT to the owner
        const recipient = Address.fromString(recipientAddress);
        const cleanHash = ipfsHash.replace(/^ipfs:\/\//, "").trim();

        const mintOp = contract.call(
          "mint_with_ipfshash",
          nativeToScVal(recipient, { type: "address" }), // NFT is minted to this address (user)
          nativeToScVal(cleanHash, { type: "string" })
        );

        // Step 4: Build and simulate transaction
        // NOTE: We use ownerAccount only to SIGN the transaction (owner must authorize the mint)
        // The NFT is minted to the recipientAddress specified above
        const ownerAccount = await rpcServer.getAccount(ownerAddress);
        const tx = new TransactionBuilder(ownerAccount, {
          fee: "10000",
          networkPassphrase: walletPassphrase || networkPassphrase,
          timebounds: {
            minTime: 0,
            maxTime: 0,
          },
        })
          .addOperation(mintOp)
          .build();

        let simulation = await rpcServer.simulateTransaction(tx);

        // Handle restore footprint if necessary
        if (rpc.Api.isSimulationRestore(simulation)) {
          const fee = (Number(simulation.restorePreamble.minResourceFee) + 1000).toString();
          const restoreAccount = await rpcServer.getAccount(ownerAddress);
          const restoreTx = new TransactionBuilder(restoreAccount, { fee })
            .setNetworkPassphrase(walletPassphrase || networkPassphrase)
            .setTimeout(0)
            .setSorobanData(simulation.restorePreamble.transactionData.build())
            .addOperation(Operation.restoreFootprint({}))
            .build();

          // Sign with owner's keypair
          const restoreTransaction = new Transaction(restoreTx.toXDR(), walletPassphrase || networkPassphrase);
          restoreTransaction.sign(ownerKeypair);
          await rpcServer.sendTransaction(restoreTransaction);

          // Re-simulate original transaction
          const freshAccount = await rpcServer.getAccount(ownerAddress);
          const freshTx = new TransactionBuilder(freshAccount, {
            fee: "10000",
            networkPassphrase: walletPassphrase || networkPassphrase,
            timebounds: {
              minTime: 0,
              maxTime: 0,
            },
          })
            .addOperation(mintOp)
            .build();
          simulation = await rpcServer.simulateTransaction(freshTx);
        }

        if (rpc.Api.isSimulationError(simulation)) {
          throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
        }

        // Step 5: Assemble, sign with owner keypair and send
        // Owner signs the transaction, but the NFT is minted to recipientAddress (user)
        const assembled = rpc.assembleTransaction(tx, simulation).build();
        const transaction = new Transaction(assembled.toXDR(), walletPassphrase || networkPassphrase);
        transaction.sign(ownerKeypair); // Owner signs to authorize the mint

        const result = await rpcServer.sendTransaction(transaction);
        if (result.status !== "PENDING") {
          throw new Error(`Transaction failed: ${result.status}`);
        }

        // Step 6: Wait for confirmation
        let txResult = await rpcServer.getTransaction(result.hash);
        while (txResult.status === "NOT_FOUND") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          txResult = await rpcServer.getTransaction(result.hash);
        }

        if (txResult.status !== "SUCCESS") {
          throw new Error(`Transaction failed: ${txResult.status}`);
        }

        // Step 7: Get token ID from simulation result
        const retval = simulation.result?.retval;
        if (!retval) {
          throw new Error("No result from simulation");
        }
        const scVal = retval;
        const native = scValToNative(scVal);
        const tokenId = typeof native === "number" ? native : parseInt(native as string);

        const mintResult: MintNFTResult = {
          tokenId,
          ipfsHash: cleanHash,
          recipient: recipientAddress,
          transactionHash: result.hash,
        };

        // Generate explorer URL
        const networkPath = stellarNetwork.toLowerCase() === "public" ? "public" : "testnet";
        const explorerUrl = `https://stellar.expert/explorer/${networkPath}/tx/${result.hash}`;
        
        addNotification(
          `NFT #${tokenId} has been minted to ${recipientAddress}. View transaction: ${explorerUrl}`,
          "success"
        );

        // Update total supply
        setTotalSupply(tokenId + 1);

        return mintResult;
      } catch (err: any) {
        const errorMsg = err.message || "Failed to mint NFT";
        setError(errorMsg);
        addNotification(`Mint Failed: ${errorMsg}`, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [contract, rpcServer, walletPassphrase, getTotalSupply, getIPFSHashForToken, addNotification]
  );

  return {
    loading,
    totalSupply,
    error,
    mintNFT,
    getTotalSupply,
    getIPFSHashForToken,
  };
}

