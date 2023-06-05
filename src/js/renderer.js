/**
 * Enigma IDE
 * renderer.js v1.0
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = electron;

// Request the file path from the main process
ipcRenderer.send('request-file-path');

// Listen for the response from the main process
ipcRenderer.on('file-path-response', (event, filePath) => {
  // Handle the file path received from the main process
  console.log('Received file path:', filePath);
});
