const { app, BrowserWindow, globalShortcut, dialog, ipcMain } = require('electron')
const path = require('path')

app.on('window-all-closed', () => {
	globalShortcut.unregisterAll();
	app.quit()
});
app.on('ready', () => {
	
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: true,
			preload: path.join(__dirname, 'js/preload.js'),
		}
	});
	
	win.loadFile(path.join(__dirname, 'index.html'));

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	})
	/* KEYBINDS */
	const hk1 = globalShortcut.register('CommandOrControl+O', () => { openFileDialog() });
		if (!hk1) console.log('Failed to register global shortcut 0');
	const hk2 = globalShortcut.register('CommandOrControl+Shift+O', () => { openFolderDialog() });
		if (!hk2) console.log('Failed to register global shortcut 1');
})

function openFileDialog() {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'All Files', extensions: ['*'] }
		]
	}).then(result => {
		if (!result.canceled && result.filePaths.length > 0) {
			const filePath = result.filePaths[0];
			// Handle the opened file here
			console.log('Selected file:', filePath);
		}
	}).catch(err => {
		console.log('Error opening file:', err);
	});
}
function openFolderDialog() {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}).then(result => {
		if (!result.canceled && result.filePaths.length > 0) {
			const folderPath = result.filePaths[0];
			// Handle the opened folder here
			console.log('Selected folder:', folderPath);
		}
	}).catch(err => {
		console.log('Error opening folder:', err);
	});
}
ipcMain.on('request-file-path', (event) => {
	const filePath = path.join(__dirname, 'path/to/file.txt');
	event.sender.send('file-path-response', filePath);
});