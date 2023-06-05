/**
 * Enigma IDE
 * preload.js v1.0
 * author: ryvor (@ryvor)
 */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
	require: require,
	ipcRenderer: ipcRenderer,
});