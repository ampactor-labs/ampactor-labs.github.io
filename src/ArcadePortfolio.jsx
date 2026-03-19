import { useState, useEffect, useRef, useMemo } from "react";
import CoherenceField from "./CoherenceField";
import SynthEngine from "./SynthEngine";
import CrtSvgDefs from "./CrtEffects";
import TunnelCanvas from "./TunnelCanvas";
import useAmbientHum from "./useAmbientHum";
import useIntroSequence from "./useIntroSequence";

const PROJECTS = [
  { id: "sonido", title: "SONIDO", subtitle: "MODULAR DSP WORKSTATION", lang: "Rust", color: "#00E5FF", icon: "\u266b", github: "https://github.com/ampactor-labs/sonido", desc: "Modular audio effects workstation. 30+ DSP effects, node graph, CLAP plugin, Daisy hardware export. The shape of sound.", tags: ["dsp", "clap", "embedded", "no_std"] },
  { id: "forge", title: "FORGE", subtitle: "LLM CONVERSATION ENGINE", lang: "Rust", color: "#44aaff", icon: "\u2692", github: "https://github.com/ampactor-labs/forge", desc: "CLI tool for multi-provider LLM conversations with tool use. Route between models, maintain context, execute tools.", tags: ["llm", "cli", "tool-use", "multi-provider"] },
  { id: "browsore", title: "BROWSORE", subtitle: "BROWSER AUTOMATION MCP", lang: "Rust", color: "#aa66ff", icon: "\u29be", github: "https://github.com/ampactor-labs/browsore", desc: "Browser automation MCP server for AI agent web interaction. Navigate, click, extract, automate.", tags: ["mcp", "browser", "automation", "ai-agents"] },
  { id: "bounty-hunter", title: "BOUNTY-HUNTER", subtitle: "SECURITY SCANNER", lang: "Rust", color: "#ff6644", icon: "\u2620", github: "https://github.com/ampactor-labs/bounty-hunter", desc: "Automated security bug bounty hunter. Multi-vertical vulnerability scanning across web, API, and infrastructure targets.", tags: ["security", "scanning", "bounty", "automation"] },
  { id: "tokensafe", title: "TOKENSAFE", subtitle: "RUG PULL DETECTION", lang: "Rust", color: "#ff44aa", icon: "\u25c8", github: "https://github.com/ampactor-labs/tokensafe", desc: "Solana token safety analyzer. Rug pull detection, concentration risk scoring, honeypot identification.", tags: ["solana", "security", "defi", "analysis"] },
  { id: "solguard", title: "ST-SOLGUARD", subtitle: "PROGRAM SECURITY SCANNER", lang: "Rust", color: "#ff8844", icon: "\u2b22", github: "https://github.com/ampactor-labs/st-solguard", desc: "Solana program security scanner. Static analysis for common vulnerabilities in on-chain programs.", tags: ["solana", "static-analysis", "security", "audit"] },
  { id: "st-audit", title: "ST-AUDIT", subtitle: "SMART CONTRACT AUDITOR", lang: "Rust", color: "#66ffcc", icon: "\u25c7", github: "https://github.com/ampactor-labs/st-audit", desc: "Automated smart contract audit tooling. Pattern matching against known vulnerability classes. Structural analysis, not string matching.", tags: ["audit", "solana", "security", "analysis"] },
  { id: "flowpilot", title: "FLOWPILOT", subtitle: "ALGORITHMIC TRADING", lang: "Rust", color: "#ffaa00", icon: "\u2b21", github: "https://github.com/ampactor-labs/flowpilot", desc: "Algorithmic trading engine for Solana DEXs. Edge-first architecture, real-time execution, on-chain settlement.", tags: ["solana", "trading", "defi", "algorithms"] },
  { id: "selekta", title: "CELEZDIAL SELEKTA", subtitle: "AUDIO INTERFACE", lang: "JavaScript", color: "#cc66ff", icon: "\u2726", github: "https://github.com/ampactor-labs/celezdial-selekta", desc: "Interactive audio selection and mixing interface. Celestial dial energy. Select your frequency.", tags: ["audio", "interactive", "web", "creative"] },
  { id: "narrative", title: "ST-NARRATIVE", subtitle: "STORY ENGINE", lang: "HTML", color: "#66ccff", icon: "\u25c9", github: "https://github.com/ampactor-labs/st-narrative", desc: "Narrative presentation layer for SuperTeam submissions. Telling the story behind the code.", tags: ["narrative", "presentation", "superteam"] },
];

const HIDDEN_PROJECTS = [
  { id: "coherence", title: "COHERENCE FIELD", subtitle: "CONSERVATION LAWS", lang: "\u2014", color: "#00ddbb", icon: "\u25ce", github: null, desc: "Self-sustaining distributed coherence. Phase-coupled particles, no central authority. Toggle the four constraints and watch the pattern live or die.", tags: ["don't fear", "don't protect", "don't consume", "don't neglect"], hidden: true, interactive: "coherence" },
  { id: "resonance", title: "SYS/RESONANCE", subtitle: "SUBTRACTIVE SYNTH", lang: "WebAudio", color: "#FFB800", icon: "\u223f", github: null, desc: "Playable single-voice subtractive synthesizer. Oscillator \u2192 Filter \u2192 Amp \u2192 Delay. Keyboard-mapped. The signal chain, alive in the browser.", tags: ["oscillator", "filter", "envelope", "delay"], hidden: true, interactive: "synth" },
];

const crtStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@300;400;600&family=Silkscreen:wght@400;700&display=swap');
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 94%{opacity:1} 96%{opacity:0.9} 97%{opacity:1} }
  @keyframes scanmove { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes glitchIn { 0%{transform:translateX(-8px) skewX(-5deg);opacity:0;filter:hue-rotate(90deg)} 30%{transform:translateX(4px) skewX(2deg);opacity:0.7;filter:hue-rotate(-30deg)} 60%{transform:translateX(-2px) skewX(-1deg);opacity:0.9;filter:hue-rotate(10deg)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes glitchFlash { 0%{background:transparent} 10%{background:rgba(0,229,255,0.08)} 20%{background:rgba(255,0,100,0.05)} 30%{background:transparent} 40%{background:rgba(0,100,255,0.06)} 50%,100%{background:transparent} }
  @keyframes marquee { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
  @keyframes coinGlow { 0%,100%{box-shadow:inset 0 0 4px rgba(255,184,0,0.2)} 50%{box-shadow:inset 0 0 8px rgba(255,184,0,0.5),0 0 6px rgba(255,184,0,0.15)} }
  @keyframes hiddenPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes crtOn { 0%{clip-path:inset(49.5% 0 49.5% 0);filter:brightness(8)} 15%{clip-path:inset(40% 0 40% 0);filter:brightness(3)} 40%{clip-path:inset(10% 0 10% 0);filter:brightness(1.5)} 70%{clip-path:inset(2% 0 2% 0);filter:brightness(1.1)} 100%{clip-path:inset(0 0 0 0);filter:brightness(1)} }
  @keyframes screenStatic { 0%{opacity:0.03} 50%{opacity:0.06} 100%{opacity:0.03} }
  @keyframes phosphorPulse { 0%,100%{text-shadow:0 0 4px rgba(0,255,140,0.3),0 0 12px rgba(0,255,140,0.1)} 50%{text-shadow:0 0 6px rgba(0,255,140,0.4),0 0 18px rgba(0,255,140,0.15)} }
  @keyframes coinTextPulse { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
  @keyframes polyHue { 0%,100%{filter:hue-rotate(0deg)} 25%{filter:hue-rotate(5deg)} 50%{filter:hue-rotate(-3deg)} 75%{filter:hue-rotate(8deg)} }
  @keyframes testPattern { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
  .crt-screen{animation:flicker 8s infinite,crtOn 0.8s ease-out both}
  .crt-glass{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 40%,transparent 60%,rgba(255,255,255,0.01) 100%);pointer-events:none;z-index:91;border-radius:inherit}
  .crt-curvature{position:absolute;inset:0;border-radius:50%/3%;box-shadow:inset 0 0 60px rgba(0,0,0,0.4);pointer-events:none;z-index:89}
  .crt-phosphor{text-shadow:0 0 4px rgba(0,255,140,0.25),0 0 12px rgba(0,255,140,0.08),-0.7px 0 0 rgba(219,116,151,0.2),0.7px 0 0 rgba(40,100,255,0.15);animation:phosphorPulse 3s ease-in-out infinite}
  .crt-noise{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");background-size:128px;pointer-events:none;z-index:88;animation:screenStatic 0.15s steps(3) infinite;mix-blend-mode:screen}
  .scanline-bar{position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.03);animation:scanmove 4s linear infinite;pointer-events:none;z-index:100}
  .blink-cursor{animation:blink 1s step-end infinite}
  .project-row{transition:all 0.2s ease;cursor:pointer}
  .project-row:hover{background:rgba(219,116,151,0.03)!important;transform:translateX(4px)}
  .btn-cabinet{transition:all 0.15s ease;cursor:pointer;user-select:none}
  .btn-cabinet:hover{transform:scale(1.1);filter:brightness(1.3)}
  .btn-cabinet:active{transform:scale(0.95);filter:brightness(0.8)}
  .hidden-row{animation:hiddenPulse 3s ease-in-out infinite}
  .glitch-enter{animation:glitchIn 0.5s ease-out}
  .crt-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,229,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.01) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:42}
  .coin-slot{animation:coinGlow 2s ease-in-out infinite;cursor:pointer;transition:all 0.2s ease}
  .coin-slot:hover{box-shadow:inset 0 0 12px rgba(255,184,0,0.6),0 0 10px rgba(255,184,0,0.2)!important}
  .coin-slot:active{transform:scale(0.95)}
  @keyframes screenBreathe { 0%,100%{box-shadow:inset 0 0 80px rgba(0,0,0,0.6),0 0 40px rgba(0,229,255,0.08),0 0 80px rgba(0,229,255,0.04),0 0 120px rgba(0,255,140,0.02)} 50%{box-shadow:inset 0 0 80px rgba(0,0,0,0.6),0 0 50px rgba(0,229,255,0.12),0 0 100px rgba(0,229,255,0.06),0 0 140px rgba(0,255,140,0.03)} }
  @keyframes cabinetBreathe { 0%,100%{opacity:0.06} 50%{opacity:0.1} }
  .screen-breathe{animation:flicker 8s infinite,crtOn 0.8s ease-out both,screenBreathe 8s ease-in-out infinite 1s}
  .cabinet-body{box-shadow:0 20px 80px rgba(0,229,255,0.07),0 0 120px rgba(0,229,255,0.04),0 40px 60px rgba(0,0,0,0.5);position:relative}
  .cabinet-body::after{content:'';position:absolute;bottom:-40px;left:10%;right:10%;height:40px;background:radial-gradient(ellipse at center,rgba(0,229,255,0.08) 0%,transparent 70%);pointer-events:none;filter:blur(10px);animation:cabinetBreathe 6s ease-in-out infinite}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,0.3)}
  ::-webkit-scrollbar-thumb{background:rgba(0,229,255,0.2);border-radius:2px}
`;

export default function ArcadePortfolio() {
  const [screen, setScreen] = useState("boot");
  const [bootPhase, setBootPhase] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [detailProject, setDetailProject] = useState(null);
  const [bootLine, setBootLine] = useState(0);
  const [coinInserted, setCoinInserted] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [dims, setDims] = useState({ w: 360, h: 500 });
  const screenRef = useRef(null);
  const tunnelRef = useRef(null);
  const logoRef = useRef(null);
  const consoleRef = useRef(null);
  const { humming, toggleHum, initHum, playBlip } = useAmbientHum();
  const { introComplete, skipIntro } = useIntroSequence(logoRef, tunnelRef, consoleRef);

  const allProjects = useMemo(() => coinInserted ? [...PROJECTS, ...HIDDEN_PROJECTS] : PROJECTS, [coinInserted]);

  const BOOT_LINES = ["AMPACTOR BIOS v4.2.0", "Initializing kernel graph...", "Loading DSP subsystem.......... OK", "Calibrating resonance field.... OK", "Mounting /dev/creativity....... OK", "Linking x402 payment layer..... OK", "Phase coupling established..... OK", "", "ALL SYSTEMS NOMINAL", "", "INSERT COIN TO CONTINUE"];

  // Boot phase 0: test pattern (800ms), then phase 1: text sequence
  useEffect(() => {
    if (screen !== "boot" || !introComplete) return;
    if (bootPhase === 0) {
      const t = setTimeout(() => setBootPhase(1), 800);
      return () => clearTimeout(t);
    }
  }, [screen, bootPhase, introComplete]);

  useEffect(() => {
    if (screen !== "boot" || bootPhase < 1) return;
    const interval = setInterval(() => { setBootLine(prev => { if (prev >= BOOT_LINES.length - 1) { clearInterval(interval); return prev; } return prev + 1; }); }, 280);
    return () => clearInterval(interval);
  }, [screen, bootPhase]);

  useEffect(() => {
    const measure = () => { if (screenRef.current) { const r = screenRef.current.getBoundingClientRect(); setDims({ w: r.width - 40, h: r.height - 32 }); } };
    measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
  }, []);

  // Skip intro on any key or click
  useEffect(() => {
    if (introComplete) return;
    const skip = () => skipIntro();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => { window.removeEventListener("keydown", skip); window.removeEventListener("pointerdown", skip); };
  }, [introComplete, skipIntro]);

  useEffect(() => {
    const handler = (e) => {
      if (!introComplete) return;
      if (screen === "boot") {
        if (bootPhase === 0) { setBootPhase(1); return; }
        if (bootLine >= BOOT_LINES.length - 1) { setScreen("select"); return; }
      }
      if (screen === "select") {
        if (e.key === "ArrowUp") { setSelectedIdx(i => (i - 1 + allProjects.length) % allProjects.length); playBlip(); }
        else if (e.key === "ArrowDown") { setSelectedIdx(i => (i + 1) % allProjects.length); playBlip(); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetailProject(allProjects[selectedIdx]); setScreen("detail"); playBlip(); }
      }
      if (screen === "detail" && !allProjects[selectedIdx]?.interactive?.includes("synth")) {
        if (e.key === "Escape" || e.key === "Backspace") { setScreen("select"); setDetailProject(null); }
      }
      if (screen === "detail" && allProjects[selectedIdx]?.interactive === "synth" && e.key === "Escape") { setScreen("select"); setDetailProject(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, selectedIdx, bootLine, bootPhase, allProjects]);

  const insertCoin = () => {
    if (coinInserted) return;
    setGlitching(true); setCoinInserted(true);
    setTimeout(() => setGlitching(false), 600);
  };

  const openProject = (idx) => { setSelectedIdx(idx); setDetailProject(allProjects[idx]); setScreen("detail"); playBlip(); };
  const goBack = () => { setScreen("select"); setDetailProject(null); };

  return (
    <div onClick={() => initHum()} style={{ width: "100%", height: "100vh", background: "radial-gradient(ellipse at 50% 40%, #0a0c18 0%, #08080f 50%, #050508 100%)", display: "flex", justifyContent: "center", alignItems: "stretch", overflow: "hidden", fontFamily: "'JetBrains Mono', monospace", position: "relative" }}>
      <CrtSvgDefs />
      <style>{crtStyles}</style>
      <TunnelCanvas ref={tunnelRef} />
      {/* A-mark logo — intro entry point, then ambient background */}
      <div ref={logoRef} style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", pointerEvents: "none", zIndex: 0, opacity: 0 }}>
        <svg viewBox="0 0 512 512" width="200" height="200" style={{ filter: "drop-shadow(0 0 20px rgba(0,229,255,0.3))" }}>
          <line x1="108" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
          <line x1="404" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
          <path d="M 168,300 C 180,268 200,268 212,300 C 224,332 244,332 256,300 C 268,268 288,268 300,300 C 312,332 332,332 344,300" stroke="#00E5FF" strokeWidth="20" strokeLinecap="round" fill="none" />
          <line x1="76" y1="408" x2="140" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
          <line x1="372" y1="408" x2="436" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div ref={consoleRef} style={{ maxWidth: 900, width: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, background: "#08080f", borderRadius: 16, opacity: 0 }}>
      <div ref={screenRef} className="crt-screen screen-breathe" style={{ flex: 1, margin: "10px 10px 0", borderRadius: "16px 16px 0 0", border: "3px solid #1a1a2a", borderTop: "3px solid #222238", borderBottom: "none", background: "radial-gradient(ellipse at center, #0c0c1a 0%, #05050c 80%)", position: "relative", overflow: "hidden", boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.08), 0 0 80px rgba(0,229,255,0.04), 0 0 120px rgba(0,255,140,0.02)" }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)", pointerEvents: "none", zIndex: 90 }} />
        <div className="scanline-bar" />
        <div className="crt-glass" />
        <div className="crt-curvature" />
        <div className="crt-noise" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none", zIndex: 80 }} />
        <div className="crt-grid" />
        {glitching && <div style={{ position: "absolute", inset: 0, animation: "glitchFlash 0.6s ease", pointerEvents: "none", zIndex: 95 }} />}
        {/* Project color bleed */}
        <div style={{ position: "absolute", inset: 0, background: detailProject ? `radial-gradient(ellipse at 30% 40%, ${detailProject.color}08 0%, transparent 60%)` : (allProjects[selectedIdx] && screen === "select" ? `radial-gradient(ellipse at 30% 40%, ${allProjects[selectedIdx].color}06 0%, transparent 60%)` : "none"), transition: "background 0.5s ease", pointerEvents: "none", zIndex: 45 }} />
        <div style={{ position: "relative", zIndex: 50, height: "100%" }}>
          <div className="crt-phosphor" style={{ height: "100%", padding: "16px 20px", overflow: "hidden" }}>
            {screen === "boot" && <BootScreen lines={BOOT_LINES} currentLine={bootLine} bootPhase={bootPhase} onSkip={() => { if (bootPhase === 0) setBootPhase(1); else setScreen("select"); }} />}
            {screen === "select" && <SelectScreen projects={allProjects} selectedIdx={selectedIdx} onSelect={openProject} onHover={setSelectedIdx} coinInserted={coinInserted} />}
            {screen === "detail" && detailProject && <DetailScreen project={detailProject} onBack={goBack} screenWidth={dims.w} screenHeight={dims.h} />}
          </div>
        </div>
      </div>

      {/* CABINET */}
      <div className="cabinet-body" style={{ margin: "0 10px 10px", background: "linear-gradient(180deg, #1a1a2a 0%, #12121c 100%)", borderRadius: "0 0 16px 16px", border: "3px solid #1a1a2a", borderTop: "1px solid #222238", padding: "14px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div className="btn-cabinet" role="button" aria-label="Navigate up" tabIndex={0} onClick={() => { if (screen === "select") setSelectedIdx(i => (i - 1 + allProjects.length) % allProjects.length); if (screen === "boot" && bootPhase > 0 && bootLine >= BOOT_LINES.length - 1) setScreen("select"); }} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25b2"}</div>
          <div style={{ display: "flex", gap: 2 }}>
            <div className="btn-cabinet" role="button" aria-label="Go back" tabIndex={0} onClick={goBack} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25c4"}</div>
            <div style={{ width: 30, height: 30, background: "#222232", borderRadius: 4, border: "1px solid #2a2a3a" }} />
            <div className="btn-cabinet" role="button" aria-label="Navigate right" tabIndex={0} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25ba"}</div>
          </div>
          <div className="btn-cabinet" role="button" aria-label="Navigate down" tabIndex={0} onClick={() => { if (screen === "select") setSelectedIdx(i => (i + 1) % allProjects.length); }} style={{ width: 30, height: 30, background: "#2a2a3a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#556", fontSize: 12, border: "1px solid #333348" }}>{"\u25bc"}</div>
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <svg viewBox="0 0 512 512" width="28" height="28" style={{ filter: "drop-shadow(-1.5px 0 0 rgba(219,116,151,0.35)) drop-shadow(1.5px 0 0 rgba(0,80,255,0.3)) drop-shadow(0 0 6px rgba(0,229,255,0.4))" }}>
              <line x1="108" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="404" y1="408" x2="256" y2="104" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 168,300 C 180,268 200,268 212,300 C 224,332 244,332 256,300 C 268,268 288,268 300,300 C 312,332 332,332 344,300" stroke="#00E5FF" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="76" y1="408" x2="140" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="372" y1="408" x2="436" y2="408" stroke="#00E5FF" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#00E5FF", letterSpacing: "0.2em", textShadow: "0 0 8px rgba(0,229,255,0.4)" }}>AMPACTOR</div>
            <div style={{ fontSize: 7, color: "#667788", letterSpacing: "0.15em" }}>SALT LAKE CITY {"\u00b7"} EST. 2018</div>
          </div>
          {/* Speaker toggle */}
          <div className="btn-cabinet" role="button" aria-label={humming ? "Mute hum" : "Enable hum"} tabIndex={0} onClick={toggleHum} style={{ width: 22, height: 22, background: humming ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.03)", borderRadius: "50%", border: `1px solid ${humming ? "rgba(0,229,255,0.2)" : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: humming ? "#00E5FF" : "#334" }}>{humming ? "\u{1F50A}" : "\u{1F507}"}</div>
          <div className="coin-slot" role="button" aria-label={coinInserted ? "Bonus loaded" : "Insert coin"} tabIndex={0} onClick={insertCoin} title="Insert coin" style={{ width: 48, height: 14, background: coinInserted ? "rgba(255,184,0,0.1)" : "#111118", borderRadius: 7, border: `2px solid ${coinInserted ? "rgba(255,184,0,0.3)" : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ width: 28, height: 3, background: coinInserted ? "rgba(255,184,0,0.4)" : "#222232", borderRadius: 2, boxShadow: coinInserted ? "0 0 4px rgba(255,184,0,0.3)" : "inset 0 1px 2px rgba(0,0,0,0.5)" }} />
          </div>
          <div style={{ fontSize: 6, color: coinInserted ? "rgba(255,184,0,0.5)" : "#556", letterSpacing: "0.15em", transition: "color 0.3s ease", animation: coinInserted ? "none" : "coinTextPulse 3s ease-in-out infinite" }}>{coinInserted ? "BONUS LOADED" : "INSERT COIN"}</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="btn-cabinet" role="button" aria-label="Back" tabIndex={0} onClick={goBack} style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #553333, #331111)", border: "2px solid #664444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#ff6644", fontFamily: "'Press Start 2P', monospace", boxShadow: "0 2px 8px rgba(255,100,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>B</div>
          <div className="btn-cabinet" role="button" aria-label="Select" tabIndex={0} onClick={() => { if (screen === "boot") { if (bootPhase === 0) setBootPhase(1); else if (bootLine >= BOOT_LINES.length - 1) setScreen("select"); } if (screen === "select") openProject(selectedIdx); }} style={{ width: 38, height: 38, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #224455, #112233)", border: "2px solid #336688", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#00E5FF", fontFamily: "'Press Start 2P', monospace", boxShadow: "0 2px 8px rgba(0,229,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>A</div>
        </div>
      </div>
      </div>
    </div>
  );
}

function BootScreen({ lines, currentLine, bootPhase, onSkip }) {
  if (bootPhase === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", animation: "testPattern 0.8s ease-out forwards" }} onClick={onSkip}>
        <svg viewBox="0 0 200 200" width="200" height="200" style={{ opacity: 0.7 }}>
          {[20, 40, 60, 80, 100].map(r => (<circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#00E5FF" strokeWidth="0.5" opacity="0.4" />))}
          <line x1="100" y1="0" x2="100" y2="200" stroke="#00E5FF" strokeWidth="0.5" opacity="0.3" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="#00E5FF" strokeWidth="0.5" opacity="0.3" />
          <line x1="29" y1="29" x2="171" y2="171" stroke="#00E5FF" strokeWidth="0.3" opacity="0.2" />
          <line x1="171" y1="29" x2="29" y2="171" stroke="#00E5FF" strokeWidth="0.3" opacity="0.2" />
          {/* A-mark */}
          <line x1="88" y1="118" x2="100" y2="88" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <line x1="112" y1="118" x2="100" y2="88" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M 93,108 C 95,102 97,102 99,108 C 101,114 103,114 105,108" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
          <line x1="85" y1="118" x2="91" y2="118" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <line x1="109" y1="118" x2="115" y2="118" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
      <div onClick={onSkip} style={{ position: "absolute", top: 12, right: 16, fontSize: 9, color: "#667788", cursor: "pointer", letterSpacing: "0.1em", zIndex: 60 }}>[ SKIP ]</div>
      <div style={{ fontSize: 14, lineHeight: 2 }}>
        {lines.slice(0, currentLine + 1).map((line, i) => (
          <div key={i} style={{ color: i === 0 ? "#00E5FF" : line === "ALL SYSTEMS NOMINAL" ? "#00E5FF" : line === "INSERT COIN TO CONTINUE" ? "#FFB800" : line.includes("OK") ? "#55bbdd" : "#778899", animation: i === currentLine ? "slideUp 0.2s ease" : undefined, fontFamily: line === "INSERT COIN TO CONTINUE" ? "'Press Start 2P', monospace" : undefined, fontSize: line === "INSERT COIN TO CONTINUE" ? 13 : undefined, textAlign: line === "INSERT COIN TO CONTINUE" ? "center" : undefined, marginTop: line === "INSERT COIN TO CONTINUE" ? 8 : undefined }}>
            {line}{i === currentLine && line !== "" && <span className="blink-cursor" style={{ color: "#00E5FF" }}> {"\u2588"}</span>}
          </div>
        ))}
      </div>
      {currentLine >= lines.length - 1 && <div style={{ textAlign: "center", marginTop: 14, fontSize: 9, color: "#667788", cursor: "pointer" }} onClick={onSkip}>[ press any key or tap A ]</div>}
    </div>
  );
}

function SelectScreen({ projects, selectedIdx, onSelect, onHover, coinInserted }) {
  const listRef = useRef(null);
  useEffect(() => { if (listRef.current?.children[selectedIdx]) listRef.current.children[selectedIdx].scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selectedIdx]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(0,229,255,0.1)" }}>
        <div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: "#00E5FF", textShadow: "0 0 12px rgba(0,229,255,0.4)", letterSpacing: "0.1em" }}>SELECT PROGRAM</div>
          <div style={{ fontSize: 10, color: "#667788", letterSpacing: "0.12em", marginTop: 3 }}>MORGAN ESPITIA {"\u00b7"} SYSTEMS ENGINEER</div>
          <div style={{ fontSize: 11, color: "#667788", marginTop: 5, letterSpacing: "0.05em" }}>{projects.length} CARTRIDGE{projects.length !== 1 ? "S" : ""} LOADED</div>
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#445566", textAlign: "right", lineHeight: 1.8 }}>{"\u25b2\u25bc"} NAV<br/>{"\u24b6"} SELECT</div>
      </div>
      <div ref={listRef} role="listbox" aria-label="Project list" style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {projects.map((p, i) => {
          const active = i === selectedIdx, isH = p.hidden;
          return (
            <div key={p.id} role="option" aria-selected={active} aria-label={`${p.title} — ${p.subtitle}`} className={`project-row${isH ? " hidden-row glitch-enter" : ""}`} onClick={() => onSelect(i)} onMouseEnter={() => onHover(i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6, background: active ? (isH ? "rgba(255,200,0,0.04)" : "rgba(0,229,255,0.05)") : "transparent", border: active ? `1px solid ${isH ? "rgba(255,200,0,0.15)" : "rgba(0,229,255,0.15)"}` : "1px solid transparent", position: "relative", borderLeft: isH ? `2px dashed ${p.color}33` : undefined }}>
              <div style={{ width: 3, height: "70%", background: active ? p.color : "transparent", borderRadius: 2, position: "absolute", left: isH ? -1 : 2, boxShadow: active ? `0 0 6px ${p.color}` : "none", transition: "all 0.2s ease" }} />
              <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: p.color, background: `${p.color}11`, borderRadius: 5, border: `1px solid ${p.color}22`, textShadow: active ? `0 0 8px ${p.color}` : "none", flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Silkscreen', monospace", fontSize: 14, color: active ? p.color : "#99aabb", textShadow: active ? `0 0 8px ${p.color}44` : "none", transition: "color 0.2s ease" }}>{p.title}</span>
                  <span style={{ fontSize: 9, color: "#445566", padding: "1px 5px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>{p.lang}</span>
                </div>
                <div style={{ fontSize: 10, color: "#667788", marginTop: 1, letterSpacing: "0.08em" }}>{p.subtitle}</div>
              </div>
              {active && <div style={{ color: p.color, fontSize: 14, flexShrink: 0, opacity: 0.6 }}>{"\u203a"}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,229,255,0.06)", overflow: "hidden", height: 16, position: "relative" }}>
        <div style={{ position: "absolute", whiteSpace: "nowrap", fontSize: 8, color: "#3a4a5a", letterSpacing: "0.1em", animation: "marquee 90s linear infinite" }}>
          MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP + EMBEDDED {"\u00b7"} RUST {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT {"\u00b7"} PYTHON {"\u00b7"} AUDIO ENGINEERING {"\u00b7"} SOLANA {"\u00b7"} x402 {"\u00b7"} SLC UT {"\u00b7\u00a0\u00a0\u00a0"}MORGAN ESPITIA {"\u00b7"} FULL-STACK + DSP + EMBEDDED {"\u00b7"} RUST {"\u00b7"} REACT {"\u00b7"} TYPESCRIPT {"\u00b7"} PYTHON {"\u00b7"} AUDIO ENGINEERING {"\u00b7"} SOLANA {"\u00b7"} x402 {"\u00b7"} SLC UT
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ project: p, onBack, screenWidth, screenHeight }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);
  const iw = Math.min(screenWidth, 400), ih = Math.min(screenHeight - 220, 240);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(10px)", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${p.color}22` }}>
        <div className="btn-cabinet" role="button" aria-label="Back to project list" tabIndex={0} onClick={onBack} style={{ fontSize: 12, color: "#667788", padding: "3px 7px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>{"\u25c4"}</div>
        <div style={{ fontSize: 24, color: p.color, textShadow: `0 0 12px ${p.color}44` }}>{p.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: p.color, textShadow: `0 0 10px ${p.color}44`, letterSpacing: "0.05em" }}>{p.title}</div>
          <div style={{ fontSize: 11, color: "#667788", letterSpacing: "0.1em", marginTop: 3 }}>{p.subtitle}</div>
        </div>
        {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#667788", letterSpacing: "0.08em", textDecoration: "none", marginLeft: "auto", flexShrink: 0 }}>{"\u203a"} SOURCE</a>}
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "#99aabb", marginBottom: 14, maxWidth: 520 }}>{p.desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {p.tags.map(tag => (<span key={tag} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 3, background: `${p.color}0a`, border: `1px solid ${p.color}20`, color: `${p.color}aa`, letterSpacing: "0.05em" }}>{tag}</span>))}
        </div>
        {p.interactive === "coherence" && <CoherenceField width={iw} height={ih} />}
        {p.interactive === "synth" && <SynthEngine width={iw} />}
        {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", marginTop: 14, background: `${p.color}11`, border: `1px solid ${p.color}33`, borderRadius: 6, color: p.color, textDecoration: "none", fontSize: 10, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }} onMouseEnter={(e) => { e.currentTarget.style.background = `${p.color}22`; e.currentTarget.style.boxShadow = `0 0 16px ${p.color}22`; }} onMouseLeave={(e) => { e.currentTarget.style.background = `${p.color}11`; e.currentTarget.style.boxShadow = "none"; }}>VIEW SOURCE {"\u2192"}</a>}
      </div>
      <div style={{ paddingTop: 10, borderTop: `1px solid ${p.color}11`, fontSize: 8, color: "#445566", display: "flex", justifyContent: "space-between" }}>
        <span>[ {"\u24b7"} BACK ]</span>
        <span>{p.github ? p.github.replace("https://github.com/", "") : p.id}</span>
      </div>
    </div>
  );
}
