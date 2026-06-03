import { motion } from "framer-motion";
import PrismMark from "./PrismMark";
import { TREASURY_ID, USDC_SAC, contractUrl } from "../config";

const EASE = [0.2, 0.7, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 320, damping: 26 } as const;
const T = { nav: 0.12, prism: 0.3, eyebrow: 0.36, l1: 0.44, l2: 0.54, l3: 0.64, sub: 0.8, cta: 0.92, strip: 1.04 };

const up = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay },
});
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: EASE, delay },
});

export default function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="landing">
      {/* ───────── hero ───────── */}
      <div className="wrap hero">
        <motion.nav className="nav" {...up(T.nav)}>
          <div className="brand">
            <PrismMark variant="mark" size={34} />
            <span className="brand__name">Prism</span>
          </div>
          <div className="topbar__r">
            <span className="pill"><span className="dot dot--live" /> Stellar Testnet</span>
            <a className="pill mono" href="https://github.com/Bekirerdem" target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </motion.nav>

        <div className="hero__center">
          <div>
            <motion.div className="eyebrow" {...up(T.eyebrow)}>Bounded agent payments · on Stellar</motion.div>
            <h1 className="hero__title">
              <motion.span className="hero__line" {...up(T.l1)}>The wallet your</motion.span>
              <motion.span className="hero__line" {...up(T.l2)}>AI agent</motion.span>
              <motion.span className="hero__line spectrum-text" {...up(T.l3)}>can&apos;t drain.</motion.span>
            </h1>
            <motion.p className="hero__sub" {...up(T.sub)}>
              Hand an autonomous agent real money to spend. The <b>contract</b> — not the model&apos;s
              good behaviour — enforces the limits, every payment is auto-accounted, and Stellar
              settles in sub-cents.
            </motion.p>
            <motion.div className="hero__cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: T.cta }}>
              <button className="btn btn--primary" onClick={onLaunch}>Launch live demo →</button>
              <a className="btn" href={contractUrl(TREASURY_ID)} target="_blank" rel="noreferrer">View contract on testnet</a>
            </motion.div>
            <motion.div className="stat-strip" {...up(T.strip)}>
              <div className="s"><b>USDC</b><span>real on-chain settlement</span></div>
              <div className="s"><b>&lt; $0.01</b><span>per agent payment</span></div>
              <div className="s"><b className="spectrum-text">0</b><span>funds an exploit can move</span></div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: EASE, delay: T.prism }}>
            <PrismMark variant="hero" />
          </motion.div>
        </div>
        <div />
      </div>

      {/* ───────── problem ───────── */}
      <section className="wrap section">
        <motion.div {...reveal()}>
          <div className="sec-eyebrow">The problem</div>
          <h2 className="sec-title">Agents can think. They just can&apos;t be trusted with a wallet.</h2>
          <p className="sec-lead">An AI agent that can spend money is one jailbreak away from disaster — and a reconciliation nightmare. So today, agents recommend. They never pay.</p>
        </motion.div>
        <div className="prob-grid">
          {PROBLEMS.map((p, i) => (
            <motion.div className="panel prob" key={p.t} {...reveal(i * 0.08)}>
              <div className="prob__ico">{p.icon}</div>
              <h3>{p.t}</h3>
              <p>{p.p}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="wrap section">
        <motion.div {...reveal()}>
          <div className="sec-eyebrow">How it works</div>
          <h2 className="sec-title">Three guarantees, enforced by the chain.</h2>
        </motion.div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <motion.div className="panel feat" key={f.t} {...reveal(i * 0.08)}>
              <div className="feat__art">{f.art}</div>
              <div className="feat__k">{f.k}</div>
              <h3>{f.t}</h3>
              <p>{f.p}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── the moment ───────── */}
      <section className="wrap moment">
        <motion.h2 className="moment__title" {...reveal()}>
          The model got jailbroken.<br /><span className="spectrum-text">The contract didn&apos;t care.</span>
        </motion.h2>
        <motion.p className="moment__sub" {...reveal(0.08)}>
          Tell the agent to drain everything to an attacker wallet. Watch Stellar reject it
          before a single cent moves.
        </motion.p>
        <motion.div {...reveal(0.16)}>
          <span className="moment__chip">✕ Blocked on-chain · PayeeNotWhitelisted</span>
        </motion.div>
      </section>

      {/* ───────── why stellar ───────── */}
      <section className="wrap section">
        <motion.div {...reveal()}>
          <div className="sec-eyebrow">Why Stellar</div>
          <h2 className="sec-title">Primitives nothing else has this cheap.</h2>
        </motion.div>
        <div className="why-grid">
          {WHY.map((w, i) => (
            <motion.div className="panel why" key={w.t} {...reveal(i * 0.06)}>
              <div className="why__n">0{i + 1}</div>
              <div><h4>{w.t}</h4><p>{w.p}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ───────── live proof ───────── */}
      <section className="wrap proof">
        <motion.div {...reveal()}>
          <PrismMark variant="mark" size={44} />
          <h2 className="sec-title" style={{ maxWidth: "18ch", margin: "18px auto 0" }}>It&apos;s already live.</h2>
          <p className="sec-lead" style={{ margin: "14px auto 0" }}>Deployed on Stellar testnet, paying real USDC, rejecting real exploits.</p>
          <div className="proof__links">
            <button className="btn btn--primary" onClick={onLaunch}>Launch live demo →</button>
            <a className="btn" href={contractUrl(TREASURY_ID)} target="_blank" rel="noreferrer">Treasury contract</a>
            <a className="btn" href={contractUrl(USDC_SAC)} target="_blank" rel="noreferrer">USDC</a>
          </div>
        </motion.div>
      </section>

      <footer className="wrap footer">
        <div className="brand">
          <PrismMark variant="mark" size={28} />
          <span className="brand__name">Prism</span>
          <span className="dim" style={{ marginLeft: 8 }}>Build On Stellar · IBW 2026</span>
        </div>
        <div className="dim">Bekir Erdem · Seyit Ali Değirmen · <a href="https://github.com/Bekirerdem" target="_blank" rel="noreferrer">GitHub ↗</a></div>
      </footer>
    </div>
  );
}

const PROBLEMS = [
  { t: "One prompt and it&apos;s gone", p: "A jailbreak, a hallucination, a poisoned tool — any of them can make an agent send your whole balance to an attacker. You can't ship that.", icon: <IconBolt /> },
  { t: "Impossible to account for", p: "An agent making hundreds of small payments leaves you no way to know what was spent, on what, for whom. Finance says no.", icon: <IconChaos /> },
].map((p) => ({ ...p, t: p.t.replace("&apos;", "'") }));

const FEATURES = [
  { k: "BOUND", t: "Set the policy", p: "The agent proposes a payment; the contract checks it against your policy — payee whitelist, per-task and daily limits — and rejects anything outside it. On-chain, every time.", art: <ArtBound /> },
  { k: "ACCOUNT", t: "Auto-reconciled", p: "Spend is tagged to its task inside the contract, so every agent payment is attributable the moment it settles. Reconcile straight off-chain — zero memos.", art: <ArtAccount /> },
  { k: "FUND", t: "Earmark per agent", p: "Fund each agent budget through a zero-cost muxed sub-address — one account, infinite sub-budgets, no memos, no new accounts.", art: <ArtFund /> },
];

const WHY = [
  { t: "Muxed accounts", p: "One account, infinite zero-cost sub-addresses — the attribution layer for payment swarms. No equivalent is this cheap elsewhere." },
  { t: "Sub-cent fees", p: "Deterministic, fraction-of-a-cent fees make agent micro-payments actually economical. Gas would eat them alive." },
  { t: "Native account abstraction", p: "Soroban's __check_auth makes a contract-bounded agent a first-class citizen, not a bolt-on." },
  { t: "Native USDC + anchors", p: "Real dollars, path-payment FX, and fiat off-ramps in 170+ countries connect the agent to the real world." },
];

function IconBolt() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z" fill="currentColor" /></svg>;
}
function IconChaos() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h13" /></svg>;
}
function ArtBound() {
  return (
    <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
      <rect x="20" y="8" width="24" height="28" rx="6" stroke="var(--accent)" strokeWidth="1.6" />
      <path d="M27 22 l4 4 l7 -8" stroke="var(--sp-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArtAccount() {
  return (
    <svg width="80" height="44" viewBox="0 0 80 44" fill="none">
      <rect x="8" y="10" width="40" height="4" rx="2" fill="var(--sp-cyan)" />
      <rect x="8" y="20" width="28" height="4" rx="2" fill="var(--sp-blue)" />
      <rect x="8" y="30" width="34" height="4" rx="2" fill="var(--sp-violet)" />
    </svg>
  );
}
function ArtFund() {
  return (
    <svg width="80" height="44" viewBox="0 0 80 44" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M6 22 h28" stroke="#fff" />
      <path d="M34 22 l30 -12" stroke="var(--sp-red)" />
      <path d="M34 22 h30" stroke="var(--sp-green)" />
      <path d="M34 22 l30 12" stroke="var(--sp-violet)" />
    </svg>
  );
}
