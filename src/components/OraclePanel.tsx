import type { TxState } from "../hooks/useLiverome";

interface Props {
  strategy: string | null;
  history: any[];
  connected: boolean;
  tx: TxState;
  onRebalance: () => void;
}

export function OraclePanel({ strategy, history, connected, tx, onRebalance }: Props) {
  const latest = history?.[0] ?? null;
  const regime = latest?.regime ?? null;
  const confidence = latest?.confidence ?? null;
  const reasoning = latest?.reasoning ?? null;

  const busy = tx.status === "pending" && tx.label === "Rebalance";

  return (
    <section className="panel panel--oracle">
      <div className="panel__eyebrow">
        <span>MARKET BRAIN</span>
        <span className="eyebrow__meta">CoinGecko signal · GenLayer consensus</span>
      </div>

      <div className="oracle-readout__headline">
        <span className={`regime-word regime-word--${regime ?? "unknown"}`}>
          {regime ? regime.toUpperCase() : "—"}
        </span>
        <span className="arrow">→</span>
        <span className="strategy-word">{strategy ? strategy.toUpperCase() : "—"}</span>
      </div>

      {confidence !== null && (
        <div className="oracle-readout__meta">
          <div className="confidence">
            <div className="confidence__label">
              <span>Confidence</span>
              <span className="confidence__value">{confidence}%</span>
            </div>
            <div className="confidence__track">
              <div className="confidence__fill" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>
      )}

      {reasoning && (
        <p className="oracle-readout__reasoning">
          <span className="reasoning__prefix">reasoning —</span>"{reasoning}"
        </p>
      )}

      <button
        className="btn btn--ghost btn--full"
        disabled={!connected || busy}
        onClick={onRebalance}
      >
        {busy ? "Optimizing vault…" : "Optimize strategy"}
      </button>
      {!connected && <p className="vault-note">Connect a wallet to ask the contract for a new strategy.</p>}
    </section>
  );
}
