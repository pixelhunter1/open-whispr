import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: Date;
}

export default function ControlPanel() {
  const [key, setKey] = useState("");
  const [history, setHistory] = useState<TranscriptionItem[]>([
    {
      id: "1",
      text: "Sample transcription from yesterday",
      timestamp: new Date(Date.now() - 86400000)
    },
    {
      id: "2", 
      text: "Another example transcription",
      timestamp: new Date(Date.now() - 3600000)
    }
  ]);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // Load saved settings
    const savedKey = localStorage.getItem('dictationKey');
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedKey) setKey(savedKey);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  const saveKey = () => {
    localStorage.setItem('dictationKey', key);
    alert(`Dictation key set to: ${key}`);
  };

  const saveApiKey = () => {
    localStorage.setItem('openaiApiKey', apiKey);
    alert('OpenAI API key saved successfully');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all transcription history?')) {
      setHistory([]);
      localStorage.removeItem('transcriptionHistory');
    }
  };

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      alert('Microphone permission granted!');
    } catch (err) {
      alert('Please grant microphone permissions in your browser settings.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">OpenScribe Control Panel</h1>
      
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mb-2"
            />
            <Button onClick={saveApiKey} disabled={!apiKey.trim()}>
              Save API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dictation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Dictation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dictation Hotkey</label>
            <Input
              placeholder="Currently: ` (backtick)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mb-2"
            />
            <Button onClick={saveKey} disabled={!key.trim()}>
              Save Hotkey
            </Button>
          </div>
          <div>
            <Button onClick={requestPermissions} variant="outline">
              Request Microphone Permissions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcription History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transcription History</CardTitle>
          <Button onClick={clearHistory} variant="destructive" size="sm">
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No transcriptions yet. Start dictating to see your history here!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1 mr-3">
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(item.text)}
                  >
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About OpenScribe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            OpenScribe is a desktop dictation app that uses OpenAI Whisper for accurate speech-to-text transcription.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Default Hotkey:</strong> ` (backtick)</p>
            <p><strong>Version:</strong> 0.1.0</p>
            <p><strong>Status:</strong> <span className="text-green-600">Active</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 