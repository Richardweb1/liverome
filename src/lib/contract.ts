import { createClient } from "genlayer-js";
import type { GenLayerClient } from "genlayer-js/types";
import { CHAIN, CONTRACT_ADDRESS } from "./chain";

/**
 * Build a client.
 * - `account` undefined  -> read-only client, no signer needed.
 * - `account` a string address -> "address-only" mode. genlayer-js will
 *   delegate signing to the injected browser wallet (window.ethereum) for
 *   any write call made with this client. This is the documented pattern
 *   for MetaMask-style integration — you do NOT pass a private key.
 */
export function getClient(account?: string): GenLayerClient<typeof CHAIN> {
  return createClient({
    chain: CHAIN,
    account: account as any,
  });
}

// ---------------- READS ----------------

export async function readStrategy(client: GenLayerClient<any>): Promise<string> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_strategy",
    args: [],
  })) as string;
}

export async function readHistory(client: GenLayerClient<any>): Promise<any[]> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_history",
    args: [],
  })) as any[];
}

export async function readTotalDeposits(client: GenLayerClient<any>): Promise<bigint> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_deposits",
    args: [],
  })) as bigint;
}

export async function readTotalPendingWithdrawals(client: GenLayerClient<any>): Promise<bigint> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_total_pending_withdrawals",
    args: [],
  })) as bigint;
}

export async function readAllocation(client: GenLayerClient<any>): Promise<any> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_allocation",
    args: [],
  });
}

export async function readMyBalance(client: GenLayerClient<any>): Promise<bigint> {
  // get_my_balance() reads gl.message.sender_address on the contract side,
  // so it must be called with a client that has `account` set — otherwise
  // there is no sender to resolve.
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_my_balance",
    args: [],
  })) as bigint;
}

export async function readMyPendingWithdrawal(client: GenLayerClient<any>): Promise<bigint> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_my_pending_withdrawal",
    args: [],
  })) as bigint;
}

export async function readUserBalanceByKey(
  client: GenLayerClient<any>,
  userKey: string
): Promise<bigint> {
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_user_balance_key",
    args: [userKey],
  })) as bigint;
}

export async function readLastDeposit(client: GenLayerClient<any>): Promise<any> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_last_deposit",
    args: [],
  });
}

export async function readLastWithdraw(client: GenLayerClient<any>): Promise<any> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_last_withdraw",
    args: [],
  });
}

// ---------------- WRITES ----------------
// Each write returns the tx hash immediately; callers drive the
// pending -> accepted -> finalized status themselves (see useTxStatus).

export async function writeDeposit(
  client: GenLayerClient<any>,
  amountBaseUnits: bigint
): Promise<string> {
  return (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "deposit",
    args: [],
    value: amountBaseUnits,
  })) as string;
}

export async function writeWithdraw(
  client: GenLayerClient<any>,
  amountBaseUnits: bigint
): Promise<string> {
  return (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "withdraw",
    args: [amountBaseUnits],
    value: 0n,
  })) as string;
}

export async function writeRebalance(client: GenLayerClient<any>): Promise<string> {
  return (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "rebalance",
    args: [],
    value: 0n,
  })) as string;
}

export async function writeConfirmSettlements(client: GenLayerClient<any>): Promise<string> {
  return (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "confirm_settlements",
    args: [],
    value: 0n,
  })) as string;
}
