// Funding rail — Seyit's angle. One classic pool account, infinite zero-cost
// muxed sub-addresses. A client funds a specific agent budget by paying its
// M-address; the deposit lands in the pool and is attributed by `to_muxed_id`
// on-chain — no memos, no new accounts. This is the Stellar-unique primitive.

import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  MuxedAccount,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { AGENT_SECRET, HORIZON_URL, NETWORK_PASSPHRASE, POOL_PK } from "../config";

const server = new Horizon.Server(HORIZON_URL);
const funder = Keypair.fromSecret(AGENT_SECRET); // a "client" wallet, for the demo

/** The zero-cost muxed (M...) sub-address that earmarks a deposit for a budget. */
export function muxedFor(id: bigint): string {
  return new MuxedAccount(new Account(POOL_PK, "0"), id.toString()).accountId();
}

/** A client deposits XLM to a budget's muxed address (a real classic payment). */
export async function sendDeposit(id: bigint, amount = "5"): Promise<string> {
  const src = await server.loadAccount(funder.publicKey());
  const tx = new TransactionBuilder(src, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: muxedFor(id),
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(60)
    .build();
  tx.sign(funder);
  const res = await server.submitTransaction(tx);
  return res.hash;
}

export interface Deposit {
  budgetId: string;
  amount: string;
  from: string;
  hash: string;
}

/** Read deposits attributed per budget straight from Horizon's `to_muxed_id`. */
export async function readDeposits(): Promise<Deposit[]> {
  const page = await server.payments().forAccount(POOL_PK).order("desc").limit(30).call();
  return (page.records as unknown as Array<Record<string, unknown>>)
    .filter((r) => r.type === "payment" && r.asset_type === "native" && r.to_muxed_id != null)
    .map((r) => ({
      budgetId: String(r.to_muxed_id),
      amount: String(r.amount),
      from: String(r.from),
      hash: String(r.transaction_hash),
    }));
}
