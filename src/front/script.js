/**
 * 
 * 
 */
document.querySelector('tabs').addEventListener('click', createEditor);
var editors = Array();
loadEditors();

function loadEditors() {
	// Event listeners
	document.querySelectorAll('tab:not(.selected)').forEach((tab) => {
		tab.addEventListener('click', changeEditor)
	})
	document.querySelectorAll('tab tab-close').forEach((tab_close_btn) => {
		tab_close_btn.addEventListener('click', removeEditor)
	});
	//
	document.querySelectorAll('editor').forEach((editor) => {
		if(!editors[editor.id]) {
			content = editor.innerText;
			editor.innerHTML = '';
			editors[editor.id] = Array();
			editors[editor.id]['id'] = editor.id;
			editors[editor.id]['file path'] = '';
			mode = 'javascript'
			editors[editor.id]['IDE'] = Enigma(document.querySelector(`editor[id="${editor.id}"]`), {
				value: content,
				mode: mode,
				lineNumbers: true,
			});

			Enigma.autoLoadMode(editors[editor.id]['IDE'], 'javascript')
		}
	});
	console.log(editors);
}

function changeEditor(event) {
	const element = event.target;
	const element_id = element.id;
	if(element.tagName.toLowerCase() == 'tab') {
		if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
		if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
		if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
		if(x = document.querySelector(`tab[id="${element_id}"]`)) x.classList.add('selected');
	}
	loadEditors();
}
function createEditor(event) {
	const element = event.target;
	if(element.tagName.toLowerCase() == 'tabs') {
		console.log(element);
	}
	loadEditors();
}
function removeEditor() {
	const element = event.target;
	if(element.tagName.toLowerCase() == 'tab-close') {
		console.log(element);
	}
	loadEditors();
}