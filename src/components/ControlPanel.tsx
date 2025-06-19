import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useState } from "react";

export default function ControlPanel() {
  const [key, setKey] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Transcribed text from yesterday",
    "Another transcription example"
  ]);

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">OpenScribe Control Panel</h1>
      <Card className="mb-6 p-4">
        <h2 className="font-semibold mb-2">Configure Dictation Key</h2>
        <Input
          placeholder="Press a key..."
          value={key}
          onChange={e => setKey(e.target.value)}
          className="mb-2"
        />
        <Button onClick={() => alert(`Key set to: ${key}`)}>
          Save Key
        </Button>
      </Card>
      <Card className="mb-6 p-4">
        <h2 className="font-semibold mb-2">Transcription History</h2>
        <ul className="space-y-2">
          {history.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <span>{item}</span>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(item)}>
                Copy
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Permissions</h2>
        <Button onClick={() => alert('Requesting permissions...')}>Request Permissions</Button>
      </Card>
    </div>
  );
} 