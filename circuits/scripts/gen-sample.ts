// Emits a valid, compliant sample input for the compliance circuit.
// Used by `circomkit prove` and to mint the contract test fixture (Task 6/7).
import { writeFileSync, mkdirSync } from "node:fs";
import { H, buildTree } from "../test/helpers.js";

const N = 8;
const LEVELS = 8;
const MEMBERS = [11n, 22n, 33n];

async function main() {
  const tree = await buildTree(MEMBERS, LEVELS);

  const amount = [100, 200, 50, 0, 0, 0, 0, 0]; // sum 350 <= 1000, each <= 300
  const payee = [11n, 22n, 33n, 11n, 11n, 11n, 11n, 11n]; // all whitelisted; pads reuse 11n
  const salt = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];

  const commitments: string[] = [];
  const pathElements: string[][] = [];
  const pathIndices: number[][] = [];
  for (let i = 0; i < N; i++) {
    commitments.push((await H([amount[i], payee[i], salt[i]])).toString());
    const idx = MEMBERS.findIndex((m) => m === payee[i]);
    const p = tree.pathFor(idx >= 0 ? idx : 0);
    pathElements.push(p.pathElements.map((x) => x.toString()));
    pathIndices.push(p.pathIndices);
  }

  const input = {
    dailyLimit: "1000",
    perTaskLimit: "300",
    whitelistRoot: tree.root.toString(),
    periodId: "1",
    commitments,
    amount: amount.map(String),
    payee: payee.map(String),
    salt: salt.map(String),
    pathElements,
    pathIndices,
  };

  mkdirSync("inputs/compliance", { recursive: true });
  writeFileSync("inputs/compliance/default.json", JSON.stringify(input, null, 2));
  console.log("wrote inputs/compliance/default.json  (root=" + tree.root.toString() + ")");
}

main();
