/**
 * Enigma IDE
 * author: ryvor (@ryvor)
 */
const { ipcRenderer } = require('electron');
const fs = require('fs');
var untitledCount = 1;
var documentID = 1;

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
		console.log('Path is type: '+type);
	  } catch (error) {
		// Handle the error if the path doesn't exist or other file system errors
		console.error(error);
	  }
	
});
ipcRenderer.on('newFile', (event) => {
	// Create new tab
	const tab = document.createElement('tab');
	const tab_title = document.createElement('span');
	const tab_close = document.createElement('close-tab');
	const tab_container = document.querySelector('tabs');
	tab_title.textContent = 'Untitled-'+untitledCount;
	tab.setAttribute('document-ID', documentID);
	tab_container.appendChild(tab);
	tab.appendChild(tab_title);
	tab.appendChild(tab_close);
	untitledCount++
	// Create new notepad
});
