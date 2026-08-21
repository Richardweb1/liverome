import { CONTRACT_ADDRESS } from "../lib/chain";

interface Props {
  address: string | null;
  isConnecting: boolean;
  isAvailable: boolean;
  error: string | null;
  onConnect: () => void;
}

function short(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function TopBar({ address, isConnecting, isAvailable, error, onConnect }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <span className="brand__dot" />
          <span className="brand__name">LIVEROME</span>
        </div>

        <div className="topbar__right">
          <span className="pill pill--network">
            <span className="pill__dot" />
            Bradbury Testnet
          </span>

          <button
            className="chip"
            title={CONTRACT_ADDRESS}
            onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}
          >
            {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
          </button>

          {address ? (
            <span className="chip chip--connected">{short(address)}</span>
          ) : (
            <button className="btn btn--primary" onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting…" : isAvailable ? "Connect Wallet" : "Install Wallet"}
            </button>
          )}
        </div>
      </div>
      {error && <div className="topbar__error">{error}</div>}
    </header>
  );
}
