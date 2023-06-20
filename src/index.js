/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, globalShortcut, dialog, Notification, ipcMain, shell } = require('electron');
const windowManager = require('electron-window-manager');
const path = require('path');
const fs = require('fs');
var	
	allWindows=[],
	windowStyles=[],
	modalActive=false,
	keybinds_status=false;
if(require('electron-squirrel-startup')) terminate(true);
//#endregion *****************************/
/*             SYSTEM EVENTS             */
//#region ********************************/

app.on('ready', ()=>{
	windowStyles[0] = {
		width: 1000,
		height: 770,
		show: false,
		icon: path.join(__dirname, '/front/assets/icons/enigma.png'),
		autoHideMenuBar: true,
		title: process.env.productName,
		titleBarStyle: 'hidden',
		resizable: true,
		titleBarOverlay: {
			symbolColor: '#74b1be',
			height: 20
		},
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
	};
	registerApplicationMenu();
	createWindow();
	var x = windowManager.getCurrent()
	console.log(typeof x);
});
app.on('window-all-closed', terminate);
app.on('activate', activate);
app.on('window-all-closed', allWindowsClosed);
  
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
	console.log('Create window');
	var x = allWindows[allWindows.length] = windowManager.createNew(''+allWindows.length, false, path.join('file://', __dirname, '/front/index.html'), false, windowStyles[0]);
	x.open();
	x.focus();
	x.content().on('focus', ()=>focus);
	x.content().on('blur', ()=>blur);
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
	console.log('activate');
	// if(BrowserWindow.getAllWindows().length === 0) createWindow();
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
	if (applicationMenu) {
		iterateMenuItems(applicationMenu.items);
	} else {
		console.log('Application menu not found.');
	}
}
/** allWindowsClosed
 * This function resets the current window if all of the windows have been closed
 * @return Void
 */
function allWindowsClosed() {
	currentWindow = null;
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
					click: ()=>openModal('front/pages/about.html'),
				},{	label: 'Check for updates',
					accelerator: '',
					click: ()=>{},
				},{	label: 'Open settings',
					accelerator: '',
					click: ()=>{},
				},{	type: 'separator'
				},{	label: 'Hide '+process.env.productName,
					accelerator: 'CmdOrCtrl+H',
					click: ()=>{},
				},{	label: 'Hide Others',
					accelerator: 'CmdOrCtrl+Alt+H',
					click: ()=>{},
				},{	type: 'separator'
				},{	label: 'Save',
					accelerator: 'CmdOrCtrl+S',
					click: ()=>openSaveDialog(1, saveFile)
				},{	label: 'Save As...',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: ()=>openSaveDialog(1.1, saveFile)
				},{	type: 'separator'
				},{	label: 'Quit',
					accelerator: 'CmdOrCtrl+Q',
					click: ()=>terminate(true),
				},
			]
		},{	label: 'File',
			submenu: [
				{	label: 'New File',
					accelerator: 'CmdOrCtrl+N',
					click: ()=>windowManager.getCurrent().content().send('newFile'),
				},{	label: 'New Project',
					accelerator: 'CmdOrCtrl+Alt+N',
					click: ()=>createProjectFile(),
				},{	label: 'New Window',
					accelerator: 'CmdOrCtrl+Shift+N',
					click: ()=>createWindow(),
				},{	type: 'separator'
				},{	label: 'Open File',
					accelerator: 'CmdOrCtrl+O',
					click: ()=>openDialog(1, processFile),
				},{	label: 'Open Project',
					accelerator: 'CmdOrCtrl+Alt+O',
					click: ()=>openDialog(3, processProjectFile),
				},{	label: 'Open Folder',
					accelerator: 'CmdOrCtrl+Shift+O',
					click: ()=>openDialog(3, processDirectory),
				},{	type: 'separator'
				},{	label: 'Close Editor',
					accelerator: 'CmdOrCtrl+W',
					click: ()=>windowManager.getCurrent().content().send('closeTab'),
				},{	label: 'Close Project',
					accelerator: 'CmdOrCtrl+Alt+W',
					click: ()=>{},
				},{	label: 'Close Folder',
					accelerator: 'CmdOrCtrl+Shift+W',
					click: ()=>{},
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
				},{	label: 'Cut',
					accelerator: 'CmdOrCtrl+X',
					click: () => {}
				},{	label: 'Copy',
					accelerator: 'CmdOrCtrl+C',
					click: () => {}
				},{	label: 'Paste',
					accelerator: 'CmdOrCtrl+V',
					click: () => {}
				},{	type: 'separator'
				},{	label: 'Find',
					accelerator: 'CmdOrCtrl+F',
					click: () => {}
				},{	label: 'Replace',
					accelerator: 'CmdOrCtrl+Alt+F',
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
			submenu: [
				{	label: 'Welcome',
					accelerator: '',
					click: ()=>windowManager.getCurrent().content().send('openWelcomePage'),
				},{	label: 'Documentation',
					accelerator: '',
					click: ()=>shell.openExternal("http://ryvor.github.io/EnigmaIDE/")
				},{	label: 'Open Developer Tools',
					accelerator: '',
					click: ()=>windowManager.getCurrent().content().openDevTools(),
				}
			]
		}
	]));
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
/** hide
 * 
 */
function toggle() {
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
				parent: currentWindow,
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
/** changeEditorTab
 * 
 * @param {*} modifier 
 */
function changeEditorTab(modifier) {
	windowManager.getCurrent().content().send('changeTab', modifier);
}
/** reopenLastEditor
 * This window requests information about the current open page from the open window
 * @returns Object
 */
async function reopenLastEditor() {
	try {
		return await windowManager.getCurrent().content().executeJavaScript(`reopenLasClosed()`);
	} catch (error) {
		console.error('Error getting info for the open file:', error);
		return false;
	}
}
/** getCurrentFile
 * This window requests information about the current open page from the open window
 * @returns Object
 */
async function getCurrentFile() {
	try {
		return await windowManager.getCurrent().content().executeJavaScript(`getCurrentFile()`);
	} catch (error) {
		console.error('Error getting info for the open file:', error);
		return false;
	}
}
/** getCurrentFiles
 * This window requests information about all current editors from the open window
 * @returns Object
 */
async function getCurrentFiles() {
	try {
		return await windowManager.getCurrent().content().executeJavaScript(`getCurrentFiles()`);
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
			if(fs.statSync(response.filePath).isFile()) {
				const buffer = fs.readFileSync(response.filePath);
				windowManager.getCurrent().content().send('fileEncoding', detectEncoding(buffer));
				windowManager.getCurrent().content().send('filePath', response.filePath);
				windowManager.getCurrent().content().send('fileName', path.basename(response.filePath));
			}
		}
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
			windowManager.getCurrent().content().send('openFile', fileInfo);
		}
	})
}
/** processProjectFile
 * 
 */
async function processProjectFile(result) {
	var c = JSON.parse(fs.readFileSync(result.filePaths[0]));
	c.json = await processDirectory(c.base)
	windowManager.getCurrent().content().send('openDirectory', c);
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
				dialog.showSaveDialog(currentWindow, {
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
//#endregion *****************************/
/*                  EOF                  */
/*****************************************/