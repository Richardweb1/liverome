import { CONTRACT_ADDRESS, fromBaseUnits } from "../lib/chain";
import type { TxState } from "../hooks/useLiverome";

interface Props {
  tx: TxState;
  lastDeposit: any | null;
  lastWithdraw: any | null;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Idle",
  pending: "Pending",
  accepted: "Accepted",
  finalized: "Finalized",
  error: "Error",
};

export function ActivityPanel({ tx, lastDeposit, lastWithdraw }: Props) {
  const lastDepositValue = lastDeposit?.value ?? lastDeposit?.amount ?? null;
  const lastWithdrawValue = lastWithdraw?.amount ?? null;

  return (
    <section className="panel panel--activity">
      <div className="panel__eyebrow">
        <span>VAULT ACTIVITY</span>
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
      </div>

      <div className="proof">
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
