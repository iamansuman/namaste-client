//Required libraries -> LZUTF-8
//https://github.com/rotemdan/lzutf8.js/
//https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js

const NAMASTE_ENCDECALG = {
	version: '1.1',
	defaultKey: "00000000",
	dependencies: {
		"lzutf8": ["https://github.com/rotemdan/lzutf8.js/", "https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js"]
	},
	note: ""
};

function charToUnicode(text) {
	return String(text.split('').map(function (value, index, array) {
		let temp = value.charCodeAt(0).toString(16).toUpperCase();
        return (temp.length > 2) ? ('\\u' + temp) : value;
	}).join(''));
}

function unicodeToChar(text) {
    return text.replace(/\\u[\dA-F]{4}/gi, function (match) {
		return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
	});
}

function encrypt(plTxt, keyin=NAMASTE_ENCDECALG.defaultKey) {
	const keyStr = String(keyin);
	let key = 0;
	for (i=0; i<keyStr.length; i++) key += keyStr.charCodeAt(i);

	var parsedPlTxt = charToUnicode(plTxt);
	var result = "";

	for (i = 0; i < parsedPlTxt.length; i++) {
		let charCode = parsedPlTxt.charCodeAt(i);
		let processedChar = String(Math.pow(charCode, 2) + key).padStart(18 ,'0');
		result += processedChar;
    }

	return LZUTF8.compress(result, { outputEncoding: "StorageBinaryString" });
}

function decrypt(ciTxt, keyin=NAMASTE_ENCDECALG.defaultKey) {
	const keyStr = String(keyin);
	let key = 0;
	for (i=0; i<keyStr.length; i++) key += keyStr.charCodeAt(i);

	let parsedCiTxt = String(LZUTF8.decompress(ciTxt, { inputEncoding: "StorageBinaryString" }));
	var result = "";
	let ciTxtChunks = parsedCiTxt.match(/.{1,18}/g);

	for (i=0; i<ciTxtChunks.length; i++){
		let rawCharData = parseInt(ciTxtChunks[i]);
		let processedChar = String(Math.sqrt(rawCharData - key))
		result += String.fromCharCode(processedChar);
	}

	return unicodeToChar(result);
}