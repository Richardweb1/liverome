# Liverome

Liverome is a GenLayer Bradbury testnet prototype for an adaptive GEN vault.

Users can deposit native GEN, request withdrawals, and trigger a live market rebalance. The contract uses GenLayer nondeterministic web access to read BTC 24h market movement, then `gl.eq_principle.strict_eq` so validators agree before the vault allocation changes.

## Current Bradbury Contract

```text
pending redeploy for async-settlement build
```

Explorer:

```text
pending new Bradbury explorer link
```

## What Works

- `deposit()` accepts native GEN and increases the user's vault balance.
- `withdraw(amount)` reduces the available vault balance, records a pending payout claim, enqueues it, and requests native GEN payout with `emit_transfer(..., on="finalized")`.
- `confirm_settlements()` is permissionless and clears queued claims only when the contract's real native balance proves GEN left the vault.
- There is no owner/admin settlement-clearing path.
- `rebalance()` updates actual value-backed allocation bucket balances, not only a label.
- `get_allocation()` exposes growth, reserve, and protection basis points.
- Direct tests prove deposit and withdrawal accounting conserves funds.

## Strategy Logic

```text
CoinGecko BTC 24h change -> deterministic classifier -> strict_eq consensus -> vault allocation update
```

Allocations:

- `aggressive`: 7000 growth / 2000 reserve / 1000 protection bps
- `balanced`: 4500 growth / 4000 reserve / 1500 protection bps
- `conservative`: 2500 growth / 5500 reserve / 2000 protection bps

## Project Structure

```text
liverome/
├── contracts/liverome.py
├── test/test_liverome.py
├── deploy/
├── frontend/
├── gltest.config.yaml
└── package.json
```

The production React dApp is in the repository root `src/` folder and is deployed to Vercel.

## Validate

```bash
npm run lint:contract
npm run test:contract
```

## Notes

- Values are stored in wei-scale `u256` units.
- GenLayer does not currently document a contract-readable per-transfer receipt for individual `emit_transfer` calls. Liverome uses aggregate native-balance reconciliation as the strongest documented on-chain proof available today.
- LLM reasoning is not in the hot consensus path because Bradbury testing showed LLM calls can cause validator timeouts. The current oracle path is deterministic and validator-friendly.
