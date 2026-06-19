// Emits binary proof/public fixtures consumed by the contract's cargo test
// (include_bytes!) and by the live testnet submit. One encoder, one source of truth.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { encodeProofHex, encodePublicHex } from "./encode.js";

const PROOF_DIR = "../../circuits/build/compliance/default";
const OUT_DIR = "../../contracts/compliance_verifier/fixtures";

const proof = JSON.parse(readFileSync(`${PROOF_DIR}/groth16_proof.json`, "utf8"));
const pub = JSON.parse(readFileSync(`${PROOF_DIR}/public.json`, "utf8"));

const proofHex = encodeProofHex(proof);
const publicHex = encodePublicHex(pub);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(`${OUT_DIR}/proof.bin`, Buffer.from(proofHex, "hex"));
writeFileSync(`${OUT_DIR}/public.bin`, Buffer.from(publicHex, "hex"));

console.log(
  `fixtures: proof ${proofHex.length / 2} bytes (want 256), public ${
    publicHex.length / 2
  } bytes (want ${pub.length * 32})`,
);
