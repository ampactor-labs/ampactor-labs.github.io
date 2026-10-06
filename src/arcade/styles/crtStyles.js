import { FRINGE, PALETTE, alpha } from "../palette";
// CRT visual styles — keyframe animations and class rules for the arcade cabinet UI.
// Fonts are loaded via <link> in index.html (not @import here).
export const crtStyles = `
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .attract-start:hover, .attract-start:focus-visible { animation: none !important; opacity: 1; filter: brightness(1.2); }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes coinGlow { 0%,100%{box-shadow:inset 0 0 6px ${alpha(PALETTE.coin, 0.25)},0 0 4px ${alpha(PALETTE.coin, 0.1)}} 50%{box-shadow:inset 0 0 12px ${alpha(PALETTE.coin, 0.6)},0 0 10px ${alpha(PALETTE.coin, 0.2)}} }
  @keyframes hiddenPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes crtOn { 0%{clip-path:inset(49.5% 0 49.5% 0);filter:brightness(8)} 15%{clip-path:inset(40% 0 40% 0);filter:brightness(3)} 40%{clip-path:inset(10% 0 10% 0);filter:brightness(1.5)} 70%{clip-path:inset(2% 0 2% 0);filter:brightness(1.1)} 100%{clip-path:inset(0 0 0 0);filter:brightness(1)} }
  @keyframes coinTextPulse { 0%,100%{opacity:0.5} 50%{opacity:0.8} }
  @keyframes fadeHints { 0%{opacity:0.4} 70%{opacity:0.4} 100%{opacity:0} }
  @keyframes testPattern { 0%,60%{opacity:1} 100%{opacity:0} }
  /* The tube's ground: indigo over void, the lit grid (8 px cells, 6 px on a
     phone) and four brightness bands, painted once. Above it, under the
     content, one shade pulls the edges down into the void. */
  .tube-ground{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(180deg,transparent 0 58%,${alpha(PALETTE.lit, 0.05)} 58% 72%,${alpha(PALETTE.lit, 0.09)} 72% 86%,${alpha(PALETTE.lit, 0.13)} 86% 100%),linear-gradient(${alpha(PALETTE.muted, 0.11)} 1px,transparent 1px),linear-gradient(90deg,${alpha(PALETTE.muted, 0.11)} 1px,transparent 1px),radial-gradient(ellipse at center,var(--cab-tube) 0%,var(--cab-void) 80%);background-size:100% 100%,8px 8px,8px 8px,100% 100%}
  @media (max-width: 480px) { .tube-ground{background-size:100% 100%,6px 6px,6px 6px,100% 100%} }
  .tube-shade{position:absolute;inset:0;z-index:40;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,${alpha(PALETTE.void, 0.55)} 100%)}
  /* Bloom in the text's own colour: a soft stop on every readout, two on the
     signage, and the chromatic split (magenta left, cyan right) on signage. */
  .cabinet-scope{--track-pixel:0.125em;--track-ui:0.1em;--track-display:0.06em;--bloom-text:0 0 4px color-mix(in srgb, currentColor 35%, transparent);--bloom-signage:0 0 6px color-mix(in srgb, currentColor 60%, transparent),0 0 24px color-mix(in srgb, currentColor 28%, transparent);--fringe:-1.5px 0 0 ${alpha(PALETTE.voice, 0.5)},1.5px 0 0 ${alpha(PALETTE.mark, 0.5)}}
  .crt-phosphor{text-shadow:var(--bloom-text)}
  .signage{text-shadow:var(--bloom-signage),var(--fringe)}
  .blink-cursor{animation:blink 1s step-end infinite}
  /* The verbs. One entrance for everything that comes onto the tube: a short
     dash from the left that leaves a magenta and a cyan after-image (transform
     and opacity only on a phone). Screen changes cut the old frame out and
     dash the new one in through the view-transition API. PRESS START, INSERT
     COIN and the skip hint breathe instead of blinking. */
  @keyframes dashIn { 0%{transform:translateX(-16px);opacity:0;filter:drop-shadow(-8px 0 0 ${alpha(PALETTE.voice, 0.6)}) drop-shadow(8px 0 0 ${alpha(PALETTE.mark, 0.6)})} 100%{transform:none;opacity:1;filter:drop-shadow(0 0 0 transparent) drop-shadow(0 0 0 transparent)} }
  @keyframes dashInLite { 0%{transform:translateX(-16px);opacity:0} 100%{transform:none;opacity:1} }
  @keyframes cutOut { to{opacity:0} }
  @keyframes breathe { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .dash-in{animation:dashIn 0.26s cubic-bezier(0.16,1,0.3,1) both}
  .tier-1-enter{animation:dashIn 0.26s cubic-bezier(0.16,1,0.3,1) both}
  .tier-2-enter{animation:dashIn 0.26s cubic-bezier(0.16,1,0.3,1) 0.08s both}
  .tier-3-enter{animation:dashIn 0.26s cubic-bezier(0.16,1,0.3,1) 0.16s both}
  .crt-phosphor{view-transition-name:tube}
  ::view-transition-old(root),::view-transition-new(root){animation:none}
  ::view-transition-old(tube){animation:cutOut 0.03s steps(1,end) both}
  ::view-transition-new(tube){animation:dashInLite 0.22s cubic-bezier(0.16,1,0.3,1) both}
  /* The idle layer: one slow sweep of light across the grid, on its own
     transform layer; off on a phone and under reduced motion. */
  @keyframes sweep { to{transform:translateX(100%)} }
  .tube-sweep{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(100deg,transparent 42%,${alpha(PALETTE.muted, 0.07)} 50%,transparent 58%);transform:translateX(-100%);animation:sweep 9s linear infinite;will-change:transform}
  /* The coin: the slit takes the drop, a ring blooms from the slot, then the
     stamp lands on the tube (coin-announce) and the rows light in order. */
  @keyframes coinDrop { 0%{transform:translateY(-6px);opacity:0} 100%{transform:none;opacity:1} }
  @keyframes coinRing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.2);opacity:0} }
  .coin-slot.lit .slit{animation:coinDrop 0.12s ease-in both}
  .coin-slot.lit::after{content:'';position:absolute;inset:-2px;border-radius:12px;border:2px solid ${alpha(PALETTE.coin, 0.7)};animation:coinRing 0.6s ease-out 0.12s both;pointer-events:none}
  /* The marquee sets its own duration inline from its text's length (constants.js). */
  .marquee-track{position:absolute;display:flex;white-space:nowrap;width:max-content;text-shadow:none;animation:marquee 90s linear infinite}
  .project-row{transition:all 0.2s ease;cursor:pointer}
  .project-row:hover{background:${alpha(FRINGE.warm, 0.03)}!important;transform:translateX(4px)}
  /* The deck's keys: black with a lilac edge, lit magenta while pressed; flat
     rings for B (hot magenta) and A (cyan); 8 px lilac labels. On a coarse
     pointer every key, the coin, the pills and the chips grow to a 44 px
     hit area. */
  .btn-cabinet{transition:transform 0.12s ease,background 0.12s ease,border-color 0.12s ease;cursor:pointer;user-select:none}
  .btn-cabinet:hover{transform:scale(1.08)}
  .btn-cabinet:active{transform:scale(0.95);background:${alpha(PALETTE.voice, 0.35)};border-color:var(--cab-voice);color:var(--cab-text)}
  .dpad-key{position:relative;width:30px;height:30px;border-radius:4px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,${alpha(PALETTE.raised, 0.9)},var(--cab-void));color:var(--cab-muted);border:1px solid ${alpha(PALETTE.muted, 0.35)};box-shadow:inset 0 1px 0 ${alpha(PALETTE.white, 0.06)}}
  .dpad-centre{width:30px;height:30px;border-radius:4px;background:var(--cab-void);border:1px solid ${alpha(PALETTE.muted, 0.18)}}
  .btn-action{position:relative;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--cab-void);transition:transform 0.12s ease,filter 0.12s ease;cursor:pointer;user-select:none}
  .btn-action.btn-b{border:2px solid var(--cab-hot);color:var(--cab-danger);box-shadow:0 0 14px ${alpha(PALETTE.hot, 0.45)},inset 0 0 10px ${alpha(PALETTE.hot, 0.18)}}
  .btn-action.btn-a{border:2px solid var(--cab-mark);color:var(--cab-mark);box-shadow:0 0 14px ${alpha(PALETTE.mark, 0.45)},inset 0 0 10px ${alpha(PALETTE.mark, 0.18)}}
  .btn-action:hover{transform:scale(1.08);filter:brightness(1.25)}
  .btn-action:active{transform:scale(0.92);filter:brightness(0.8)}
  .panel-label{font-family:'Press Start 2P',monospace;font-size:8px;color:var(--cab-muted);letter-spacing:var(--track-pixel);user-select:none}
  /* A narrow deck: the 8 px labels are wider than their buttons, so the
     padding, the gap between B and A and the tracking come in, and the
     AMPACTOR sign keeps its room between the d-pad and the buttons. */
  @media (max-width: 480px) {
    .est-line{display:none}
    .cabinet-body{padding:10px 12px 12px!important}
    .action-cluster{gap:8px!important}
    .panel-label{letter-spacing:0}
    .brand-sign{letter-spacing:0!important}
  }
  @media (pointer: coarse) {
    .dpad-key,.dpad-centre{width:36px;height:36px}
    /* An absolute child is placed from inside the border, so each inset is
       the margin plus the border: 36 + 2 x (4 + 1) = 44 for a key, and
       20 + 2 x (12 + 2) = 44 tall for the coin slot. */
    .dpad-key::before,.coin-slot::before,.btn-action::before{content:'';position:absolute;inset:-5px}
    .coin-slot::before{inset:-14px -5px}
    /* INSERT COIN breathes, and while its opacity dips it paints as its own
       layer over the slot's margin; the slot stays on top, so a tap on the
       words drops the coin too. */
    .coin-slot{z-index:1}
    .pill{padding:16px 10px!important}
    .chip{padding:13px 12px!important}
  }
  .hidden-row{animation:hiddenPulse 3s ease-in-out infinite}
  /* The sunset bar, and the sign that hangs a label on it (Sign.jsx). */
  .sunset{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--cab-mark),var(--cab-quiet) 50%,var(--cab-voice))}
  .sign{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .sign .sunset{flex:1;min-width:24px}
  /* The title band: the name on the reference's band, lit cells with dark
     gaps brightening in four steps to the right. The name is mist, which
     clears 6.4:1 on the brightest cell; nothing smaller sits on the band. */
  .title-band{position:relative;align-self:stretch;margin:0 -36px;padding:20px 36px;display:flex;justify-content:center;background:linear-gradient(90deg,var(--cab-band) 0,var(--cab-band) 25%,var(--cab-bandBright) 100%)}
  .title-band::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(90deg,transparent 0 25%,${alpha(PALETTE.muted, 0.05)} 25% 50%,${alpha(PALETTE.muted, 0.09)} 50% 75%,${alpha(PALETTE.muted, 0.14)} 75% 100%),linear-gradient(${alpha(PALETTE.void, 0.55)} 1px,transparent 1px),linear-gradient(90deg,${alpha(PALETTE.void, 0.55)} 1px,transparent 1px);background-size:100% 100%,8px 8px,8px 8px}
  .title-band>*{position:relative}
  /* A readout's header wraps before it clips, and under 420 px its links
     become two tiles the width of the tube. */
  @media (max-width: 420px) {
    .readout-rail{flex-basis:100%;margin-left:0!important}
    .readout-rail>a{flex:1;justify-content:center;text-align:center}
  }
  /* The select screen on a phone: the links and the contact as one set of
     40 px chips (the links first, all of it in view), and a 3 px band in the
     lit row's colour instead of the marquee (the taglines are on the
     readouts and in NOW SHOWING). */
  .phone-rail{gap:6px;flex-wrap:wrap;margin-top:10px}
  .phone-rail a{flex:none;display:inline-flex;align-items:center;min-height:40px;padding:0 12px;border-radius:6px;white-space:nowrap;text-decoration:none}
  @media (max-width: 600px) {
    .desk-only{display:none!important}
    .phone-rail{display:flex!important}
    .marquee-wrap{display:none!important}
    .marquee-band{display:block!important}
  }
  /* The BIOS as a lit checklist: name, verb and a mint OK cell. */
  .bios{display:grid;grid-template-columns:auto auto auto;column-gap:1.5ch;align-items:center;justify-content:start}
  .bios>.wide{grid-column:1/-1}
  .ok-cell{justify-self:start;padding:0 6px;border-radius:3px;line-height:1.6;color:var(--cab-ok);background:${alpha(PALETTE.ok, 0.14)};border:1px solid ${alpha(PALETTE.ok, 0.5)}}
  @keyframes gameHighlight { 0%{box-shadow:0 0 20px ${alpha(PALETTE.hot, 0.6)},inset 0 0 10px ${alpha(PALETTE.hot, 0.15)}} 100%{box-shadow:none} }
  .game-highlight{animation:gameHighlight 2s ease-out forwards}
  .coin-slot{animation:coinGlow 6s ease-in-out infinite;cursor:pointer;transition:all 0.2s ease}
  .coin-slot:hover{box-shadow:inset 0 0 12px ${alpha(PALETTE.coin, 0.6)},0 0 10px ${alpha(PALETTE.coin, 0.2)}!important}
  .coin-slot:active{transform:scale(0.95)}
  .cabinet-body{box-shadow:0 20px 80px ${alpha(PALETTE.voice, 0.10)},0 0 120px ${alpha(PALETTE.lit, 0.14)},0 40px 60px ${alpha(PALETTE.black, 0.5)};position:relative}
  .cabinet-body::after{content:'';position:absolute;bottom:-40px;left:10%;right:10%;height:40px;background:radial-gradient(ellipse at center,${alpha(PALETTE.voice, 0.14)} 0%,transparent 70%);pointer-events:none;filter:blur(10px)}
  .crt-screen ::-webkit-scrollbar{width:4px}
  .crt-screen ::-webkit-scrollbar-track{background:${alpha(PALETTE.black, 0.3)}}
  .crt-screen ::-webkit-scrollbar-thumb{background:${alpha(PALETTE.mark, 0.2)};border-radius:2px}
  /* A cabinet scrolled off the floor stops running its tube effects. */
  .arcade-offscreen .marquee-track,.arcade-offscreen .tube-sweep,
  .arcade-offscreen .coin-slot,.arcade-offscreen .btn-action{animation-play-state:paused!important}
  @keyframes announceIn { 0%{opacity:0;transform:translateY(8px)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1} 100%{opacity:0} }
  @keyframes tier3Overlay { 0%{opacity:0} 10%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
  .coin-announce{position:absolute;left:50%;transform:translateX(-50%);animation:announceIn 1.6s ease forwards;font-family:'Press Start 2P',monospace;pointer-events:none;z-index:200}
  .coin-announce.tier-1{bottom:120px;font-size:8px;color:var(--cab-voice)}
  .coin-announce.tier-2{bottom:120px;font-size:8px;color:var(--cab-halo)}
  .coin-announce.tier-3{top:50%;transform:translate(-50%,-50%);font-size:16px;color:var(--cab-danger);text-align:center;animation:tier3Overlay 2.8s ease 0.3s both;background:${alpha(PALETTE.black, 0.9)};padding:20px 30px;border:1px solid var(--cab-danger)}
  .coin-announce.tier-3 span{display:block;margin-top:10px;font-size:8px;letter-spacing:var(--track-pixel);white-space:nowrap;color:var(--cab-text)}
  @media (prefers-reduced-motion: reduce) {
    .blink-cursor, .hidden-row, .coin-slot, .btn-action, .tube-sweep,
    .dash-in, .tier-1-enter, .tier-2-enter, .tier-3-enter, .coin-announce,
    .coin-slot.lit .slit, .coin-slot.lit::after,
    .marquee-track, .attract-start { animation: none !important; }
  }
  /* Mobile: drop the continuous animations that jank low-power GPUs. */
  .desktop-only-flex { display: flex; }
  .mobile-only-block { display: none; }
  @media (max-width: 600px) {
    .btn-action, .coin-slot { animation: none !important; }
    .tube-sweep { display: none !important; }
    .dash-in, .tier-1-enter, .tier-2-enter, .tier-3-enter { animation-name: dashInLite !important; }
    .cabinet-body::after { display: none !important; }
    .desktop-only-flex { display: none !important; }
    .mobile-only-block { display: block !important; }
  }
`;
