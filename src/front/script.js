/**
 * Enigma IDE
 * author: ryvor (@ryvor)
 */

let caretPosition;

document.querySelectorAll('editor-line-content').forEach((editor)=>{
	editor.addEventListener('input',	inputSyntaxing);
});

function inputSyntaxing(event) {
	const editor = event.target
	const text = editor.innerText;
	const words = text.split(' ');
	const formattedWords = words.map(word => {
		// Apply custom styling to each word
		const styledWord = `<span class="editor-syntax-highlighting--">${word}</span>`;
		return styledWord;
	});
	saveCaretPosition(editor);
	editor.innerHTML = formattedWords.join(' ');
	setCaretPosition(editor);
	saveCaretPosition(editor);
};
function getCaretPosition(editor) {
	const selection = window.getSelection();
	if (selection.rangeCount > 0) {
	  const range = selection.getRangeAt(0);
	  const preCaretRange = range.cloneRange();
	  preCaretRange.selectNodeContents(editor);
	  preCaretRange.setEnd(range.endContainer, range.endOffset);
	  return preCaretRange.toString().length;
	}
}
function saveCaretPosition(editor) {
	caretPosition = getCaretPosition(editor);
};
function setCaretPosition(editor) {
	const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);

	let currentPosition = 0;
	let targetNode = null;
	let targetOffset = 0;

	while (walker.nextNode()) {
		const node = walker.currentNode;
		const nodeText = node.textContent;
		
		const words = nodeText.trim().split(' ');
		for (const word of words) {
		const wordLength = word.length;

		if (currentPosition + wordLength >= caretPosition) {
			targetNode = node;
			targetOffset = caretPosition - currentPosition;
			break;
		}

		currentPosition += wordLength + 1; // Account for the space between words
		}

		if (targetNode) {
		break;
		}
		
		currentPosition += nodeText.length;
	}

	if (targetNode) {
		const range = document.createRange();
		range.setStart(targetNode, targetOffset);
		range.collapse(true);

		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}

}