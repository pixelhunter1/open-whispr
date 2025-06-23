const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  pasteText: (text) => ipcRenderer.invoke('paste-text', text),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onToggleDictation: (callback) => ipcRenderer.on('toggle-dictation', callback),
}); 