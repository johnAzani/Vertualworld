# Vertualworld

A tiny, playable 3D world built around one simple idea: give a little human somewhere to wander.

## Run it

```sh
npm install
npm run dev
```

Open the local URL Vite prints. Build a production bundle with `npm run build`.

## Explore

- **W / A / S / D** or **arrow keys** to walk
- **Shift** to run, **Space** to jump
- **Drag** on the world to look around; press **V** or tap the eye button to switch between third-person and first-person. In first-person, drag up/down to look vertically
- Solid house walls stop the player, who can slide along them; House 01 also has an enterable, furnished interior with a living room, kitchen, and bedroom
- Visit **Meadow Court**, the four-home estate east of the trail. At your front door, press **E** or tap the home prompt to enter; use **E** or the prompt by the inside doorway to head back outside, and press **L** or tap the light control to toggle the lamps while indoors
- Open the in-world field phone with the phone button or **P**: check your live map, message Nia, track glow seeds, open the Meadow Court home app, and save a private field note on this device
- On touch screens, use the joystick and jump button; tap the eye button in the top bar to change view
- Find the three glowing seeds hidden around the island

The island, trees, path, beacon, avatar, Meadow Court estate, and map are generated in Three.js—no external art assets required.

## Preview on your phone

The GitHub Actions workflow builds and publishes the site when this branch or `main` is updated. After the current deployment finishes, open the public site at:

[https://johnazani.github.io/Vertualworld/](https://johnazani.github.io/Vertualworld/)

On phones, use the on-screen joystick and jump button.
