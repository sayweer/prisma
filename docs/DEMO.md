# Prism — demo & pitch

## One-liner

> Prism is the wallet your AI agent can't drain. A business hands an autonomous agent real
> money to spend; the **contract** enforces the limits, every payment is auto-accounted, and
> Stellar settles in sub-cents.

## 30-second pitch

AI agents can reason and act — until they need to pay. No business gives an LLM agent a
wallet, because one jailbreak drains it and hundreds of micro-payments are impossible to
reconcile. Prism fixes both: the agent's spend is **bounded by a Soroban contract** (whitelist,
per-task and daily limits, rejected on-chain), every payment is **auto-accounted per task**,
and budgets are funded through **zero-cost muxed sub-addresses** — Stellar primitives nothing
else matches. It's live on testnet, paying real USDC.

## 90-second live demo

1. **Landing → Launch live demo.** "This dashboard is reading live testnet state — 495 USDC
   sitting in the business's own non-custodial contract."
2. **▶ Run agent tasks.** "The agent pays three vendors autonomously — it signs its own
   transactions, no human, no wallet popup. Watch them settle." → 3 tx links, balance drops.
3. **⚠ Simulate prompt-injection.** "Now I jailbreak the agent: send everything to an
   attacker wallet." → 🔴 **Blocked on-chain — PayeeNotWhitelisted. Funds never moved.**
   "The model misbehaved. The contract didn't care."
4. **Auto-reconciled spend.** "Every payment is tagged to its task, read straight off-chain —
   reconcile a thousand agent payments with zero memos."
5. **Funding rail.** "Fund the Research agent's budget — one click pays its zero-cost muxed
   sub-address; the deposit is attributed on-chain with no memo. One account, infinite
   sub-budgets." → attributed deposit appears.
6. **Close:** "Bounded. Accounted. Funded. All Stellar-native. All live."

## Why Stellar (have this ready)

Sub-cent deterministic fees make agent micro-payments viable; **muxed accounts** are the
zero-cost attribution primitive for payment swarms; **`__check_auth`** makes a contract-bounded
agent first-class; native USDC + anchors reach the real world. The bounded-spend safety exists
elsewhere — the **cheap attribution + fiat-grade rail** is where Stellar wins.

## Judging map

| Criterion | Our evidence |
|---|---|
| Real-world impact | The #1 blocker to agentic commerce (safe + accountable agent spend) — SDF's own Agents hackathon names "payments" as the hard stop |
| Technical | Real Soroban contract (policy + `__check_auth` semantics, per-task accounting, events), deployed + verified on testnet; on-chain rejection demoed live |
| UX | One-click autonomous agent, visceral on-chain rejection, live reconciliation, cinematic landing |
| Ecosystem fit | Muxed accounts, SAC/USDC, path-ready, ERC-8004 (trionlabs) trust layer — composes with the ecosystem |
| Presentation | The "contract says no" moment + live tx links |

## Honest scope

- **Real (testnet):** treasury contract + policy + rejection, agent autonomous payments,
  per-task accounting, muxed funding attribution, ERC-8004 identity (agent #1).
- **Demo shortcut:** the agent key is embedded (testnet-only) so the agent signs without a
  popup — deliberate, since the contract is the safety, not a human approval. Funding-rail
  deposits use XLM for a frictionless demo (USDC in production).
- **Roadmap:** on-chain reputation gate in `pay()` (the seam is already in the contract),
  anchor cash-out, x402 vendor endpoints.

## Likely questions

- *"Isn't bounded spend already solved?"* The bound is table-stakes; our edge is **cheap
  on-chain attribution** (muxed) + the **funding rail**, which competitors don't have.
- *"Why not Base/Solana where x402 lives?"* Micro-fee + muxed attribution + fiat anchors.
  Stellar is also shipping x402; we compose with it.
- *"Custody risk?"* None — funds never leave the owner's contract. We're software, not a bank.
