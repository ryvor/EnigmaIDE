/*****************************************/
/*               VARIABLES               */
//#region ********************************/

const { app, Menu, BrowserWindow, dialog, ipcMain, shell, screen } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const fs = require('fs');
const os = require('os');

var	applicationMenuDefaults=[],
	applicationMenu={},
	allWindows=[],
	currentWindow,
	windowStyles=[],
	modalActive=false,
	initialized=false,
	screenWidth,
	screenHeight,
	halfScreenWidth;

if(require('electron-squirrel-startup')) terminate(true);
//#endregion *****************************/
/*             SYSTEM EVENTS             */
//#region ********************************/

app.on('ready', initialize);
app.on('window-all-closed', terminate);
app.on('activate', activate);
app.on('window-all-closed', allWindowsClosed);
app.on('web-contents-created', (event, contents)=>initializeContextMenu(event, contents))
app.on('open-file', (event, filePath) => {
	initialize();
	processProjectFile(filePath);
});
ipcMain.on('minimiseWindow', (event)=>currentWindow.minimize())
ipcMain.on('maximiseWindow', (event)=>(currentWindow.isMaximized())? currentWindow.restore(): currentWindow.maximize())
ipcMain.on('closeWindow', (event)=>currentWindow.close())
ipcMain.on('requestAppMenu', (event)=>event.sender.send('appMenu', JSON.stringify(applicationMenu[process.platform])))
ipcMain.on('createProject', (event)=>openSaveDialog(2, createProjectFile));
ipcMain.on('openFile', (event)=>openDialog(1, processFile));
ipcMain.on('processFile', (event, file )=>processFile(file));
ipcMain.on('openProject', (event)=>openDialog(3, processProjectFile));
ipcMain.on('getFileContent', (event)=>event.reply('getFileContent-reply', resp));
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

/** initializeContextMenu
 * 
 */
function initializeContextMenu(event, contents) {
	contextMenu({
		window: contents,
		showLearnSpelling: false,
		showLookUpSelection: false,
		showSearchWithGoogle: false,
		showCopyImage: false,
		showCopyLink: false,
		prepend: (defaultActions, parameters, browserWindow) => [
			{	label: '',
			},{	type: 'separator'
			},
		],
		append: () => [
			{	label: 'Command Pelette...',
			},
		],
	});  
}
/** tileWindowToLeft
 * 
 */
function tileWindowToLeft() {
	currentWindow.setBounds({ x: 0, y: 0, width: halfScreedWidth, screenHeight });
}
/** tileWindowToRight
 * 
 */
function tileWindowToRight() {
	currentWindow.setBounds({ x: halfScreenWidth, y: 0, width: halfScreenWidth, screenHeight });
}
function initialize() {
	if(initialized) exit();
	screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
	screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
	halfScreenWidth = Math.floor(screenWidth / 2);
	windowStyles.default = {
		width: 1080,
		height: 700,
		minWidth: 1080,
		minHeight: 600,
		show: false,
		icon: path.join(__dirname, '/front/assets/icons/enigma.png'),
		autoHideMenuBar: true,
		title: app.getName(),
		titleBarStyle: 'hidden',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
	};
	applicationMenuDefaults = {
		default: [
			{	label: app.getName(),
				submenu: [
					{	label: 'About Enigma IDE',
						accelerator: 'Alt+A',
						click: ()=>openModal('front/pages/about.html'),
					},{	label: 'Check for updates',
						accelerator: 'f10',
						click: ()=>{},
					},{	label: 'Open settings',
						accelerator: 'f12',
						click: ()=>{},
					},{	type: 'separator'
					},{	label: 'Hide '+app.getName(),
						accelerator: 'CmdOrCtrl+H',
						role: 'hide',
					},{	label: 'Hide Others',
						accelerator: 'CmdOrCtrl+Alt+H',
						role: 'hideOthers',
					},{	type: 'separator'
					},{	label: 'Quit',
						accelerator: '',
						click: ()=>terminate(true),
					},
				]
			},{	label: 'File',/*  */
				submenu: [
					{	label: 'New File',
						accelerator: 'CmdOrCtrl+N',
						click: ()=>currentWindow.send('newFile'),
					},{	label: 'New Project',
						accelerator: 'CmdOrCtrl+Alt+N',
						click: ()=>openSaveDialog(2, createProjectFile),
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
					},{	label: 'Save',
						accelerator: 'CmdOrCtrl+S',
						click: ()=>openSaveDialog(1, saveFile)
					},{	label: 'Save As...',
						accelerator: 'CmdOrCtrl+Shift+S',
						click: ()=>openSaveDialog(1.1, saveFile)
					},{	type: 'separator'
					},{	label: 'Close Editor',
						accelerator: 'CmdOrCtrl+W',
						click: ()=>currentWindow.send('closeTab'),
					},{	label: 'Close Project',
						accelerator: 'CmdOrCtrl+Alt+W',
						click: ()=>{}, // TODO
					},{	label: 'Close Folder',
						accelerator: 'CmdOrCtrl+Shift+W',
						click: ()=>{}, // TODO
					},
				]
			},{	label: 'Edit',
				submenu: [
					{	label: 'Undo',
						accelerator: 'CmdOrCtrl+Z',
						role: 'undo',
					},{	label: 'Redo',
						accelerator: 'CmdOrCtrl+Shift+Z',
						role: 'redo',
					},{	type: 'separator'
					},{	label: 'Cut',
						accelerator: 'CmdOrCtrl+X',
						role: 'cut',
					},{	label: 'Copy',
						accelerator: 'CmdOrCtrl+C',
						role: 'copy',
					},{	label: 'Paste',
						accelerator: 'CmdOrCtrl+V',
						role: 'paste',
					},{	type: 'separator'
					},{	label: 'Find',
						accelerator: 'CmdOrCtrl+F',
						click: ()=>{} // TODO
					},{	label: 'Replace',
						accelerator: 'CmdOrCtrl+Alt+F',
						click: ()=>{} // TODO
					},
				]
			},{	label: 'Selection',
				submenu: []
			},{	label: 'View',
				submenu: [
					{	label: 'Next Tab',
						accelerator: 'Ctrl+Tab',
						click: ()=>changeEditorTab('++'),
					},{	label: 'Previous Tab',
						accelerator: 'Ctrl+Shift+Tab',
						click: ()=>changeEditorTab('--'),
					},{	type: 'separator'
					},
				]
			},{	label: 'Go',
				submenu: []
			},{	label: 'Run',
				submenu: []
			},{	label: 'Terminal',
				submenu: []
			},{	label: 'Window',
				submenu: [
					{	label: 'Minimize',
						accelerator: '',
						click: ()=>currentWindow.minimize(),
					},{	label: 'Zoom',
						accelerator: '',
						click: ()=>(currentWindow.isMaximized())? currentWindow.restore(): currentWindow.maximize(),
					},{	label: 'Tile left',
						accelerator: '',
						click: ()=>tileWindowToLeft(),
					},{	label: 'Tile Right',
						accelerator: '',
						click: ()=>tileWindowToRight(),
					},{	type: 'separator'
				},
				]
			},{	label: 'Help',
				submenu: [
					{	label: 'Welcome',
						accelerator: '',
						click: ()=>currentWindow.send('openWelcomePage'),
					},{	label: 'Documentation',
						accelerator: '',
						click: ()=>shell.openExternal("http://ryvor.github.io/EnigmaIDE/")
					},{	label: 'Open Developer Tools',
						accelerator: '',
						click: ()=>currentWindow.openDevTools(),
					}
				]
			}
		],
		win32: [
			{	label: app.getName(),
				submenu: [
					{	label: 'Quit',
						accelerator: 'Alt+F4',
						click: ()=>terminate(true),
					},
				]
			}
		],
		darwin: [
			{	label: app.getName(),
				submenu: [
					{	label: 'Quit',
						accelerator: 'CmdOrCtrl+Q',
						click: ()=>terminate(true),
					},
				]
			}
		],
		linux: [
			{	label: app.getName(),
				submenu: [
					{	label: 'Quit',
						accelerator: 'Alt+F4',
						click: ()=>terminate(true),
					},
				]
			}
		],
	}
	applicationMenu.win32  = merge(applicationMenuDefaults.default, applicationMenuDefaults.win32);
	applicationMenu.darwin = merge(applicationMenuDefaults.default, applicationMenuDefaults.darwin);
	applicationMenu.linux  = merge(applicationMenuDefaults.default, applicationMenuDefaults.linux);

	registerApplicationMenu();
	createWindow();
	initialized=true;
}
/** createWindow
 * Creates a new window and loads the configuration
 * @return Void
 */
function createWindow() {
	allWindows[allWindows.length+1] = x = new BrowserWindow(windowStyles.default);
	x.loadFile(__dirname+'/front/index.html');

	x.on('focus', focus);
	x.on('blur', blur);
	x.on('maximize', ()=>(currentWindow)? currentWindow.send('windowState', true): null);
	x.on('unmaximize', ()=>(currentWindow)? currentWindow.send('windowState', false): null);
	x.once('ready-to-show', ()=>{
		x.show();
		x.send('windowState', x.isMaximized());
	});
	
	return x;
};
/** merge
 * 
 */
function merge(var1, var2) {
	var out;
	if (Array.isArray(var1) && Array.isArray(var2)) { // both arrays
		out = var1.slice(); // Make a shallow copy of var1
		for(var x=0; x<var1.length; x++) {
			for(var y=0; y<var2.length; y++) {
				if(var1[x].label == var2[y].label) {
					out[x] = merge(var1[x], var2[y]);
				}
			}
		}
	} else if(typeof var1 === 'object' && typeof var2 === 'object') { // both objects
		out = { ...var1 }; // Make a shallow copy of var1
		for (let key in var1) {
			if(var2[key]) {
				out[key] = merge(var1[key], var2[key]);
			}
		}
	} else { // both
		if(var1 === var2) {
			return var1;
		} else {
			return var2;
		}
	}
	return out;
}
/** Terminate
 * Closes the program in windows and linux, but waits for all of the  CMD+Q command on MAC
 * @return Void
 */
function terminate(force=false) {
	if (process.platform!=='darwin'|| force) {
		app.quit();
	}
}
/** activate
 * This function is called when the application has been initially launched or attempted to launch whilst already open
 * @return Void
 */
function activate() {
	if(BrowserWindow.getAllWindows().length === 0) createWindow();
}
/** blur
 * This this function is executed when the main browser window has lost focus
 * @return Void
 */
function blur() {
	currentWindow=null;
}
/** focus
 * This this function is executed when the main browser window has gained focus
 * @return Void
 */
function focus() {
	currentWindow = BrowserWindow.getFocusedWindow();
}
/** allWindowsClosed
 * This function resets the current window if all of the windows have been closed
 * @return Void
 */
function allWindowsClosed() {
}
/** registerApplicationMenu
 * This function sets the application alt menu for the program
 * @returns Void
 */
function registerApplicationMenu() {
	Menu.setApplicationMenu(Menu.buildFromTemplate(applicationMenu[process.platform]));
}
/** hide
 * 
 */
function hide() {
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
/** writeFileToDisk
 * @param String location
 * @param  String content
 * @reeturn Boolean
 */
function writeFileToDisk(location, content) {
	try {
		fs.writeFileSync(location, content, 'utf-8');
		return true;
	} catch(e) {

		log('ERROR: Could not save the file!', location, e);
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
	currentWindow.send('changeTab', modifier);
}
/** reopenLastEditor
 * This window requests information about the current open page from the open window
 * @returns Object
 */
async function reopenLastEditor() {
	try {
		return await currentWindow.executeJavaScript(`reopenLastClosed()`);
	} catch (error) {
		log('ERROR: Could not re-open the last file');
		return false;
	}
}
/** getCurrentFile
 * This window requests information about the current open page from the open window
 * @returns Object
 */
async function getCurrentFile() {
	try {
		return await currentWindow.webContents.executeJavaScript('getCurrentFile()');
	} catch (error) {
		log('ERROR: Could not gett info for the open file');
		return false;
	}
}
/** getCurrentFiles
 * This window requests information about all current editors from the open window
 * @returns Object
 */
async function getCurrentFiles() {
	try {
		return await currentWindow.webContents.executeJavaScript('getCurrentFiles()');
	} catch (error) {
		log('ERROR: Could not get info for the open files');
		return false;
	}
}
/** saveFile
 * @param Boolean force
 * @returns Void
 */
async function saveFile(response, obfuscate) {
	if(response.canceled) { currentWindow.send('loading', false); exit()}

	file = (obfuscate)? handleObfuscation(file.content): file;
	if(writeFileToDisk(response.filePath, file.content)) {
		if(obfuscate) writeFileToDisk(response.filePath, file.key);
		if(fs.statSync(response.filePath).isFile()) {
			const buffer = fs.readFileSync(response.filePath);
			currentWindow.send('fileEncoding', detectEncoding(buffer));
			currentWindow.send('filePath', response.filePath);
			currentWindow.send('fileName', path.basename(response.filePath));
		}
	}
}
function filterSystemFiles(files, root) {
	return files.filter((dirent) => {
		const filePath = path.join(root, dirent.name);
		const fileStats = fs.statSync(filePath);

		// Exclude system files based on criteria specific to your platform
		if (os.platform() === 'win32') {
			// Exclude files with system and hidden attributes
			if ((fileStats.isFile() && (fileStats.win32.system || fileStats.win32.hidden))) return false;
			// Exclude files with specific extensions commonly used for system files
			const systemFileExtensions = ['.sys', '.dll', '.ini', '.lnk'];
			const fileExtension = path.extname(dirent.name).toLowerCase();
			if (fileStats.isFile() && systemFileExtensions.includes(fileExtension)) return false;
		} else if (os.platform() === 'darwin') {
			// Exclude files with specific extensions commonly used for system files
			const systemFileExtensions = ['.localized', '.ds_store'];
			const fileExtension = path.extname(dirent.name).toLowerCase();
			if (fileStats.isFile() && (systemFileExtensions.includes(fileExtension) || systemFileExtensions.includes(dirent.name.toLowerCase()))) return false;
		} else if (os.platform() === 'linux') {
			// Exclude files with specific extensions commonly used for system files
			const systemFileExtensions = ['.so', '.conf'];
			const fileExtension = path.extname(dirent.name).toLowerCase();
			if (fileStats.isFile() && systemFileExtensions.includes(fileExtension)) return false;
		}
		// Include the file if it doesn't match any system file criteria
		return true;
	});
}
/** processFile
 * @param Object result
 */
async function processFile(result) {
	if(result.canceled) {currentWindow.send('loading', false); exit();}
	var fileInfo={};
	if(typeof result === 'string') {
		process(result);
	} else {
		result.filePaths.forEach((filePath)=>process(filePath))
	}
	function process(filePath) {
		fileInfo.path = filePath;
		if(fs.statSync(fileInfo.path).isFile()) {
			const buffer = fs.readFileSync(fileInfo.path);
			fileInfo.encoding = detectEncoding(buffer);
			fileInfo.content = buffer.toString(fileInfo.encoding);
			currentWindow.send('openFile', fileInfo);
		}
	}
}
/** createProjectFile
 * @param Object result
 */
function createProjectFile(result) {
	if(result.canceled) {currentWindow.send('loading', false); exit();}
	const project = {}
	project.name = path.basename(result.filePath, path.extname(result.filePath));
	project.folders = [
		path.dirname(result.filePath)
	];
	project.settings = {};
	if(writeFileToDisk(result.filePath, JSON.stringify(project, null, "\t"))) {
		processProjectFile(result.filePath);
	}
}
/** processProjectFile
 * 
 */
async function processProjectFile(result) {
	if(result.canceled) {currentWindow.send('loading', false); exit();}
	var files=[],
	fileCount=0;
	(typeof result !== 'object')? files.push(result): files=result.filePaths;
	try {
		for (const file of files) {
			var json = JSON.parse(fs.readFileSync(file));

			for (const folder of json.folders) {
				json.folderContents = {
					name: path.basename(path.dirname(file)),
					base: path.dirname(file)+'/',
					type: 'directory',
					contents: await processDirectory(folder),
				}
			};
			(fileCount==0)? currentWindow.send('processProject', json): createWindow().send('processProject', json);
			fileCount++;
		};
	} catch(e) {
		log('ERROR: Couldnt process project file. ');
		log(e);
	}
}
/** processDirectory
 * @param Object result
 */
async function processDirectory(result) {
	if(result.canceled) {currentWindow.send('loading', false); exit();}
	return await new Promise((resolve, reject) => {
	  fs.readdir(result, { withFileTypes: true }, async (err, unfilteredFiles) => {
		// Check for errors
		if (err) reject(err);
		// Filter system files
		const files = filterSystemFiles(unfilteredFiles, result);
		// Set variables
		const folderPromises = [];
		const filePromises = [];
		// Scan through directory to get files recursively
		for (const dirent of files) {
			const itemPromise = {
				name: dirent.name,
				type: dirent.isDirectory() ? 'directory' : 'file',
			};
			// If the path is a directory, scan the directory otherwise get the name and type
			if (dirent.isDirectory()) {
				itemPromise.contents = await processDirectory(path.join(result, dirent.name));
				folderPromises.push(itemPromise);
			} else {
				itemPromise.path = path.join(result, dirent.name);
				filePromises.push(itemPromise);
			}
		}
		const folderItems = await Promise.all(folderPromises);
		const fileItems = await Promise.all(filePromises);
		resolve(folderItems.concat(fileItems));
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
	var windowID = currentWindow.id;
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
			properties = ['openFile', 'multiSelections'];
			break;
	}
	try {
		allWindows[windowID].setEnabled(false);
		dialog.showOpenDialog({
			filters: filters,
			properties: properties
		}).then((result)=>{
			allWindows[windowID].setEnabled(true);
			return result;
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
			title = 'Foce Save File As';
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
		file = await getCurrentFile();
		if(file.savable || force) {
			if(file.filePath == null || saveas || force) { // Check if the file already exists
				dialog.showSaveDialog(currentWindow, {
					title: type_text,
					filters: filters,
					defaultPath: defaultName, 
					buttonLabel: 'Save',
				}).then(res => {
					cb(res);
				}).catch(err => {
					new Error(err);
				});
			} else {
				cb(file);
			}
		}
	} catch (error) {
		log('ERROR: Could not process the save dialog');
		return false;
	}
}

/** log
 * This function writes a string to the log file with the logging format.
 * @param { String } str
 * @returns Void
 */
function log(str) {
	console.log(str);
}
//#endregion *****************************/
/*              Obfuscation              */
//#region ********************************/
function handleObfuscation(content) {

}
function handleDeobfuscation(content, key) {

}
//#endregion *****************************/
/*                  EOF                  */
/*****************************************/