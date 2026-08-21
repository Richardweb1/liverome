/**
 * Setup du client genlayer-js pour le frontend Liverome.
 * Env vars attendues (dans .env.local):
 *   NEXT_PUBLIC_NETWORK=studio | bradbury
 *   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet, testnetBradbury } from "genlayer-js/chains";

const network = process.env.NEXT_PUBLIC_NETWORK ?? "studio";
export const chain = network === "bradbury" ? testnetBradbury : studionet;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

// Côté client (browser): idéalement on branche un wallet (MetaMask-like)
// au lieu de générer une clé. Ici un exemple simple pour dev/local.
export function getClient(privateKey?: `0x${string}`) {
  const account = privateKey ? createAccount(privateKey) : createAccount();
  return createClient({
    chain,
    account,
  });
}
