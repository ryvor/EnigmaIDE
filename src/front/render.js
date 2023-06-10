/**
 * Enigma IDE
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = require('electron');

ipcRenderer.on('file-contents', (event, fileContents) => {
  console.log('Received file contents:', fileContents);
});