// snarkjs Groth16 (BN254) -> soroban-sdk byte layout.
//
// Source-verified against mysteryon88/soroban-verifier-gen test.rs and
// stellar/rs-soroban-sdk v26 crypto::bn254:
//   - every field element is 32-byte BIG-ENDIAN
//   - G1 (64B):  x || y
//   - G2 (128B): X.c1 || X.c0 || Y.c1 || Y.c0   (EIP-197 swap vs snarkjs [c0,c1])
//   - A is NOT negated here; the contract negates internally.

/** decimal string -> 32-byte big-endian hex (no 0x). */
export function hex32(dec: string): string {
  return BigInt(dec).toString(16).padStart(64, "0");
}

/** proof.json -> 256-byte hex: a(64) || b(128) || c(64). */
export function encodeProofHex(proof: any): string {
  const a = hex32(proof.pi_a[0]) + hex32(proof.pi_a[1]);
  const b =
    hex32(proof.pi_b[0][1]) + hex32(proof.pi_b[0][0]) + // X: c1 then c0
    hex32(proof.pi_b[1][1]) + hex32(proof.pi_b[1][0]);  // Y: c1 then c0
  const c = hex32(proof.pi_c[0]) + hex32(proof.pi_c[1]);
  return a + b + c;
}

/** public.json (array of decimals) -> (n*32)-byte hex, each big-endian. */
export function encodePublicHex(pub: string[]): string {
  return pub.map(hex32).join("");
}
