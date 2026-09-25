# Fonts

Self-hosted so the first paint waits on nobody else's server. The latin
subsets of four families, from the Fontsource packages at 5.3.0, each under
the SIL Open Font License 1.1 (the `LICENSE-*.txt` beside it):

| File | Family | Role |
|---|---|---|
| `inter-latin-wght-normal.woff2` | Inter (variable, 100–900) | prose and product UI |
| `jetbrains-mono-latin-wght-normal.woff2` | JetBrains Mono (variable, 100–800) | readouts, labels, numbers |
| `share-tech-mono-latin-400-normal.woff2` | Share Tech Mono | display, the cabinet |
| `press-start-2p-latin-400-normal.woff2` | Press Start 2P | signage |

The `@font-face` rules, and the metric-matched fallbacks that keep a late font
from moving anything, are in `src/styles/fonts.css`.
