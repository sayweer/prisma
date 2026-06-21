// Real treasury settlement for bounded x402: turns a gated payment into a live
// `pay()` on the v2 treasury. Wraps the stellar CLI (like packages/prover/submit.ts)
// so the agent key stays in the OS keychain — never in code.
import { spawnSync } from "node:child_process";
import type { SettleFn } from "./index.js";

export interface PayArgs {
  treasuryId: string;
  /** attribution id the treasury records this spend against */
  taskId: number;
  payTo: string;
  /** atomic units of the treasury's token (native XLM SAC: 7 decimals) */
  amount: bigint;
  source?: string; // keychain identity, default zk-deployer
  network?: string; // default testnet
}

/** Build the `stellar contract invoke ... -- pay` argument vector. Pure + deterministic
 *  so the command shape is unit-testable without touching the network. */
export function buildPayArgs(opts: PayArgs): string[] {
  return [
    "contract", "invoke",
    "--id", opts.treasuryId,
    "--source", opts.source ?? "zk-deployer",
    "--network", opts.network ?? "testnet",
    "--",
    "pay",
    "--task_id", String(opts.taskId),
    "--to", opts.payTo,
    "--amount", opts.amount.toString(),
  ];
}

/** Runs a CLI command and returns its merged stderr+stdout. Injected in tests so
 *  settlement is exercised without the network; defaults to the real stellar CLI.
 *  stderr is included because that's where the stellar CLI prints the tx hash. */
export type Exec = (file: string, args: string[]) => string;

const defaultExec: Exec = (file, args) => {
  const r = spawnSync(file, args, { encoding: "utf8" });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${file} exited ${r.status}: ${r.stderr ?? ""}`);
  return `${r.stderr ?? ""}${r.stdout ?? ""}`;
};

const TX_HASH = /Signing transaction:\s*([0-9a-f]{64})/i;

/** Pull the submitted tx hash out of `stellar contract invoke` output — it's in the
 *  "Signing transaction" line. Falls back to the trimmed output if no hash is found
 *  (e.g. a void return), so the caller always gets a non-empty settlement reference. */
export function parseTxHash(output: string): string {
  return output.match(TX_HASH)?.[1] ?? output.trim();
}

export interface TreasurySettleOptions {
  treasuryId: string;
  /** attribution id every payment from this settler is recorded against */
  taskId: number;
  source?: string;
  network?: string;
  exec?: Exec;
}

/** Build a `SettleFn` (the boundedPay seam) that pays through the v2 treasury's `pay()`.
 *  Only reached when the bounded gate already allowed the payment, so the on-chain
 *  policy is the final word and an over-limit/wrong-payee request never gets here. */
export function makeTreasurySettle(opts: TreasurySettleOptions): SettleFn {
  const exec = opts.exec ?? defaultExec;
  return async (payTo, amount) =>
    parseTxHash(
      exec(
        "stellar",
        buildPayArgs({
          treasuryId: opts.treasuryId,
          taskId: opts.taskId,
          payTo,
          amount,
          source: opts.source,
          network: opts.network,
        }),
      ),
    );
}
