import {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { wallet } from "../util/wallet";
import storage from "../util/storage";

export interface WalletContextType {
  address?: string;
  network?: string;
  networkPassphrase?: string;
  isPending: boolean;
  signTransaction?: typeof wallet.signTransaction;
}

const initialState = {
  address: undefined,
  network: undefined,
  networkPassphrase: undefined,
};

const POLL_INTERVAL = 1000;

export const WalletContext = // eslint-disable-line react-refresh/only-export-components
  createContext<WalletContextType>({ isPending: true });

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] =
    useState<Omit<WalletContextType, "isPending">>(initialState);
  const [isPending, startTransition] = useTransition();
  const popupLock = useRef(false);
  
  // Create a wrapper function that ensures wallet is set before signing
  const signTransaction = async (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => {
    const walletId = storage.getItem("walletId");
    if (walletId) {
      wallet.setWallet(walletId);
    }
    return wallet.signTransaction(xdr, opts);
  };

  const nullify = () => {
    updateState(initialState);
    storage.setItem("walletId", "");
    storage.setItem("walletAddress", "");
    storage.setItem("walletNetwork", "");
    storage.setItem("networkPassphrase", "");
  };

  const updateState = (newState: Omit<WalletContextType, "isPending">) => {
    setState((prev: Omit<WalletContextType, "isPending">) => {
      if (
        prev.address !== newState.address ||
        prev.network !== newState.network ||
        prev.networkPassphrase !== newState.networkPassphrase
      ) {
        return newState;
      }
      return prev;
    });
  };

  const updateCurrentWalletState = async () => {
    // There is no way, with StellarWalletsKit, to check if the wallet is
    // installed/connected/authorized. We need to manage that on our side by
    // checking our storage item.
    const walletId = storage.getItem("walletId");
    const walletNetwork = storage.getItem("walletNetwork");
    const walletAddr = storage.getItem("walletAddress");
    const passphrase = storage.getItem("networkPassphrase");

    // If no wallet is stored, clear everything
    if (!walletId) {
      nullify();
      return;
    }

    // If we have all the data in localStorage and state is not set, restore it
    if (
      !state.address &&
      walletAddr &&
      walletNetwork &&
      passphrase
    ) {
      updateState({
        address: walletAddr,
        network: walletNetwork,
        networkPassphrase: passphrase,
      });
      return;
    }

    // For non-Freighter wallets, trust localStorage data if available
    if (walletId !== "freighter" && walletAddr && walletNetwork && passphrase) {
      if (state.address !== walletAddr) {
        updateState({
          address: walletAddr,
          network: walletNetwork,
          networkPassphrase: passphrase,
        });
      }
      return;
    }

    // For Freighter wallet, periodically check if still connected
    if (walletId === "freighter") {
      if (popupLock.current) return;
      
      try {
        popupLock.current = true;
        wallet.setWallet(walletId);
        
        const [a, n] = await Promise.all([
          wallet.getAddress(),
          wallet.getNetwork(),
        ]);

        if (!a.address) {
          // Wallet was disconnected
          nullify();
        } else if (
          a.address !== state.address ||
          n.network !== state.network ||
          n.networkPassphrase !== state.networkPassphrase
        ) {
          // Update if data changed
          storage.setItem("walletAddress", a.address);
          storage.setItem("walletNetwork", n.network);
          storage.setItem("networkPassphrase", n.networkPassphrase);
          updateState({ ...a, ...n });
        }
      } catch (e) {
        // If there's an error, don't immediately disconnect
        // Just log it - the user might have closed the popup
        console.error("Error checking wallet state:", e);
      } finally {
        popupLock.current = false;
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isMounted = true;

    // Load wallet from localStorage immediately on mount
    const initializeWallet = () => {
      const walletAddr = storage.getItem("walletAddress");
      const walletNetwork = storage.getItem("walletNetwork");
      const passphrase = storage.getItem("networkPassphrase");

      // If we have stored wallet data, restore it immediately
      if (walletAddr && walletNetwork && passphrase) {
        updateState({
          address: walletAddr,
          network: walletNetwork,
          networkPassphrase: passphrase,
        });
      }
    };

    // Create recursive polling function to check wallet state continuously
    const pollWalletState = async () => {
      if (!isMounted) return;

      await updateCurrentWalletState();

      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL);
      }
    };

    // Initialize wallet state immediately from localStorage
    initializeWallet();

    // Get the wallet address when the component is mounted for the first time
    startTransition(async () => {
      await updateCurrentWalletState();
      // Start polling after initial state is loaded

      if (isMounted) {
        timer = setTimeout(() => void pollWalletState(), POLL_INTERVAL);
      }
    });

    // Clear the timeout and stop polling when the component unmounts
    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const contextValue = useMemo(
    () => ({
      ...state,
      isPending,
      signTransaction,
    }),
    [state, isPending, signTransaction],
  );

  return <WalletContext value={contextValue}>{children}</WalletContext>;
};
