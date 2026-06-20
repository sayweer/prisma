// Live prover: a real payment batch -> witness -> Groth16 proof -> Soroban fixtures.
//
// Generalises gen-sample (no hardcoded amounts/payees): take a batch + policy, emit
// the exact bytes the on-chain verifier consumes. Salts are CSPRNG (see salt.ts), so
// commitments actually hide. Run in WSL (needs circom/snarkjs via circomkit).
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { H, buildTree } from "../test/helpers.js";
import { randomFieldSalt } from "../../packages/prover/src/salt.js";
import { encodeProofHex, encodePublicHex } from "../../packages/prover/src/encode.js";

const N = 8;
const LEVELS = 8;

export interface CompliancePayment {
  amount: bigint;
  payee: bigint; // payee field element (whitelist member)
}

export interface ComplianceBatch {
  payments: CompliancePayment[]; // 1..8 real payments; padded to 8
  whitelist: bigint[]; // payee fields allowed (Merkle members)
  dailyLimit: bigint;
  perTaskLimit: bigint;
  periodId: bigint;
}

/** Build the circuit input for a batch (CSPRNG salts), matching the circuit layout. */
export async function buildInput(batch: ComplianceBatch) {
  const tree = await buildTree(batch.whitelist, LEVELS);
  const pad = batch.whitelist[0]; // pad slots reuse a real whitelisted payee, amount 0

  const amount: bigint[] = [];
  const payee: bigint[] = [];
  for (let i = 0; i < N; i++) {
    const p = batch.payments[i];
    amount.push(p ? p.amount : 0n);
    payee.push(p ? p.payee : pad);
  }
  const salt = Array.from({ length: N }, () => randomFieldSalt());

  const commitments: string[] = [];
  const pathElements: string[][] = [];
  const pathIndices: number[][] = [];
  for (let i = 0; i < N; i++) {
    commitments.push((await H([amount[i], payee[i], salt[i]])).toString());
    const idx = batch.whitelist.findIndex((m) => m === payee[i]);
    const path = tree.pathFor(idx >= 0 ? idx : 0);
    pathElements.push(path.pathElements.map(String));
    pathIndices.push(path.pathIndices);
  }

  return {
    dailyLimit: batch.dailyLimit.toString(),
    perTaskLimit: batch.perTaskLimit.toString(),
    whitelistRoot: tree.root.toString(),
    periodId: batch.periodId.toString(),
    commitments,
    amount: amount.map(String),
    payee: payee.map(String),
    salt: salt.map(String),
    pathElements,
    pathIndices,
  };
}

const CIRCUITS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface ProveResult {
  proof: Buffer; // 256 bytes (a||b||c)
  publicSignals: Buffer; // 384 bytes (12 field elements)
  whitelistRoot: string;
  periodId: string;
}

/** Full pipeline: batch -> input -> circomkit prove + off-chain verify -> Soroban bytes. */
export async function proveCompliance(batch: ComplianceBatch, name = "live"): Promise<ProveResult> {
  const input = await buildInput(batch);
  mkdirSync(`${CIRCUITS}/inputs/compliance`, { recursive: true });
  writeFileSync(`${CIRCUITS}/inputs/compliance/${name}.json`, JSON.stringify(input, null, 2));

  const run = (...args: string[]) =>
    execFileSync("npx", ["circomkit", ...args], { cwd: CIRCUITS, stdio: "pipe" });
  run("prove", "compliance", name);
  run("verify", "compliance", name); // off-chain sanity before paying for an on-chain tx

  const dir = `${CIRCUITS}/build/compliance/${name}`;
  const proofJson = JSON.parse(readFileSync(`${dir}/groth16_proof.json`, "utf8"));
  const pubJson = JSON.parse(readFileSync(`${dir}/public.json`, "utf8"));
  return {
    proof: Buffer.from(encodeProofHex(proofJson), "hex"),
    publicSignals: Buffer.from(encodePublicHex(pubJson), "hex"),
    whitelistRoot: input.whitelistRoot,
    periodId: input.periodId,
  };
}
