import { test } from "node:test";
import assert from "node:assert/strict";
import { randomFieldSalt, BN254_FIELD } from "./salt.js";

test("randomFieldSalt stays inside the BN254 scalar field", () => {
  for (let i = 0; i < 1000; i++) {
    const s = randomFieldSalt();
    assert.ok(s > 0n, "salt must be positive");
    assert.ok(s < BN254_FIELD, "salt must be < field prime");
  }
});

test("randomFieldSalt is unpredictable: no collisions over many draws", () => {
  const seen = new Set<bigint>();
  for (let i = 0; i < 1000; i++) seen.add(randomFieldSalt());
  assert.equal(seen.size, 1000, "all salts must be distinct");
});

test("randomFieldSalt is high-entropy: never a small brute-forceable value", () => {
  // The old generator used salt = 1,2,3,... which is trivially brute-forceable.
  // A real CSPRNG draw carries >=128 bits; reject anything that small.
  const MIN = 1n << 128n;
  for (let i = 0; i < 1000; i++) {
    assert.ok(randomFieldSalt() >= MIN, "salt must carry >=128 bits of entropy");
  }
});
