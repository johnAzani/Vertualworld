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
- **Drag** on the world to look around; use the reset-camera button to return to the starting view
- On touch screens, use the on-screen joystick and jump button
- Find the three glowing seeds hidden around the island

The island, trees, path, beacon, avatar, and map are generated in Three.js—no external art assets required.

## Preview on your phone

The GitHub Actions workflow builds and publishes the site to GitHub Pages when this branch or `main` is updated. Once Pages is enabled with **Settings → Pages → Source: GitHub Actions** and the first deployment completes, open:

`https://johnazani.github.io/Vertualworld/`
