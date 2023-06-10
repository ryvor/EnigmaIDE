const { app, Menu, BrowserWindow, globalShortcut, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const InDev = process.argv.includes('--forge');
var keybinds_status = false;

if(require('electron-squirrel-startup')) terminate(true);
app.on('ready', createWindow);
app.on('window-all-closed', terminate);
app.on('activate', activate);

var mainWindow, aboutWindow;

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
			color: '#2f3241',
			symbolColor: '#74b1be',
			height: 20
		},
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	mainWindow.on('blur', ()=>blur());
	mainWindow.on('focus', ()=>focus());
	mainWindow.loadFile(path.join(__dirname, 'front/index.html'));
	registerApplicationMenu();

	// If the program is started with electron-forge, it then shows the debug console
	if(InDev) {
		mainWindow.webContents.openDevTools();
	}
};
function focus() {
	log('Window focused');
	registerKeybinds();
}
function blur() {
	log('Window lost focus');
	unregisterKeybinds();
}
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
 * Creates a new window if there isnt already one existing.
 */
function activate() {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
}

/** registerKeybinds
 * Registers the keybinds once
 */
function registerKeybinds() {
	if(!globalShortcut.register('Alt+A', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 1');
	if(!globalShortcut.register('CommandOrControl+H', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 2');
	if(!globalShortcut.register('CommandOrControl+Shift+H', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 3');
	if(process.platform==='darwin') {
		if(!globalShortcut.register('Command+Q', ()=>terminate(true))) console.log('Failed to register global shortcut 4.1');
	}
	//---//
	if(!globalShortcut.register('CommandOrControl+N', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 5');
	if(!globalShortcut.register('CommandOrControl+Shift+N', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 6');
	if(!globalShortcut.register('CommandOrControl+O', ()=>openDialogue(1))) console.log('Failed to register global shortcut 7');
	if(!globalShortcut.register('CommandOrControl+Shift+O', ()=>openDialogue(2))) console.log('Failed to register global shortcut 8');
	//---//
	if(!globalShortcut.register('CommandOrControl+Z', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 9');
	if(!globalShortcut.register('CommandOrControl+Shift+Z', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 10');
	if(!globalShortcut.register('CommandOrControl+S', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 11');
	if(!globalShortcut.register('CommandOrControl+Shift+S', ()=>{console.log('TODO')})) console.log('Failed to register global shortcut 12');
}
/**
 * 
 */
function unregisterKeybinds() {
	if(keybinds_status) {
		globalShortcut.unregisterAll();
	}
}
  
/**
 * 
 */
function unregisterKeybinds() {
	globalShortcut.unregisterAll();
}
  
/**
 * 
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
			if(type=1) {
				mainWindow.webContents.send('file-contents', path, fs.readFileSync(path, 'utf-8'));
			} else {

			}
		}
	}).catch(err => {
		console.log('Error opening '+type+':', err);
	});
}

/** openAbout
 * 
 */
function openAbout() {
	console.log('todo');
}

/** log
 * This function writes a string to the log file with the logging format.
 */
function log() {

}