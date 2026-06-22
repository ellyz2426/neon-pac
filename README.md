# Neon Pac VR

A holodeck-style VR Pac-Man arcade built with [IWSDK](https://iwsdk.dev). Navigate the neon maze, eat pellets, dodge ghosts, and grab power pellets for a chance to strike back.

**[Play Now](https://ellyz2426.github.io/neon-pac/)**

## Gameplay

- Navigate Pac-Man through the classic maze to eat all pellets
- Avoid four ghosts with unique AI personalities:
  - **Blinky** (red): Direct chase -- always targets your position
  - **Pinky** (pink): Ambush -- targets 4 tiles ahead of you
  - **Inky** (cyan): Flanking -- uses Blinky's position to flank
  - **Clyde** (orange): Shy -- chases from afar, scatters when close
- Grab power pellets to make ghosts vulnerable -- eat them for bonus points
- Clear all pellets to advance to the next level (ghosts get faster!)
- Ghost scoring: 200, 400, 800, 1600 for consecutive eats per power pellet

## Features

- **Classic Pac-Man maze** with authentic layout and ghost house
- **4 Ghost AI personalities** with scatter/chase cycle
- **Power pellet mechanics** with frightened mode
- **Level progression** with increasing difficulty
- **High score persistence** via localStorage
- **4 PanelUI panels** -- HUD, menu, game over, pause (zero HTML DOM UI)
- **Procedural audio** -- waka-waka, power pellet fanfare, ghost eat, death, level complete
- **Neon aesthetic** -- glowing blue walls, edge highlighting, atmospheric fog
- **Dual runtime** -- full VR + browser-first

## Controls

### VR (Quest / WebXR)
| Input | Action |
|-------|--------|
| Thumbstick | Move Pac-Man |
| A | Start / Select |
| B | Pause |

### Browser
| Input | Action |
|-------|--------|
| Arrow Keys / WASD | Move Pac-Man |
| Space / Enter | Start / Select |
| ESC / P | Pause |

## Tech

- Built with [IWSDK](https://iwsdk.dev) 0.4.x (Immersive Web SDK)
- 4 PanelUI spatial panels -- zero HTML DOM UI
- ECS architecture with GameSystem and UISystem
- Dual runtime: full VR + browser-first
- Procedural audio via Web Audio API
- InstancedMesh walls for performance

## Development

```bash
npm install
npx iwsdk dev
```

## License

MIT
