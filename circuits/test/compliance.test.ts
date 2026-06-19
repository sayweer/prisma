import { Circomkit } from "circomkit";
import { H, buildTree, type Tree } from "./helpers.js";

const circomkit = new Circomkit();
const N = 8;
const LEVELS = 8;
const NBITS = 64;

// whitelist members (field-encoded payees)
const MEMBERS = [11n, 22n, 33n];

describe("Compliance — full predicate (range, sum, commitment, whitelist)", function () {
  this.timeout(180000);
  let T: any;
  let tree: Tree;

  before(async () => {
    T = await circomkit.WitnessTester("compliance", {
      file: "compliance",
      template: "Compliance",
      params: [N, LEVELS, NBITS],
      pubs: ["dailyLimit", "perTaskLimit", "whitelistRoot", "periodId", "commitments"],
    });
    tree = await buildTree(MEMBERS, LEVELS);
  });

  async function build(amount: number[], payee: bigint[], salt: bigint[]) {
    const commitments: bigint[] = [];
    const pathElements: bigint[][] = [];
    const pathIndices: number[][] = [];
    for (let i = 0; i < N; i++) {
      commitments.push(await H([amount[i], payee[i], salt[i]]));
      const idx = MEMBERS.findIndex((m) => m === payee[i]);
      const path = tree.pathFor(idx >= 0 ? idx : 0); // non-member → bogus path → membership fails
      pathElements.push(path.pathElements);
      pathIndices.push(path.pathIndices);
    }
    return {
      dailyLimit: 1000,
      perTaskLimit: 300,
      whitelistRoot: tree.root,
      periodId: 1,
      commitments,
      amount,
      payee,
      salt,
      pathElements,
      pathIndices,
    };
  }

  // padding slots reuse a whitelisted member (11n) with amount 0
  const PAYEE = [11n, 22n, 11n, 11n, 11n, 11n, 11n, 11n];
  const AMT = [100, 200, 0, 0, 0, 0, 0, 0];
  const SALT = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];

  it("passes a compliant batch", async () => {
    await T.expectPass(await build(AMT, PAYEE, SALT));
  });

  it("fails when one amount exceeds the per-task limit", async () => {
    await T.expectFail(await build([301, 0, 0, 0, 0, 0, 0, 0], PAYEE, SALT));
  });

  it("fails when the sum exceeds the daily limit", async () => {
    await T.expectFail(await build([300, 300, 300, 200, 0, 0, 0, 0], PAYEE, SALT));
  });

  it("fails when a commitment does not match its preimage", async () => {
    const b = await build(AMT, PAYEE, SALT);
    b.commitments[0] = b.commitments[0] + 1n;
    await T.expectFail(b);
  });

  it("fails when a payee is not in the whitelist", async () => {
    await T.expectFail(await build(AMT, [99n, 22n, 11n, 11n, 11n, 11n, 11n, 11n], SALT));
  });
});
