# Liverome

Liverome is a GenLayer Bradbury dApp prototype for an adaptive GEN vault.

Users connect a wallet, deposit GEN, withdraw from their internal vault balance, and trigger an on-chain strategy optimization. The strategy is updated by a GenLayer intelligent contract using live market data and validator consensus.

## Live Demo

- App: https://liverome.vercel.app
- Repository: https://github.com/Richardweb1/liverome
- Bradbury contract: `0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd`
- Explorer: https://explorer-bradbury.genlayer.com/address/0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd
- Contract source: [`contracts/liverome.py`](contracts/liverome.py)

## Deployed Contract

The Liverome intelligent contract is deployed on GenLayer Bradbury testnet.

```text
0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd
```

Source code:

```text
contracts/liverome.py
```

Explorer:

```text
https://explorer-bradbury.genlayer.com/address/0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd
```

## What Works Now

- Wallet connection in the web app
- `deposit()` payable transaction
- `withdraw(amount)` internal-accounting transaction
- `rebalance()` strategy optimization transaction
- User vault balance
- Total vault deposits
- Current strategy
- Latest oracle decision
- Transaction status flow: pending, accepted, finalized, error

## How The Strategy Works

`rebalance()` reads BTC 24h market movement from CoinGecko through GenLayer nondeterministic web access.

The contract classifies the market:

- `bull` -> `aggressive`
- `bear` -> `conservative`
- `sideways` -> `balanced`
- `high_volatility` -> `conservative`

Validators must agree on the deterministic result through `gl.eq_principle.strict_eq` before the strategy is stored on-chain.

## Current Status

This is a working Bradbury testnet prototype. It demonstrates:

- live web data inside a GenLayer contract
- validator consensus over the oracle result
- on-chain strategy updates
- a real React dApp frontend connected to the deployed contract

It is not a production yield product yet. Withdraw currently updates internal accounting only and does not transfer native GEN back to the wallet.

## Tech Stack

- GenLayer intelligent contract in Python
- GenLayer Bradbury testnet
- `genlayer-js`
- Vite
- React
- TypeScript
- Vercel

## Project Structure

```text
.
├── contracts/
│   └── liverome.py            # GenLayer intelligent contract
├── src/                       # React dApp frontend
│   ├── components/
│   ├── hooks/
│   └── lib/
├── liverome/
│   ├── contracts/liverome.py  # Original contract workspace copy
│   ├── deploy/
│   └── test/
├── package.json
├── vercel.json
└── README.md
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
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
- `get_my_balance()`
- `get_last_deposit()`
- `get_last_withdraw()`
- `get_user_balance_key(user: str)`

## Notes

- The app is connected to Bradbury testnet.
- The frontend uses wallet connection and `genlayer-js` for contract reads/writes.
- The current contract uses deterministic oracle classification for Bradbury reliability.
- Earlier LLM-based oracle tests were avoided in the hot path because they caused validator timeouts.
