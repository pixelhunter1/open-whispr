const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  pasteText: (text) => ipcRenderer.invoke('paste-text', text),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onToggleDictation: (callback) => ipcRenderer.on('toggle-dictation', callback),
  
  // Database functions
  saveTranscription: (text) => ipcRenderer.invoke('db-save-transcription', text),
  getTranscriptions: (limit) => ipcRenderer.invoke('db-get-transcriptions', limit),
  clearTranscriptions: () => ipcRenderer.invoke('db-clear-transcriptions'),
  deleteTranscription: (id) => ipcRenderer.invoke('db-delete-transcription', id),
  
  // Environment variables
  getOpenAIKey: () => ipcRenderer.invoke('get-openai-key'),
  saveOpenAIKey: (key) => ipcRenderer.invoke('save-openai-key', key),
  createProductionEnvFile: (key) => ipcRenderer.invoke('create-production-env-file', key),
  
  // Clipboard functions
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
}); 