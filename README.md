# Liverome

Liverome is a GenLayer Bradbury dApp prototype for an adaptive GEN vault.

Users connect a wallet, deposit GEN, withdraw from their internal vault balance, and trigger an on-chain strategy optimization. The strategy is updated by a GenLayer intelligent contract using live market data and validator consensus.

## Live Demo

- App: https://liverome.vercel.app
- Bradbury contract: `0xc5DFC170c8bc55EF31C1E68fAA5e4a49ec8E7613`
- Explorer: https://explorer-bradbury.genlayer.com/address/0xc5DFC170c8bc55EF31C1E68fAA5e4a49ec8E7613
- Contract source: [`contracts/liverome.py`](contracts/liverome.py)

## Deployed Contract

The Liverome intelligent contract is deployed on GenLayer Bradbury testnet.

```text
0xc5DFC170c8bc55EF31C1E68fAA5e4a49ec8E7613
```

Source code:

```text
contracts/liverome.py
```

Explorer:

```text
https://explorer-bradbury.genlayer.com/address/0xc5DFC170c8bc55EF31C1E68fAA5e4a49ec8E7613
```

## What Works Now

- Wallet connection in the web app
- `deposit()` payable transaction
- `withdraw(amount)` requests a native GEN payout with `emit_transfer(..., on="finalized")`
- Pending withdrawal claims remain recorded until a payout is marked paid
- `rebalance()` strategy optimization transaction
- User vault balance
- Total vault deposits
- Current strategy
- Latest oracle decision
- Real allocation fields: growth, reserve, and protection basis points
- Pending withdrawal accounting
- Transaction status flow: pending, accepted, finalized, error

## How The Strategy Works

`rebalance()` reads BTC 24h market movement from CoinGecko through GenLayer nondeterministic web access.

The contract classifies the market:

- `bull` -> `aggressive`
- `bear` -> `conservative`
- `sideways` -> `balanced`
- `high_volatility` -> `conservative`

Validators must agree on the deterministic result through `gl.eq_principle.strict_eq` before the strategy is stored on-chain.

The accepted strategy also updates persisted vault allocation fields:

- `aggressive`: 7000 growth / 2000 reserve / 1000 protection bps
- `balanced`: 4500 growth / 4000 reserve / 1500 protection bps
- `conservative`: 2500 growth / 5500 reserve / 2000 protection bps

## Current Status

This is a working Bradbury testnet prototype. It demonstrates:

- live web data inside a GenLayer contract
- validator consensus over the oracle result
- on-chain strategy updates
- a real React dApp frontend connected to the deployed contract

It is not a production yield product yet. The current withdrawal model requests a native GEN transfer on finalization and keeps a pending claim in storage until the payout is explicitly marked paid. This means the user's claim is not erased if an asynchronous payout message fails or needs manual review.

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
- `mark_withdrawal_paid(user: str, amount: u256)`
- `rebalance()`

Read methods:

- `get_strategy()`
- `get_history()`
- `get_total_deposits()`
- `get_total_pending_withdrawals()`
- `get_accounting()`
- `get_allocation()`
- `get_my_balance()`
- `get_my_pending_withdrawal()`
- `get_last_deposit()`
- `get_last_withdraw()`
- `get_user_balance_key(user: str)`

## Notes

- The app is connected to Bradbury testnet.
- The frontend uses wallet connection and `genlayer-js` for contract reads/writes.
- The current contract uses deterministic oracle classification for Bradbury reliability.
- Earlier LLM-based oracle tests were avoided in the hot path because they caused validator timeouts.

