import storage from "./storage";
import {
  ISupportedWallet,
  StellarWalletsKit,
  WalletNetwork,
  sep43Modules,
} from "@creit.tech/stellar-wallets-kit";
import { Horizon } from "@stellar/stellar-sdk";
import { networkPassphrase, stellarNetwork } from "../contracts/util";

const kit: StellarWalletsKit = new StellarWalletsKit({
  network: networkPassphrase as WalletNetwork,
  modules: sep43Modules(),
});

export const connectWallet = async () => {
  await kit.openModal({
    modalTitle: "Connect to your wallet",
    onWalletSelected: async (option: ISupportedWallet) => {
      const selectedId = option.id;
      kit.setWallet(selectedId);

      try {
        // Get address and network information
        const [address, network] = await Promise.all([
          kit.getAddress(),
          kit.getNetwork(),
        ]);

        // Save wallet information if successfully connected
        if (address.address) {
          storage.setItem("walletId", selectedId);
          storage.setItem("walletAddress", address.address);
          
          // Save network information
          if (network.network && network.networkPassphrase) {
            storage.setItem("walletNetwork", network.network);
            storage.setItem("networkPassphrase", network.networkPassphrase);
          }
          
          console.log("Wallet connected successfully:", {
            address: address.address,
            network: network.network,
          });
        } else {
          // Clear storage if connection failed
          storage.setItem("walletId", "");
          storage.setItem("walletAddress", "");
          storage.setItem("walletNetwork", "");
          storage.setItem("networkPassphrase", "");
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        // Clear storage on error
        storage.setItem("walletId", "");
        storage.setItem("walletAddress", "");
        storage.setItem("walletNetwork", "");
        storage.setItem("networkPassphrase", "");
      }
    },
  });
};

export const disconnectWallet = async () => {
  await kit.disconnect();
  storage.removeItem("walletId");
  storage.removeItem("walletAddress");
  storage.removeItem("walletNetwork");
  storage.removeItem("networkPassphrase");
};

function getHorizonHost(mode: string) {
  switch (mode) {
    case "LOCAL":
      return "http://localhost:8000";
    case "FUTURENET":
      return "https://horizon-futurenet.stellar.org";
    case "TESTNET":
      return "https://horizon-testnet.stellar.org";
    case "PUBLIC":
      return "https://horizon.stellar.org";
    default:
      throw new Error(`Unknown Stellar network: ${mode}`);
  }
}

export const fetchBalance = async (address: string) => {
  const horizon = new Horizon.Server(getHorizonHost(stellarNetwork), {
    allowHttp: stellarNetwork === "LOCAL",
  });

  const { balances } = await horizon.accounts().accountId(address).call();
  return balances;
};

export type Balance = Awaited<ReturnType<typeof fetchBalance>>[number];

export const wallet = kit;
