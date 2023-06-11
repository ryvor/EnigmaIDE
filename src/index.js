/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, globalShortcut, dialog, ipcMain } = require('electron');
const path = require('path');
const InDev = process.argv.includes('--forge');

var currentWindow, mainWindow, aboutWindow;
var keybinds_status = false;

//#endregion *****************************/
/*             SYSTEM EVENTS             */
//#region ********************************/

if(require('electron-squirrel-startup')) terminate(true);
app.on('ready', createWindow);
app.on('window-all-closed', terminate);
app.on('activate', activate);
app.on('blur', blur);
app.on('focus', focus);
app.on('window-all-closed', allWindowsClosed);
app.on('browser-window-created', newWindow);

//#endregion *****************************/
/*            SYSTEM FUNCTIONS           */
//#region ********************************/

/** createWindow
 * Creates a new window and loads the configuration
 */
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		title: process.env.productName,
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: '#00000000',
			symbolColor: '#74b1be',
			height: 20
		},
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	registerKeybinds();
	mainWindow.loadFile(path.join(__dirname, 'front/index.html'));
	registerApplicationMenu();

	// If the program is started with electron-forge, it then shows the debug console
	if(InDev) {
		mainWindow.webContents.openDevTools();
	}
};
/** Terminate
 * Closes the program in windows and linux, but waits for all of the  CMD+Q command on MAC
 */
function terminate(force=false) {
	if (process.platform!=='darwin'|| force) {
		globalShortcut.unregisterAll();
		app.quit();
	}
}
/** activate
 * This function is called when the application has been initially launched or attempted to launch whilst already open
 */
function activate() {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
}
/** blur
 * This this function is executed when the main browser window has lost focus
 */
function blur() {
	unregisterKeybinds();
}
/** focus
 * This this function is executed when the main browser window has gained focus
 */
function focus() {
	registerKeybinds();
}
/** allWindowsClosed
 * This function resets the current window if all of the windows have been closed
 */
function allWindowsClosed() {
	currentWindow = null;
}
/** newWindow
 * This function sets the current window each time you change/create windows and unsets the window when you leave it.
 */
function newWindow(event, window) {
	window.on('focus', () => {
		currentWindow = window;
	});
	window.on('blur', () => {
		currentWindow = null;
	});
}

//#endregion *****************************/
/*               FUNCTIONS               */
//#region ********************************/

/** registerApplicationMenu
 * This function sets the application alt menu for the program
 */
function registerApplicationMenu() {
	Menu.setApplicationMenu(Menu.buildFromTemplate([
		{	label: process.env.productName,
			submenu: [
				{	label: 'About Enigma IDE',
					accelerator: 'Alt+A',
					click: () => {},
				},{	label: 'Check for updates',
					accelerator: '',
					click: () => {},
				},{	label: 'Open settings',
					accelerator: '',
					click: () => {},
				},{	type: 'separator'
				},{	label: 'Hide window',
					accelerator: 'CmdOrCtrl+H',
					click: () => {},
				},{	label: 'Hide all other windows',
					accelerator: 'CmdOrCtrl+Shift+H',
					click: () => {},
				},{	label: 'Quit',
					accelerator: 'CmdOrCtrl+Q',
					click: () => {},
				},
			]
		},{	label: 'File',
			submenu: [
				{	label: 'New File',
					accelerator: 'CmdOrCtrl+N',
					click: () => {},
				},{	label: 'New Project',
					accelerator: 'CmdOrCtrl+Shift+N',
					click: () => {},
				},{	type: 'separator'
				},{	label: 'Open File',
					accelerator: 'CmdOrCtrl+O',
					click: () => {},
				},{	label: 'Open Folder',
					accelerator: 'CmdOrCtrl+Shift+O',
					click: () => {},
				},{	label: 'Open Workspace',
					accelerator: '',
					click: () => {},
				},
			]
		},{	label: 'Edit',
			submenu: [
				{	label: 'Undo',
					accelerator: 'CmdOrCtrl+Z',
					click: () => {}
				},{	label: 'Redo',
					accelerator: 'CmdOrCtrl+Shift+Z',
					click: () => {}
				},{	type: 'separator'
				},{	label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					click: () => {}
				},{	label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: () => {}
				},
			]
		},{	label: 'Selection',
			submenu: []
		},{	label: 'View',
			submenu: []
		},{	label: 'Go',
			submenu: []
		},{	label: 'Run',
			submenu: []
		},{	label: 'Terminal',
			submenu: []
		},{	label: 'Window',
			submenu: []
		},{	label: 'Help',
			submenu: []
		}
	]));
}
/** registerKeybinds
 * Registers the keybinds once
 */
function registerKeybinds() {
	if(keybinds_status === false) {
		if(!globalShortcut.register('Alt+A', ()=>{console.log('TODO')})) log('Failed to register global shortcut 1');
		if(!globalShortcut.register('CommandOrControl+H', ()=>{console.log('TODO')})) log('Failed to register global shortcut 2');
		if(!globalShortcut.register('CommandOrControl+Shift+H', ()=>{console.log('TODO')})) log('Failed to register global shortcut 3');
		if(process.platform==='darwin')
			if(!globalShortcut.register('Command+Q', ()=>terminate(true)))
				log('Failed to register global shortcut 4');
		//---//
		if(!globalShortcut.register('CommandOrControl+N', ()=>{currentWindow.webContents.send('newFile')})) log('Failed to register global shortcut 5');
		if(!globalShortcut.register('CommandOrControl+Shift+N', ()=>{console.log('TODO')})) log('Failed to register global shortcut 6');
		if(!globalShortcut.register('CommandOrControl+O', ()=>openDialog(1))) log('Failed to register global shortcut 7');
		if(!globalShortcut.register('CommandOrControl+Shift+O', ()=>openDialog(2))) log('Failed to register global shortcut 8');
		//---//
		if(!globalShortcut.register('CommandOrControl+Z', ()=>{console.log('TODO')})) log('Failed to register global shortcut 9');
		if(!globalShortcut.register('CommandOrControl+Shift+Z', ()=>{console.log('TODO')})) log('Failed to register global shortcut 10');
		if(!globalShortcut.register('CommandOrControl+S', ()=>{console.log('TODO')})) log('Failed to register global shortcut 11');
		if(!globalShortcut.register('CommandOrControl+Shift+S', ()=>{console.log('TODO')})) log('Failed to register global shortcut 12');
		keybinds_status = true;
	}
}
/** unregisterKeybinds
 * This function will unbing any keybindings made.
 */
function unregisterKeybinds() {
	if(keybinds_status === true) {
		globalShortcut.unregisterAll();
		keybinds_status = false;
	}
}
/** openDialog
 * This function will open a window to enable the ability to open a file or folder
 */
function openDialog(type) {
	switch(type) {
		case 1:
			type='File';
			break;
		case 2:
			type='Directory';
			break;
	}
	dialog.showOpenDialog({
		properties: ['open'+type]
	}).then(result => {
		if (!result.canceled && result.filePaths.length > 0) {
			const path = result.filePaths[0];
			log('Open '+type+': '+path);
			currentWindow.webContents.send('contents', path);
		}
	}).catch(err => {
		console.log('Error opening '+type+':', err);
	});
}
/** log
 * This function writes a string to the log file with the logging format.
 */
function log() {

}

//#endregion *****************************/
/*                  EOF                  */
/*****************************************/