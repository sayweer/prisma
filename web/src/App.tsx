import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Background from "./components/Background";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";

type View = "landing" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("landing");

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <>
      <Background />
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <Landing onLaunch={() => go("dashboard")} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <Dashboard onHome={() => go("landing")} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
