import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPayArgs, makeTreasurySettle, parseTxHash } from "./settle.js";

// A real `stellar contract invoke ... -- pay` output (stdout+stderr merged): the tx
// hash lives in the "Signing transaction" line; stdout is just the void return `null`.
const PAY_OUTPUT = `ℹ️  Simulating transaction…
ℹ️  Signing transaction: 6f2786d95716471892a2145f5a1a3135339842b9329ec2b57589c5c027340678
🌎 Sending transaction…
✅ Transaction submitted successfully!
🔗 https://stellar.expert/explorer/testnet/tx/6f2786d95716471892a2145f5a1a3135339842b9329ec2b57589c5c027340678
null
`;

test("buildPayArgs targets the treasury's pay() with task_id, payee and amount", () => {
  const args = buildPayArgs({
    treasuryId: "CTREASURY",
    taskId: 7,
    payTo: "GVENDOR",
    amount: 50000000n, // 5 XLM (7 decimals)
    source: "zk-deployer",
    network: "testnet",
  });

  assert.deepEqual(args, [
    "contract", "invoke",
    "--id", "CTREASURY",
    "--source", "zk-deployer",
    "--network", "testnet",
    "--",
    "pay",
    "--task_id", "7",
    "--to", "GVENDOR",
    "--amount", "50000000",
  ]);
});

test("buildPayArgs defaults source to zk-deployer and network to testnet", () => {
  const args = buildPayArgs({ treasuryId: "CT", taskId: 1, payTo: "GP", amount: 1n });
  assert.deepEqual(args, [
    "contract", "invoke",
    "--id", "CT",
    "--source", "zk-deployer",
    "--network", "testnet",
    "--",
    "pay",
    "--task_id", "1",
    "--to", "GP",
    "--amount", "1",
  ]);
});

test("parseTxHash extracts the submitted transaction hash from the stellar CLI output", () => {
  assert.equal(
    parseTxHash(PAY_OUTPUT),
    "6f2786d95716471892a2145f5a1a3135339842b9329ec2b57589c5c027340678",
  );
});

test("parseTxHash falls back to the trimmed output when no hash is present", () => {
  assert.equal(parseTxHash("null\n"), "null");
});

test("makeTreasurySettle invokes `stellar` with the pay args and returns the tx hash", async () => {
  const calls: { file: string; args: string[] }[] = [];
  const settle = makeTreasurySettle({
    treasuryId: "CTREASURY",
    taskId: 7,
    exec: (file, args) => {
      calls.push({ file, args });
      return PAY_OUTPUT;
    },
  });

  const txHash = await settle("GVENDOR", 50000000n);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, "stellar");
  assert.deepEqual(
    calls[0].args,
    buildPayArgs({ treasuryId: "CTREASURY", taskId: 7, payTo: "GVENDOR", amount: 50000000n }),
  );
  assert.equal(txHash, "6f2786d95716471892a2145f5a1a3135339842b9329ec2b57589c5c027340678");
});
