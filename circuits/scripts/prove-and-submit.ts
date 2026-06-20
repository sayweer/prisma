// End-to-end live demo of the programmatic pipeline: a NEW compliant batch (different
// amounts + a fresh periodId than the test fixture) is proved, off-chain verified, and
// submitted to the hardened verifier on testnet — proving the prover is parametric, not
// a hardcoded sample. Run in WSL (needs circom/snarkjs + stellar CLI keychain).
import { proveCompliance } from "./prove.js";
import { submitProof } from "../../packages/prover/src/submit.js";

const VERIFIER = "CCOLX7NEBDJRRVTPFVSK3UJLHMG3HO4UVYJW3NFBOTUG7Q7GOP63DBRH";

async function main() {
  const res = await proveCompliance(
    {
      payments: [
        { amount: 50n, payee: 11n },
        { amount: 75n, payee: 22n },
        { amount: 25n, payee: 33n },
      ], // sum 150 <= 1000, each <= 300 — same policy + whitelist the verifier is anchored to
      whitelist: [11n, 22n, 33n],
      dailyLimit: 1000n,
      perTaskLimit: 300n,
      periodId: 2n, // a fresh period (the fixture used 1) — not a replay
    },
    "live",
  );
  console.log(`proved: proof ${res.proof.length}B, public ${res.publicSignals.length}B, period ${res.periodId}`);

  const out = submitProof({ verifierId: VERIFIER, proof: res.proof, publicSignals: res.publicSignals });
  console.log(out.ok ? "SUBMITTED ✅\n" + out.output : "REJECTED ❌\n" + out.output);
  if (!out.ok) process.exit(1);
}

main();
