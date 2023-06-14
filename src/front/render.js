/**
 * Enigma IDE
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const os = require('os');

ipcRenderer.on('contents', (event, path) => {
	try {
		const stats = fs.statSync(path);
		let type = 0;
		
		if (stats.isFile()) {
			type = 1;
		} else if (stats.isDirectory()) {
			type = 2;
		}
		if(type === 0) throw new Error('The path does not exist or is neither a file nor folder: '+path);
		alert('Path is type: '+type);
	  } catch (error) {
		// Handle the error if the path doesn't exist or other file system errors
		console.error(error);
	  }
	
});
ipcRenderer.on('newFile', (event) => {
	createEditorTab();
});
ipcRenderer.on('openWelcomePage', () => {
	createEditorTab('./pages/welcome.html', true);
})

// Hide the taskbar image unless on windows
if (os.platform() === 'win32') document.querySelector('titlebar > icon > img').style.display = 'block';

function getTitleBarColor() {
	const titleBar = document.querySelector('titlebar');
	// Get the computed background color of the title bar
	const backgroundColor = getComputedStyle(titleBar).backgroundColor;
	// Return the background color
	return backgroundColor;
}
