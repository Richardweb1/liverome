import { CONTRACT_ADDRESS } from "./genlayerClient";
import type { GenLayerClient } from "genlayer-js/types";

export async function deposit(client: GenLayerClient<any>, amount: bigint) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "deposit",
    args: [],
    value: amount,
  });
  return client.waitForTransactionReceipt({ hash, status: "ACCEPTED" });
}

export async function withdraw(client: GenLayerClient<any>, amount: bigint) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "withdraw",
    args: [amount],
  });
  return client.waitForTransactionReceipt({ hash, status: "ACCEPTED" });
}

export async function rebalance(client: GenLayerClient<any>) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "rebalance",
    args: [],
  });
  // FINALIZED car rebalance implique un consensus LLM -> mieux vaut attendre la finalité
  return client.waitForTransactionReceipt({ hash, status: "FINALIZED" });
}

export async function getStrategy(client: GenLayerClient<any>): Promise<string> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_strategy",
    args: [],
  });
}

export async function getUserBalance(client: GenLayerClient<any>, user: string): Promise<bigint> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_user_balance",
    args: [user],
  });
}

export async function getHistory(client: GenLayerClient<any>): Promise<any[]> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_history",
    args: [],
  });
}

export async function getTotalDeposits(client: GenLayerClient<any>): Promise<bigint> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_deposits",
    args: [],
  });
}

export async function getCooldownRemaining(client: GenLayerClient<any>): Promise<bigint> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_cooldown_remaining",
    args: [],
  });
}
