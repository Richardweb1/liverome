/**
 * Chain + contract configuration.
 *
 * CAVEAT: `testnetBradbury` is the expected export name in genlayer-js's
 * `genlayer-js/chains` module as of the docs at time of writing. Confirm
 * this against your installed version — run:
 *   node -e "console.log(Object.keys(require('genlayer-js/chains')))"
 * If it's not there, `testnetAsimov` and `studionet` are confirmed-stable
 * exports and Bradbury shares RPC/faucet infra with Asimov, so falling
 * back to a manually-defined chain object (same shape) is a safe patch.
 */
import { testnetBradbury } from "genlayer-js/chains";

export const CHAIN = testnetBradbury;

export const CONTRACT_ADDRESS =
  "0x579b3587C27DfeA3Ad8AC500B1E0Bd8e19F211Fd" as const;

// GEN token decimals — GenLayer's native token follows the standard EVM
// 18-decimal convention for ghost-contract value transfers. Verify this
// against your faucet/explorer before wiring real deposit amounts, since
// this directly affects how much a user actually sends.
export const GEN_DECIMALS = 18;

export function toBaseUnits(amountGen: string | number): bigint {
  const [whole, frac = ""] = String(amountGen).split(".");
  const fracPadded = (frac + "0".repeat(GEN_DECIMALS)).slice(0, GEN_DECIMALS);
  return BigInt(whole || "0") * 10n ** BigInt(GEN_DECIMALS) + BigInt(fracPadded || "0");
}

export function fromBaseUnits(amount: bigint | number | string): string {
  const value = BigInt(amount);
  const divisor = 10n ** BigInt(GEN_DECIMALS);
  const whole = value / divisor;
  const frac = value % divisor;
  const fracStr = frac.toString().padStart(GEN_DECIMALS, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}
