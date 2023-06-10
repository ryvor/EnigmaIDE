const { app, BrowserWindow, globalShortcut, dialog, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
var win;

app.on('window-all-closed', terminate);
app.on('ready', initialize);
app.on('activate', activate)

function activate() {
	if(BrowserWindow.getAllWindows().length === 0) createWindow();
}
function terminate() {
	globalShortcut.unregisterAll();
	app.quit()
}
function initialize() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: true,
			preload: path.join(__dirname, 'js/preload.js'),
		}
	}).loadFile(path.join(__dirname, 'index.html'));
	/* KEYBINDS */
	const hk1 = globalShortcut.register('CommandOrControl+O', () => { openDialog(1) });
		if (!hk1) console.log('Failed to register global shortcut 0');
	const hk2 = globalShortcut.register('CommandOrControl+Shift+O', () => { openDialog(2) });
		if (!hk2) console.log('Failed to register global shortcut 1');
}
function openDialog(type) {
	switch(type) {
		case 1:
			type = 'File';
			break;
		case 2:
			type = 'Folder';
			break;
		default:
			type = 'File';
	}
	dialog.showOpenDialog({
		properties: ['open'+type],
		filters: [
			{ name: 'All '+type+'s', extensions: ['*'] }
		]
	}).then(result => {
		if (!result.canceled && result.filePaths.length > 0) {
			const filePath = result.filePaths[0];
			// Handle the opened file here
			console.log('Selected '+type+':', filePath);
			win.webContents.send('file-path', filePath);
		}
	}).catch(err => {
		console.log('Error opening '+type+':', err);
	});
}