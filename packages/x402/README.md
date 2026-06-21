# prism-x402 — bounded x402 buyer

The safe wallet behind an agent's [x402](https://developers.stellar.org/docs/build/agentic-payments/x402) payments on Stellar.

When a service replies `402 Payment Required`, an agent normally signs a payment for
whatever the server asks. **prism-x402 gates that payment against the treasury policy
first** — per-task limit, daily limit, and the payee whitelist OR reputation gate — and
only settles through the bounded treasury if it passes. An over-limit or wrong-payee
x402 request never reaches settlement.

```ts
import { boundedPay, makeTreasurySettle } from "prism-x402";

const settle = makeTreasurySettle({ treasuryId, taskId });
const result = await boundedPay(requirements, policy, settle);
//  requirements: parsed from the server's 402 response
//  policy:       a snapshot of the treasury's limits + payee gate
//  settle:       pays through the v2 treasury's pay() (the on-chain enforcement)
if (!result.gate.allowed) console.log("refused:", result.gate.reason);
else console.log("paid, tx:", result.txHash);
```

`gateX402` mirrors the on-chain gate so the agent never attempts a payment the contract
would reject; `treasury.pay` is the final, on-chain word.

## Live settlement (`npm run e2e`)

`makeTreasurySettle` is the production `settle`: it invokes the v2 treasury's
`pay(task_id, to, amount)` through the stellar CLI, so the bounded contract enforces
policy at settlement time and the agent key stays in the OS keychain (never in code).

The E2E runs against the **live testnet treasury** and proves both halves:

- **In-policy** → gated, then settled on-chain. e.g. tx [`8a1a887a…`](https://stellar.expert/explorer/testnet/tx/8a1a887ac32b700d7e2ad2d28d64760003529c8d804be600891b162eba8ada1a) (treasury `transfer` + `paid` events).
- **Over-limit** → gated **off-chain**, never reaches `pay()`.

- **Asset:** native XLM via its SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` — the v2 treasury's token.
- **Treasury (v2, testnet):** `CDKQGDPLRX6DOCQTI5KVMZNGMPKMSRNGJRVCQ7LAAQGB2S5JKDCHXT5H`.

## Remaining production seam

This package ships the Prism-specific value — the **bounded gate** + treasury-routed
settlement, **live on testnet**. The remaining seam is the HTTP `402` handshake itself
plus third-party-agent **auth-entry signing** (for an agent that isn't the treasury's
own key), via the [`@x402/stellar`](https://www.npmjs.com/package/@x402/stellar) client
and the OpenZeppelin Relayer facilitator (`https://channels.openzeppelin.com/x402/testnet`).
