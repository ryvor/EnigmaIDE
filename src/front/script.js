/**
 * 
 * 
 */
document.querySelector('tabs').addEventListener('click', function() {
	console.log(this.tagName);
	if(this.tagName == 'TABS') {
		console.log(this);
		createEditor(this);
	}
});
var editors = Array();
loadEditors();

function loadEditors(file = null, preview = false) {
	// Event listeners
	document.querySelectorAll('tab:not(.selected)').forEach((tab) => {
		tab.addEventListener('click', (tab)=>{
			if(tab.tagName == 'TAB') {
				console.log(tab);
				changeEditor(tab);
			}
		});
	})
	document.querySelectorAll('tab tab-close').forEach((tab_close_btn) => {
		tab_close_btn.addEventListener('click', (tab_close_btn)=>{
			if(tab_close_btn.tagName == 'TAB-CLOSE') {
				console.log(tab_close_btn);
				removeEditor(tab_close_btn);
			}
		})
	});
	//
	if(preview) {

	} else {
		document.querySelectorAll('editor').forEach((editor) => {
			if(!editors[editor.id]) {
				content = editor.innerText;
				editor.innerHTML = '';
				editors[editor.id] = Array();
				editors[editor.id]['id'] = editor.id;
				editors[editor.id]['file path'] = '';
				mode = 'javascript';
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
		});
	}
}

function changeEditor(element) {
	const element_id = element.id;
	if(x = document.querySelector(`editor.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`tab.selected`)) x.classList.remove('selected');
	if(x = document.querySelector(`editor[id="${element_id}"]`)) x.classList.add('selected');
	if(x = document.querySelector(`tab[id="${element_id}"]`)) x.classList.add('selected');
	loadEditors();
}
function createEditor(file) {
	// Create the tabs and editor
	const newTab = document.createElement("tab");
	const newTab_close = document.createElement("tab-close");
	const newPage = document.createElement("editor");
	// Add classed and ID's to the elements
	newTab.classList.add('selected');
	newTab.id = editors.length+1;

	newPage.classList.add('selected');
	newPage.id = editors.length+1;
	newTab_close.classList.add('oct-x');
	//
	if(file == '') {
		newTab.innerText = 'Welcome';
		loadEditors('./pages/welcome.html', true);
	}
	//Append the elements
	document.querySelector("tabs").appendChild(newTab);
	newTab.appendChild(newTab_close);
	document.querySelector("editors").appendChild(newPage);
	changeEditor(newTab);
}
function removeEditor(element) {
}

/******/
/**  **/
/******/
if(editors.length == 0) {
	createEditor('');
}