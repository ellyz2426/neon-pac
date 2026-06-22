# Neon 2048 VR

A holodeck-style VR sliding tile puzzle built with [IWSDK](https://iwsdk.dev). Slide and merge tiles to reach 2048 in immersive 3D.

**[Play Now](https://ellyz2426.github.io/neon-2048/)**

## Gameplay

- Slide tiles in four directions on a grid
- Matching tiles merge into one tile with double the value
- After each move, a new tile (2 or 4) spawns in a random empty cell
- Reach the 2048 tile to win — or keep going for a higher score
- Game over when no moves remain

## Features

- **6 Game Modes**: Classic, Time Attack, Endless, Speed Run, Zen, Daily Challenge
- **3 Difficulty Levels**: Easy (4x4, always 2s), Normal (4x4, 90/10), Hard (5x5, 80/20)
- **70+ Achievements** with unlock tracking — tile milestones, score goals, mode-specific, career stats
- **5 Tile Skins**: Neon, Crimson, Ocean, Forest, Sunset
- **3 Arena Themes**: Holodeck, Deep Space, Cyberpunk
- **Undo System** with 20-move stack (disabled in Daily mode)
- **Statistics Tracking**: games played, wins, best score, highest tile, total merges, win rate
- **Daily Challenge**: seeded PRNG for consistent puzzles across all players
- **Smooth Animations**: slide, merge pop, spawn grow with easing
- **Particle Effects**: merge explosions with value-colored particles
- **Procedural Audio**: slide, merge, spawn, win, game over, achievement sounds

## Controls

### VR (Quest / WebXR)
| Input | Action |
|-------|--------|
| Thumbstick | Slide tiles |
| B / Y | Pause |
| Trigger | Select menu items |

### Browser
| Input | Action |
|-------|--------|
| Arrow Keys / WASD | Slide tiles |
| Z | Undo last move |
| ESC | Pause |

## Tech

- Built with [IWSDK](https://iwsdk.dev) 0.4.x (Immersive Web SDK)
- 10 PanelUI spatial panels — zero HTML DOM UI
- ECS architecture with GameSystem and UISystem
- Dual runtime: full VR + browser-first
- Procedural audio via Web Audio API

## Development

```bash
npm install
npx iwsdk dev
```

## License

MIT
