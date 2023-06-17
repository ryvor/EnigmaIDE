/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, globalShortcut, dialog, Notification, ipcMain } = require('electron');
const windowManager = require('electron-window-manager');
const fs = require('fs');
const path = require('path');
var currentWindow=null,
	mainWindow=null,
	aboutWindow=null,
	aboutWindowActive=false,
	keybinds_status=false;
if(require('electron-squirrel-startup')) terminate(true);
//#endregion *****************************/
/*             SYSTEM EVENTS             */
//#region ********************************/

app.on('ready', createWindow);
app.on('window-all-closed', terminate);
app.on('activate', activate);
app.on('window-all-closed', allWindowsClosed);
app.on('browser-window-created', newWindow);
//#endregion *****************************/
/*               FUNCTIONS               */
//#region ********************************/

/** createWindow
 * Creates a new window and loads the configuration
 * @return Void
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
			webSecurity: false,
		},
	});
	mainWindow.loadFile(path.join(__dirname, 'front/index.html'));
	mainWindow.once('ready-to-show', ()=>{
		registerApplicationMenu();
		mainWindow.show();
	})
	mainWindow.on('focus', ()=>focus())
	mainWindow.on('blur', ()=>blur())
};
/** Terminate
 * Closes the program in windows and linux, but waits for all of the  CMD+Q command on MAC
 * @return Void
 */
function terminate(force=false) {
	if (process.platform!=='darwin'|| force) {
		globalShortcut.unregisterAll();
		app.quit();
	}
}
/** activate
 * This function is called when the application has been initially launched or attempted to launch whilst already open
 * @return Void
 */
function activate() {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
}
/** blur
 * This this function is executed when the main browser window has lost focus
 * @return Void
 */
function blur() {
	unregisterKeybinds();
}
/** focus
 * This this function is executed when the main browser window has gained focus
 * @return Void
 */
function focus() {
	registerKeybinds();
}
/** allWindowsClosed
 * This function resets the current window if all of the windows have been closed
 * @return Void
 */
function allWindowsClosed() {
	currentWindow = null;
}
/** newWindow
 * This function sets the current window each time you change/create windows and unsets the window when you leave it.
 * @param Event event
 * @param BriwserWindow window
 * @return Void
 */
function newWindow(event, window) {
	window.on('focus', () => {
		currentWindow = window;
	});
	window.on('blur', () => {
		currentWindow = null;
	});
}
/** registerApplicationMenu
 * This function sets the application alt menu for the program
 * @returns Void
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
					click: () => {console.log('TODO')},
				},{	label: 'New Window',
					accelerator: 'CmdOrCtrl+Alt+N',
					click: ()=>createNewWindow(),
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
					click: ()=>saveFile()
				},{	label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: ()=>saveFile(true)
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
					click: ()=>currentWindow.webContents.send('openWelcomePage'),
				},{	label: 'Documentation',
					accelerator: '',
					click: ()=>require("shell").openExternal("http://ryvor.github.io/EnigmaIDE/")
				},{	label: 'Open Developer Tools',
					accelerator: '',
					click: ()=>mainWindow.webContents.openDevTools(),
				}
			]
		}
	]));
}
/** registerKeybinds
 * Registers the keybinds once
 * @returns Void
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
		if(!globalShortcut.register('CommandOrControl+N', ()=>currentWindow.webContents.send('newFile'))) log('Failed to register global shortcut 5');
		if(!globalShortcut.register('CommandOrControl+Shift+N', ()=>createNewWindow())) log('Failed to register global shortcut 6');
		if(!globalShortcut.register('CommandOrControl+O', ()=>openDialog(1))) log('Failed to register global shortcut 7');
		if(!globalShortcut.register('CommandOrControl+Shift+O', ()=>openDialog(2))) log('Failed to register global shortcut 8');
		if(!globalShortcut.register('CommandOrControl+Alt+O', ()=>openDialog(3))) log('Failed to register global shortcut 9');
		if(!globalShortcut.register('CommandOrControl+W', ()=>currentWindow.webContents.send('closeTab'))) log('Failed to register global shortcut 9');
		//---//
		if(!globalShortcut.register('CommandOrControl+S', ()=>{saveFile()})) log('Failed to register global shortcut 10');
		if(!globalShortcut.register('CommandOrControl+Shift+S', ()=>{saveFile(true)})) log('Failed to register global shortcut 11');
		keybinds_status = true;
	}
}
/** unregisterKeybinds
 * This function will unbing any keybindings made.
 * @returns Void
 */
function unregisterKeybinds() {
	if(keybinds_status === true) {
		globalShortcut.unregisterAll();
		keybinds_status = false;
	}
}
/** openDialog
 * This function will open a window to enable the ability to open a file or folder
 * @param Integer type
 * @returns Void
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
			var fileInfo={};
			fileInfo.path = result.filePaths[0];
			if(fs.statSync(fileInfo.path).isFile()) {
				const buffer = fs.readFileSync(fileInfo.path);
				fileInfo.encoding = detectEncoding(buffer);
				fileInfo.content = buffer.toString(fileInfo.encoding);

				currentWindow.webContents.send('openFile', fileInfo);
			}
		}
	}).catch(err => {
		console.log('Error opening '+type_text+':', err);
	});
}
/** detectEncoding
 * @param Object buffer
 * @return String
 */
function detectEncoding(buffer) {
	if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
		return 'utf-8'; // UTF-8 with BOM
	} else if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
		return 'utf-16le'; // UTF-16LE with BOM
	} else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
		return 'utf-16be'; // UTF-16BE with BOM
	} else if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xFE && buffer[3] === 0xFF) {
		return 'utf-32be'; // UTF-32BE with BOM
	} else if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xFE && buffer[2] === 0x00 && buffer[3] === 0x00) {
		return 'utf-32le'; // UTF-32LE with BOM
	} else {
		return 'utf-8'; // Default to UTF-8 if no BOM is detected
	}
}
/** log
 * This function writes a string to the log file with the logging format.
 * @param String str
 * @returns Void
 */
function log(str) {
	console.log(str);
}
/** writeFileToDisk
 * @param String location
 * @param  String content
 * @reeturn Boolean
 */
function writeFileToDisk(location, content) {
	log('Attempting to save file', location, content);
	try {
		fs.writeFileSync(location, content, 'utf-8');
		log('File saved successfully ', location);
		return true;
	} catch(e) {
		log('Failed to save the file!', location, e);
		return false;
	}
}
/** openAboutModal
 * @returns Void
 */
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
/** getCurrentFile
 * This window requests information about the current open page from the open window
 * @returns Object
 */
async function getCurrentFile() {
	try {
		return await mainWindow.webContents.executeJavaScript(`getCurrentFile()`);
	} catch (error) {
		console.error('Error getting info for the open file:', error);
		return false;
	}
}
/** saveFile
 * @param Boolean force
 * @returns Void
 */
async function saveFile(force=false) {
	if((file = await getCurrentFile()).savable) {
		if(file.filePath == null || force) { // Check if the file already exists
			log('File to be saved path is not already set')
			dialog.showSaveDialog(mainWindow, {
					title: 'Save File', // Dialog title
					defaultPath: 'untitled.txt', // Default file name/path
					buttonLabel: 'Save', // Custom button label
					filters: [ // file filters
						{ name: 'All Files', extensions: ['*'] }
					],
			}).then(res => {
				if(res.canceled) { // Check if the save dialog was cancelled
					log('cancelled save dialog');
				} else {
					if(writeFileToDisk(res.filePath, file.content)) {
						currentWindow.webContents.send('filePath', res.filePath);
						currentWindow.webContents.send('fileName', path.basename(res.filePath));
					}
				}
			}).catch(err => {
				log(err);
			});
		} else {
			log('File to be saved path already set')
			writeFileToDisk(file.filePath, file.content)
		}
	}
}
//#endregion *****************************/
/*                  EOF                  */
/*****************************************/