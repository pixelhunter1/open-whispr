const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  pasteText: (text) => ipcRenderer.invoke('paste-text', text),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onToggleDictation: (callback) => ipcRenderer.on('toggle-dictation', callback),
});

// Expose the API key securely
contextBridge.exposeInMainWorld('OPENAI_API_KEY', process.env.OPENAI_API_KEY || ''); 