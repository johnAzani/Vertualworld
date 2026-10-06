# Vertualworld

A tiny, playable 3D world built around one simple idea: give a little human somewhere to wander.

## Run it

```sh
npm install
npm run dev
```

Open the local URL Vite prints. Run the economy checks with `npm test`, and build a production bundle with `npm run build`.

## Explore

- **W / A / S / D** or **arrow keys** to walk
- **Shift** to run, **Space** to jump
- **Drag** on the world to look around; press **V** or tap the eye button to switch between third-person and first-person. In first-person, drag up/down to look vertically; while driving, first-person looks through the windscreen and third-person follows behind the car as it turns
- House walls, tree trunks, and rocks are solid, with collisions that let you slide along them; jumps have a short input buffer, forgiving coyote time, and lighter air steering
- House 01 has an enterable, furnished interior with a living room, kitchen, and bedroom. The Meadow Court home app lets you rent Houses 02–04 from named NPC landlords with island credits; move-in charges the first month plus a refundable deposit, rent accrues every 30 real-world days while the game is away, and leases, balances, and purchases save locally on this device
- Visit **Meadow Court**, the four-home estate east of the trail. At your current home’s front door, press **E** or tap the prompt to enter; use **E** by the inside doorway to head back outside, and press **L** (or tap the light control) to toggle the lamps while indoors. Rented cottages use the same furnished interior and can be ended from the home app
- A car is parked beside your front walk. Press **E** or tap the car prompt to enter; use **W/S** to drive, **A/D** or the touch joystick to steer, **Space** or the brake pedal to slow down, the accelerator pedal to move on touch screens, and **E** to get out
- Visit **Fern & Cup** café and **Meadow Market** beside the connected city street grid. Buy drinks, fresh food, produce, pantry goods, and groceries with fictional island credits; items are added to a locally saved bag and can only be purchased while standing at the shop
- Explore the connected city street grid linking the Meadow Court estate, Beacon Circle, and Meadow Park; the car and Island Bus now use a wider network of streets and intersections
- The Island Line now serves full **rail terminals** at **Meadow Court**, **Beacon Circle**, and **Meadow Park**. Board when the train arrives, then press **E** or tap **Request Stop** to alight at the next terminal
- **Island Bus** shuttles use the connected road grid between matching **bus terminals** at all three hubs. Board the arriving bus with **E** or the prompt; request your next stop onboard. The live phone map shows the full street network, bus route, rail terminals, and bus terminals
- Follow the western path branch to **Meadow Park Stadium**. At the entrance, press **E** or tap **Watch Match** for a pitch-following broadcast view with a live score and clock; press **E** or tap **Return to World** to keep exploring. The teams chase and kick the ball, and the floodlights come on after dark
- Meadow Park now has home-and-away dugouts, pitch-side matchday boards that brighten after dark, fuller stands, detailed goal nets and penalty markings, waving corner flags, running players with moving arms, and a crowd that celebrates goals
- Open the in-world field phone with the phone button or **P**: check your live map, message Nia, track glow seeds, manage rentals and rent payments, browse the café and market menus, and save a private field note on this device
- On touch screens, use the joystick and jump button; tap the eye button in the top bar to change view
- Find the three glowing seeds hidden around the island

The island, trees, path, beacon, avatar, Meadow Court estate, Meadow Park, and maps are generated in Three.js—no external art assets required. The sky, moon, stars, estate lighting, and Meadow Park’s floodlights follow the in-world clock.

## Preview on your phone

The GitHub Actions workflow builds and publishes the site when this branch or `main` is updated. After the current deployment finishes, open the public site at:

[https://johnazani.github.io/Vertualworld/](https://johnazani.github.io/Vertualworld/)

On phones, use the on-screen joystick and jump button.
