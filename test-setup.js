const { exec } = require("child_process")
const fs = require("fs")

console.log("🧪 Testing Whisper Dictation App Setup...\n")

// Test 1: Check if required files exist
console.log("1. Checking required files...")
const requiredFiles = ["main.js", "index.html", "package.json"]
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`)
  } else {
    console.log(`   ❌ ${file} missing`)
  }
})

// Test 2: Check Node.js version
console.log("\n2. Checking Node.js version...")
exec("node --version", (error, stdout) => {
  if (error) {
    console.log("   ❌ Node.js not found")
  } else {
    console.log(`   ✅ Node.js version: ${stdout.trim()}`)
  }
})

// Test 3: Check if Electron is installed
console.log("\n3. Checking Electron installation...")
exec("npx electron --version", (error, stdout) => {
  if (error) {
    console.log("   ❌ Electron not installed - run: npm install")
  } else {
    console.log(`   ✅ Electron version: ${stdout.trim()}`)
  }
})

// Test 4: Check environment variables
console.log("\n4. Checking environment setup...")
if (process.env.OPENAI_API_KEY) {
  console.log("   ✅ OPENAI_API_KEY is set")
} else {
  console.log("   ⚠️  OPENAI_API_KEY not set - add it to your environment or .env file")
}

// Test 5: Platform-specific checks
console.log("\n5. Platform-specific checks...")
console.log(`   Platform: ${process.platform}`)

if (process.platform === "darwin") {
  console.log("   📝 macOS detected:")
  console.log("      - You'll need to grant microphone permissions")
  console.log("      - You'll need to grant accessibility permissions for text pasting")
  console.log("      - Go to System Preferences > Security & Privacy > Privacy")
} else if (process.platform === "win32") {
  console.log("   📝 Windows detected:")
  console.log("      - You may need to adjust PowerShell execution policy")
  console.log("      - Grant microphone permissions when prompted")
} else {
  console.log("   📝 Linux detected:")
  console.log("      - Install xdotool: sudo apt install xdotool")
  console.log("      - Grant microphone permissions when prompted")
}

console.log("\n🚀 To test the app:")
console.log("1. Run: npm start")
console.log("2. Press F13 or Cmd+` to show/hide the window")
console.log("3. Click the microphone or press Space to start recording")
console.log("4. Speak something and press Space again to stop")
console.log("5. Check the console for debug messages")
console.log("\n💡 Open Developer Tools in the app with Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)")
