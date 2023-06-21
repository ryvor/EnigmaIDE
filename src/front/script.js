/**
 * ELECTRON IPC
 */
const { ipcRenderer, remote } = require('electron');
const fs = require('fs');
const os = require('os');
const { electron } = require('process');
ipcRenderer.on('openFile', (event, fileInfo)=>createEditorTab(fileInfo));
ipcRenderer.on('openDirectory', (event, message )=>console.log(message));
ipcRenderer.on('newFile', (event)=>createEditorTab());
ipcRenderer.on('closeTab', (event)=>removeEditorTab());
ipcRenderer.on('openWelcomePage', (event)=>createEditorTab('./pages/welcome.html', true));
ipcRenderer.on('openSettingsPage', (event)=>createEditorTab('./pages/welcome.html', true));
ipcRenderer.on('fileEncoding', (event, fileEncoding)=>updateFileEncoding(fileEncoding));
ipcRenderer.on('filePath', (event, filePath)=>updateFilePath(filePath));
ipcRenderer.on('fileName', (event, fileName)=>updateFileName(fileName));
ipcRenderer.on('changeTab', (event, modifier)=>changeEditorTab(modifier));

ipcRenderer.on('console', (event, element)=>console.log(element));

// Hide the taskbar image unless on windows
/*
if (os.platform() == 'win32') {
	document.querySelector('titlebar[for="windows"]').style.display = 'flex'; 
} else if (os.platform() == 'darwin') {
	document.querySelector('titlebar[for="mac"]').style.display = 'flex';
} else {
	document.querySelector('titlebar[for="linux"]').style.display = 'flex';
}
*/
if (os.platform() == 'win32') {
	document.querySelector('titlebar > titlebar-icon > img').style.display = 'block'; 
}
/**
 * 
 */
var editors = [],
	lastEditor = [],
	recentlyClosed = [],
	lastClosed = {},
	currEditor = null;
//* Add event listeners for the tabs
document.querySelector('tabs').addEventListener('click', function(event) {
	target = event.target;
	if (target.tagName.toLowerCase() === 'tabs') {
		createEditorTab();
	} else if (target.tagName.toLowerCase() === 'tab') {
		if(!target.classList.contains('selected')) {
			changeEditorTab(parseInt(target.id));
		}
	} else if (target.tagName.toLowerCase() === 'tab-close') {
		removeEditorTab(target.parentNode.id);
	}
});
//* add event listeners for any included pages
window.addEventListener('message', function(event) {
	message = event.data;
	// specify the allowed functions and variabled
	var allowedFunctions = {
		createEditorTab: createEditorTab,
		changeEditorTab: changeEditorTab,
		removeEditorTab: removeEditorTab,
		createProject: createProject,
		openFile: openFile,
		openDirectory: openDirectory,
	};
	var allowedVariables = {};
	// execute each function specified
	if(message.functions) {
		message.functions.forEach((func)=>{
			if(typeof (x = allowedFunctions[func.name])=== 'function') {
				x();
			} else {
				console.log()
			}
		});
	}
	// clsoe tab is requested
	if(message.closeTab) removeEditorTab(message.frameID);
});
document.querySelectorAll('.openSettingsPage').forEach((btn)=>{
	btn.addEventListener('click', ()=>openSettingsPage())
})
document.querySelectorAll('.openWelcomePage').forEach((btn)=>{
	btn.addEventListener('click', ()=>openWelcomePage())
})
document.querySelectorAll('project-item').forEach((item)=>{
	item.addEventListener('click', ()=>{
		if(item.nextElementSibling && item.nextElementSibling.tagName == 'PROJECT-FOLDER') {
			item.classList.toggle('oct-chevron-right');
			item.classList.toggle('oct-chevron-down');
			item.nextElementSibling.classList.toggle('unfolded');
		} else {
			console.log('openFile');
		}
	})
})

/** createEditorTab
 * 
 */
function createEditorTab(fileInfo) {
	const newID = editors.length;
	var newTab,
		newTab_close,
		newTab_title,
		newEditor;
	switch(typeof fileInfo) {
		case 'object': // Open file
			if(x = document.querySelector(`tabs > tab[filepath="${fileInfo.path}"]`) && fileInfo.path.length > 0) {
				ipcRenderer.send('openModal', {"file": 'front/pages/alreadyOpen.html', "options":{height: 160}});
				ipcRenderer.on('modal-response', (event, response) => {
					if(response) changeEditorTab(parseInt(x.id));
				});
				break;
			}
			createTab();
			newTab.setAttribute('filepath', fileInfo.path);
			newTab.setAttribute('fileencoding', fileInfo.encoding);
			if(fileInfo.path.length > 0)
				newTab.setAttribute('filename', fileInfo.path.split("/").pop());
			newTab_title.innerHTML = (fileInfo.title)? fileInfo.title: fileInfo.path.split("/").pop();
			newEditor.innerText = fileInfo.content;
			reloadEditors();
			changeEditorTab(parseInt(newID));
			break;
		case 'string': // Open preview
			createTab();
			// Check if the tab is supposed to be a preview tab and if it can be previewed
			//*				 | IMAGE FILES			  	  |	AUDIO FILES | VIDEO FILES  | DOCUMENTS						| ARCHIVES		 | XML/HTML		| TEXT BASED  | FONTS			   | DATA	 | DATABASE		 | 3D MODELS  |				 *//
			if(/\.[ong|jpeg|jpg|gif|svg|eps|ai | mp3|wav|ogg | mp4|webm|ogg | pdf|doc|docx|xls|xlsx|ppt|pptx | zip|tar|gz|rar | html|htm|xml | css|js|json | ttf|woff|woff2|otf | csv|tsv | sqlite|db|sql | obj|stl|fbx]+/.exec(fileInfo)[0] !== '.html') {
				log(`Unable to preview file: The file requested (${fileInfo}) is not a previewable file. Cannot be previewed`);
				break;
			}
			newTab_title.innerHTML = fileInfo.match(/([a-z]+)\.[a-z]+/)[1].charAt(0).toUpperCase() + fileInfo.match(/([a-z]+)\.[a-z]+/)[1].slice(1);
			newEditor.classList.add('preview');
			newEditor.setAttribute('preview-file', fileInfo)
			reloadEditors();
			changeEditorTab(parseInt(newID));
			break;
		case 'undefined':
			createTab();
			newTab_title.innerHTML = `undefined-`+newID;
			reloadEditors();
			changeEditorTab(parseInt(newID));
			break;
		default:
			log(typeof fileInfo)
	}
	function createTab() {
		// Create the tabs and editor
		newTab = document.createElement("tab");
		newTab_title = document.createElement("tab-title");
		newTab_close = document.createElement("tab-close");
		newTab.classList.add('selected');
		newTab.id = newID;
		newTab_close.classList.add('oct-x');

		newEditor = document.createElement("editor");
		newEditor.classList.add('selected');
		newEditor.id = newID;
		//Append the elements
		document.querySelector("tabs").appendChild(newTab);
		newTab.appendChild(newTab_title);
		newTab.appendChild(newTab_close);
		document.querySelector("editors").appendChild(newEditor);
	}
}
/** reloadEditors
 * 
 */
function reloadEditors() {
	document.querySelectorAll('editor').forEach((editor) => {
		if(!editors[editor.id]) {
			editors[editor.id] = Array();
			editors[editor.id]['id'] = editor.id;
			editors[editor.id]['tab'] = document.querySelector(`tab[id="${editor.id}"]`);
			editors[editor.id]['editor'] = document.querySelector(`editor[id="${editor.id}"]`);
			editors[editor.id]['title'] = editors[editor.id]['tab'].innerText;
			mode = 'javascript';

			if(editor.classList.contains('preview')) {
				editors[editor.id]['type'] = 'preview';
				editors[editor.id]['IDE'] = null;
				const newIframe = document.createElement("iframe");
				newIframe.setAttribute('src', editors[editor.id]['editor'].getAttribute('preview-file'));
				IFrame = editors[editor.id]['editor'].appendChild(newIframe);
				IFrame.onload = function() {
					IFrame.contentWindow.postMessage({
						type: 'initialize',
						id: editor.id,
						templateRequest: {
							frameID: editor.id,
							functions: [],
							closeTab: false,
						}
					}, '*');
				};
			} else {
				content = (editor.innerHTML).replaceAll('<br>', '\n');
				editor.innerHTML = '';
				editors[editor.id]['type'] = 'code';
				editors[editor.id]['path'] = editors[editor.id]['tab'].getAttribute('filepath');
				editors[editor.id]['encoding'] = editors[editor.id]['tab'].getAttribute('fileencoding');
				editors[editor.id]['IDE'] = Enigma(editors[editor.id]['editor'], {
					value: content,
					mode: mode,
					lineNumbers: true,
					matchBrackets: {
						highlightNonMatching: true,
					},
					matchTags: {
						bothTags: true,
					},
					foldGutter: true,
					foldOptions: {
						widget: " ... ",
					},
					gutters: ["Enigma-linenumbers", "Enigma-foldgutter"],
				});
				Enigma.autoLoadMode(editors[editor.id]['IDE'], 'javascript')
				editors[editor.id]['IDE'].focus();
			}
		}
	});
	(Object.keys(editors).length == 0)? document.querySelector('tabs').classList.add('oct-plus') : document.querySelector('tabs').classList.remove('oct-plus');
}
/** changeEditorTab
 * 
 */
function changeEditorTab(modifier) {
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
			console.log('before: ', currEditor, ', after: ', element_id);
			break;
		default:
			console.log(typeof modifier);
	}
	if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
	if(x = document.querySelector(`tab[id="${element_id}"]`)) x.classList.add('selected');
	if(editors[element_id]['IDE']) editors[element_id]['IDE'].focus();
	currEditor = element_id;
	lastEditor.push(element_id);
}
/** removeEditorTab
 * 
 */
function removeEditorTab(tabID = null) {
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
	reloadEditors();
}
/** reopenLasClosed
 * 
 * @param {*} EditorInfo 
 */
function reopenLasClosed() {
	console.log('BEFORE', 'lastClosed: ', lastClosed, ', recentlyClosed: ', recentlyClosed)
	var fileInfo = {
		path: (lastClosed.path)? lastClosed.path: '',
		encoding: (lastClosed.encoding)? lastClosed.encoding: '',
		content: lastClosed.IDE.getValue(),
		title: lastClosed.title,
	}
	createEditorTab(fileInfo);
	recentlyClosed.splice(recentlyClosed.length - 1, 1);;
	lastClosed = recentlyClosed[recentlyClosed.length - 1];
	console.log('AFTER', 'lastClosed: ', lastClosed, ', recentlyClosed: ', recentlyClosed)
}
/** getCurrentFile
 * 
 */
function getCurrentFile() {
	resp = {};
	if(edt = editors[currEditor].IDE) {
		resp.savable = true;
		resp.content = edt.getValue();
		resp.filePath = editors[currEditor]['path'];
		resp.fileName = editors[currEditor]['title'];
		resp.encoding = editors[currEditor]['encoding'];
		console.log(editors);
	} else {
		resp.savable = false;
	}
	return resp;
}
/** getCurrentFiles
 * 
 */
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
/** updateFileEncoding
 * 
 */
function updateFileEncoding(encoding) {
	editors[currEditor]['encoding'] = encoding;
}
/** updateFilePath
 * 
 */
function updateFilePath(location) {
	editors[currEditor]['path'] = location;
}
/** updateFileName
 * 
 */
function updateFileName(name) {
	document.querySelector('tab.selected').setAttribute("FileName", name);
	editors[document.querySelector('tab.selected').id]['title'] = name;
	document.querySelector('tab.selected > tab-title').innerHTML = name;
	editors[currEditor]['title'] = name;
}
/** openWelcomePage
 * 
 */
function openWelcomePage() {
	createEditorTab('./pages/welcome.html', true);
}
/** openSettingsPage
 * 
 */
function openSettingsPage() {
	createEditorTab('./pages/settings.html', true);
}
/** createProject
 * 
 */
function createProject() {
	ipcRenderer.send('createProject')
}
/** openFile
 * 
 */
function openFile() {
	ipcRenderer.send('openFile')
}
/** openDirectory
 * 
 */
function openDirectory() {
	ipcRenderer.send('openProject')
}

/****************/
/** INITIALIZE **/
/****************/
if(editors.length == 0) {
	openWelcomePage();
}