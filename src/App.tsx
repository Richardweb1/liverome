import { useWallet } from "./hooks/useWallet";
import { useLiverome } from "./hooks/useLiverome";
import { TopBar } from "./components/TopBar";
import { VaultPanel } from "./components/VaultPanel";
import { OraclePanel } from "./components/OraclePanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { fromBaseUnits } from "./lib/chain";

function allocationFor(strategy: string | null) {
  if (strategy === "aggressive") {
    return [
      ["Growth pool", 70],
      ["Reserve", 20],
      ["Protection", 10],
    ] as const;
  }
  if (strategy === "conservative") {
    return [
      ["Growth pool", 25],
      ["Reserve", 55],
      ["Protection", 20],
    ] as const;
  }
  return [
    ["Growth pool", 45],
    ["Reserve", 40],
    ["Protection", 15],
  ] as const;
}

function ProductOverview({
  connected,
  myBalance,
  totalDeposits,
  strategy,
  history,
}: {
  connected: boolean;
  myBalance: bigint | null;
  totalDeposits: bigint | null;
  strategy: string | null;
  history: any[];
}) {
  const latest = history?.[0] ?? {};
  const regime = latest.regime ?? "sideways";
  const confidence = latest.confidence ?? 0;
  const allocation = allocationFor(strategy);

  return (
    <section className="product-hero">
      <div className="product-hero__copy">
        <div className="product-kicker">GenLayer autonomous vault</div>
        <h1>Liverome manages a test vault from live market consensus.</h1>
        <p>
          Connect a wallet, deposit Bradbury GEN, and let the contract classify the market before choosing a vault mode. The user sees a portfolio product, while GenLayer handles the oracle agreement behind it.
        </p>
        <div className="hero-metrics" aria-label="Vault summary">
          <div>
            <span>Your position</span>
            <strong>{connected && myBalance !== null ? `${fromBaseUnits(myBalance)} GEN` : "Connect wallet"}</strong>
          </div>
          <div>
            <span>Vault TVL</span>
            <strong>{totalDeposits !== null ? `${fromBaseUnits(totalDeposits)} GEN` : "Loading"}</strong>
          </div>
          <div>
            <span>Active mode</span>
            <strong>{strategy ?? "Loading"}</strong>
          </div>
        </div>
      </div>

      <div className="product-hero__card">
        <div className="mode-header">
          <span>Recommended allocation</span>
          <strong>{regime} market</strong>
        </div>
        <div className="allocation-chart">
          {allocation.map(([label, value]) => (
            <div className="allocation-row" key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}%</strong>
              </div>
              <div className="allocation-track">
                <span style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="decision-strip">
          <span>Oracle confidence</span>
          <strong>{confidence}/100</strong>
        </div>
      </div>
    </section>
  );
}

function ProductModules({ strategy, history }: { strategy: string | null; history: any[] }) {
  const latest = history?.[0] ?? {};
  const regime = latest.regime ?? "sideways";

  return (
    <section className="module-grid" aria-label="Liverome product modules">
      <article className="module-card">
        <span className="module-card__label">For users</span>
        <h3>Deposit once, follow the active vault mode.</h3>
        <p>Users are not asked to read contract internals. They see their GEN position, the selected mode, and the next available action.</p>
      </article>
      <article className="module-card">
        <span className="module-card__label">Strategy engine</span>
        <h3>{strategy ?? "balanced"} portfolio mode is live.</h3>
        <p>The UI translates the contract strategy into growth, reserve, and protection buckets so the product feels like a managed vault.</p>
      </article>
      <article className="module-card">
        <span className="module-card__label">GenLayer proof</span>
        <h3>{regime} regime came from validator agreement.</h3>
        <p>The oracle uses CoinGecko market movement plus strict equality consensus before the strategy changes on Bradbury.</p>
      </article>
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
        <ProductOverview
          connected={connected}
          myBalance={data.myBalance}
          totalDeposits={data.totalDeposits}
          strategy={data.strategy}
          history={data.history}
        />

        <ProductModules strategy={data.strategy} history={data.history} />

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
