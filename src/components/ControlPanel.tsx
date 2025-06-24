import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      pasteText: (text: string) => Promise<void>;
      hideWindow: () => Promise<void>;
      onToggleDictation: (callback: () => void) => void;
      saveTranscription: (text: string) => Promise<{ id: number; success: boolean }>;
      getTranscriptions: (limit?: number) => Promise<TranscriptionItem[]>;
      clearTranscriptions: () => Promise<{ cleared: number; success: boolean }>;
      deleteTranscription: (id: number) => Promise<{ success: boolean }>;
      getOpenAIKey: () => Promise<string>;
      saveOpenAIKey: (key: string) => Promise<{ success: boolean }>;
      readClipboard: () => Promise<string>;
      createProductionEnvFile: (key: string) => Promise<void>;
      transcribeLocalWhisper: (audioBlob: Blob, options?: any) => Promise<any>;
      checkWhisperInstallation: () => Promise<{ installed: boolean; working: boolean; error?: string }>;
      installWhisper: () => Promise<{ success: boolean; message: string; output: string }>;
      onWhisperInstallProgress: (callback: (event: any, data: { type: string; message: string; output?: string }) => void) => void;
      downloadWhisperModel: (modelName: string) => Promise<{ success: boolean; model: string; downloaded: boolean; size_mb?: number; error?: string }>;
      checkModelStatus: (modelName: string) => Promise<{ success: boolean; model: string; downloaded: boolean; size_mb?: number; error?: string }>;
      listWhisperModels: () => Promise<{ success: boolean; models: Array<{ model: string; downloaded: boolean; size_mb?: number }>; cache_dir: string }>;
    };
  }
}

interface TranscriptionItem {
  id: number;
  text: string;
  timestamp: string;
  created_at: string;
}

export default function ControlPanel() {
  const [key, setKey] = useState("");
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [useLocalWhisper, setUseLocalWhisper] = useState(false);
  const [whisperModel, setWhisperModel] = useState("base");
  const [whisperInstalled, setWhisperInstalled] = useState(false);
  const [checkingWhisper, setCheckingWhisper] = useState(false);
  const [modelList, setModelList] = useState<Array<{ model: string; downloaded: boolean; size_mb?: number }>>([]);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [installingWhisper, setInstallingWhisper] = useState(false);
  const [installProgress, setInstallProgress] = useState<string>('');

  useEffect(() => {
    // Load saved settings
    const savedKey = localStorage.getItem('dictationKey');
    if (savedKey) setKey(savedKey);
    
    // Load Whisper settings
    const savedUseLocal = localStorage.getItem('useLocalWhisper') === 'true';
    const savedModel = localStorage.getItem('whisperModel') || 'base';
    setUseLocalWhisper(savedUseLocal);
    setWhisperModel(savedModel);
    
    // Load API key from main process first, then fallback to localStorage
    const loadApiKey = async () => {
      try {
        const envApiKey = await window.electronAPI.getOpenAIKey();
        if (envApiKey && envApiKey !== 'your_openai_api_key_here') {
          setApiKey(envApiKey);
        } else {
          const savedApiKey = localStorage.getItem('openaiApiKey');
          if (savedApiKey) setApiKey(savedApiKey);
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
        const savedApiKey = localStorage.getItem('openaiApiKey');
        if (savedApiKey) setApiKey(savedApiKey);
      }
    };
    
    loadApiKey();
    
    // Load transcription history from database
    loadTranscriptions();
    
    // Check Whisper installation
    checkWhisperInstallation();
    
    // Set up progress listener for Whisper installation
    window.electronAPI.onWhisperInstallProgress((event, data) => {
      setInstallProgress(data.message);
    });
  }, []);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      const transcriptions = await window.electronAPI.getTranscriptions(50);
      setHistory(transcriptions);
      console.log('📚 Loaded', transcriptions.length, 'transcriptions');
    } catch (error) {
      console.error('❌ Failed to load transcriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkWhisperInstallation = async () => {
    try {
      setCheckingWhisper(true);
      const result = await window.electronAPI.checkWhisperInstallation();
      setWhisperInstalled(result.installed && result.working);
      console.log('🔍 Whisper installation check:', result);
      
      // If Whisper is installed, also load model list
      if (result.installed && result.working) {
        loadModelList();
      }
    } catch (error) {
      console.error('❌ Failed to check Whisper installation:', error);
      setWhisperInstalled(false);
    } finally {
      setCheckingWhisper(false);
    }
  };

  const loadModelList = async () => {
    try {
      setLoadingModels(true);
      const result = await window.electronAPI.listWhisperModels();
      if (result.success) {
        setModelList(result.models);
        console.log('📋 Model list loaded:', result.models);
      }
    } catch (error) {
      console.error('❌ Failed to load model list:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const installWhisper = async () => {
    try {
      setInstallingWhisper(true);
      setInstallProgress('Starting Whisper installation...');
      console.log('🔧 Installing Whisper automatically...');
      
      const result = await window.electronAPI.installWhisper();
      
      if (result.success) {
        alert('✅ Whisper installed successfully! You can now download and use local models.');
        // Recheck installation status
        checkWhisperInstallation();
      } else {
        alert(`❌ Failed to install Whisper: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Whisper installation error:', error);
      alert(`❌ Failed to install Whisper: ${error}`);
    } finally {
      setInstallingWhisper(false);
      setInstallProgress('');
    }
  };

  const downloadModel = async (modelName: string) => {
    try {
      setDownloadingModel(modelName);
      console.log(`📥 Downloading model: ${modelName}`);
      
      const result = await window.electronAPI.downloadWhisperModel(modelName);
      
      if (result.success) {
        alert(`✅ Model "${modelName}" downloaded successfully! (${result.size_mb}MB)`);
        // Refresh model list
        loadModelList();
      } else {
        alert(`❌ Failed to download model "${modelName}": ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Model download error:', error);
      alert(`❌ Failed to download model "${modelName}": ${error}`);
    } finally {
      setDownloadingModel(null);
    }
  };

  const saveKey = () => {
    localStorage.setItem('dictationKey', key);
    alert(`Dictation key inscribed: ${key}`);
  };

  const saveApiKey = async () => {
    try {
      // Save to main process (updates environment variable)
      await window.electronAPI.saveOpenAIKey(apiKey);
      // Also save to localStorage as backup
      localStorage.setItem('openaiApiKey', apiKey);
      
      // In production, try to create a .env file in user data directory
      try {
        await window.electronAPI.createProductionEnvFile(apiKey);
        alert('OpenAI API key inscribed successfully! Your credentials have been securely recorded for transcription services.');
      } catch (envError) {
        console.log('Could not create production .env file:', envError);
        alert('OpenAI API key saved successfully and will be available for transcription');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      // Fallback to localStorage only
      localStorage.setItem('openaiApiKey', apiKey);
      alert('OpenAI API key saved to localStorage (fallback mode)');
    }
  };

  const saveWhisperSettings = () => {
    localStorage.setItem('useLocalWhisper', useLocalWhisper.toString());
    localStorage.setItem('whisperModel', whisperModel);
    alert(`Whisper settings saved! ${useLocalWhisper ? `Using local model: ${whisperModel}` : 'Using OpenAI API'}`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Text copied to your scribal collection!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearHistory = async () => {
    if (confirm('Are you certain you wish to clear all inscribed records? This action cannot be undone.')) {
      try {
        const result = await window.electronAPI.clearTranscriptions();
        console.log(`🗑️ Cleared ${result.cleared} transcriptions`);
        setHistory([]);
        alert(`Successfully cleared ${result.cleared} transcriptions from your chronicles.`);
      } catch (error) {
        console.error('❌ Failed to clear transcriptions:', error);
        alert('Failed to clear history. Please try again.');
      }
    }
  };

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      alert('Microphone access granted! Your voice may now be inscribed.');
    } catch (err) {
      alert('Please grant microphone permissions to enable voice inscription.');
    }
  };

  const requestAccessibilityPermissions = async () => {
    try {
      // Test if pasting works
      await window.electronAPI.pasteText('Test inscription - please verify this appears in another application');
      alert('Accessibility permissions appear to be working! Check if the test inscription appeared in another app.');
    } catch (err) {
      alert('Accessibility permissions required! The app will guide you through granting the necessary privileges for automatic text inscription.');
    }
  };

  const resetAccessibilityPermissions = () => {
    const message = `🔄 RESET ACCESSIBILITY PERMISSIONS

If you've rebuilt or reinstalled OpenScribe and automatic inscription isn't functioning, you may have obsolete permissions from the previous version.

📋 STEP-BY-STEP RESTORATION:

1️⃣ Open System Settings (or System Preferences)
   • macOS Ventura+: Apple Menu → System Settings
   • Older macOS: Apple Menu → System Preferences

2️⃣ Navigate to Privacy & Security → Accessibility

3️⃣ Look for obsolete OpenScribe entries:
   • Any entries named "OpenScribe"
   • Any entries named "Electron" 
   • Any entries with unclear or generic names
   • Entries pointing to old application locations

4️⃣ Remove ALL obsolete entries:
   • Select each old entry
   • Click the minus (-) button
   • Enter your password if prompted

5️⃣ Add the current OpenScribe:
   • Click the plus (+) button
   • Navigate to and select the CURRENT OpenScribe app
   • Ensure the checkbox is ENABLED

6️⃣ Restart OpenScribe completely

💡 This is very common during development when rebuilding applications!

Click OK when you're ready to open System Settings.`;

    if (confirm(message)) {
      // Try to open the accessibility settings directly
      const commands = [
        'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"',
        'open -b com.apple.systempreferences',
        'open "/System/Library/PreferencePanes/Security.prefPane"'
      ];
      
      // We can't directly execute these from the renderer, but we can guide the user
      alert('Opening System Settings... Look for the Accessibility section under Privacy & Security.');
      
      // Try the URL scheme approach
      window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility', '_blank');
    }
  };

  const deleteTranscription = async (id: number) => {
    if (confirm('Are you certain you wish to remove this inscription from your records?')) {
      try {
        const result = await window.electronAPI.deleteTranscription(id);
        if (result.success) {
          // Remove from local state
          setHistory(prev => prev.filter(item => item.id !== id));
          console.log(`🗑️ Deleted transcription ${id}`);
        } else {
          alert('Failed to delete transcription. It may have already been removed.');
        }
      } catch (error) {
        console.error('❌ Failed to delete transcription:', error);
        alert('Failed to delete transcription. Please try again.');
      }
    }
  };

  const refreshHistory = async () => {
    console.log('🔄 Refreshing transcription history...');
    await loadTranscriptions();
  };

  // Enhanced keyboard paste handler for API key input
  const handleApiKeyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Cmd+V on Mac or Ctrl+V on Windows/Linux
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      e.preventDefault(); // Prevent default to handle manually
      console.log('Paste shortcut detected, attempting manual paste...');
      
      // Try to paste from clipboard
      setTimeout(async () => {
        try {
          // Try Electron clipboard first
          const text = await window.electronAPI.readClipboard();
          if (text && text.trim()) {
            setApiKey(text.trim());
            console.log('✅ Keyboard paste successful via Electron clipboard');
          } else {
            // Fallback to web clipboard API
            const webText = await navigator.clipboard.readText();
            if (webText && webText.trim()) {
              setApiKey(webText.trim());
              console.log('✅ Keyboard paste successful via Web API');
            }
          }
        } catch (err) {
          console.error('❌ Keyboard paste failed:', err);
          // Don't show alert for keyboard shortcuts, just log the error
        }
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E6] via-[#F9F6F1] to-[#EDE7DC] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="brand-heading text-5xl font-bold text-[#2B1F14] mb-3">
            OpenScribe
          </h1>
          <p className="brand-script text-xl text-[#6B5D52] italic">
            "Your words, inscribed with care"
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#C0A77D] to-transparent mx-auto mt-4"></div>
        </div>

        {/* API Configuration Card */}
        <Card className="card">
          <CardHeader className="border-b border-[#DDD4C7] bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
            <CardTitle className="brand-heading text-2xl text-[#2B1F14] flex items-center gap-3">
              <span className="text-[#C0A77D]">🔑</span>
              OpenAI API Configuration
            </CardTitle>
            <p className="text-sm text-[#6B5D52] mt-2">
              Configure your transcription credentials to enable voice-to-text inscription.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B1F14] mb-3 brand-body">
                  OpenAI API Key
                </label>
                <div className="flex gap-3">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 text-base"
                    onPaste={(e) => {
                      e.stopPropagation();
                      console.log('Paste event triggered');
                    }}
                    onKeyDown={handleApiKeyKeyDown}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        const text = await window.electronAPI.readClipboard();
                        if (text && text.trim()) {
                          setApiKey(text.trim());
                          console.log('Manual paste successful via Electron');
                        } else {
                          const webText = await navigator.clipboard.readText();
                          setApiKey(webText.trim());
                          console.log('Manual paste successful via Web API');
                        }
                      } catch (err) {
                        console.error('Manual paste failed:', err);
                        alert('Could not paste from clipboard. Please try typing or using Cmd+V/Ctrl+V.');
                      }
                    }}
                  >
                    Inscribe
                  </Button>
                </div>
                <p className="text-xs text-[#6B5D52] mt-2 italic">
                  Your API key will be securely stored and used only for transcription services.
                </p>
              </div>
              <Button 
                onClick={saveApiKey} 
                disabled={!apiKey.trim()}
                className="w-full bg-[#4B2E2B] hover:bg-[#C0A77D] text-[#F5F0E6] hover:text-[#2B1F14] font-semibold py-3"
              >
                Save API Credentials
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Whisper Engine Settings Card */}
        <Card className="card">
          <CardHeader className="border-b border-[#DDD4C7] bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
            <CardTitle className="brand-heading text-2xl text-[#2B1F14] flex items-center gap-3">
              <span className="text-[#C0A77D]">🤖</span>
              Whisper Engine Settings
            </CardTitle>
            <p className="text-sm text-[#6B5D52] mt-2">
              Configure your speech recognition engine: local processing or cloud API.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[#DDD4C7] rounded-lg bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="useLocalWhisper"
                    checked={useLocalWhisper}
                    onChange={(e) => setUseLocalWhisper(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <label htmlFor="useLocalWhisper" className="text-base font-semibold text-[#2B1F14] brand-body">
                    Use Local Whisper (Privacy Mode)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  {checkingWhisper ? (
                    <span className="text-[#C0A77D] text-sm">Checking...</span>
                  ) : whisperInstalled ? (
                    <span className="text-green-600 text-sm">✅ Installed</span>
                  ) : (
                    <span className="text-red-600 text-sm">❌ Not Found</span>
                  )}
                </div>
              </div>

              {useLocalWhisper && (
                <div className="pl-8 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2B1F14] mb-3 brand-body">
                      Whisper Model
                    </label>
                    <select
                      value={whisperModel}
                      onChange={(e) => setWhisperModel(e.target.value)}
                      className="w-full p-3 border border-[#DDD4C7] rounded-lg bg-white text-[#2B1F14] focus:outline-none focus:ring-2 focus:ring-[#C0A77D]"
                    >
                      <option value="tiny">Tiny (39M params - Fastest)</option>
                      <option value="base">Base (74M params - Balanced)</option>
                      <option value="small">Small (244M params - Better quality)</option>
                      <option value="medium">Medium (769M params - High quality)</option>
                      <option value="large">Large (1550M params - Best quality)</option>
                      <option value="turbo">Turbo (809M params - Fast + quality)</option>
                    </select>
                    <p className="text-xs text-[#6B5D52] mt-2 italic">
                      Larger models provide better accuracy but use more memory and are slower.
                    </p>
                  </div>

                  {/* Model Management Section */}
                  {whisperInstalled && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-800">Model Management</h4>
                        <Button 
                          onClick={loadModelList}
                          variant="outline"
                          size="sm"
                          disabled={loadingModels}
                        >
                          {loadingModels ? "Loading..." : "Refresh Models"}
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {modelList.length > 0 ? (
                          modelList.map((model) => (
                            <div key={model.model} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-green-900 capitalize">
                                  {model.model}
                                </span>
                                {model.downloaded ? (
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    ✅ Downloaded ({model.size_mb}MB)
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Not downloaded
                                  </span>
                                )}
                              </div>
                              
                              {!model.downloaded && (
                                <Button
                                  onClick={() => downloadModel(model.model)}
                                  disabled={downloadingModel === model.model}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {downloadingModel === model.model ? (
                                    <>📥 Downloading...</>
                                  ) : (
                                    <>📥 Download</>
                                  )}
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-green-700">
                              {loadingModels ? "Loading model information..." : "Click 'Refresh Models' to check available models"}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                        <p><strong>💡 Tip:</strong> Download models you plan to use for faster transcription. The first time you use a model, it will be downloaded automatically, but pre-downloading prevents delays during dictation.</p>
                      </div>
                    </div>
                  )}

                  {!whisperInstalled && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                      <div className="text-center">
                        <div className="text-4xl mb-4">🚀</div>
                        <h4 className="font-bold text-blue-900 text-lg mb-2">
                          Ready to Enable Local Processing?
                        </h4>
                        <p className="text-sm text-blue-700 mb-4 max-w-md mx-auto">
                          We'll automatically install Whisper for you! No terminal commands needed - just click the button below.
                        </p>
                        
                        {installingWhisper ? (
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center justify-center space-x-3 mb-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="font-semibold text-blue-900">Installing Whisper...</span>
                              </div>
                              {installProgress && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded font-mono">
                                  {installProgress}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-blue-600 italic">
                              This may take a few minutes. Please don't close the app.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Button 
                              onClick={installWhisper}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all"
                              size="lg"
                            >
                              🔧 Install Whisper Automatically
                            </Button>
                            
                            <div className="flex items-center justify-center space-x-4 text-xs text-blue-600">
                              <Button 
                                onClick={checkWhisperInstallation}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                🔄 Check Again
                              </Button>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 text-xs text-blue-700 border border-blue-200">
                              <p className="font-semibold mb-1">✨ What we'll install:</p>
                              <ul className="space-y-1 text-left">
                                <li>• OpenAI Whisper package (speech recognition)</li>
                                <li>• Required dependencies (torch, numpy, etc.)</li>
                                <li>• Everything needed for local AI transcription</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Privacy Information</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Local Whisper:</strong> Audio processed on your device, complete privacy, no internet required (after initial model download).</p>
                  <p><strong>OpenAI API:</strong> Audio sent to OpenAI servers, requires API key and internet connection.</p>
                </div>
              </div>

              <Button 
                onClick={saveWhisperSettings} 
                className="w-full bg-[#4B2E2B] hover:bg-[#C0A77D] text-[#F5F0E6] hover:text-[#2B1F14] font-semibold py-3"
              >
                Save Whisper Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dictation Settings Card */}
        <Card className="card">
          <CardHeader className="border-b border-[#DDD4C7] bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
            <CardTitle className="brand-heading text-2xl text-[#2B1F14] flex items-center gap-3">
              <span className="text-[#C0A77D]">⌨️</span>
              Dictation Preferences
            </CardTitle>
            <p className="text-sm text-[#6B5D52] mt-2">
              Configure your voice inscription settings and system permissions.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2B1F14] mb-3 brand-body">
                  Dictation Activation Key
                </label>
                <Input
                  placeholder="Currently: ` (backtick)"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="mb-3 text-base"
                  onPaste={(e) => {
                    e.stopPropagation();
                    console.log('Hotkey paste event triggered');
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                      console.log('Hotkey paste shortcut detected');
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button onClick={saveKey} disabled={!key.trim()} variant="outline" className="mb-6">
                  Save Activation Key
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={requestPermissions} variant="outline" className="py-3">
                  <span className="mr-2">🎤</span>
                  Request Microphone Access
                </Button>
                <Button onClick={requestAccessibilityPermissions} variant="outline" className="py-3">
                  <span className="mr-2">🔓</span>
                  Verify Accessibility
                </Button>
              </div>
              
              <Button onClick={resetAccessibilityPermissions} variant="secondary" className="w-full py-3">
                <span className="mr-2">🔄</span>
                Reset Accessibility Permissions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transcription History Card */}
        <Card className="card">
          <CardHeader className="border-b border-[#DDD4C7] bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="brand-heading text-2xl text-[#2B1F14] flex items-center gap-3">
                  <span className="text-[#C0A77D]">📜</span>
                  Inscription Chronicles
                </CardTitle>
                <p className="text-sm text-[#6B5D52] mt-2">
                  Your recorded voice transcriptions, preserved for posterity.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={refreshHistory} variant="outline" size="sm">
                  <span className="mr-1">🔄</span>
                  Refresh
                </Button>
                <Button onClick={clearHistory} variant="destructive" size="sm">
                  <span className="mr-1">🗑️</span>
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-[#C0A77D] text-2xl mb-3">📖</div>
                <p className="text-[#6B5D52] brand-body">
                  Loading your inscription chronicles...
                </p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[#C0A77D] text-4xl mb-4">✒️</div>
                <p className="text-[#6B5D52] brand-body text-lg mb-2">
                  No inscriptions yet recorded
                </p>
                <p className="text-[#6B5D52] text-sm italic">
                  Begin dictating to see your chronicles appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {history.map((item, index) => (
                  <div key={item.id} className="border border-[#DDD4C7] rounded-lg p-6 bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1] hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#C0A77D] text-sm">#{history.length - index}</span>
                          <div className="w-px h-4 bg-[#DDD4C7]"></div>
                          <span className="text-xs text-[#6B5D52] brand-body">
                            {new Date(item.timestamp).toLocaleString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-[#2B1F14] brand-body leading-relaxed text-base">
                          "{item.text}"
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyToClipboard(item.text)}
                          className="text-xs"
                        >
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteTranscription(item.id)}
                          className="text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Card */}
        <Card className="card">
          <CardHeader className="border-b border-[#DDD4C7] bg-gradient-to-r from-[#FFFFFF] to-[#F9F6F1]">
            <CardTitle className="brand-heading text-2xl text-[#2B1F14] flex items-center gap-3">
              <span className="text-[#C0A77D]">ℹ️</span>
              About OpenScribe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-[#6B5D52] brand-body text-base leading-relaxed mb-6">
              OpenScribe is an elegant dictation companion that transforms your spoken words into written text using advanced AI transcription. 
              Like a skilled scribe of old, it captures your thoughts with precision and care.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="text-center p-4 border border-[#DDD4C7] rounded-lg bg-gradient-to-b from-[#FFFFFF] to-[#F9F6F1]">
                <div className="text-[#C0A77D] text-xl mb-2">⌨️</div>
                <p className="font-semibold text-[#2B1F14] mb-1">Default Hotkey</p>
                <p className="text-[#6B5D52]">` (backtick)</p>
              </div>
              <div className="text-center p-4 border border-[#DDD4C7] rounded-lg bg-gradient-to-b from-[#FFFFFF] to-[#F9F6F1]">
                <div className="text-[#C0A77D] text-xl mb-2">🏷️</div>
                <p className="font-semibold text-[#2B1F14] mb-1">Version</p>
                <p className="text-[#6B5D52]">0.1.0</p>
              </div>
              <div className="text-center p-4 border border-[#DDD4C7] rounded-lg bg-gradient-to-b from-[#FFFFFF] to-[#F9F6F1]">
                <div className="text-[#C0A77D] text-xl mb-2">✅</div>
                <p className="font-semibold text-[#2B1F14] mb-1">Status</p>
                <p className="status-active">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-[#6B5D52] text-sm brand-script italic">
            "In every word lies a story waiting to be inscribed"
          </p>
        </div>
      </div>
    </div>
  );
} 