# Installing PI Academy

## Desktop app (recommended)

Installers are built by GitHub Actions (`.github/workflows/release.yml`) for:

| Platform | Files |
|---|---|
| Windows 10/11 | `.msi` and `.exe` (NSIS) |
| macOS (Apple silicon and Intel) | `.dmg` (universal) |
| Linux | `.AppImage` and `.deb` |

To get them:

1. Open the repository on GitHub, go to **Actions**, choose **Release installers** and click
   **Run workflow**. Or push a tag such as `v0.1.0`, which also creates a draft release.
2. When the run finishes, download the installer for your system from the run's **Artifacts**
   section (or from the draft release).
3. Run the installer.

The installers are **not code-signed** yet, so the first launch shows a warning:

- **Windows:** SmartScreen says "Windows protected your PC". Click **More info**, then **Run anyway**.
- **macOS:** right-click the app, choose **Open**, then **Open** again. If macOS says the app is
  damaged, run `xattr -cr "/Applications/PI Academy.app"` once in Terminal.
- **Linux:** make the AppImage executable (`chmod +x PI*.AppImage`) and run it, or install the
  `.deb` with `sudo apt install ./pi-academy_*.deb`.

Your data lives in the app data folder (for example `%APPDATA%\com.piacademy.app` on Windows) and
survives updates. Back it up from **Settings → Backup and restore**.

## Web app (PWA)

1. Build and serve it: `npm ci && npm run build`, then host the `dist/` folder on any static web
   server over HTTPS (or `npm run preview` for a local test).
2. Open it in Chrome, Edge or Safari and choose **Install** (address bar) or **Add to Home Screen**.
3. After the first load it works offline.

Web app data is kept in the browser's storage for that site. Clearing site data deletes it, so
export a backup from Settings first.

## Building from source

Prerequisites: Node.js 22, and for the desktop app Rust (stable) plus the
[Tauri 2 prerequisites](https://tauri.app/start/prerequisites/) for your platform.

```bash
npm ci
npm run build              # web app into dist/
npm run tauri build        # desktop installer for the current platform
```

Cloud containers without a system WebKit cannot build the desktop app; use the GitHub Actions
workflow instead.
