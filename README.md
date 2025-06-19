# Whisper Dictation App

A desktop dictation application that uses OpenAI's Whisper model to transcribe speech and automatically paste it at your cursor location, similar to Wispr Flow.

## Features

- 🎤 **Voice Recording**: Click or press space to start/stop recording
- 🤖 **AI Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- ⌨️ **Auto Paste**: Automatically pastes transcribed text at cursor location
- 🔥 **Global Shortcut**: Cmd+Shift+Space to toggle the app from anywhere
- 🪟 **Floating Window**: Always-on-top transparent window
- ⚡ **Fast & Lightweight**: Built with Electron for cross-platform support

## Installation

1. Clone or download this project
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up your OpenAI API key:
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Add it to the `.env` file or directly in the code
4. Run the app:
   \`\`\`bash
   npm start
   \`\`\`

## Usage

1. **Activate**: Press `Cmd+Shift+Space` (Mac) or `Ctrl+Shift+Space` (Windows/Linux)
2. **Record**: Click the microphone button or press `Space`
3. **Stop**: Click again or press `Space` to stop recording
4. **Auto-paste**: The transcribed text will automatically be pasted at your cursor
5. **Close**: Press `ESC` or click the X button

## System Requirements

- **macOS**: Requires accessibility permissions for text pasting
- **Windows**: May require PowerShell execution policy adjustment
- **Linux**: Requires `xdotool` for text pasting (`sudo apt install xdotool`)

## Building

To create a distributable app:

\`\`\`bash
npm run build
\`\`\`

This will create platform-specific installers in the `dist` folder.

## Permissions

The app requires:
- **Microphone access**: For voice recording
- **Accessibility permissions**: For automatic text pasting (macOS)
- **Input simulation**: For keyboard shortcuts (Windows/Linux)

## Troubleshooting

- **No microphone access**: Check system permissions
- **Text not pasting**: Ensure accessibility permissions are granted
- **API errors**: Verify your OpenAI API key is correct and has credits

## License

MIT License - feel free to modify and distribute!
