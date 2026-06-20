// x402 "exact" scheme payment requirements (the JSON a server returns with HTTP 402),
// trimmed to the fields the bounded gate needs. See @x402/stellar / coinbase/x402.
export interface PaymentRequirements {
  /** protocol version; carried at the envelope level in the full 402 body, flattened here */
  x402Version: number; // currently 1
  scheme: string; // "exact"
  network: string; // CAIP-2, e.g. "stellar:testnet" / "stellar:pubnet"
  /** amount in atomic units (asset's own decimals), as a decimal string */
  maxAmountRequired: string;
  asset: string; // SEP-41 contract id of the payment asset
  payTo: string; // recipient address
  resource: string; // the resource being paid for
}

/** A snapshot of the treasury's spend policy, read off-chain to pre-flight a payment
 *  before signing/submitting (the on-chain treasury is the final enforcement). */
export interface TreasuryPolicy {
  perTaskLimit: bigint;
  dailyLimit: bigint;
  daySpent: bigint;
  token: string; // SEP-41 id of the asset the treasury spends
  /** whitelist OR reputation-gate result for a payee (mirrors the on-chain gate) */
  isAllowedPayee: (payee: string) => boolean;
}

export interface GateResult {
  allowed: boolean;
  amount: bigint;
  reason?: string;
}
