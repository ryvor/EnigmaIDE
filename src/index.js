/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, globalShortcut, dialog, Notification } = require('electron');
const windowManager = require('electron-window-manager');
const path = require('path');
const InDev = process.argv.includes('--debugMode');

var currentWindow, mainWindow, aboutWindow, aboutWindowActive = false, keybinds_status = false;

//#endregion *****************************/
/*             SYSTEM EVENTS             */
//#region ********************************/

if(require('electron-squirrel-startup')) terminate(true);
app.on('ready', createWindow);
app.on('window-all-closed', terminate);
app.on('activate', activate);
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
		width: 1000,
		height: 770,
		show: false,
		icon: path.join(__dirname, '/front/assets/icons/enigma.png'),
		autoHideMenuBar: true,
		title: process.env.productName,
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			symbolColor: '#74b1be',
			height: 20
		},
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	});
	mainWindow.loadFile(path.join(__dirname, 'front/index.html'));
	mainWindow.once('ready-to-show', ()=>{
		handleAccentColorChange();
		mainWindow.on('accent-color-changed', handleAccentColorChange);
		registerApplicationMenu();
		if(InDev) {	// If the program is started with electron-forge, it then shows the debug console
			mainWindow.webContents.openDevTools();
		}
		mainWindow.show();
	})
	mainWindow.on('focus', ()=>focus())
	mainWindow.on('blur', ()=>blur())
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
					click: () => {openAboutModal()},
				},{	label: 'Check for updates',
					accelerator: '',
					click: () => {console.log('TODO')},
				},{	label: 'Open settings',
					accelerator: '',
					click: () => {console.log('TODO')},
				},{	type: 'separator'
				},{	label: 'Hide window',
					accelerator: 'CmdOrCtrl+H',
					click: () => {console.log('TODO')},
				},{	label: 'Hide all other windows',
					accelerator: 'CmdOrCtrl+Shift+H',
					click: () => {console.log('TODO')},
				},{	label: 'Quit',
					accelerator: 'CmdOrCtrl+Q',
					click: () => {terminate(true)},
				},
			]
		},{	label: 'File',
			submenu: [
				{	label: 'New File',
					accelerator: 'CmdOrCtrl+N',
					click: () => {currentWindow.webContents.send('newFile')},
				},{	label: 'New Project',
					accelerator: 'CmdOrCtrl+Shift+N',
					click: () => {createWindow()},
				},{	label: 'New Window',
					accelerator: 'CmdOrCtrl+Alt+N',
					click: () => {console.log('TODO')},
				},{	type: 'separator'
				},{	label: 'Open File',
					accelerator: 'CmdOrCtrl+O',
					click: () => {openDialog(1)},
				},{	label: 'Open Folder',
					accelerator: 'CmdOrCtrl+Shift+O',
					click: () => {openDialog(2)},
				},{	label: 'Open Workspace',
					accelerator: 'CmdOrCtrl+Altt+O',
					click: () => {openDialog(3)},
				},
			]
		},{	label: 'Edit',
			submenu: [
				{	label: 'Undo',
					accelerator: 'CmdOrCtrl+Z',
					click: () => {console.log('TODO')}
				},{	label: 'Redo',
					accelerator: 'CmdOrCtrl+Shift+Z',
					click: () => {console.log('TODO')}
				},{	type: 'separator'
				},{	label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					click: () => {console.log('TODO')}
				},{	label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: () => {console.log('TODO')}
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
			submenu: [
				{	label: 'Welcome',
					accelerator: '',
					click: ()=>currentWindow.webContents.send('openWelcomePage')
				}
			]
		}
	]));
}
/** registerKeybinds
 * Registers the keybinds once
 */
function registerKeybinds() {
	if(keybinds_status === false) {
		if(!globalShortcut.register('Alt+A', ()=>{openAboutModal()})) log('Failed to register global shortcut 1');
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
		if(!globalShortcut.register('CommandOrControl+Alt+O', ()=>openDialog(3))) log('Failed to register global shortcut 9');
		//---//
		if(!globalShortcut.register('CommandOrControl+S', ()=>{console.log('TODO')})) log('Failed to register global shortcut 12');
		if(!globalShortcut.register('CommandOrControl+Shift+S', ()=>{console.log('TODO')})) log('Failed to register global shortcut 13');
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
			type_text = 'File';
			filters = [];
			properties = ['openFile', 'multiSelections'];
			break;
		case 2:
			type_text = 'Directory';
			filters = [];
			properties = ['openDirectory', 'createDirectory'];
			break;
		case 3:
			type_text = 'Enigma Workspace';
			filters = [
				{ name: 'Enigma Workspace File', extensions: ['enigma_workspace'] }
			];
			properties = ['openFile'];
			break;
	}
	dialog.showOpenDialog({
		filters: filters,
		properties: properties
	}).then(result => {
		if (!result.canceled && result.filePaths.length > 0) {
			const path = result.filePaths[0];
			currentWindow.webContents.send('contents', path);
		}
	}).catch(err => {
		console.log('Error opening '+type_text+':', err);
	});
}
/** log
 * This function writes a string to the log file with the logging format.
 */
function log() {

}
function openAboutModal() {
	if(!aboutWindowActive) {
		aboutWindowActive = true;
		aboutWindow = new BrowserWindow({
			parent: mainWindow,
			modal: true,
			show: false,
			width: 300,
			height: 450,
			resizable: false,
			autoHideMenuBar: true,
			titleBarStyle: 'hidden',
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		});
		aboutWindow.loadFile(path.join(__dirname, 'front/pages/about.html'));
		aboutWindow.once('ready-to-show', ()=>{
			if(InDev) {	// If the program is started with electron-forge, it then shows the debug console
				aboutWindow.webContents.openDevTools();
			}
			aboutWindow.show();
		})
		aboutWindow.on('focus', ()=>focus())
		aboutWindow.on('blur', ()=>blur())
		aboutWindow.on('close', ()=>{aboutWindowActive=false})
	}
}
handleAccentColorChange = async () => {
	try {
		const backgroundColor = await mainWindow.webContents.executeJavaScript(`getTitleBarColor()`);
		mainWindow.setOverlayIcon(null, backgroundColor);
		if(aboutWindow) aboutWindow.setOverlayIcon(null, backgroundColor);
	} catch (error) {
		console.error('Error getting title bar color:', error);
	}
}

//#endregion *****************************/
/*                  EOF                  */
/*****************************************/