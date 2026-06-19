#![cfg(test)]
use super::*;
use soroban_sdk::{Bytes, Env};

// Binary fixtures emitted by packages/prover (one encoder, shared with the live call).
const PROOF: &[u8] = include_bytes!("../fixtures/proof.bin");
const PUBLIC: &[u8] = include_bytes!("../fixtures/public.bin");

#[test]
fn valid_proof_attests() {
    let env = Env::default();
    let id = env.register(ComplianceVerifier, ());
    let client = ComplianceVerifierClient::new(&env, &id);

    let proof = Bytes::from_slice(&env, PROOF);
    let public = Bytes::from_slice(&env, PUBLIC);

    // Must not trap: reaching the end of verify() means the proof passed the
    // on-chain pairing check and the attestation was emitted.
    client.verify(&proof, &public);
}

#[test]
#[should_panic]
fn tampered_proof_traps() {
    let env = Env::default();
    let id = env.register(ComplianceVerifier, ());
    let client = ComplianceVerifierClient::new(&env, &id);

    let mut arr = [0u8; 256];
    arr.copy_from_slice(PROOF);
    arr[63] ^= 0x01; // corrupt A.y -> off-curve / wrong point -> verification fails

    let proof = Bytes::from_slice(&env, &arr);
    let public = Bytes::from_slice(&env, PUBLIC);
    client.verify(&proof, &public); // expected to trap
}
