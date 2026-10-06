import { FRINGE, PALETTE, alpha } from "../palette";
// CRT visual styles — keyframe animations and class rules for the arcade cabinet UI.
// Fonts are loaded via <link> in index.html (not @import here).
export const crtStyles = `
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes startBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .attract-start:hover, .attract-start:focus-visible { animation: none !important; opacity: 1; filter: brightness(1.2); }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes glitchIn { 0%{transform:translateX(-8px) skewX(-5deg);opacity:0;filter:hue-rotate(90deg)} 30%{transform:translateX(4px) skewX(2deg);opacity:0.7;filter:hue-rotate(-30deg)} 60%{transform:translateX(-2px) skewX(-1deg);opacity:0.9;filter:hue-rotate(10deg)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes glitchFlash { 0%{background:transparent} 10%{background:${alpha(PALETTE.mark, 0.08)}} 20%{background:${alpha(PALETTE.hot, 0.05)}} 30%{background:transparent} 40%{background:${alpha(FRINGE.cool, 0.06)}} 50%,100%{background:transparent} }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes coinGlow { 0%,100%{box-shadow:inset 0 0 6px ${alpha(PALETTE.coin, 0.25)},0 0 4px ${alpha(PALETTE.coin, 0.1)}} 50%{box-shadow:inset 0 0 12px ${alpha(PALETTE.coin, 0.6)},0 0 10px ${alpha(PALETTE.coin, 0.2)}} }
  @keyframes hiddenPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes crtOn { 0%{clip-path:inset(49.5% 0 49.5% 0);filter:brightness(8)} 15%{clip-path:inset(40% 0 40% 0);filter:brightness(3)} 40%{clip-path:inset(10% 0 10% 0);filter:brightness(1.5)} 70%{clip-path:inset(2% 0 2% 0);filter:brightness(1.1)} 100%{clip-path:inset(0 0 0 0);filter:brightness(1)} }
  @keyframes coinTextPulse { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
  @keyframes fadeHints { 0%{opacity:0.4} 70%{opacity:0.4} 100%{opacity:0} }
  @keyframes testPattern { 0%{opacity:1} 60%{opacity:1} 100%{opacity:0} }
  /* The tube's ground: indigo over void, the lit grid (8 px cells, 6 px on a
     phone) and four brightness bands, painted once. Above it, under the
     content, one shade pulls the edges down into the void. */
  .tube-ground{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(180deg,transparent 0 58%,${alpha(PALETTE.lit, 0.05)} 58% 72%,${alpha(PALETTE.lit, 0.09)} 72% 86%,${alpha(PALETTE.lit, 0.13)} 86% 100%),linear-gradient(${alpha(PALETTE.muted, 0.11)} 1px,transparent 1px),linear-gradient(90deg,${alpha(PALETTE.muted, 0.11)} 1px,transparent 1px),radial-gradient(ellipse at center,var(--cab-tube) 0%,var(--cab-void) 80%);background-size:100% 100%,8px 8px,8px 8px,100% 100%}
  @media (max-width: 480px) { .tube-ground{background-size:100% 100%,6px 6px,6px 6px,100% 100%} }
  .tube-shade{position:absolute;inset:0;z-index:40;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,${alpha(PALETTE.void, 0.55)} 100%)}
  /* Bloom in the text's own colour: a soft stop on every readout, two on the
     signage, and the chromatic split (magenta left, cyan right) on signage. */
  .cabinet-scope{--bloom-text:0 0 4px color-mix(in srgb, currentColor 35%, transparent);--bloom-signage:0 0 6px color-mix(in srgb, currentColor 60%, transparent),0 0 24px color-mix(in srgb, currentColor 28%, transparent);--fringe:-1.5px 0 0 ${alpha(PALETTE.voice, 0.5)},1.5px 0 0 ${alpha(PALETTE.mark, 0.5)}}
  .crt-phosphor{text-shadow:var(--bloom-text)}
  .signage{text-shadow:var(--bloom-signage),var(--fringe)}
  .blink-cursor{animation:blink 1s step-end infinite}
  /* The marquee sets its own duration inline from its text's length (constants.js). */
  .marquee-track{position:absolute;display:flex;white-space:nowrap;width:max-content;text-shadow:none;animation:marquee 90s linear infinite}
  .project-row{transition:all 0.2s ease;cursor:pointer}
  .project-row:hover{background:${alpha(FRINGE.warm, 0.03)}!important;transform:translateX(4px)}
  .btn-cabinet{transition:all 0.15s ease;cursor:pointer;user-select:none}
  .btn-cabinet:hover{transform:scale(1.1);filter:brightness(1.3)}
  .btn-cabinet:active{transform:scale(0.95);filter:brightness(0.8)}
  @keyframes btnGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.04)}}
  .btn-action{animation:btnGlow 5s ease-in-out infinite;transition:transform 0.12s ease,filter 0.12s ease;cursor:pointer;user-select:none}
  .btn-action:hover{transform:scale(1.10);filter:brightness(1.35)!important}
  .btn-action:active{transform:scale(0.92);filter:brightness(0.75)!important}
  .hidden-row{animation:hiddenPulse 3s ease-in-out infinite}
  .glitch-enter{animation:glitchIn 0.5s ease-out}
  @keyframes gameHighlight { 0%{box-shadow:0 0 20px ${alpha(PALETTE.hot, 0.6)},inset 0 0 10px ${alpha(PALETTE.hot, 0.15)}} 100%{box-shadow:none} }
  .game-highlight{animation:gameHighlight 2s ease-out forwards}
  .coin-slot{animation:coinGlow 6s ease-in-out infinite;cursor:pointer;transition:all 0.2s ease}
  .coin-slot:hover{box-shadow:inset 0 0 12px ${alpha(PALETTE.coin, 0.6)},0 0 10px ${alpha(PALETTE.coin, 0.2)}!important}
  .coin-slot:active{transform:scale(0.95)}
  .cabinet-body{box-shadow:0 20px 80px ${alpha(PALETTE.mark, 0.07)},0 0 120px ${alpha(PALETTE.mark, 0.04)},0 40px 60px ${alpha(PALETTE.black, 0.5)};position:relative}
  .cabinet-body::after{content:'';position:absolute;bottom:-40px;left:10%;right:10%;height:40px;background:radial-gradient(ellipse at center,${alpha(PALETTE.mark, 0.08)} 0%,transparent 70%);pointer-events:none;filter:blur(10px)}
  .crt-screen ::-webkit-scrollbar{width:4px}
  .crt-screen ::-webkit-scrollbar-track{background:${alpha(PALETTE.black, 0.3)}}
  .crt-screen ::-webkit-scrollbar-thumb{background:${alpha(PALETTE.mark, 0.2)};border-radius:2px}
  /* A cabinet scrolled off the floor stops running its tube effects. */
  .arcade-offscreen .marquee-track,
  .arcade-offscreen .coin-slot,.arcade-offscreen .btn-action{animation-play-state:paused!important}
  @keyframes synthEnter { 0%{transform:translateX(-6px);opacity:0;filter:hue-rotate(30deg) brightness(2)} 40%{transform:translateX(2px);opacity:0.8;filter:hue-rotate(-10deg) brightness(1.3)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes coherenceEnter { 0%{opacity:0;letter-spacing:0.4em;filter:blur(3px)} 60%{opacity:0.9;letter-spacing:0.05em;filter:blur(0.5px)} 100%{opacity:1;letter-spacing:inherit;filter:none} }
  @keyframes gameEnter { 0%{opacity:0;transform:scaleY(0.1)} 50%{opacity:0.7;transform:scaleY(1.05)} 100%{opacity:1;transform:scaleY(1)} }
  @keyframes announceIn { 0%{opacity:0;transform:translateY(8px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
  @keyframes tier3Overlay { 0%{opacity:0} 10%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
  .tier-1-enter{animation:synthEnter 0.6s ease-out}
  .tier-2-enter{animation:coherenceEnter 0.7s ease-out}
  .tier-3-enter{animation:gameEnter 0.5s ease-out}
  .coin-announce{position:absolute;left:50%;transform:translateX(-50%);animation:announceIn 1.6s ease forwards;font-family:'Press Start 2P',monospace;pointer-events:none;z-index:200}
  .coin-announce.tier-1{bottom:120px;font-size:8px;color:var(--cab-voice)}
  .coin-announce.tier-2{bottom:120px;font-size:8px;color:var(--cab-halo)}
  .coin-announce.tier-3{top:50%;transform:translate(-50%,-50%);font-size:14px;color:var(--cab-danger);text-align:center;animation:tier3Overlay 2.8s ease forwards;background:${alpha(PALETTE.black, 0.9)};padding:20px 30px;border:1px solid var(--cab-danger)}
  .coin-announce.tier-3 span{display:block;margin-top:10px;font-size:9px;letter-spacing:0.12em;white-space:nowrap;color:var(--cab-text)}
  @media (prefers-reduced-motion: reduce) {
    .blink-cursor, .hidden-row, .coin-slot, .btn-action,
    .glitch-enter, .tier-1-enter, .tier-2-enter, .tier-3-enter, .coin-announce,
    .marquee-track, .attract-start { animation: none !important; }
  }
  /* Mobile: drop the continuous animations that jank low-power GPUs. */
  .desktop-only-flex { display: flex; }
  .mobile-only-block { display: none; }
  @media (max-width: 600px) {
    .btn-action, .coin-slot { animation: none !important; }
    .cabinet-body::after { display: none !important; }
    .desktop-only-flex { display: none !important; }
    .mobile-only-block { display: block !important; }
  }
`;
