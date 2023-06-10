/**
 * Enigma IDE
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = require('electron');

ipcRenderer.on('file-contents', (event, path, fileContents) => {
	console.log('Received file contents:', fileContents);
	console.log('Received file path:', path);
});