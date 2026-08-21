import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isAvailable: boolean;
  error: string | null;
}

/**
 * Minimal injected-wallet integration (MetaMask or compatible EIP-1193
 * provider). GenLayer does not yet ship its own browser-extension wallet
 * SDK for React as of this writing — the documented path is: connect an
 * ordinary EVM wallet, get the address, then pass that address string to
 * genlayer-js's `createClient({ account: address })`. genlayer-js forwards
 * signing requests to `window.ethereum` under the hood.
 *
 * CAVEAT: confirm with GenLayer docs whether Bradbury requires the wallet
 * to have the Bradbury RPC/chainId added as a custom network before it can
 * sign — if so, add a `wallet_addEthereumChain` call in `connect()` below.
 */
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    isAvailable: typeof window !== "undefined" && !!window.ethereum,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({ ...s, error: "No wallet detected. Install MetaMask or a compatible wallet." }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setState((s) => ({ ...s, address: accounts[0] ?? null, isConnecting: false }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: err?.message ?? "Wallet connection was rejected.",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, address: null }));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, address: accounts[0] ?? null }));
    };
    const handleChainChanged = () => {
      // Simplest safe reaction to a chain switch: reload reads from scratch.
      window.location.reload();
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return { ...state, connect, disconnect };
}
