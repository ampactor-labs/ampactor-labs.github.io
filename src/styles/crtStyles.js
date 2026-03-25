// CRT visual styles — keyframe animations and class rules for the arcade cabinet UI.
// Fonts are loaded via <link> in index.html (not @import here).
export const crtStyles = `
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.8} 94%{opacity:1} 96%{opacity:0.9} 97%{opacity:1} }
  @keyframes scanmove { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes glitchIn { 0%{transform:translateX(-8px) skewX(-5deg);opacity:0;filter:hue-rotate(90deg)} 30%{transform:translateX(4px) skewX(2deg);opacity:0.7;filter:hue-rotate(-30deg)} 60%{transform:translateX(-2px) skewX(-1deg);opacity:0.9;filter:hue-rotate(10deg)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes glitchFlash { 0%{background:transparent} 10%{background:rgba(0,229,255,0.08)} 20%{background:rgba(255,0,100,0.05)} 30%{background:transparent} 40%{background:rgba(0,100,255,0.06)} 50%,100%{background:transparent} }
  @keyframes marquee { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
  @keyframes coinGlow { 0%,100%{box-shadow:inset 0 0 6px rgba(255,184,0,0.25),0 0 4px rgba(255,184,0,0.1)} 50%{box-shadow:inset 0 0 12px rgba(255,184,0,0.6),0 0 10px rgba(255,184,0,0.2)} }
  @keyframes hiddenPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes crtOn { 0%{clip-path:inset(49.5% 0 49.5% 0);filter:brightness(8)} 15%{clip-path:inset(40% 0 40% 0);filter:brightness(3)} 40%{clip-path:inset(10% 0 10% 0);filter:brightness(1.5)} 70%{clip-path:inset(2% 0 2% 0);filter:brightness(1.1)} 100%{clip-path:inset(0 0 0 0);filter:brightness(1)} }
  @keyframes phosphorPulse { 0%,100%{text-shadow:0 0 4px rgba(0,255,140,0.3),0 0 12px rgba(0,255,140,0.1)} 50%{text-shadow:0 0 6px rgba(0,255,140,0.4),0 0 18px rgba(0,255,140,0.15)} }
  @keyframes coinTextPulse { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
  @keyframes fadeHints { 0%{opacity:0.4} 70%{opacity:0.4} 100%{opacity:0} }
  @keyframes testPattern { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
  .crt-screen{animation:flicker 14s infinite}
  .crt-glass{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 40%,transparent 60%,rgba(255,255,255,0.01) 100%);pointer-events:none;z-index:91;border-radius:inherit}
  .crt-curvature{position:absolute;inset:0;border-radius:50%/3%;box-shadow:inset 0 0 60px rgba(0,0,0,0.4);pointer-events:none;z-index:89}
  .crt-phosphor{text-shadow:0 0 4px rgba(0,255,140,0.25),0 0 12px rgba(0,255,140,0.08),-0.7px 0 0 rgba(219,116,151,0.2),0.7px 0 0 rgba(40,100,255,0.15)}
  .crt-noise{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");background-size:128px;pointer-events:none;z-index:88;opacity:0.04;mix-blend-mode:screen}
  .scanline-bar{position:absolute;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,0.03);animation:scanmove 8s linear infinite;pointer-events:none;z-index:100}
  .blink-cursor{animation:blink 1s step-end infinite}
  .project-row{transition:all 0.2s ease;cursor:pointer}
  .project-row:hover{background:rgba(219,116,151,0.03)!important;transform:translateX(4px)}
  .btn-cabinet{transition:all 0.15s ease;cursor:pointer;user-select:none}
  .btn-cabinet:hover{transform:scale(1.1);filter:brightness(1.3)}
  .btn-cabinet:active{transform:scale(0.95);filter:brightness(0.8)}
  @keyframes btnGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.04)}}
  .btn-action{animation:btnGlow 5s ease-in-out infinite;transition:transform 0.12s ease,filter 0.12s ease;cursor:pointer;user-select:none}
  .btn-action:hover{transform:scale(1.10);filter:brightness(1.35)!important}
  .btn-action:active{transform:scale(0.92);filter:brightness(0.75)!important}
  .hidden-row{animation:hiddenPulse 3s ease-in-out infinite}
  .glitch-enter{animation:glitchIn 0.5s ease-out}
  .crt-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,229,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.01) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:42}
  @keyframes gameHighlight { 0%{box-shadow:0 0 20px rgba(255,34,102,0.6),inset 0 0 10px rgba(255,34,102,0.15)} 100%{box-shadow:none} }
  .game-highlight{animation:gameHighlight 2s ease-out forwards}
  .coin-slot{animation:coinGlow 6s ease-in-out infinite;cursor:pointer;transition:all 0.2s ease}
  .coin-slot:hover{box-shadow:inset 0 0 12px rgba(255,184,0,0.6),0 0 10px rgba(255,184,0,0.2)!important}
  .coin-slot:active{transform:scale(0.95)}
  .cabinet-body{box-shadow:0 20px 80px rgba(0,229,255,0.07),0 0 120px rgba(0,229,255,0.04),0 40px 60px rgba(0,0,0,0.5);position:relative}
  .cabinet-body::after{content:'';position:absolute;bottom:-40px;left:10%;right:10%;height:40px;background:radial-gradient(ellipse at center,rgba(0,229,255,0.08) 0%,transparent 70%);pointer-events:none;filter:blur(10px)}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,0.3)}
  ::-webkit-scrollbar-thumb{background:rgba(0,229,255,0.2);border-radius:2px}
  @keyframes synthEnter { 0%{transform:translateX(-6px);opacity:0;filter:hue-rotate(30deg) brightness(2)} 40%{transform:translateX(2px);opacity:0.8;filter:hue-rotate(-10deg) brightness(1.3)} 100%{transform:none;opacity:1;filter:none} }
  @keyframes coherenceEnter { 0%{opacity:0;letter-spacing:0.4em;filter:blur(3px)} 60%{opacity:0.9;letter-spacing:0.05em;filter:blur(0.5px)} 100%{opacity:1;letter-spacing:inherit;filter:none} }
  @keyframes gameEnter { 0%{opacity:0;transform:scaleY(0.1)} 50%{opacity:0.7;transform:scaleY(1.05)} 100%{opacity:1;transform:scaleY(1)} }
  @keyframes announceIn { 0%{opacity:0;transform:translateY(8px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
  @keyframes tier3Overlay { 0%{opacity:0} 10%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
  .tier-1-enter{animation:synthEnter 0.6s ease-out}
  .tier-2-enter{animation:coherenceEnter 0.7s ease-out}
  .tier-3-enter{animation:gameEnter 0.5s ease-out}
  .coin-announce{position:absolute;left:50%;transform:translateX(-50%);animation:announceIn 1.6s ease forwards;font-family:'Press Start 2P',monospace;pointer-events:none;z-index:200}
  .coin-announce.tier-1{bottom:120px;font-size:8px;color:#FFB800}
  .coin-announce.tier-2{bottom:120px;font-size:8px;color:#00ddbb}
  .coin-announce.tier-3{top:50%;transform:translate(-50%,-50%);font-size:14px;color:#ff2266;text-align:center;animation:tier3Overlay 2.8s ease forwards;background:rgba(0,0,0,0.9);padding:20px 30px;border:1px solid #ff2266}
  @media (prefers-reduced-motion: reduce) {
    .crt-screen, .scanline-bar, .blink-cursor, .hidden-row, .coin-slot, .btn-action,
    .glitch-enter, .tier-1-enter, .tier-2-enter, .tier-3-enter, .coin-announce { animation: none !important; }
  }
`;
