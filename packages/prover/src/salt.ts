// Cryptographically-random commitment salt over the BN254 scalar field.
//
// The commitment C = Poseidon(amount, payee, salt) only *hides* amount/payee if
// salt is unpredictable. A small/sequential salt (e.g. 1,2,3,...) lets an observer
// brute-force the preimage of every public commitment from a small known set of
// amounts/payees, fully de-anonymising the "confidential" batch. Production must
// draw salt from a CSPRNG with >=128 bits of entropy.
import { randomBytes } from "node:crypto";

/** BN254 (alt_bn128) scalar field prime — the field circomlib Poseidon operates over. */
export const BN254_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** A CSPRNG salt uniformly in [1, BN254_FIELD) with ~254 bits of entropy. */
export function randomFieldSalt(): bigint {
  // 32 random bytes (256 bits) reduced into the field. The reduction bias is
  // < 2^-250 (negligible), and the draw keeps >=128 bits with overwhelming prob.
  let n = 0n;
  for (const b of randomBytes(32)) n = (n << 8n) | BigInt(b);
  const s = n % BN254_FIELD;
  return s === 0n ? 1n : s; // 0 is a degenerate salt; vanishingly unlikely
}
