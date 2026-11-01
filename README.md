# Poorna Market VR

A static A-Frame streetscape: a modern artistic interpretation of Poorna Market, Visakhapatnam, with traditional character. Six G+2 buildings, 16 distinct shops, Telugu/English signs, flower borders, petal carpets and an original instrumental loop sit behind the preserved plum/gold interface.

## Run locally

With Node.js installed, run from this folder:

```sh
npm start
```

Open http://127.0.0.1:4173. No build or package installation is needed to serve the site. Alternatively, use any static HTTP server. Deploy `index.html` together with `vendor/`, `js/` and `assets/`; the original image assets remain available and unchanged. Headset WebXR needs HTTPS or a trusted localhost context and a compatible browser/device.

## Explore

- Enter the Market for free exploration, or Guided market walk to start at stall 1.
- Drag with a mouse or finger to look; WASD or arrow keys to walk.
- Click/tap the street to glide; click/tap stalls for their stories.
- Previous/Next visits all 16 shops and wraps around.
- Help opens a keyboard-accessible dialog; Escape or Got it closes it.
- Sound toggles the local music loop. Exploration remains available when audio fails.
- Help includes a motion checkbox. System reduced-motion settings disable petals and animated gliding by default.
- The moon button toggles Evening lighting: a dusk sky, softer daylight, warm windows and market lamps. Your choice persists across reloads; press again to return to daylight.
- The market is surrounded by 44 scenic neighborhood buildings, four connecting roads, sidewalks, trees and lamps. The existing shop street remains the walking/tour route.

## Browser checks

```sh
npm ci
npm test
```

On Windows the tests use installed Microsoft Edge. On other systems, install Playwright Chromium with `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL` to choose another installed channel.

The checks cover rendering with external requests blocked, all 16 tour stops, walking, repeated navigation, real ground/stall raycasts, sound state, audio failure, missing-engine recovery, dialog keyboard behavior, desktop/mobile layout, synthesized touch drag/tap, and reduced motion. Captures go in ignored `artifacts/`; failures and traces go in `test-results/`.

See [AUDIT.md](AUDIT.md) for findings, fixes, and remaining verification limits.


## Implementation

- `js/data.js`: 16 shop records and street bounds.
- `js/scene.js`: deterministic material maps, bilingual canvas signs, shared instanced geometry, architecture and category-specific merchandise.
- `js/neighborhood.js`: surrounding city blocks, connected roads, footpaths, trees and street lamps, using the scene's shared geometry batches.
- `js/components.js`: bounded walking and one instanced petal effect.
- `js/app.js`: loading, exploration, tours, Help, reduced motion and responsive camera framing.
- `js/audio.js`: user-triggered local playback, gain ramps, volume/mute persistence, background suspension and retry handling.

No GSAP, Lenis or Vanta runtime is added: A-Frame owns the scene loop and movement. The camera resolution is capped at 1.5× on desktop and 1.25× on coarse-pointer devices. The sun-shadow map updates at startup and on lighting changes. Repeated flowers, produce and architecture share geometry/material batches. Evening lighting uses two local point lights, a warm fill light and emissive windows/lamps; switching modes does not rebuild scene geometry or reset the tour/audio.

## Music and provenance

The user approved an original substitute after the planned Pixabay recording was blocked by its browser challenge. **Golden Hour** is a 60-second original synthetic tabla-and-flute-inspired composition, not a live performance or the Pixabay track. See `assets/README.md` for provenance. Playback begins only after entry; Help offers volume and motion controls. The original composition can be regenerated with `python scripts/compose_music.py` using NumPy/SciPy; Python is not needed to run the site.

The sound player reads `assets/audio/poorna-golden-hour.wav`. To use a different authorized recording later, update the asset path in `js/audio.js`, its provenance notes and relevant audio tests together.
