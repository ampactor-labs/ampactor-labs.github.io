import { useState } from "react";
import Lobby from "./components/Lobby";
import ArcadePortfolio from "./ArcadePortfolio";

// Top-level view switch. The lobby is the default landing — it paints instantly.
// The arcade cabinet mounts only when the visitor chooses to explore, so its
// GSAP intro, tunnel canvas, and audio context never spin up behind the lobby.
// Deep link: a #arcade hash boots straight into the cabinet.
export default function App() {
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#arcade"
      ? "cabinet"
      : "lobby",
  );

  return view === "lobby" ? (
    <Lobby onEnter={() => setView("cabinet")} />
  ) : (
    <ArcadePortfolio onExitToLobby={() => setView("lobby")} />
  );
}
