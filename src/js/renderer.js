/**
 * Enigma IDE
 * renderer.js v1.0
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = window.electron;

ipcRenderer.on('file-path', (event, filePath) => {
	console.log('Received file contents:', filePath);
});
  