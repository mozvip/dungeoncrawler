# Dungeon Crawler

A retro-style 3D dungeon crawler with modern WebGL graphics, implemented using Three.js.

![Dungeon Crawler](screenshots/game.png)

## Features

- First-person dungeon exploration
- Grid-based movement system
- Four distinct projectile types:
  - **Fireball**: Standard damage dealer with fire effects
  - **Ice Arrow**: Fast-moving projectile with freezing properties
  - **Lightning**: High-speed electric attack
  - **Gas Cloud**: Area-of-effect toxic cloud that expands over time
- Dynamic lighting effects
- Immersive sound effects and background music
- Trap system with animated hazards
- Modular level design using JSON configuration

## Controls

### Movement
- **W/Up Arrow**: Move forward
- **S/Down Arrow**: Move backward
- **A**: Strafe left
- **D**: Strafe right
- **Q/Left Arrow**: Turn left
- **E/Right Arrow**: Turn right

### Combat
- **Left Click**: Fire a fireball
- **Right Click**: Fire an ice arrow
- **Space**: Fire lightning
- **Middle Click/G**: Release gas cloud
- **M**: Toggle background music

## Installation

1. Clone the repository:
```
git clone https://github.com/mozvip/dungeoncrawler.git
```

2. Navigate to the project directory:
```
cd dungeoncrawler
```

3. Serve the files using a local web server:
   - Using Python: `python -m http.server`
   - Using Node.js: `npx serve`
   - Using VSCode: Install the "Live Server" extension and click "Go Live`

4. Open your browser and go to `http://localhost:8000` (or the port provided by your web server)

## Project Structure

- **js/**
  - **dungeon.js**: Handles level generation and rendering
  - **game.js**: Main game loop and input handling
  - **player.js**: Player state and movement
  - **projectile.js**: Base projectile class
  - **sound.js**: Audio management
  - **projectiles/**: Individual projectile type implementations
    - **Fireball.js**: Fireball projectile
    - **IceArrow.js**: Ice arrow projectile
    - **Lightning.js**: Lightning projectile
    - **GasCloud.js**: Gas cloud projectile
- **css/**: Styling for the game UI
- **assets/**: Game assets (textures, sounds, etc.)
- **levels/**: JSON level definitions

## Development

### Adding New Levels

Create a new JSON file in the `levels/` directory with the following structure:

```json
{
  "name": "Level Name",
  "width": 10,
  "height": 10,
  "grid": [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ],
  "playerStart": {
    "x": 1,
    "y": 1,
    "direction": 1
  },
  "traps": [
    {"x": 3, "y": 5, "type": "spikes"}
  ]
}
```

### Adding New Projectile Types

1. Create a new class file in `js/projectiles/` that extends the base `Projectile` class
2. Implement the required methods: `createProjectile()`, `updateVisuals()`, `createImpactEffect()`
3. Add the projectile script to `index.html`
4. Update the `Game` class to include a method for firing the new projectile

## Credits

- Three.js: https://threejs.org/
- Sound effects: Various sources (see attribution in individual files)
- Inspiration: Classic dungeon crawlers like Eye of the Beholder, Dungeon Master, and Legend of Grimrock

## License

MIT License - See LICENSE file for details
