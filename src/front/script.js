/*****************************************/
/*               VARIABLES               */
//#region ********************************/
const { ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');
var editors = [],
	lastEditor = [],
	recentlyClosed = [],
	lastClosed = {},
	currEditor = null;

//#endregion *****************************/
/*             ELECTRON IPC              */
//#region ********************************/
ipcRenderer.on('openFile', (event, fileInfo)=>{createEditorTab(fileInfo); loading(false);});
ipcRenderer.on('openDirectory', (event, message )=>{handleOpenDirectory(message); loading(false);});
ipcRenderer.on('processProject', (event, json)=>{handleOpenProject(json); loading(false);});
ipcRenderer.on('newFile', (event)=>createEditorTab());
ipcRenderer.on('closeTab', (event)=>removeEditorTab());
ipcRenderer.on('openWelcomePage', (event)=>createEditorTab('./pages/welcome.html', true));
ipcRenderer.on('openSettingsPage', (event)=>createEditorTab('./pages/welcome.html', true));
ipcRenderer.on('fileEncoding', (event, fileEncoding)=>updateFileEncoding(fileEncoding));
ipcRenderer.on('filePath', (event, filePath)=>updateFilePath(filePath));
ipcRenderer.on('fileName', (event, fileName)=>updateFileName(fileName));
ipcRenderer.on('changeTab', (event, modifier)=>changeEditorTab(modifier));
ipcRenderer.on('loading', (event, bool)=>loading(bool));
ipcRenderer.on('console', (event, element)=>console.log(element));
ipcRenderer.on('windowState', (event, state)=>{
	if(state) {
		document.querySelector('titlebar[for="win32"] maximise').innerHTML = '';
		document.querySelector('titlebar[for="darwin"] maximise').innerHTML = '';
		document.querySelector('titlebar[for="linux"] maximise').innerHTML = '';
	} else {
		document.querySelector('titlebar[for="win32"] maximise').innerHTML = '';
		document.querySelector('titlebar[for="darwin"] maximise').innerHTML = '';
		document.querySelector('titlebar[for="linux"] maximise').innerHTML = '';
	}
});
//#endregion *****************************/
/*           SYSTEM-SPECIFIC             */
//#region ********************************/
if (os.platform() == 'win32') {
	ipcRenderer.send('requestAppMenu');
	ipcRenderer.on('appMenu', (event, menuJSON)=>{
		var	cont, cnt=0;
		JSON.parse(menuJSON).forEach((element)=>{
			if(cont = document.querySelector(`titlebar[for="${os.platform()}"] titlebar-menu`)) {
				titlebarMenuContainer = document.createElement("titlebar-menu-container");
				titlebarMenuLabel = document.createElement("titlebar-menu-label");
				titlebarMenuSubmenu = document.createElement("titlebar-menu-submenu");
				titlebarMenuContainer.setAttribute('tabindex', 0)
				titlebarMenuLabel.innerText = element.label;
				cont.appendChild(titlebarMenuContainer);
				titlebarMenuContainer.appendChild(titlebarMenuLabel);
				titlebarMenuContainer.appendChild(titlebarMenuSubmenu);
				cont.classList.add('show');
				
				if(element.submenu) {
					element.submenu.forEach((element)=>{
						if(element.label) {
							titlebarMenuSubmenuItem = document.createElement("titlebar-menu-submenu-item");
							titlebarMenuSubmenuItemLabel = document.createElement("titlebar-menu-submenu-item-label");
							titlebarMenuSubmenuItemAccellerator = document.createElement("titlebar-menu-submenu-item-accellerator");
							// append title
							titlebarMenuSubmenuItemLabel.innerText = element.label;
							//append accellerators
							titlebarMenuSubmenuItemAccellerator.innerText = getAcceleratorString(element.accelerator);

							titlebarMenuSubmenu.appendChild(titlebarMenuSubmenuItem);
							titlebarMenuSubmenuItem.appendChild(titlebarMenuSubmenuItemLabel);
							titlebarMenuSubmenuItem.appendChild(titlebarMenuSubmenuItemAccellerator);
						} else if(element.type == 'separator') {
							titlebarMenuSubmenuItem = document.createElement("hr");
							titlebarMenuSubmenu.appendChild(titlebarMenuSubmenuItem);
						} else {
							console.info(element)
						}
					})
				}
			}
			cnt++
		});
	});
}
//#endregion *****************************/
/*            QUERY SELECTORS            */
/*            EVENT LISTENERS            */
//#region ********************************/
document.querySelector(`titlebar[for="${os.platform()}"]`).style.display = 'flex';
document.querySelector('.openSettingsPage').addEventListener('click', ()=>openSettingsPage());
document.querySelectorAll('minimise').forEach((btn)=>{btn.addEventListener('click', ()=>ipcRenderer.send('minimiseWindow'))});
document.querySelectorAll('maximise').forEach((btn)=>{btn.addEventListener('click', ()=>ipcRenderer.send('maximiseWindow'))});
document.querySelectorAll('close').forEach((btn)=>{btn.addEventListener('click', ()=>ipcRenderer.send('closeWindow'))});
document.querySelector('tabs').addEventListener('click', function(event) {
	if(event.target.classList.contains('oct-plus')) {
		createEditorTab()
	} else if (event.target.tagName.toLowerCase() === 'tab') {
		if(!event.target.classList.contains('selected')) {
			changeEditorTab(parseInt(event.target.id));
		}
	} else if (event.target.tagName.toLowerCase() === 'tab-close') {
		removeEditorTab(event.target.parentNode.id);
	}
});
document.querySelector('tabs').addEventListener('dblclick', (event)=>(event.target.tagName.toLowerCase() === 'tabs')? createEditorTab():null);
document.querySelector('tabs').addEventListener('mousedown', event => {
	if (event.button === 1) {
		const tabElement = event.target.closest('tab');
		if (tabElement) {
			removeEditorTab(tabElement.id);
		}
	}
});
window.addEventListener('message', function(event) {
	message = event.data;
	// specify the allowed functions and variabled
	var allowedFunctions = {
		createEditorTab: createEditorTab,
		changeEditorTab: changeEditorTab,
		removeEditorTab: removeEditorTab,
		createProject: createProject,
		openFile: openFile,
		openProject: openProject,
	};
	var allowedVariables = {};
	// execute each function specified
	if(message.functions) {
		message.functions.forEach((func)=>{
			if(typeof (x = allowedFunctions[func.name])=== 'function') {
				x();
			}
		});
	}
	// clsoe tab is requested
	if(message.closeTab) removeEditorTab(message.frameID);
});
//#endregion *****************************/
/*               FUNCTIONS               */
//#region ********************************/

// Core functions
function createEditorTab(options = {}) {
	var defaultOptions = new function() {
		this.id =						editors.length;

		this.tabContainer =				document.querySelector('tabs');
		this.tabElements =				{};
		this.tabElements.tab =			this.tabContainer.appendChild(document.createElement('tab'));
		this.tabElements.tabTitle =		this.tabElements.tab.appendChild(document.createElement('tab-title'));
		this.tabElements.tabClose =		this.tabElements.tab.appendChild(document.createElement('tab-close'));

		this.editorConfig =				undefined;
		this.editorContainer =			document.querySelector('editors');
		this.editorElements =			{};
		this.editorElements.editor =	this.editorContainer.appendChild(document.createElement('editor'));

		this.title =					undefined;
		this.path =						'';
		this.ide =						undefined;
		this.preview =					false;
		this.encoding =					'UTF-8';
		this.content =					'';
	};
	const config = Object.assign({}, defaultOptions, options);
	config.title = (config.preview)? config.path.match(/([a-z]+)\.[a-z]+/)[1].charAt(0).toUpperCase()+config.path.match(/([a-z]+)\.[a-z]+/)[1].slice(1): (config.path !== '')? config.path.split("/").pop(): `undefined-`+editors.length;;
	// Check if the file has already been opened, set the tab for it 
	if((x = document.querySelector(`tabs > tab[filepath="${config.path}"]`)) !== null) {config.id = x.id;} else {
		config.tabElements.tabTitle.innerText = config.title;
		config.tabElements.tabClose.classList.add('oct-x');

		config.tabElements.tab.id = config.id;
		config.editorElements.editor.id = config.id;

		if(config.preview){
			//*				 | IMAGE FILES			  	  |	AUDIO FILES | VIDEO FILES  | DOCUMENTS						| ARCHIVES		 | XML/HTML		| TEXT BASED  | FONTS			   | DATA	 | DATABASE		 | 3D MODELS  |				 *//
			if(/\.[ong|jpeg|jpg|gif|svg|eps|ai | mp3|wav|ogg | mp4|webm|ogg | pdf|doc|docx|xls|xlsx|ppt|pptx | zip|tar|gz|rar | html|htm|xml | css|js|json | ttf|woff|woff2|otf | csv|tsv | sqlite|db|sql | obj|stl|fbx]+/.exec(config.path)[0] !== '.html') {
				exit(`Unable to preview file: The file requested (${fileInfo}) is not a previewable file. Cannot be previewed`);
			}
			config.tabElements.tabTitle.innerText = config.title;
			var iframe = config.content = config.editorElements.editor.appendChild(document.createElement('iframe'));
			iframe.setAttribute('src', config.path)
			iframe.onload = function() {
				iframe.contentWindow.postMessage({
					type: 'initialize',
					id: config.id,
					templateRequest: {
						frameID: config.id,
						functions: [],
						closeTab: false,
					}
				}, '*');
			};
		} else {
			if((config.editorConfig = Enigma.findModeByFileName(config.path)) === undefined) config.editorConfig = Enigma.findModeByMIME('text/plain');
			config.editorIDE = Enigma(config.editorElements.editor, {
				value: config.content,
				mode: config.editorConfig.mode,
				lineNumbers: true,
				matchBrackets: {
					highlightNonMatching: true,
				},
				matchTags: {
					bothTags: true,
				},
				foldGutter: true,
				foldOptions: {
					widget: "  ",
				},
				gutters: [
					"Enigma-linenumbers",
					"Enigma-foldgutter"
				],
			});
			config.editorIDE.on("cursorActivity", () => {
				const cursorPosition = config.editorIDE.getCursor();
				document.querySelector('footer-controls .enigma-editor-row-number').innerText = cursorPosition.line;
				document.querySelector('footer-controls .enigma-editor-column-number').innerText = cursorPosition.ch;
			});
			if(config.editorConfig) Enigma.autoLoadMode(config.editorIDE, config.editorConfig.mode);
			config.editorIDE.focus();
		}
		editors.push(config);
		if(editors.length>0) config.tabContainer.classList.remove('oct-plus')
	}
	changeEditorTab(config.id);
}
function changeEditorTab(modifier) {
	// Get the tab to change to based on number or string for dynamic changing
	switch(typeof modifier) {
		case 'number':
			element_id = modifier;
			break;
		case 'string':
			if(modifier === '++') {
				element_id = currEditor +1;
				if(element_id == editors.length) element_id = 0;
			} else if(modifier === '--') {
				element_id = currEditor - 1;
				if(element_id == -1) element_id = editors.length-1;
			}
			break;
		default:
			console.info(typeof modifier);
	}
	// Change the editor
	if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
	// Change the tab
	if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
	if(x = editors[element_id].tabElements.tab) x.classList.add('selected');
	// Change the selected tree item if exists
	if(x = document.querySelector(`project-item.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`project-item[filepath="${editors[element_id].path}"]`)) x.classList.add('selected');
	// Focus on the correct IDE, if exists
	if(editors[element_id] && editors[element_id]['IDE']) editors[element_id]['IDE'].focus();
	// Set the current editor
	currEditor = element_id;
	// add the previous editor to the list of last editors.
	lastEditor.push(element_id);
	// Change the Row/Column on the footer bar
	console.log(editors[element_id]);
	if(editors[element_id].preview){
		document.querySelectorAll('footer-controls > a.editorConfig').forEach((elem)=>{
			elem.style.display = 'none';
		})
	} else {
		document.querySelectorAll('footer-controls > a.editorConfig').forEach((elem)=>{
			elem.style.display = 'flex';
		})
		// Change the Line/Column on the footer bar
		var cursorPosition = editors[element_id].editorIDE.getCursor();
		document.querySelector('footer-controls .enigma-editor-row-number').innerText = cursorPosition.ch;
		document.querySelector('footer-controls .enigma-editor-column-number').innerText = cursorPosition.line;
		// Change the Tab size on the footer bar
		document.querySelector('footer-controls .enigma-editor-tab-size').innerText = editors[element_id].editorIDE.options.tabSize;
		// Change the Encoding on the footer bar
		document.querySelector('footer-controls .enigma-editor-encoding').innerText = editors[element_id].encoding;
		// Change the End-of-line Convention on the footer bar
		document.querySelector('footer-controls .enigma-editor-end-of-line-convention').innerText = editors[element_id].editorIDE.options.lineSeperator;
		// Change the Language on the footer bar	
		document.querySelector('footer-controls .enigma-editor-lang').innerText = editors[element_id].editorConfig.name;
	}
}
function removeEditorTab(tabID) {
	if(!tabID) tabID = document.querySelector(`tab.selected`).id;
	var elem = document.querySelector(`tab[id="${tabID}"]`);
	elem.parentNode.removeChild(elem);
	var elem = document.querySelector(`editor[id="${tabID}"]`);
	elem.parentNode.removeChild(elem);
	// Remove every occurrence of the closed tab from the active tabs array
	lastEditor = lastEditor.filter(function(value){
		return value != tabID;
	});
	// change the tabs and reload the editors array
	recentlyClosed.push(editors[tabID]);
	lastClosed = editors[tabID];
	delete editors[tabID]
	changeEditorTab(parseInt(lastEditor[lastEditor.length - 1]));
	(Object.keys(editors).length == 0)? document.querySelector('tabs').classList.add('oct-plus') : document.querySelector('tabs').classList.remove('oct-plus');
}

// Project tree
function loadProjectTree() {
	document.querySelectorAll('project-item').forEach((item)=>{
		item.addEventListener('click', ()=>{
			if(item.nextElementSibling && item.nextElementSibling.tagName == 'PROJECT-FOLDER') {
				item.classList.toggle('oct-chevron-right');
				item.classList.toggle('oct-chevron-down');
				item.nextElementSibling.classList.toggle('unfolded');
			} else {
				ipcRenderer.send('processFile', item.getAttribute('filepath'));
				if(document.querySelector('project-item.selected')) document.querySelector('project-item.selected').classList.remove('selected');
				item.classList.add('selected');
			}
		})
	})
}

// Other functions
function getAcceleratorString(string) {
	if(string.includes('+')) {
		var out = string.split('+').map((str)=>{
			return getAcceleratorString(str);
		});
		if(os.platform()=='darwin') {
			return out.join('')
		} else if(os.platform()=='darwin') {
			return out.join('+')
		} else {
			return out.join('+')
		}
	} else {
		switch(string) {
			case 'CommandOrControl':
			case 'CmdOrCtrl':
				return (os.platform()=='darwin')? '⌃': 'Ctrl';
			case 'Command':
			case 'Control':
			case 'Cmd':
			case 'Ctrl':
				return (os.platform()=='darwin')? '⌘': 'Ctrl';
			case 'Alt':
				return (os.platform()=='darwin')? '⌥': 'Alt';
			case 'Shift':
				return (os.platform()=='darwin')? '⇧': 'Shift';
			case 'f1':
			case 'f2':
			case 'f3':
			case 'f4':
			case 'f5':
			case 'f6':
			case 'f7':
			case 'f8':
			case 'f9':
			case 'f10':
			case 'f11':
			case 'f12':
			default:
				return string;
		}
	}
}
function handleOpenProject(json) {
	handleOpenDirectory(json.folderContents);
	document.querySelector('project-name').innerText = json.name
}
function updateFileEncoding(encoding) {
	editors[currEditor]['encoding'] = encoding;
}
function updateFilePath(location) {
	editors[currEditor]['path'] = location;
}
function updateFileName(name) {
	document.querySelector('tab.selected').setAttribute("FileName", name);
	editors[document.querySelector('tab.selected').id]['title'] = name;
	document.querySelector('tab.selected > tab-title').innerHTML = name;
	editors[currEditor]['title'] = name;
}
function handleOpenDirectory(project) {
	var sidebar = document.querySelector('sidebar'),
	  projectTitle = document.createElement('project-title'),
	  projectTree = document.createElement('project-tree'),
	  projectItem = document.createElement('project-item'),
	  projectNameIcon = document.createElement('project-name-icon'),
	  projectName = document.createElement('project-name');

	  sidebar.innerHTML = '';
  
	currTitle = sidebar.appendChild(projectTitle);
	currTitle.innerText = 'EXPLORER';
	currTree = sidebar.appendChild(projectTree);
	currItem = currTree.appendChild(projectItem);
	currItem.classList.add('oct-chevron-down');
	currNameIcon = currItem.appendChild(projectNameIcon);
	currNameIcon.classList.add('oct-repo');
	currName = currItem.appendChild(projectName);
	currName.innerText = project.name;
	currFolder = currTree.appendChild(document.createElement('project-folder'));
	currFolder.classList.add('unfolded');
	processFolder(project, currFolder);
	loadProjectTree();
  
	function processFolder(folder, container) {
	  try {
		folder.contents.forEach((item) => {
		  switch (item.type) {
			case 'file':
			  cont = document.createElement('project-item');
			  icon = document.createElement('project-label-icon');
			  label = document.createElement('project-label');
  
			  cont.classList.add('oct-nodef');
			  cont.setAttribute('filepath', item.path);
			  cont.setAttribute('filename', item.name);
			  icon.classList.add('oct-file-text');
			  label.innerText = item.name;
  
			  container.appendChild(cont);
			  cont.appendChild(icon);
			  cont.appendChild(label);
			  break;
			case 'directory':
			  cont = document.createElement('project-item');
			  icon = document.createElement('project-label-icon');
			  label = document.createElement('project-label');
			  folderElem = document.createElement('project-folder');
  
			  cont.classList.add('oct-chevron-right');
			  icon.classList.add('oct-file-directory');
			  label.innerText = item.name;
  
			  container.appendChild(cont);
			  cont.appendChild(icon);
			  cont.appendChild(label);
			  processFolder(item, container.appendChild(folderElem));
			  break;
			default:
			  break;
		  }
		});
	  } catch (error) {
		// Handle error
	  }
	}
}
function loading(bool) {
	if(bool) {
		document.querySelector('titlebars').classList.add('loading')
	} else {
		document.querySelector('titlebars').classList.remove('loading')
	}
}
  

// Open specific pages
function openWelcomePage() {
	createEditorTab({
		path: './pages/welcome.html',
		preview: true
	});
}
function openSettingsPage() {
	createEditorTab({
		path: './pages/settings.html',
		preview: true
	});
}

// Requestors
createProject = ()=>{loading(true); ipcRenderer.send('createProject')};
openProject = ()=>{loading(true); ipcRenderer.send('openProject')};
openFile = ()=>{loading(true); ipcRenderer.send('openFile')};

//#endregion *****************************/
/*   MAIN-PROCESS SEPECIFIC FUNCTIONS    */
//#region ********************************/
function reopenLastClosed() {
	var fileInfo = {
		path: (lastClosed.path)? lastClosed.path: '',
		encoding: (lastClosed.encoding)? lastClosed.encoding: '',
		content: lastClosed.IDE.getValue(),
		title: lastClosed.title,
	}
	createEditorTab(fileInfo);
	recentlyClosed.splice(recentlyClosed.length - 1, 1);;
	lastClosed = recentlyClosed[recentlyClosed.length - 1];
}
function getCurrentFile() {
	resp = {};
	if(editors[currEditor].IDE) {
		resp.savable = true;
		resp.content = editors[currEditor].IDE.getValue();
		resp.filePath = editors[currEditor]['path'];
		resp.fileName = editors[currEditor]['title'];
		resp.encoding = editors[currEditor]['encoding'];
	} else {
		resp.savable = false;
	}
	return resp;
}
function getCurrentFiles() {
	resp = {};
	editors.forEach((editor) => {

	})
	if(edt = editors[currEditor].IDE) {
		resp.savable = true;
		resp.content = edt.getValue();
		resp.filePath = editors[currEditor]['path'];
		resp.fileName = editors[currEditor]['title'];
		resp.encoding = editors[currEditor]['encoding'];
	} else {
		resp.savable = false;
	}
	return resp;
}
//#endregion *****************************/
/*             INITIALIZATION            */
//#region ********************************/
if(editors.length == 0)
	openWelcomePage();
//#endregion *****************************/
/*                  EOF                  */
//#***************************************/