import { useWallet } from "./hooks/useWallet";
import { useLiverome } from "./hooks/useLiverome";
import { TopBar } from "./components/TopBar";
import { VaultPanel } from "./components/VaultPanel";
import { OraclePanel } from "./components/OraclePanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { fromBaseUnits } from "./lib/chain";

function DashboardStats({
  myBalance,
  totalDeposits,
  strategy,
}: {
  myBalance: bigint | null;
  totalDeposits: bigint | null;
  strategy: string | null;
}) {
  return (
    <section className="stats-grid" aria-label="Vault summary">
      <div className="stat-card stat-card--primary">
        <span>My balance</span>
        <strong>{myBalance !== null ? fromBaseUnits(myBalance) : "0.0000"} GEN</strong>
      </div>
      <div className="stat-card">
        <span>Total vault</span>
        <strong>{totalDeposits !== null ? fromBaseUnits(totalDeposits) : "..." } GEN</strong>
      </div>
      <div className="stat-card">
        <span>Strategy</span>
        <strong>{strategy ?? "..."}</strong>
      </div>
    </section>
  );
}

export default function App() {
  const wallet = useWallet();
  const { data, tx, deposit, withdraw, rebalance } = useLiverome(wallet.address);
  const connected = !!wallet.address;

  return (
    <>
      <TopBar
        address={wallet.address}
        isConnecting={wallet.isConnecting}
        isAvailable={wallet.isAvailable}
        error={wallet.error}
        onConnect={wallet.connect}
      />

      <main className="shell">
        <div className="app-heading">
          <div>
            <h1>Vault</h1>
            <p>{connected ? "Manage your GEN position." : "Connect your wallet to start."}</p>
          </div>
          <span className="network-label">Bradbury Testnet</span>
        </div>

        <DashboardStats
          myBalance={data.myBalance}
          totalDeposits={data.totalDeposits}
          strategy={data.strategy}
        />

        <div className="dashboard-grid">
          <VaultPanel
            connected={connected}
            myBalance={data.myBalance}
            totalDeposits={data.totalDeposits}
            tx={tx}
            onDeposit={deposit}
            onWithdraw={withdraw}
          />

          <OraclePanel
            strategy={data.strategy}
            history={data.history}
            connected={connected}
            tx={tx}
            onRebalance={rebalance}
          />

          <ActivityPanel tx={tx} lastDeposit={data.lastDeposit} lastWithdraw={data.lastWithdraw} />
        </div>
      </main>
    </>
  );
}
