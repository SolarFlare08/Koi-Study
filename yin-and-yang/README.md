# Yin and Yang

A silent, fullscreen study garden built with HTML, CSS, and native JavaScript modules. No dependencies or backend. Spotify is optional and uses its official embedded player; the app cannot control other applications on the computer.

Run `npm run dev` and open http://localhost:5173. Run `npm test` for timer and persistence checks, or `npm run build` for module syntax checks. The `dist` directory is the deployable app and can be served by any static web host.

For system-wide capture on Windows, run `npm run capture-hotkey -- 5178` in a second terminal from this folder. Substitute the port printed by your dev server. If the server was running before the update, restart it first. The helper uses the Windows .NET Framework compiler and stays in the tray until you quit it. **Ctrl+Alt+N** opens a note near the pointer, **Ctrl+Enter** saves it, and **Esc** hides the window with the draft intact. Saved notes appear under **Captured thoughts** in the app. The browser capture shortcut also works while the helper is closed.

## Windows desktop app

Extract the Windows x64 package and double-click `Yin and Yang.exe` in the extracted folder. The desktop app uses the Microsoft Edge WebView2 Runtime and runs its bundled Garden in its own window. You can create a Windows shortcut to the executable for easier access.

The desktop app saves to `%LOCALAPPDATA%\Yin and Yang`. To migrate your browser data, use **Backup and restore** in the original tab to download a backup, then restore it in the desktop app. Ctrl+Alt+N uses the bundled Quick Capture helper while the desktop app is open. If the browser helper is already running, quit it from its tray icon before opening the app.

To update, close the app, extract the newer desktop package into a fresh folder, and run its executable. The new app uses the same profile. Updates are manual.

### Version 5.0

The Windows app has a slim draggable window strip, custom controls, and a mountain-and-sun taskbar icon. Double-click the strip to maximize or restore; drag an edge to resize. Fullscreen hides the strip. Per-monitor DPI support follows Microsoft's [.NET Framework high-DPI configuration](https://learn.microsoft.com/en-us/dotnet/desktop/winforms/high-dpi-support-in-windows-forms), so Windows renders the window at the monitor's resolution instead of scaling a low-resolution bitmap. Keep `Yin and Yang.exe.config` beside the executable.

In Garden, the progress ring shows session progress and the label shows the estimated end time. The bell toggles focus and break chimes without overriding master mute or music mode. **Session tools** opens a compact drawer for handoffs, notes, outcomes, and other session actions. Click the daily minutes beneath it to set your focus goal. The default target is 120 minutes; completed focus time counts and skipped sessions remain separate.

**Automatic backups:** ten seconds after opening, then every five minutes while open, changed data gets a portable snapshot. Three automatic restore points are kept separately from five manual restore points. The Windows app also writes to `%LOCALAPPDATA%\Yin and Yang\Backups`, keeping 30 recent files and the first backup from each of the last 14 backed-up days. A normal window close writes a disk backup before exiting. In **Backup and restore**, check status, choose **Back up now**, or **Open backup folder**. Disk backups can be selected through the existing restore preview. These are local copies, not cloud sync; keep an external copy to protect against disk failure. Storage quota failures appear in the backup status. Unsaved text that has not yet entered app storage is not included.

4.x saved data and portable backups remain compatible. Source edits and website updates do **not** update an existing executable's bundled files; build and extract the new desktop package to get them.

For a source build, run `npm run desktop:build` from this folder on 64-bit Windows. The build uses the .NET Framework compiler and downloads the Microsoft WebView2 SDK from NuGet. The executable and ZIP are written under `.local/desktop`. For an offline source build, run `npm run desktop:build -- --sdk-bin "C:/path/to/WebView2 DLLs"` with matching .NET Framework versions of Microsoft.Web.WebView2.Core.dll, Microsoft.Web.WebView2.WinForms.dll, and the x64 WebView2Loader.dll.

## Changing the landscape

`dist/scenery.js` owns the scenic SVG landscape, tool definitions, and smooth daylight progression. `dist/landscape.js` supplies the small blossom artwork. Replace its scenery freely. Keep the five object IDs (`pagoda`, `tasks`, `music`, `notes`, `progress`) to retain tool bindings. Set their positions and responsive sizes in `dist/style.css`. `dist/app.js` owns panels and interactions; `dist/state.js` owns timer and persistence logic. The study data does not depend on the landscape.

`dist/daylight.js` defines the sunrise, daylight, sunset, and night palette, plus the smooth mountain curve helper. Focus progress drives the scene directly on each animation frame; resetting a session returns the sun immediately to the start rather than animating it backwards. The sky, landscape shading, stars, reflections, and text contrast follow the same day cycle.

## Behavior

Timers use an absolute end timestamp, so background throttling and refreshes do not add time. Pausing stores the remaining duration. A finished focus session prepares a break, which starts manually. Settings changes apply to the next session if a session has already started. Resetting, skipping, or switching modes records an unfinished started session as skipped; it never counts as complete. Completed focus minutes and blossoms use the local date when the timer actually finished. Tasks are independent of session completion.

Tasks, selected task, intention, distraction notes, timer, music link, focus mode, and session history persist in localStorage under `yin-and-yang.v1`. Closing a Spotify panel keeps its iframe loaded; removing the player stops it. Fullscreen support depends on browser and embedding permissions. Reduced motion disables landscape animation. Space toggles the timer when the page background is focused, Escape closes a panel, and Tab navigates controls. Panels trap keyboard focus while open.

All study data stays in this browser. Clearing browser storage removes it. Spotify content and optional Google Fonts require a network connection; fallback fonts keep the rest of the app functional offline.

