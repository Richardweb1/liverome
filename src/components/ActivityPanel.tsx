import { CONTRACT_ADDRESS, fromBaseUnits } from "../lib/chain";
import type { TxState } from "../hooks/useLiverome";

interface Props {
  tx: TxState;
  loadingReads: boolean;
  lastDeposit: any | null;
  lastWithdraw: any | null;
  myPendingWithdrawal: bigint | null;
  totalPendingWithdrawals: bigint | null;
  allocation: any | null;
  history: any[];
  onRefresh: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  pending: "Pending",
  accepted: "Accepted",
  finalized: "Finalized",
  error: "Error",
};

function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function valueToBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string" && value.length > 0) return BigInt(value);
  return 0n;
}

function ProofItem({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className={`proof-item ${ok ? "proof-item--ok" : ""}`}>
      <span className="proof-item__mark">{ok ? "OK" : "--"}</span>
      <span className="proof-item__label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ActivityPanel({
  tx,
  loadingReads,
  lastDeposit,
  lastWithdraw,
  myPendingWithdrawal,
  totalPendingWithdrawals,
  allocation,
  history,
  onRefresh,
}: Props) {
  const lastDepositValue = lastDeposit?.value ?? lastDeposit?.amount ?? null;
  const lastWithdrawValue = lastWithdraw?.amount ?? null;
  const lastWithdrawPending = lastWithdraw?.pending ?? null;
  const payoutRequested = lastWithdraw?.payout_requested_amount ?? null;
  const payoutRequestCount = lastWithdraw?.payout_request_count ?? null;
  const totalAllocation =
    Number(allocation?.growth_bps ?? 0) +
    Number(allocation?.reserve_bps ?? 0) +
    Number(allocation?.protection_bps ?? 0);

  const depositAmount = valueToBigInt(lastDepositValue);
  const withdrawAmount = valueToBigInt(lastWithdrawValue);
  const pendingAmount = myPendingWithdrawal ?? valueToBigInt(lastWithdrawPending);
  const requestedAmount = valueToBigInt(payoutRequested);

  return (
    <section className="panel panel--activity">
      <div className="panel__eyebrow">
        <span>VAULT ACTIVITY</span>
        <button className="btn btn--tiny" disabled={loadingReads} onClick={onRefresh}>
          {loadingReads ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {tx.status !== "idle" && (
        <div className={`tx-status tx-status--${tx.status}`}>
          <span className="tx-status__dot" />
          <span className="tx-status__label">{tx.label}</span>
          <span className="tx-status__value">{STATUS_LABEL[tx.status]}</span>
          {tx.error && <span className="tx-status__error">{tx.error}</span>}
        </div>
      )}

      <div className="log-entry">
        <div className="log-entry__row">
          <span className="log-entry__key">last deposit</span>
          <span className="log-entry__mono">
            {lastDepositValue ? `${fromBaseUnits(lastDepositValue)} GEN` : "—"}
          </span>
        </div>
        <div className="log-entry__row">
          <span className="log-entry__key">last withdraw</span>
          <span className="log-entry__mono">
            {lastWithdrawValue ? `${fromBaseUnits(lastWithdrawValue)} GEN` : "—"}
          </span>
        </div>
        {lastWithdrawPending !== null && (
          <div className="log-entry__row">
            <span className="log-entry__key">pending payout</span>
            <span className="log-entry__mono">{fromBaseUnits(lastWithdrawPending)} GEN</span>
          </div>
        )}
        {payoutRequested !== null && (
          <div className="log-entry__row">
            <span className="log-entry__key">native payout requested</span>
            <span className="log-entry__mono">{fromBaseUnits(payoutRequested)} GEN</span>
          </div>
        )}
        {payoutRequestCount !== null && (
          <div className="log-entry__row">
            <span className="log-entry__key">payout request count</span>
            <span className="log-entry__mono">{String(payoutRequestCount)}</span>
          </div>
        )}
      </div>

      <div className="proof-grid" aria-label="Submission evidence">
        <ProofItem
          ok={depositAmount > 0n}
          label="Deposit recorded"
          value={depositAmount > 0n ? `${fromBaseUnits(depositAmount)} GEN` : "waiting"}
        />
        <ProofItem
          ok={withdrawAmount > 0n}
          label="Withdraw recorded"
          value={withdrawAmount > 0n ? `${fromBaseUnits(withdrawAmount)} GEN` : "waiting"}
        />
        <ProofItem
          ok={requestedAmount > 0n}
          label="Native payout requested"
          value={requestedAmount > 0n ? `${fromBaseUnits(requestedAmount)} GEN` : "waiting"}
        />
        <ProofItem
          ok={pendingAmount > 0n}
          label="Claim preserved"
          value={pendingAmount > 0n ? `${fromBaseUnits(pendingAmount)} GEN pending` : "waiting"}
        />
        <ProofItem
          ok={totalAllocation === 10000 && history.length > 0}
          label="Allocation updated"
          value={
            totalAllocation === 10000
              ? `${allocation?.growth_bps ?? 0}/${allocation?.reserve_bps ?? 0}/${allocation?.protection_bps ?? 0} bps`
              : "waiting"
          }
        />
        <ProofItem
          ok={(totalPendingWithdrawals ?? 0n) >= pendingAmount && pendingAmount > 0n}
          label="Vault accounting"
          value={totalPendingWithdrawals !== null ? `${fromBaseUnits(totalPendingWithdrawals)} GEN pending` : "waiting"}
        />
      </div>

      <div className="proof">
        {tx.hash && (
          <div className="explorer-card">
            <div>
              <span className="explorer-card__label">Latest transaction</span>
              <strong>{shortHash(tx.hash)}</strong>
            </div>
            <a
              href={`https://explorer-bradbury.genlayer.com/tx/${tx.hash}`}
              target="_blank"
              rel="noopener"
              className="btn btn--tiny explorer-card__button"
            >
              Open transaction
            </a>
          </div>
        )}
        <div className="proof__row">
          <span>Contract</span>
          <a
            href={`https://explorer-bradbury.genlayer.com/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener"
            className="proof__link"
          >
            {CONTRACT_ADDRESS.slice(0, 10)}…
          </a>
        </div>
        <div className="proof__row">
          <span>Studio</span>
          <a href="https://studio.genlayer.com/contracts" target="_blank" rel="noopener" className="proof__link">
            Open Studio
          </a>
        </div>
      </div>
    </section>
  );
}
