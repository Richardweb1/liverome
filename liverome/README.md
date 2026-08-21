# Liverome

Liverome is a GenLayer Bradbury testnet prototype for an adaptive GEN vault.

Users can deposit native GEN, request withdrawals, and trigger a live market rebalance. The contract uses GenLayer nondeterministic web access to read BTC 24h market movement, then `gl.eq_principle.strict_eq` so validators agree before the vault allocation changes.

## Current Bradbury Contract

```text
0x2c9d37F4A84204Fa46112A239665C292E6cDffC5
```

Explorer:

```text
https://explorer-bradbury.genlayer.com/address/0x2c9d37F4A84204Fa46112A239665C292E6cDffC5
```

## What Works

- `deposit()` accepts native GEN and increases the user's vault balance.
- `withdraw(amount)` reduces the available vault balance, records a pending payout claim, and requests native GEN payout with `emit_transfer(..., on="finalized")`.
- `mark_withdrawal_paid(user, amount)` is owner-only and clears a pending claim only after payout is considered paid.
- `rebalance()` updates actual allocation fields, not only a label.
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
- Pending payout accounting is intentionally separate from available balances so a withdrawal claim is not erased before payout confirmation.
- LLM reasoning is not in the hot consensus path because Bradbury testing showed LLM calls can cause validator timeouts. The current oracle path is deterministic and validator-friendly.
