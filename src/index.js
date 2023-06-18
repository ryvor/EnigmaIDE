/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, globalShortcut, dialog, Notification, ipcMain, shell } = require('electron');
const windowManager = require('electron-window-manager');
const fs = require('fs');
const path = require('path');
var currentWindow=null,
	mainWindow=null,
	modal=null,
	modalActive=false,
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
ipcMain.on('createProject', (event)=>openSaveDialog(2, createProjectFile));
ipcMain.on('openFile', (event)=>openDialog(1, processFile));
ipcMain.on('openProject', (event)=>openDialog(3, processProjectFile));
ipcMain.on('openModal', async (event, message) => {
	switch(typeof message) {
		case "object":
			file = message.file;
			options = message.options;
			break;
		case "string":
			file = message.file;
			options = {};
			break;
	}
	await openModal(file, options, (resp)=>{
		event.reply('modal-response', resp);
	});
});
  
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
					click: () => {openModal('front/pages/about.html')},
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
					click: () => {openDialog(1, processFile)},
				},{	label: 'Open Folder',
					accelerator: 'CmdOrCtrl+Shift+O',
					click: () => {openDialog(3, processDirectory)},
				},{	label: 'Open Project',
					accelerator: 'CmdOrCtrl+Altt+O',
					click: () => {openDialog(3, processProjectFile)},
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
					click: ()=>openSaveDialog(1, saveFile)
				},{	label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: ()=>openSaveDialog(1.1, saveFile)
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
					click: ()=>shell.openExternal("http://ryvor.github.io/EnigmaIDE/")
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
		if(!globalShortcut.register('Alt+A', ()=>{openModal('front/pages/about.html')})) log('Failed to register global shortcut 1');
		if(!globalShortcut.register('CommandOrControl+H', ()=>{console.log('TODO')})) log('Failed to register global shortcut 2');
		if(!globalShortcut.register('CommandOrControl+Shift+H', ()=>{console.log('TODO')})) log('Failed to register global shortcut 3');
		if(process.platform==='darwin')
			if(!globalShortcut.register('Command+Q', ()=>terminate(true)))
				log('Failed to register global shortcut 4');
		//---//
		if(!globalShortcut.register('CommandOrControl+N', ()=>currentWindow.webContents.send('newFile'))) log('Failed to register global shortcut 5');
		if(!globalShortcut.register('CommandOrControl+Shift+N', ()=>createNewWindow())) log('Failed to register global shortcut 6');
		if(!globalShortcut.register('CommandOrControl+O', ()=>openDialog(1, processFile))) log('Failed to register global shortcut 7');
		if(!globalShortcut.register('CommandOrControl+Shift+O', ()=>openDialog(3, processDirectory))) log('Failed to register global shortcut 8');
		if(!globalShortcut.register('CommandOrControl+Alt+O', ()=>openDialog(3, processProjectFile))) log('Failed to register global shortcut 9');
		if(!globalShortcut.register('CommandOrControl+W', ()=>currentWindow.webContents.send('closeTab'))) log('Failed to register global shortcut 9');
		//---//
		if(!globalShortcut.register('CommandOrControl+S', ()=>{openSaveDialog(1, saveFile)})) log('Failed to register global shortcut 10');
		if(!globalShortcut.register('CommandOrControl+Shift+S', ()=>{openSaveDialog(1.1, saveFile)})) log('Failed to register global shortcut 11');
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
/** processFile
 * @param Object result
 */
async function processFile(result) {
	var fileInfo={};
	result.filePaths.forEach((filePath)=>{
		fileInfo.path = filePath;
		if(fs.statSync(fileInfo.path).isFile()) {
			const buffer = fs.readFileSync(fileInfo.path);
			fileInfo.encoding = detectEncoding(buffer);
			fileInfo.content = buffer.toString(fileInfo.encoding);
			currentWindow.webContents.send('openFile', fileInfo);
		}
	})
}
/** processProjectFile
 * 
 */
async function processProjectFile(result) {
	var c = JSON.parse(fs.readFileSync(result.filePaths[0]));
	c.json = await processDirectory(c.base)
	currentWindow.webContents.send('openDirectory', c);
}
/** createProjectFile
 * @param Object result
 */
function createProjectFile(result) {
	const content = {}
	content.base = result.filePath;
	content.folders = [result.filePath];
	content.settings = {};
	if(writeFileToDisk(result.filePath, JSON.stringify(content, null, "\t"))) {
		processProjectFile(result.filePath);
	}
}
/** processDirectory
 * @param Object result
 */
async function processDirectory(folderPath) {
	return await new Promise((resolve, reject) =>{
		fs.readdir(folderPath, { withFileTypes: true }, async (err, files) => {
			if (err) {
				reject(err);
				return;
			}
			const directoryJSON = {
				path: folderPath,
				contents: []
			};
			const promises = files.map(async (file) => {
					const item = {
						name: file.name,
						type: file.isDirectory() ? 'directory' : 'file'
					};
					if (file.isDirectory()) item.contents = await processDirectory(path.join(folderPath, file.name));
					return item;
			});
			// Wait for all the promises to resolve
			directoryJSON.contents = await Promise.all(promises);
			resolve(directoryJSON);
		});
	});
}
/** openDialog
 * This function will open a window to enable the ability to open a file or folder
 * @param Integer type
 * @returns Void
 */
async function openDialog(type, cb) {
	let type_text, filters, properties;
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
			type_text = 'Enigma Project';
			filters = [
				{ name: 'Enigma Project File', extensions: ['enws'] }
			];
			properties = ['openFile'];
			break;
	}
	try {
		dialog.showOpenDialog({
			filters: filters,
			properties: properties
		}).then((result)=>{
			cb(result);
		});
	} catch (error) {
		return false;
	}
}
/** openSaveDialog
 * This function will open a window to enable the ability to open a file or folder
 * @param Integer type
 * @returns Void
 */
async function openSaveDialog(type, cb) {
	let type_text, defaultName, filters, force=false, saveas=false;
	switch(type) {
		case 1:
			title = 'Save File';
			defaultName = 'untitled.txt';
			filters = [
				{ name: 'All Files', extensions: ['*'] }
			]
			break;
		case 1.1:
			title = 'Save File As';
			defaultName = 'untitled.txt';
			filters = [
				{ name: 'All Files', extensions: ['*'] }
			]
			saveas = true;
			break;
		case 1.2:
			title = 'Save File As';
			defaultName = 'untitled.txt';
			filters = [
				{ name: 'All Files', extensions: ['*'] }
			]
			force = true;
			break;
		case 2:
			type_text = 'Save Enigma Project';
			defaultName = 'untitled.enws';
			filters = [
				{ name: 'Enigma Project File', extensions: ['enws'] }
			];
			force = true;
			break;
	}
	try {
		if((file = await getCurrentFile()).savable || force) {
			if(file.filePath == null || saveas || force) { // Check if the file already exists
				log('File to be saved path is not already set')
				dialog.showSaveDialog(mainWindow, {
					title: type_text,
					filters: filters,
					defaultPath: defaultName, 
					buttonLabel: 'Save',
				}).then(res => {
					cb(res);
				}).catch(err => {
					log(err);
				});
			} else {
				log('File to be saved path already set')
				writeFileToDisk(file.filePath, file.content)
			}
		}
	} catch (error) {
		console.log('err');
		return false;
	}
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
	try {
		log('Attempting to save file', location, content);
		fs.writeFileSync(location, content, 'utf-8');
		log('File saved successfully ', location);
		return true;
	} catch(e) {
		log('Failed to save the file!', location, e);
		return false;
	}
}
/** openModal
 * @returns Void
 */
function openModal(page, options={}, cb) {
	return new Promise((resolve, reject) => {
		var res=null,
				defaultOptions = {
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
			};
		browserOptions = Object.assign({}, defaultOptions, options);
		if(!modalActive) {
			modalActive = true;
			var modal = new BrowserWindow(browserOptions);
			modal.loadFile(path.join(__dirname, page));
			modal.once('ready-to-show', ()=>modal.show());
			modal.on('focus', ()=>focus())
			modal.on('blur', ()=>blur())
			modal.on('close', ()=>{
				modal=false;
				modalActive=false;
				if(cb) cb(res);
				resolve(); // Resolve the promise when modal is closed
			})
			modal.webContents.on('ipc-message', (event, channel, message) => {
				if (channel === 'closeModal') {
					res = message;
				}
			});
		} else {
			reject(new Error('Modal is already active'));
		}
	});
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
async function saveFile(response) {
	if(response.canceled) { // Check if the save dialog was cancelled
		log('cancelled save dialog');
	} else {
		if(writeFileToDisk(response.filePath, file.content)) {
			currentWindow.webContents.send('filePath', response.filePath);
			currentWindow.webContents.send('fileName', path.basename(response.filePath));
		}
	}
}
//#endregion *****************************/
/*                  EOF                  */
/*****************************************/