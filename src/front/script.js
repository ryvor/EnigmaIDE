/**
 * 
 */
var editors = Array();
var lastEditor = Array();

document.querySelector('tabs').addEventListener('click', function(event) {
	target = event.target;
	if (target.tagName.toLowerCase() === 'tabs') {
		id=createEditorTab();
		updateEditorTab(id);
	} else if (target.tagName.toLowerCase() === 'tab') {
		if(!target.classList.contains('selected')) {
			changeEditorTab(target.id);
		}
	} else if (target.tagName.toLowerCase() === 'tab-close') {
		removeEditorTab(target.parentNode.id);
	}
});
/**
 * 
 */
function reloadEditors() {
	document.querySelectorAll('editor').forEach((editor) => {
		if(!editors[editor.id]) {
			editors[editor.id] = Array();
			editors[editor.id]['id'] = editor.id;
			editors[editor.id]['file path'] = '';
			mode = 'javascript';

			if(editor.classList.contains('preview')) {
				editors[editor.id]['type'] = 'preview';
				editors[editor.id]['IDE'] = null;
				const newEmbed = document.createElement("embed");
				newEmbed.setAttribute('type', 'text/html');
				newEmbed.setAttribute('src', document.querySelector(`editor[id="${editor.id}"]`).getAttribute('preview-file'));
				document.querySelector(`editor[id="${editor.id}"]`).appendChild(newEmbed);
			} else {
				content = editor.innerText;
				editor.innerHTML = '';
				editors[editor.id]['type'] = 'code';
				editors[editor.id]['IDE'] = Enigma(document.querySelector(`editor[id="${editor.id}"]`), {
					value: content,
					mode: mode,
					lineNumbers: true,
					matchBrackets: true,
					matchTags: true,
					foldGutter: true,
					foldOptions: {
						widget: " \uf266 ",
					},
					gutters: ["Enigma-linenumbers", "Enigma-foldgutter"],
				});
				Enigma.autoLoadMode(editors[editor.id]['IDE'], 'javascript')
			}
		}
	});
}

function createEditorTab() {
	const newID = editors.length;
	// Create the tabs and editor
	const newTab = document.createElement("tab");
	const newTab_close = document.createElement("tab-close");
	const newPage = document.createElement("editor");
	// Add classed and ID's to the elements
	newTab.classList.add('selected');
	newTab.id = newID;
	newPage.classList.add('selected');
	newPage.id = newID;
	newTab_close.classList.add('oct-x');
	//Append the elements
	document.querySelector("tabs").appendChild(newTab);
	newTab.appendChild(newTab_close);
	document.querySelector("editors").appendChild(newPage);
	changeEditorTab(newID);
	return newID;
}
function updateEditorTab(id, file=null, preview=false) {
	if(false) preview = false;
	if(preview) {
		const tabElement = document.querySelector(`tab[id="${id}"]`);
		const title = file.match(/([a-z]+)\.[a-z]+/)[1];
		tabElement.innerHTML = `${title.charAt(0).toUpperCase() + title.slice(1)}${tabElement.innerHTML}`;

		document.querySelector(`editor[id="${id}"]`).classList.add('preview');
		document.querySelector(`editor[id="${id}"]`).setAttribute('preview-file', file)
	} else {
		if(file==null) {
			const tabElement = document.querySelector(`tab[id="${id}"]`);
			tabElement.innerHTML = `undefined-${id}${tabElement.innerHTML}`;
		} else {

		}
	}
	reloadEditors();
}
function changeEditorTab(element_id) {
	if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
	if(x = document.querySelector(`tab[id="${element_id}"]`)) x.classList.add('selected');
	lastEditor.push(element_id);
}
function removeEditorTab(tabID) {
	var elem = document.querySelector(`tab[id="${tabID}"]`);
	elem.parentNode.removeChild(elem);
	var elem = document.querySelector(`editor[id="${tabID}"]`);
	elem.parentNode.removeChild(elem);
	// Remove every occurrence of the closed tab from the active tabs array
	lastEditor = lastEditor.filter(function(value){
		return value != tabID;
	});
	// change the tabs and reload the editors array
	changeEditorTab(parseInt(lastEditor[lastEditor.length - 1]));
	reloadEditors();
}

/****************/
/** INITIALIZE **/
/****************/
if(editors.length == 0) {
	id = createEditorTab();
	updateEditorTab(id, './pages/welcome.html', true);
}