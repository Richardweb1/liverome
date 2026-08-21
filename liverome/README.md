# Liverome

Live adaptive yield engine built on GenLayer.

Liverome is a Bradbury testnet prototype for an autonomous vault that records deposits, internal withdrawals, and an oracle-driven strategy rebalance on-chain. The current working version uses a fast GenLayer oracle path: CoinGecko BTC 24h change is fetched by validators and classified deterministically through `strict_eq`.

## Status

Working on GenLayer Bradbury:

- Contract deployment accepted
- Payable `deposit()` accepted
- Internal-accounting `withdraw(amount)` accepted
- Oracle `rebalance()` accepted
- `get_history()` returns the latest on-chain strategy decision
- Static frontend showcase is ready in `frontend/`

Current Bradbury contract:

```text
0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd
```

Latest verified oracle result:

```json
{
  "regime": "bull",
  "strategy": "aggressive",
  "confidence": 75,
  "reasoning": "Deterministic CoinGecko BTC 24h change classifier."
}
```

## How It Works

The contract has three main write paths:

- `deposit()` receives native GEN value and stores internal vault accounting.
- `withdraw(amount)` reduces internal accounting only. It intentionally does not call native transfer yet.
- `rebalance()` fetches CoinGecko BTC 24h change and updates the vault strategy.

The oracle path is intentionally minimal for Bradbury reliability:

```text
CoinGecko web.get -> deterministic regime classifier -> strict_eq consensus -> strategy update
```

The first LLM-based oracle version was tested, but it caused validator timeouts on Bradbury. For this demo, the live strategy driver is deterministic and validator-friendly.

## Project Structure

```text
liverome/
├── contracts/
│   └── liverome.py          # GenLayer intelligent contract
├── deploy/
│   ├── deploy.ts            # TypeScript deploy script
│   └── deployed-address.json
├── frontend/
│   ├── index.html           # Static showcase UI
│   ├── styles.css
│   └── app.js
├── test/
│   └── test_liverome.py
├── gltest.config.yaml
├── package.json
└── README.md
```

## Contract Methods

Write methods:

- `deposit()` payable
- `withdraw(amount: u256)`
- `rebalance()`

Read methods:

- `get_strategy()`
- `get_history()`
- `get_total_deposits()`
- `get_last_deposit()`
- `get_last_deposit_balance()`
- `get_last_withdraw()`
- `get_user_balance(user: Address)`
- `get_user_balance_key(user: str)`
- `get_my_balance()`
- `get_cooldown_remaining()`

## Local Setup

Install dependencies:

```bash
npm install
python -m pip install genvm-linter pytest genlayer-test
```

Validate the contract:

```bash
npm run lint:contract
```

Run direct tests if your local GenLayer test fixtures are installed:

```bash
npm run test:contract
```

## Run The Frontend Locally

The frontend is static HTML/CSS/JS and does not need a build step.

Open directly:

```text
frontend/index.html
```

Or serve it locally:

```bash
cd frontend
python -m http.server 5177
```

Then open:

```text
http://localhost:5177
```

## Deploy Contract

Deploy to Studio:

```bash
npm run deploy:studio
```

Deploy to Bradbury:

```powershell
$env:LIVEROME_PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY"
npm run deploy:bradbury
```

After deployment, update:

- `deploy/deployed-address.json`
- `frontend/.env.local`
- the contract address shown in `frontend/index.html` and `frontend/app.js`

## Deploy Frontend To Vercel

Because the frontend is static, deploy the `frontend/` folder as the Vercel project root.

Recommended Vercel settings:

```text
Framework Preset: Other
Root Directory: frontend
Build Command: none
Output Directory: .
Install Command: none
```

If Vercel asks for a build command, leave it empty or use:

```bash
echo "static"
```

## Push To GitHub

From the `liverome/` folder:

```bash
git init
git add .
git commit -m "Initial Liverome GenLayer prototype"
git branch -M main
git remote add origin https://github.com/Richardweb1/liverome.git
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/Richardweb1/liverome.git
git push -u origin main
```

## Notes

- Native GEN payout from `withdraw` is intentionally disabled for now. The method updates internal accounting only.
- LLM reasoning is not in the hot consensus path. The Bradbury-stable version uses deterministic oracle classification.
- `balances` are keyed by `str(address)` because `TreeMap[Address, u256]` lookups were inconsistent in Studio testing.
- The frontend buttons are currently showcase/demo controls. The verified on-chain values are displayed in the oracle and proof sections.

## Links

- GenLayer Studio: https://studio.genlayer.com/contracts
- GenExplorer Bradbury: https://explorer-bradbury.genlayer.com/
- GenLayer Docs: https://docs.genlayer.com/
