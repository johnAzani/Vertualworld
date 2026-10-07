# Vertualworld · Abuja Life prototype

**Abuja Life** is a playable, stylised 3D neighbourhood life-simulation prototype set in **Abuja, Federal Capital Territory, Nigeria**. The world is schematic, not a street-for-street map of a named district. Resident profiles, needs, career progress, inventory and fictional game credits are stored locally on the player’s device. “Abuja Life” is a working prototype title; check name, domain and trademark availability before a public launch.

For the researched zero-cash launch strategy and long-term business roadmap, see [`docs/zero-budget-abuja-venture-plan.md`](docs/zero-budget-abuja-venture-plan.md).

For the Abuja-first competitor research—covering direct 3D worlds, local game studios, event platforms, and merchant-discovery substitutes—see [`docs/competitor-landscape-abuja.md`](docs/competitor-landscape-abuja.md).

## Run it

```sh
npm install
npm run dev
```

Open the local URL Vite prints. Run checks with `npm test`, and build a production bundle with `npm run build`.

## Explore

- **W / A / S / D** or **arrow keys** to walk
- **Shift** to run, **Space** to jump
- **Drag** on the world to look around; press **V** or tap the eye button to switch between third-person and first-person. In first-person, drag up/down to look vertically; while driving, first-person looks through the windscreen and third-person follows behind the car as it turns
- Press **O** or tap the globe button for **World View**, a high-angle overview of the whole neighbourhood; drag to orbit around the city, then press O or tap **Return to resident** to go back
- House walls, tree trunks, and rocks are solid, with collisions that let you slide along them; jumps have a short input buffer, forgiving coyote time, and lighter air steering
- House 01 has an enterable, furnished interior with a living room, kitchen, and bedroom. The **Unity Court** home app lets you rent Houses 02–04 from named NPC landlords with fictional in-game credits; move-in charges the first month plus a refundable deposit, rent comes due every 30 real-world days and is paid manually in the home app; leases, balances, and purchases save locally on this device
- Visit **Unity Court**, the four-home neighbourhood east of the greenway. At your current home’s front door, press **E** or tap the prompt to enter; use **E** by the inside doorway to head back outside, and press **L** (or tap the light control) to toggle the lamps while indoors. Rented homes use the same furnished interior and can be ended from the home app
- A car is parked beside your front walk. Press **E** or tap the car prompt to enter; use **W/S** to drive, **A/D** or the touch joystick to steer, **Space** or the brake pedal to slow down, the accelerator pedal to move on touch screens, and **E** to get out
- Visit **Civic Café** and **Unity Market** beside the connected street grid, or meet at **Unity Community Hall**, a shaded neighbourhood forecourt near the local service cluster. Buy drinks, fresh food, produce, pantry goods, and groceries with fictional game credits; items are added to a locally saved bag and can only be purchased while standing at the shop
- Explore the street grid linking Unity Court, **Unity Circle**, and **Abuja Community Stadium**. The car and Abuja City Bus use the connected roads
- **Abuja City Rail** serves rail terminals at all three hubs. Board when the train arrives, then press **E** or tap **Request Stop** to alight at the next terminal
- **Abuja City Bus** shuttles use matching bus terminals at all three hubs. Board the arriving bus with **E** or the prompt; request your next stop onboard. The live phone map shows the street grid, bus route, rail stops, and bus terminals
- Follow the western path branch to **Abuja Community Stadium**. At the entrance, press **E** or tap **Watch Match** for a pitch-following broadcast view with a live score and clock; press **E** or tap **Return to World** to keep exploring. The Capital Stars play Savannah United; the crowd celebrates goals and the floodlights come on after dark
- Create a resident with a chosen name, hometown and outfit; the outfit changes your avatar. The **Life** app tracks energy, fullness, freshness, mood and connection. Meters drift gently only while the game is open; rest inside your home, eat items from your bag, or check in with Nia. Low needs never block exploration
- Use the **Work** app to choose a Civic Café assistant, Unity Market clerk or stadium steward role. Walk to the actual workplace, clock in and answer three neighbour requests to earn fictional game credits and career XP; repeat shifts to progress through local ranks
- The **Life** app also tracks first-day goals for visiting local places, trying food, resting, connecting with Nia, working and attending a match
- Open the in-world field phone with the phone button or **P**: check your live map, message Nia, track glow seeds, manage rentals, browse the café and market, view the local game-wallet balance and activity, preview demo-only payment flows, and save a private field note on this device
- On touch screens, use the joystick and jump button; tap the eye button in the top bar to change view
- Find three glowing seeds tucked around the neighbourhood

The terrain, vegetation, Aso Rock-inspired distant silhouette, paths, civic plaza, homes, community hall, stadium, transport and maps are generated in Three.js—no external art assets required. The surrounding landscape is inland savannah rather than an ocean; the landmark silhouette is illustrative, not a geographic survey. The planning assumptions and sources are recorded in [`docs/abuja-planning-brief.md`](docs/abuja-planning-brief.md).

## Rendering performance

Repeated tree parts, rocks and cloud puffs use instanced batches instead of one mesh per piece; the distant ridges are instanced, and the Aso Rock-inspired landmark is a single low-poly mesh. Civic plaza motes share one dynamic batch. The minimap skips redraws while its player marker and collectibles are unchanged. The render loop is capped at 60 FPS and sleeps while the tab is hidden. High-density touch screens are capped at 1.4 device-pixel ratio (1.5 elsewhere). The directional shadow map is 1024² and refreshes at up to 30 Hz while the scene renders at up to 60 FPS; this reduces shadow-pass work, with a small temporal lag on moving shadows. Stadium crowd animation uses distance-based update rates (15–30 Hz in the background, full rate nearby or during the match view), while match/gameplay simulation remains active. Player and car movement use at-most-60 Hz substeps so ordinary 20–60 FPS render variation does not discard movement time; catch-up is deliberately capped at 100 ms to prevent unbounded work after a stall. The large hinterland ground plane does not receive the shadow map to limit GPU work. These settings trade some image sharpness and shadow detail for performance. Append `?perf=1` to the page URL to show averaged FPS, p95 rendered-frame interval, draw calls, triangles, main-thread update/render-submission time, and render pixel ratio. CPU timing is not a GPU timer; results vary by device and should be checked on target phones.

## Bank app and Flutterwave status

The phone’s **Abuja Game Wallet** shows a **local game reference**, fictional in-game credit balance, and recent wallet activity. It is not a real bank account. Top-up, rent, and shop buttons currently open **demo-only previews**: they do not call Flutterwave, generate a transfer account, charge money, add credits, or settle purchases. Any naira amount shown is only a mock checkout input; the app does not use a live exchange rate.

Before test or live Flutterwave payments can be enabled, this static GitHub Pages app needs a **Cloudflare Worker** backend with secrets configured outside the browser, server-side transaction verification, and validated webhooks. The UI intentionally contains no Flutterwave secret and does not collect customer bank or identity details. See Flutterwave’s [API security guidance](https://developer.flutterwave.com/docs/best-practices), [webhook verification](https://developer.flutterwave.com/docs/webhooks), and [NGN virtual account documentation](https://developer.flutterwave.com/docs/ngn-virtual-accounts).

## Preview on your phone

The GitHub Actions workflow builds and publishes the site when this branch or `main` is updated. After the current deployment finishes, open the public site at:

[https://johnazani.github.io/Vertualworld/](https://johnazani.github.io/Vertualworld/)

On phones, use the on-screen joystick and jump button.
