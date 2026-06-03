// Thin app-facing layer over the generated treasury client.
// Reads state via simulation and lets the autonomous agent sign + send payments.

import { Keypair } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client, Errors } from "./treasuryClient";
import {
  AGENT_PK,
  AGENT_SECRET,
  NETWORK_PASSPHRASE,
  RPC_URL,
  TREASURY_ID,
} from "../config";

const agentKp = Keypair.fromSecret(AGENT_SECRET);
const signer = basicNodeSigner(agentKp, NETWORK_PASSPHRASE);

const treasury = new Client({
  contractId: TREASURY_ID,
  networkPassphrase: NETWORK_PASSPHRASE,
  rpcUrl: RPC_URL,
  publicKey: AGENT_PK,
  signTransaction: signer.signTransaction,
});

export interface PrismState {
  balance: bigint;
  daySpent: bigint;
  dailyLimit: bigint;
  perTaskLimit: bigint;
  admin: string;
  agent: string;
  token: string;
}

export async function readState(): Promise<PrismState> {
  const [bal, cfg, day] = await Promise.all([
    treasury.balance(),
    treasury.get_config(),
    treasury.day_spent(),
  ]);
  const c = cfg.result;
  return {
    balance: bal.result,
    daySpent: day.result,
    dailyLimit: c.daily_limit,
    perTaskLimit: c.per_task_limit,
    admin: c.admin,
    agent: c.agent,
    token: c.token,
  };
}

export async function readTaskSpent(taskId: bigint): Promise<bigint> {
  return (await treasury.task_spent({ task_id: taskId })).result;
}

export interface PayResult {
  ok: boolean;
  hash?: string;
  errorCode?: number;
  errorMessage?: string;
}

export async function agentPay(
  taskId: bigint,
  to: string,
  amount: bigint,
): Promise<PayResult> {
  try {
    const tx = await treasury.pay({ task_id: taskId, to, amount });
    const sent = await tx.signAndSend();
    const hash =
      (sent as { sendTransactionResponse?: { hash?: string } })
        .sendTransactionResponse?.hash;
    return { ok: true, hash };
  } catch (e) {
    return { ok: false, ...parseContractError(e) };
  }
}

function parseContractError(e: unknown): {
  errorCode?: number;
  errorMessage: string;
} {
  const msg =
    e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
  const m = msg.match(/Error\(Contract,\s*#?(\d+)\)/) || msg.match(/#(\d+)/);
  if (m) {
    const code = Number(m[1]);
    const known = (Errors as Record<number, { message: string }>)[code];
    return { errorCode: code, errorMessage: known?.message ?? `Contract error #${code}` };
  }
  return { errorMessage: msg.slice(0, 160) };
}
