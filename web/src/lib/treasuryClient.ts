import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCTMOZ5NTQEQ5DDVRANOPEVMT3FDVZE25LPV2S4QQIDPZFWV6OXSH3IW",
  }
} as const

export const Errors = {
  1: {message:"InvalidAmount"},
  2: {message:"PayeeNotWhitelisted"},
  3: {message:"ExceedsTaskLimit"},
  4: {message:"ExceedsDailyLimit"}
}


export interface Config {
  /**
 * Owner of the funds; the only one who can change the policy.
 */
admin: string;
  /**
 * The agent allowed to trigger payments (must sign each `pay`).
 */
agent: string;
  /**
 * Max total spend allowed per rolling UTC day.
 */
daily_limit: i128;
  /**
 * Max spend allowed in a single payment.
 */
per_task_limit: i128;
  /**
 * SEP-41 / SAC token the treasury holds and spends (e.g. USDC).
 */
token: string;
}

export type DataKey = {tag: "Config", values: void} | {tag: "Payee", values: readonly [string]} | {tag: "DaySpent", values: readonly [u64]} | {tag: "TaskSpent", values: readonly [u64]};

export interface Client {
  /**
   * Construct and simulate a pay transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The agent asks the treasury to pay `amount` to `to` for `task_id`.
   * The contract enforces the policy and rejects any violation on-chain.
   */
  pay: ({task_id, to, amount}: {task_id: u64, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a is_payee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_payee: ({payee}: {payee: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a add_payee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Whitelist a payee. Admin-only.
   */
  add_payee: ({payee}: {payee: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a day_spent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  day_spent: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a task_spent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  task_spent: ({task_id}: {task_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a remove_payee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove a payee from the whitelist. Admin-only.
   */
  remove_payee: ({payee}: {payee: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, agent, token, daily_limit, per_task_limit}: {admin: string, agent: string, token: string, daily_limit: i128, per_task_limit: i128},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, agent, token, daily_limit, per_task_limit}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAEAAAAAAAAAE1BheWVlTm90V2hpdGVsaXN0ZWQAAAAAAgAAAAAAAAAQRXhjZWVkc1Rhc2tMaW1pdAAAAAMAAAAAAAAAEUV4Y2VlZHNEYWlseUxpbWl0AAAAAAAABA==",
        "AAAAAAAAAIdUaGUgYWdlbnQgYXNrcyB0aGUgdHJlYXN1cnkgdG8gcGF5IGBhbW91bnRgIHRvIGB0b2AgZm9yIGB0YXNrX2lkYC4KVGhlIGNvbnRyYWN0IGVuZm9yY2VzIHRoZSBwb2xpY3kgYW5kIHJlamVjdHMgYW55IHZpb2xhdGlvbiBvbi1jaGFpbi4AAAAAA3BheQAAAAADAAAAAAAAAAd0YXNrX2lkAAAAAAYAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABQAAADtPd25lciBvZiB0aGUgZnVuZHM7IHRoZSBvbmx5IG9uZSB3aG8gY2FuIGNoYW5nZSB0aGUgcG9saWN5LgAAAAAFYWRtaW4AAAAAAAATAAAAPVRoZSBhZ2VudCBhbGxvd2VkIHRvIHRyaWdnZXIgcGF5bWVudHMgKG11c3Qgc2lnbiBlYWNoIGBwYXlgKS4AAAAAAAAFYWdlbnQAAAAAAAATAAAALE1heCB0b3RhbCBzcGVuZCBhbGxvd2VkIHBlciByb2xsaW5nIFVUQyBkYXkuAAAAC2RhaWx5X2xpbWl0AAAAAAsAAAAmTWF4IHNwZW5kIGFsbG93ZWQgaW4gYSBzaW5nbGUgcGF5bWVudC4AAAAAAA5wZXJfdGFza19saW1pdAAAAAAACwAAAD1TRVAtNDEgLyBTQUMgdG9rZW4gdGhlIHRyZWFzdXJ5IGhvbGRzIGFuZCBzcGVuZHMgKGUuZy4gVVNEQykuAAAAAAAABXRva2VuAAAAAAAAEw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAQAAAAAAAAAFUGF5ZWUAAAAAAAABAAAAEwAAAAEAAAAAAAAACERheVNwZW50AAAAAQAAAAYAAAABAAAAAAAAAAlUYXNrU3BlbnQAAAAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIaXNfcGF5ZWUAAAABAAAAAAAAAAVwYXllZQAAAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAB5XaGl0ZWxpc3QgYSBwYXllZS4gQWRtaW4tb25seS4AAAAAAAlhZGRfcGF5ZWUAAAAAAAABAAAAAAAAAAVwYXllZQAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAJZGF5X3NwZW50AAAAAAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAfQAAAABkNvbmZpZwAA",
        "AAAAAAAAAAAAAAAKdGFza19zcGVudAAAAAAAAQAAAAAAAAAHdGFza19pZAAAAAAGAAAAAQAAAAs=",
        "AAAAAAAAAC5SZW1vdmUgYSBwYXllZSBmcm9tIHRoZSB3aGl0ZWxpc3QuIEFkbWluLW9ubHkuAAAAAAAMcmVtb3ZlX3BheWVlAAAAAQAAAAAAAAAFcGF5ZWUAAAAAAAATAAAAAA==",
        "AAAAAAAAADxBdG9taWMgaW5pdCBhdCBkZXBsb3kgdGltZSAobm8gZnJvbnQtcnVubmFibGUgYGluaXRpYWxpemVgKS4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAUAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFYWdlbnQAAAAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAAC2RhaWx5X2xpbWl0AAAAAAsAAAAAAAAADnBlcl90YXNrX2xpbWl0AAAAAAALAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    pay: this.txFromJSON<Result<void>>,
        balance: this.txFromJSON<i128>,
        is_payee: this.txFromJSON<boolean>,
        add_payee: this.txFromJSON<null>,
        day_spent: this.txFromJSON<i128>,
        get_config: this.txFromJSON<Config>,
        task_spent: this.txFromJSON<i128>,
        remove_payee: this.txFromJSON<null>
  }
}
