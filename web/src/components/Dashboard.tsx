/*  DASHBOARD — live treasury + autonomous agent console
    Reads real testnet state. The agent signs its own payments; the contract is the
    only gate. The rogue button proves a prompt-injected payment is rejected on-chain.

    entrance: stats stagger (120/200/280) → console (380) → ledger (480) → attrib (560)
*/
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrismMark from "./PrismMark";
import FundingRail from "./FundingRail";
import {
  readState, readTaskSpent, agentPay, type PrismState, type PayResult,
} from "../lib/prism";
import {
  TASKS, ROGUE, fmtUSDC, shortAddr, txUrl, contractUrl,
  TREASURY_ID, USDC_SAC, AGENT_PK, REG_IDENTITY, AGENT_8004_ID, type AgentTask,
} from "../config";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const up = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay },
});

type Stat = "idle" | "running" | "ok" | "rej";
interface LedgerRow { key: string; name: string; payee: string; amount: bigint; ok: boolean; hash?: string; error?: string; }

function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const usd = (stroops: bigint) => Number(stroops) / 1e7;

export default function Dashboard({ onHome }: { onHome: () => void }) {
  const [state, setState] = useState<PrismState | null>(null);
  const [spent, setSpent] = useState<Record<string, bigint>>({});
  const [status, setStatus] = useState<Record<string, Stat>>({});
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [reject, setReject] = useState<{ name: string; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    try {
      const s = await readState();
      setState(s);
      const entries = await Promise.all(
        TASKS.map(async (t) => [t.taskId.toString(), await readTaskSpent(t.taskId)] as const),
      );
      setSpent(Object.fromEntries(entries));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "RPC error");
    }
  }
  useEffect(() => { refresh(); }, []);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function pay(task: AgentTask, rogue = false): Promise<PayResult> {
    setStatus((s) => ({ ...s, [task.taskId.toString()]: "running" }));
    const res = await agentPay(task.taskId, task.payee, task.amount);
    setStatus((s) => ({ ...s, [task.taskId.toString()]: res.ok ? "ok" : "rej" }));
    setLedger((l) => [
      { key: `${task.taskId}-${l.length}`, name: task.name, payee: task.payee, amount: task.amount, ok: res.ok, hash: res.hash, error: res.errorMessage },
      ...l,
    ]);
    if (!res.ok && rogue) setReject({ name: task.name, error: res.errorMessage ?? "rejected" });
    return res;
  }

  async function runAgent() {
    setBusy(true); setReject(null);
    for (const t of TASKS) {
      setStatus((s) => ({ ...s, [t.taskId.toString()]: "idle" }));
    }
    for (const t of TASKS) { await pay(t); await wait(450); }
    await refresh();
    setBusy(false);
  }

  async function runRogue() {
    setBusy(true);
    await pay(ROGUE, true);
    setBusy(false);
  }

  const balance = useCountUp(state ? usd(state.balance) : 0);
  const dailyPct = state ? Math.min(100, (Number(state.daySpent) / Number(state.dailyLimit)) * 100) : 0;

  return (
    <div className="wrap dash">
      {/* topbar */}
      <div className="topbar">
        <div className="brand" style={{ cursor: "pointer" }} onClick={onHome}>
          <PrismMark variant="mark" size={32} />
          <span className="brand__name">Prism</span>
          <span className="dim mono" style={{ fontSize: 12, marginLeft: 4 }}>/ agent treasury</span>
        </div>
        <div className="topbar__r">
          <span className="pill"><span className="dot dot--live" /> Testnet · live</span>
          <a className="pill mono" href={contractUrl(TREASURY_ID)} target="_blank" rel="noreferrer">{shortAddr(TREASURY_ID)} ↗</a>
          <button className="btn" style={{ padding: "9px 16px" }} onClick={onHome}>↩ Home</button>
        </div>
      </div>

      {err && <div className="rejbar" style={{ borderColor: "var(--line-2)" }}><span className="muted">Couldn’t reach testnet RPC: {err}. Retrying state on next action.</span></div>}

      <AnimatePresence>
        {reject && (
          <motion.div
            className="rejbar"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <div className="x">✕</div>
            <div>
              <div><b>Blocked on-chain</b> — the agent tried “{reject.name}”.</div>
              <div className="mono dim" style={{ fontSize: 12.5, marginTop: 2 }}>
                Contract rejected: {reject.error}. Funds never moved.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* stats */}
      <div className="stat-grid">
        <motion.div className="panel stat" {...up(0.12)}>
          <div className="stat__label">TREASURY BALANCE · non-custodial</div>
          <div className="stat__value">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}<span className="stat__u">USDC</span></div>
          <div className="stat__sub mono">{shortAddr(USDC_SAC)} · funds stay in the owner’s contract</div>
        </motion.div>

        <motion.div className="panel stat" {...up(0.2)}>
          <div className="stat__label">SPENT TODAY</div>
          <div className="stat__value">{state ? fmtUSDC(state.daySpent) : "—"}<span className="stat__u">/ {state ? fmtUSDC(state.dailyLimit) : "—"}</span></div>
          <div className="bar"><div className="bar__fill" style={{ width: `${dailyPct}%` }} /></div>
          <div className="stat__sub">daily limit enforced by the contract</div>
        </motion.div>

        <motion.div className="panel stat" {...up(0.28)}>
          <div className="stat__label">PER-TASK LIMIT</div>
          <div className="stat__value">{state ? fmtUSDC(state.perTaskLimit) : "—"}<span className="stat__u">USDC</span></div>
          <div className="stat__sub">hard cap on any single payment</div>
        </motion.div>
      </div>

      <div className="grid-2">
        {/* agent console */}
        <motion.div className="panel console" {...up(0.38)}>
          <div className="sec-h"><h2>Agent console</h2><span className="hint">autonomous · signs its own payments</span></div>

          <div className="agentcard">
            <PrismMark variant="mark" size={30} />
            <div>
              <div className="id">{shortAddr(AGENT_PK)}</div>
              <div className="dim" style={{ fontSize: 12 }}>procurement agent</div>
            </div>
            <a className="badge8004" href={contractUrl(REG_IDENTITY)} target="_blank" rel="noreferrer">
              ERC-8004 · agent #{AGENT_8004_ID} verified
            </a>
          </div>

          <div>
            {TASKS.map((t) => {
              const st = status[t.taskId.toString()] ?? "idle";
              return (
                <div className="task" key={t.taskId.toString()}>
                  <div className="task__ico"><Glyph /></div>
                  <div className="task__main">
                    <div className="task__name">{t.name}</div>
                    <div className="task__meta">{t.vendor} · {shortAddr(t.payee)}</div>
                  </div>
                  <div className="task__amt">{fmtUSDC(t.amount)}</div>
                  <StatusPill st={st} />
                </div>
              );
            })}
          </div>

          <div className="actions">
            <button className="btn btn--primary" onClick={runAgent} disabled={busy}>
              {busy ? "Agent working…" : "▶ Run agent tasks"}
            </button>
            <button className="btn btn--danger" onClick={runRogue} disabled={busy}>
              ⚠ Simulate prompt-injection
            </button>
          </div>
        </motion.div>

        {/* ledger */}
        <motion.div className="panel ledger" {...up(0.48)}>
          <div className="sec-h"><h2>On-chain activity</h2><span className="hint">{ledger.length} events</span></div>
          {ledger.length === 0 && <div className="empty">No payments yet. Run the agent to watch it settle in real time.</div>}
          {ledger.map((r) => (
            <div className="lrow" key={r.key}>
              <div className={`lrow__bar ${r.ok ? "lrow__bar--ok" : "lrow__bar--rej"}`} />
              <div className="lrow__main">
                <div className="lrow__t">{r.name}</div>
                <div className="lrow__m">
                  {r.ok
                    ? <>settled → {shortAddr(r.payee)}{r.hash && <> · <a href={txUrl(r.hash)} target="_blank" rel="noreferrer">tx ↗</a></>}</>
                    : <span style={{ color: "var(--danger)" }}>rejected · {r.error}</span>}
                </div>
              </div>
              <div className="lrow__r" style={{ color: r.ok ? "var(--ok)" : "var(--danger)" }}>
                {r.ok ? "−" : "✕"}{fmtUSDC(r.amount)}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* attribution */}
      <motion.div className="panel console" style={{ marginTop: 16 }} {...up(0.58)}>
        <div className="sec-h"><h2>Auto-reconciled spend</h2><span className="hint">per-task accounting, read straight from the contract</span></div>
        {TASKS.map((t) => (
          <div className="payee-row" key={t.taskId.toString()}>
            <span className="mono dim">task #{t.taskId.toString()}</span>
            <span>{t.name}</span>
            <span className="muxed">{spent[t.taskId.toString()] !== undefined ? `${fmtUSDC(spent[t.taskId.toString()]!)} USDC` : "—"}</span>
          </div>
        ))}
      </motion.div>

      <FundingRail />
    </div>
  );
}

function StatusPill({ st }: { st: Stat }) {
  const map: Record<Stat, { cls: string; label: string }> = {
    idle: { cls: "st--idle", label: "queued" },
    running: { cls: "st--run", label: "signing…" },
    ok: { cls: "st--ok", label: "settled" },
    rej: { cls: "st--rej", label: "rejected" },
  };
  const m = map[st];
  return <span className={`task__st ${m.cls}`}>{m.label}</span>;
}

function Glyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="11" height="11" rx="3" stroke="var(--accent)" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" fill="var(--accent)" />
    </svg>
  );
}
