// Lines borrowed from the games, films and folklore the cabinet grew up in:
// short, famous, and placed where a real machine would show something. Each
// line's source is here and never on screen. They are idiom, like PRESS
// START, not words about the operator; those are Morgan's (profile.js, WORDS).
// Short lines only, never a lyric, never a passage, and never one every
// developer's site already wears.
export const QUOTES = {
  // A returning visitor is recognised. Metal Gear Solid: Snake, the line as
  // Peace Walker (2010) and Ground Zeroes (2014) have it.
  titleReturn: "KEPT YOU WAITING, HUH?",
  // The locked rows before the coin drops. Jurassic Park (1993), Nedry's
  // lockout: "Ah ah ah! You didn't say the magic word!"
  locked: "YOU DIDN'T SAY THE MAGIC WORD",
  // Under CREDIT ACCEPTED as the hidden programs appear. The Legend of Zelda
  // (1986), the Moblin in the hidden cave.
  coin: "IT'S A SECRET TO EVERYBODY.",
  // TUNNEL_RUN, over GAME OVER. The Unix shell's own words.
  gameOver: "SEGMENTATION FAULT (CORE DUMPED)",
  // TUNNEL_RUN, a score entering the global top ten. Street Fighter II
  // (1991), the interrupt screen when a second player's coin drops.
  challenger: "HERE COMES A NEW CHALLENGER!",
  // TUNNEL_RUN, ANOMALY arrives. Sinistar (1983), the boss's own voice.
  boss: "BEWARE, I LIVE!",
  // /craft/. Donald Knuth, in a memo to Peter van Emde Boas, 1977.
  craft:
    "Beware of bugs in the above code; I have only proved it correct, not tried it.",
};

// The Konami code: up up down down left right left right B A. Typed on the
// keyboard anywhere the panel is live, it drops the coin.
export const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
