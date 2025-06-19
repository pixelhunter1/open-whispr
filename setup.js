const fs = require("fs")
const path = require("path")

console.log("Setting up Whisper Dictation App...")

// Create .env file template
const envTemplate = `# OpenAI API Key for Whisper
OPENAI_API_KEY=your_openai_api_key_here

# Instructions:
# 1. Get your OpenAI API key from https://platform.openai.com/api-keys
# 2. Replace 'your_openai_api_key_here' with your actual API key
# 3. Save this file
`

if (!fs.existsSync(".env")) {
  fs.writeFileSync(".env", envTemplate)
  console.log("✅ Created .env file template")
} else {
  console.log("⚠️  .env file already exists")
}

console.log(`
🎉 Setup complete!

Next steps:
1. Add your OpenAI API key to the .env file
2. Install dependencies: npm install
3. Run the app: npm start

Features:
- Global shortcut: Cmd+Shift+Space (Mac) or Ctrl+Shift+Space (Windows/Linux)
- Space bar to start/stop recording
- ESC to close the app
- Automatic text pasting at cursor location

Note: Make sure you have the necessary system permissions for:
- Microphone access
- Accessibility permissions (for text pasting)
`)
