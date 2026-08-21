import { useState } from "react";
import { fromBaseUnits } from "../lib/chain";
import type { TxState } from "../hooks/useLiverome";

interface Props {
  connected: boolean;
  myBalance: bigint | null;
  totalDeposits: bigint | null;
  tx: TxState;
  onDeposit: (amount: string) => void;
  onWithdraw: (amount: string) => void;
}

export function VaultPanel({ connected, myBalance, totalDeposits, tx, onDeposit, onWithdraw }: Props) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const busy = tx.status === "pending" && (tx.label === "Deposit" || tx.label === "Withdraw");

  return (
    <section className="panel panel--vault">
      <div className="panel__eyebrow">
        <span>MY VAULT</span>
        <span className="badge badge--verified">Live account</span>
      </div>

      <div className="balance mobile-only">
        <span className="balance__label">Your balance</span>
        <div className="balance__value">
          <span>{myBalance !== null ? fromBaseUnits(myBalance) : connected ? "…" : "—"}</span>
          <span className="balance__unit">GEN</span>
        </div>
      </div>

      <div className="balance balance--secondary mobile-only">
        <span className="balance__label">Total deposits (all users)</span>
        <div className="balance__value balance__value--small">
          <span>{totalDeposits !== null ? fromBaseUnits(totalDeposits) : "…"}</span>
          <span className="balance__unit">GEN</span>
        </div>
      </div>

      <div className="vault-form">
        <div className="field">
          <label htmlFor="depositInput">Deposit</label>
          <div className="field__row">
            <input
              id="depositInput"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.0001"
              value={depositAmount}
              disabled={!connected}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button
              className="btn btn--primary"
              disabled={!connected || busy || !depositAmount}
              onClick={() => onDeposit(depositAmount)}
            >
              Deposit
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="withdrawInput">Withdraw</label>
          <div className="field__row">
            <input
              id="withdrawInput"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.0001"
              value={withdrawAmount}
              disabled={!connected}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <button
              className="btn btn--ghost"
              disabled={!connected || busy || !withdrawAmount}
              onClick={() => onWithdraw(withdrawAmount)}
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {!connected && (
        <p className="vault-note">Connect wallet first.</p>
      )}
    </section>
  );
}
