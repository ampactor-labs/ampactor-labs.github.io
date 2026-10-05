// Lines borrowed from the games, films and folklore the cabinet grew up in:
// short, famous, and placed where a real machine would show something. Each
// line's source is here and never on screen. They are idiom, like PRESS
// START, not words about the operator; those are Morgan's (profile.js, WORDS).
// Short lines only, never a lyric, never a passage. The 404 page carries one
// more in its own HTML: Super Mario Bros. (1985), Toad.
export const QUOTES = {
  // The title card asks a first visitor. WarGames (1983): Joshua, the WOPR.
  titleFirst: "SHALL WE PLAY A GAME?",
  // A returning visitor is recognised. Metal Gear Solid: Snake, the line as
  // Peace Walker (2010) and Ground Zeroes (2014) have it.
  titleReturn: "KEPT YOU WAITING, HUH?",
  // The attract loop's last frame: the splash every North American cabinet
  // ran in attract mode from 1989 to 2000, credited to the Director of the
  // FBI. A public service announcement, quoted as the artifact it is.
  winners: "WINNERS DON'T USE DRUGS",
  winnersBy: "WILLIAM S. SESSIONS, DIRECTOR, FBI",
  // The locked rows before the coin drops. Jurassic Park (1993), Nedry's
  // lockout: "Ah ah ah! You didn't say the magic word!"
  locked: "YOU DIDN'T SAY THE MAGIC WORD",
  // Under CREDIT ACCEPTED as the hidden programs appear. The Legend of Zelda
  // (1986), the Moblin in the hidden cave.
  coin: "IT'S A SECRET TO EVERYBODY.",
  // Above the controls. The Legend of Zelda (1986), the old man in the first
  // cave, handing over the sword.
  howto: "IT'S DANGEROUS TO GO ALONE! TAKE THIS.",
  // TUNNEL_RUN, over GAME OVER. The Unix shell's own words.
  gameOver: "SEGMENTATION FAULT (CORE DUMPED)",
  // TUNNEL_RUN, a score entering the global top ten. Street Fighter II
  // (1991), the interrupt screen when a second player's coin drops.
  challenger: "HERE COMES A NEW CHALLENGER!",
  // TUNNEL_RUN, the pause screen. xkcd 303, "Compiling" (2007).
  paused: "MY CODE'S COMPILING.",
  // TUNNEL_RUN, ANOMALY arrives. Sinistar (1983), the boss's own voice.
  boss: "BEWARE, I LIVE!",
  // /receipts/. Linus Torvalds, linux-kernel mailing list, 25 August 2000.
  receipts: "Talk is cheap. Show me the code.",
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
