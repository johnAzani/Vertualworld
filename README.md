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
- **Drag** on the world to look around; press **V** or tap the eye button to switch between third-person and first-person. In first-person, drag up/down to look vertically; while driving, first-person looks through the windscreen and third-person follows behind the car as it turns
- House walls, tree trunks, and rocks are solid, with collisions that let you slide along them; jumps have a short input buffer, forgiving coyote time, and lighter air steering
- House 01 has an enterable, furnished interior with a living room, kitchen, and bedroom
- Visit **Meadow Court**, the four-home estate east of the trail. At your front door, press **E** or tap the home prompt to enter; use **E** or the prompt by the inside doorway to head back outside, and press **L** or tap the light control to toggle the lamps while indoors
- A car is parked beside your front walk. Press **E** or tap the car prompt to enter; use **W/S** to drive, **A/D** or the touch joystick to steer, **Space** or the brake pedal to slow down, the accelerator pedal to move on touch screens, and **E** to get out
- Follow the western path branch to **Meadow Park Stadium**. At the entrance, press **E** or tap **Watch Match** for a pitch-following broadcast view with a live score and clock; press **E** or tap **Return to World** to keep exploring. The teams chase and kick the ball, and the floodlights come on after dark
- Open the in-world field phone with the phone button or **P**: check your live map, message Nia, track glow seeds, open the Meadow Court home app, and save a private field note on this device
- On touch screens, use the joystick and jump button; tap the eye button in the top bar to change view
- Find the three glowing seeds hidden around the island

The island, trees, path, beacon, avatar, Meadow Court estate, Meadow Park, and maps are generated in Three.js—no external art assets required. The sky, moon, stars, estate lighting, and Meadow Park’s floodlights follow the in-world clock.

## Preview on your phone

The GitHub Actions workflow builds and publishes the site when this branch or `main` is updated. After the current deployment finishes, open the public site at:

[https://johnazani.github.io/Vertualworld/](https://johnazani.github.io/Vertualworld/)

On phones, use the on-screen joystick and jump button.
