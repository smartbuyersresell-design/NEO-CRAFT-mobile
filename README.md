# NEO CRAFT

A browser voxel sandbox inspired by classic block-building games.

## Features
- Chunk-based procedural world
- Grass, dirt, stone, sand, water, flowers, tall grass, trees, glass
- Day/night cycle
- Mining, building, crafting, tools
- Pigs, cows, and zombies
- Eating system: relieve hunger with porkchop, raw beef, apples, or risky rotten flesh
- Sprinting (Shift) for faster movement at the cost of extra hunger drain
- Craftable glass blocks from sand
- Save/load via localStorage
- Desktop and mobile controls
- Installable as a mobile app (PWA): "Add to Home Screen" on Android/iOS, works offline, fullscreen landscape mode, custom app icon

## Installing as a mobile app
- **Android (Chrome)**: open the site, tap the "📲 Install App" button on the start screen (or the browser's own "Add to Home Screen" prompt). It installs like a native app icon and opens fullscreen.
- **iOS (Safari)**: open the site, tap Share → "Add to Home Screen". iOS doesn't support the install prompt button, but the app icon and fullscreen mode work the same way.
- Once installed, the game works offline thanks to the service worker (`sw.js`), which caches all game files.

## Run
Open `index.html` in a browser.

## Notes
- For offline use, download Three.js locally and replace the CDN link if needed.
- Texture PNG files are placeholders; you can replace them with pixel-art assets later.
