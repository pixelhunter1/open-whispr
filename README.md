# OpenScribe

OpenScribe is a modern, open-source desktop dictation app that uses OpenAI Whisper to transcribe your speech and instantly paste it anywhere. Designed for speed, privacy, and productivity, OpenScribe floats above your workflow and works everywhere you type.

## ✨ Features
- 🎤 **Voice Recording**: Start/stop recording with a click or shortcut
- 🤖 **AI Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- ⌨️ **Auto Paste**: Instantly pastes transcribed text at your cursor
- ⚡ **Global Shortcut**: Toggle the app from anywhere
- 🪟 **Floating Window**: Always-on-top, minimal, and transparent
- 🖥️ **Menu Bar & Dock**: Quick access from the macOS menu bar and dock, with tray menu (Show/Hide, Control Panel, Quit)
- 🛠️ **Control Panel**: Configure dictation key, permissions, and view/copy transcription history
- 💾 **Local Storage**: Transcription history stored locally with better-sqlite3
- 🧩 **Modern Stack**: Electron + Vite + React + Tailwind v4 (no config) + shadcn/ui
- 🔒 **Secure**: Electron security best practices (preload script, context isolation, no node integration)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/open-scribe.git
cd open-scribe
```

### 2. Setup environment variables
Run the setup script to create a `.env` file:
```bash
npm run setup
```
Or manually copy `env.example` to `.env` and add your [OpenAI API key](https://platform.openai.com/api-keys).

### 3. Install dependencies (Electron + React/Vite)
Just run:
```bash
npm install
```
This will install all dependencies for both the Electron main process and the React/Vite frontend (`src/`).

### 4. Start the app (development)
```bash
npm run dev
```
This will start both the Vite dev server (for React) and Electron together. Hot reload is supported for the frontend.

## 🛠 Usage
- **Toggle**: Use the global shortcut (`Fn` key on Mac, or `Cmd+\`` as an alternative)
- **Record**: Click the microphone or press `Space`
- **Stop**: Click again or press `Space`
- **Paste**: The transcribed text is automatically pasted at your cursor
- **Control Panel**: Access from the tray menu to configure settings and view history
- **Close**: Press `ESC` or use the tray/dock menu

## 🖥️ System Requirements
- **macOS**: Requires microphone and accessibility permissions
- **Windows**: May require PowerShell execution policy adjustment
- **Linux**: Needs `xdotool` for pasting (`sudo apt install xdotool`)

## 🏗️ Building for Distribution
To create a distributable app:
```bash
npm run build
# or for a specific platform:
npm run build:mac
npm run build:win
npm run build:linux
```
Installers will be in the `dist/` folder.

## 🧹 Project Structure
- `main.js` — Electron main process
- `preload.js` — Secure bridge for renderer/main communication
- `assets/` — Icons and static assets
- `src/` — All React (Vite) code, UI components, and frontend logic
  - `src/components/ui/` — shadcn/ui components
  - `src/index.css` — Tailwind v4 (no config files needed)
  - `src/package.json` — Vite/React dependencies
- `src/control.html` — Control panel window

## 🧩 Tech Stack & Security
- **Electron 36+** with context isolation, sandbox, and preload script
- **Vite** for fast React development
- **Tailwind v4** (no config, CSS-first)
- **shadcn/ui** for modern UI components
- **better-sqlite3** for local transcription history
- **Tray menu** and **Control Panel** for quick access and configuration

## 🧩 Contributing
We welcome contributions! To get started:
1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a Pull Request

For larger changes, please open an issue to discuss your idea first.

## 📄 License
MIT — free for personal and commercial use. See [LICENSE](LICENSE) for details.

---

**OpenScribe** is built for creators, writers, and anyone who wants to move faster with their voice. Enjoy!
