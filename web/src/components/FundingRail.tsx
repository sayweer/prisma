import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { muxedFor, sendDeposit, readDeposits, type Deposit } from "../lib/muxed";
import { BUDGETS, POOL_PK, shortAddr, txUrl, contractUrl } from "../config";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const codeStyle = {
  fontFamily: "var(--mono)", fontSize: 12,
  background: "oklch(100% 0 0 / 0.06)", padding: "1px 5px", borderRadius: 5,
} as const;

export default function FundingRail() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function refresh() {
    try { setDeposits(await readDeposits()); } catch { /* offline — ignore */ }
  }
  useEffect(() => { refresh(); }, []);

  async function fund(id: bigint) {
    setBusy(id.toString());
    try { await sendDeposit(id); await refresh(); } catch (e) { console.error(e); }
    setBusy(null);
  }

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
  }

  const nameFor = (id: string) => BUDGETS.find((b) => b.id.toString() === id)?.name ?? `Budget #${id}`;

  return (
    <motion.div
      className="panel console" style={{ marginTop: 16 }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="sec-h">
        <h2>Funding rail</h2>
        <span className="hint">one account · ∞ muxed sub-addresses · no memos</span>
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16, maxWidth: "64ch" }}>
        A client funds a specific agent budget by paying its zero-cost{" "}
        <a href={contractUrl(POOL_PK)} target="_blank" rel="noreferrer">muxed sub-address</a>.
        Deposits land in one pool account, attributed on-chain by{" "}
        <code style={codeStyle}>to_muxed_id</code> — no memos, no new accounts. Unique to Stellar.
      </p>

      <div className="grid-2" style={{ gap: 18 }}>
        <div>
          {BUDGETS.map((b) => {
            const m = muxedFor(b.id);
            const k = b.id.toString();
            return (
              <div className="payee-row" key={k} style={{ alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 500 }}>{b.name}</span>
                <button
                  className="muxed"
                  style={{ background: "none", border: 0, cursor: "pointer", color: "var(--dim)", fontFamily: "var(--mono)" }}
                  onClick={() => copy(m, k)}
                  title="copy full muxed address"
                >
                  {copied === k ? "copied ✓" : `${m.slice(0, 6)}…${m.slice(-6)} ⧉`}
                </button>
                <button
                  className="btn" style={{ padding: "7px 13px", fontSize: 13 }}
                  disabled={busy === k} onClick={() => fund(b.id)}
                >
                  {busy === k ? "funding…" : "Fund 5 XLM"}
                </button>
              </div>
            );
          })}
        </div>

        <div>
          <div className="dim mono" style={{ fontSize: 12, marginBottom: 10, letterSpacing: "0.08em" }}>ATTRIBUTED DEPOSITS</div>
          {deposits.length === 0 && (
            <div className="empty" style={{ padding: "22px 0" }}>No deposits yet. Fund a budget to see it attributed on-chain.</div>
          )}
          {deposits.map((d, i) => (
            <div className="lrow" key={d.hash + i}>
              <div className="lrow__bar lrow__bar--ok" />
              <div className="lrow__main">
                <div className="lrow__t">{nameFor(d.budgetId)} <span className="dim mono" style={{ fontSize: 11 }}>· budget #{d.budgetId}</span></div>
                <div className="lrow__m">from {shortAddr(d.from)} · <a href={txUrl(d.hash)} target="_blank" rel="noreferrer">tx ↗</a></div>
              </div>
              <div className="lrow__r" style={{ color: "var(--ok)" }}>+{Number(d.amount).toFixed(0)} XLM</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
