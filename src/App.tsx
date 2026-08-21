import { useWallet } from "./hooks/useWallet";
import { useLiverome } from "./hooks/useLiverome";
import { TopBar } from "./components/TopBar";
import { VaultPanel } from "./components/VaultPanel";
import { OraclePanel } from "./components/OraclePanel";
import { ActivityPanel } from "./components/ActivityPanel";

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
        <div className="columns">
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
        </div>

        <ActivityPanel tx={tx} lastDeposit={data.lastDeposit} lastWithdraw={data.lastWithdraw} />
      </main>
    </>
  );
}
