# Yin and Yang

A silent, fullscreen study garden built with HTML, CSS, and native JavaScript modules. No dependencies or backend. Spotify is optional and uses its official embedded player; the app cannot control other applications on the computer.

Run `npm run dev` and open http://localhost:5173. Run `npm test` for timer and persistence checks, or `npm run build` for module syntax checks. The `dist` directory is the deployable app and can be served by any static web host.

## Changing the landscape

`dist/scenery.js` owns the scenic SVG landscape, tool definitions, and smooth daylight progression. `dist/landscape.js` supplies the small blossom artwork. Replace its scenery freely. Keep the five object IDs (`pagoda`, `tasks`, `music`, `notes`, `progress`) to retain tool bindings. Set their positions and responsive sizes in `dist/style.css`. `dist/app.js` owns panels and interactions; `dist/state.js` owns timer and persistence logic. The study data does not depend on the landscape.

`dist/daylight.js` defines the sunrise, daylight, sunset, and night palette, plus the smooth mountain curve helper. Focus progress drives the scene directly on each animation frame; resetting a session returns the sun immediately to the start rather than animating it backwards. The sky, landscape shading, stars, reflections, and text contrast follow the same day cycle.

## Behavior

Timers use an absolute end timestamp, so background throttling and refreshes do not add time. Pausing stores the remaining duration. A finished focus session prepares a break, which starts manually. Settings changes apply to the next session if a session has already started. Resetting, skipping, or switching modes records an unfinished started session as skipped; it never counts as complete. Completed focus minutes and blossoms use the local date when the timer actually finished. Tasks are independent of session completion.

Tasks, selected task, intention, distraction notes, timer, music link, focus mode, and session history persist in localStorage under `yin-and-yang.v1`. Closing a Spotify panel keeps its iframe loaded; removing the player stops it. Fullscreen support depends on browser and embedding permissions. Reduced motion disables landscape animation. Space toggles the timer when the page background is focused, Escape closes a panel, and Tab navigates controls. Panels trap keyboard focus while open.

All study data stays in this browser. Clearing browser storage removes it. Spotify content and optional Google Fonts require a network connection; fallback fonts keep the rest of the app functional offline.

