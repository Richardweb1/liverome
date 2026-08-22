import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hash } from "genlayer-js/types";
import { getClient, readAllocation, readHistory, readLastDeposit, readLastWithdraw, readMyBalance, readMyPendingWithdrawal, readStrategy, readTotalDeposits, readTotalPendingWithdrawals, writeConfirmSettlements, writeDeposit, writeRebalance, writeWithdraw } from "../lib/contract";
import { toBaseUnits } from "../lib/chain";

export type TxStatus = "idle" | "pending" | "accepted" | "finalized" | "error";

export interface TxState {
  status: TxStatus;
  label: string | null;
  hash: string | null;
  error: string | null;
}

export interface LiveromeData {
  strategy: string | null;
  history: any[];
  totalDeposits: bigint | null;
  totalPendingWithdrawals: bigint | null;
  myBalance: bigint | null;
  myPendingWithdrawal: bigint | null;
  allocation: any | null;
  lastDeposit: any | null;
  lastWithdraw: any | null;
}

const EMPTY_DATA: LiveromeData = {
  strategy: null,
  history: [],
  totalDeposits: null,
  totalPendingWithdrawals: null,
  myBalance: null,
  myPendingWithdrawal: null,
  allocation: null,
  lastDeposit: null,
  lastWithdraw: null,
};

export function useLiverome(address: string | null) {
  const [data, setData] = useState<LiveromeData>(EMPTY_DATA);
  const [loadingReads, setLoadingReads] = useState(false);
  const [tx, setTx] = useState<TxState>({ status: "idle", label: null, hash: null, error: null });

  // Read-only client always works, whether or not a wallet is connected.
  const readClient = useMemo(() => getClient(), []);
  // Write client is only meaningful once an address is connected — it
  // delegates signing to window.ethereum for that address.
  const writeClient = useMemo(() => (address ? getClient(address) : null), [address]);

  const refetch = useCallback(async () => {
    setLoadingReads(true);
    try {
      const [strategy, history, totalDeposits, lastDeposit, lastWithdraw] = await Promise.all([
        readStrategy(readClient),
        readHistory(readClient),
        readTotalDeposits(readClient),
        readLastDeposit(readClient),
        readLastWithdraw(readClient),
      ]);

      let totalPendingWithdrawals: bigint | null = null;
      let allocation: any | null = null;
      try {
        totalPendingWithdrawals = await readTotalPendingWithdrawals(readClient);
      } catch {
        totalPendingWithdrawals = 0n;
      }
      try {
        allocation = await readAllocation(readClient);
      } catch {
        allocation = null;
      }

      let myBalance: bigint | null = null;
      let myPendingWithdrawal: bigint | null = null;
      if (address && writeClient) {
        myBalance = await readMyBalance(writeClient);
        try {
          myPendingWithdrawal = await readMyPendingWithdrawal(writeClient);
        } catch {
          myPendingWithdrawal = 0n;
        }
      }

      setData({
        strategy,
        history,
        totalDeposits,
        totalPendingWithdrawals,
        myBalance,
        myPendingWithdrawal,
        allocation,
        lastDeposit,
        lastWithdraw,
      });
    } catch (err) {
      console.error("Liverome read failed:", err);
    } finally {
      setLoadingReads(false);
    }
  }, [readClient, writeClient, address]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Drives a write transaction through pending -> accepted -> finalized,
  // then refreshes all reads once it lands.
  const runWrite = useCallback(
    async (label: string, action: () => Promise<string>) => {
      if (!writeClient) {
        setTx({ status: "error", label, hash: null, error: "Connect a wallet first." });
        return;
      }
      setTx({ status: "pending", label, hash: null, error: null });
      try {
        const hash = await action();
        setTx({ status: "pending", label, hash, error: null });

        await writeClient.waitForTransactionReceipt({ hash: hash as Hash, status: "ACCEPTED" as any });
        setTx({ status: "accepted", label, hash, error: null });

        // Refresh immediately on ACCEPTED so the UI feels responsive...
        await refetch();

        // ...then continue waiting for FINALIZED in the background.
        writeClient
          .waitForTransactionReceipt({ hash: hash as Hash, status: "FINALIZED" as any })
          .then(() => setTx((s) => (s.hash === hash ? { ...s, status: "finalized" } : s)))
          .catch(() => {
            /* finality wait failing is non-fatal — ACCEPTED already succeeded */
          });
      } catch (err: any) {
        setTx({
          status: "error",
          label,
          hash: null,
          error: err?.message ?? "Transaction failed.",
        });
      }
    },
    [writeClient, refetch]
  );

  const deposit = useCallback(
    (amountGen: string) => runWrite("Deposit", () => writeDeposit(writeClient!, toBaseUnits(amountGen))),
    [writeClient, runWrite]
  );

  const withdraw = useCallback(
    (amountGen: string) => runWrite("Withdraw", () => writeWithdraw(writeClient!, toBaseUnits(amountGen))),
    [writeClient, runWrite]
  );

  const rebalance = useCallback(
    () => runWrite("Rebalance", () => writeRebalance(writeClient!)),
    [writeClient, runWrite]
  );

  const confirmSettlements = useCallback(
    () => runWrite("Confirm settlements", () => writeConfirmSettlements(writeClient!)),
    [writeClient, runWrite]
  );

  return { data, loadingReads, tx, refetch, deposit, withdraw, rebalance, confirmSettlements };
}
