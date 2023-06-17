/**
 * ELECTRON IPC
 */
if(typeof require === 'function') {
	const { ipcRenderer } = require('electron');
	const fs = require('fs');
	const os = require('os');
	ipcRenderer.on('openFile', (event, fileInfo)=>createEditorTab(fileInfo));
	ipcRenderer.on('newFile', (event)=>createEditorTab());
	ipcRenderer.on('closeTab', (event)=>removeEditorTab());
	ipcRenderer.on('openWelcomePage', (event)=>createEditorTab('./pages/welcome.html', true));
	ipcRenderer.on('openSettingsPage', (event)=>createEditorTab('./pages/welcome.html', true));
	ipcRenderer.on('filePath', (event, filePath)=>updateFilePath(filePath));
	ipcRenderer.on('fileName', (event, fileName)=>updateFileName(fileName));
	// Hide the taskbar image unless on windows
	if (os.platform() !== 'win32') document.querySelector('titlebar > icon > img').style.display = 'none';
	
}
/**
 * Keybinds
 */
//TODO: Move keybinds to within the window
/**
 * 
 */
var editors = Array(),
	lastEditor = Array(),
	currEditor = null;
//* Add event listeners for the tabs
document.querySelector('tabs').addEventListener('click', function(event) {
	target = event.target;
	if (target.tagName.toLowerCase() === 'tabs') {
		createEditorTab();
	} else if (target.tagName.toLowerCase() === 'tab') {
		if(!target.classList.contains('selected')) {
			changeEditorTab(target.id);
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
/**
 * 
 */

/** createEditorTab
 * 
 */
function createEditorTab(fileInfo=null, preview=false) {
	const newID = editors.length;
	// Create the tabs and editor
	const newTab = document.createElement("tab");
	const newTab_close = document.createElement("tab-close");
	const newTab_title = document.createElement("tab-title");
	const newPage = document.createElement("editor");
	// Add classed and ID's to the elements
	newTab.classList.add('selected');
	newTab.id = newID;
	newPage.classList.add('selected');
	newPage.id = newID;
	newTab_close.classList.add('oct-x');
	//Append the elements
	document.querySelector("tabs").appendChild(newTab);
	newTab.appendChild(newTab_title);
	newTab.appendChild(newTab_close);
	document.querySelector("editors").appendChild(newPage);
	// Check if the tab is supposed to be a preview tab and if it can be previewed
	//*				 | IMAGE FILES			  	  |	AUDIO FILES | VIDEO FILES  | DOCUMENTS						| ARCHIVES		 | XML/HTML		| TEXT BASED  | FONTS			   | DATA	 | DATABASE		 | 3D MODELS  |				 *//
	if(typeof fileInfo == 'string' && preview && /\.[ong|jpeg|jpg|gif|svg|eps|ai | mp3|wav|ogg | mp4|webm|ogg | pdf|doc|docx|xls|xlsx|ppt|pptx | zip|tar|gz|rar | html|htm|xml | css|js|json | ttf|woff|woff2|otf | csv|tsv | sqlite|db|sql | obj|stl|fbx]+/.exec(fileInfo)[0] !== '.html') {
		preview = false;
		console.log(`Unable to preview file: The file requested (${fileInfo}) is not a previewable file. Cannot be previewed`);
	}
	// Update the tab
	if(preview && typeof fileInfo ==='string') {
		const tabTitle = document.querySelector(`tab[id="${newID}"] > tab-title`);
		const title = fileInfo.match(/([a-z]+)\.[a-z]+/)[1];
		tabTitle.innerHTML = title.charAt(0).toUpperCase() + title.slice(1);

		document.querySelector(`editor[id="${newID}"]`).classList.add('preview');
		document.querySelector(`editor[id="${newID}"]`).setAttribute('preview-file', fileInfo)
	} else {
		if(fileInfo==null) { // Open a new file
			const tabTitle = document.querySelector(`tab[id="${newID}"] > tab-title`);
			tabTitle.innerHTML = `undefined-`+newID;
		} else {
			const tabTitle = document.querySelector(`tab[id="${newID}"] > tab-title`);
			newTab.setAttribute('filepath', fileInfo.path);
			newTab.setAttribute('fileencoding', fileInfo.encoding);
			newTab.setAttribute('filename', fileInfo.path.split("/").pop());
			tabTitle.innerHTML = fileInfo.path.split("/").pop();
			newPage.innerText = fileInfo.content;
		}
	}
	reloadEditors();
	changeEditorTab(newID);

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
				content = editor.innerText;
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
	console.log(editors);
}
/** changeEditorTab
 * 
 */
function changeEditorTab(element_id) {
	if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
	if(x = document.querySelector(`tab[id="${element_id}"]`)) x.classList.add('selected');
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
	delete editors[tabID]
	changeEditorTab(parseInt(lastEditor[lastEditor.length - 1]));
	reloadEditors();
}
/** getCurrentFile
 * 
 */
function getCurrentFile() {
	resp = {};
	if((edt = editors[currEditor].IDE) !== null) {
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
/** updateFilePath
 * 
 */
function updateFilePath(location) {
	document.querySelector('tab.selected').setAttribute("filePath", location);
}
/** updateFileName
 * 
 */
function updateFileName(name) {
	document.querySelector('tab.selected').setAttribute("FileName", name);
	editors[document.querySelector('tab.selected').id]['title'] = name;
	document.querySelector('tab.selected > tab-title').innerHTML = name;
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

/****************/
/** INITIALIZE **/
/****************/
if(editors.length == 0) {
	openWelcomePage();
}