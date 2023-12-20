//Required libraries -> LZUTF-8
//https://github.com/rotemdan/lzutf8.js/
//https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js

const NAMASTE_ENCDECALG = {
	version: '1.4',
	defaultKey: "00000000",
	dependencies: {
		"lzutf8": ["https://github.com/rotemdan/lzutf8.js/", "https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js"],
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

async function encrypt(plTxt, keyin=NAMASTE_ENCDECALG.defaultKey, compressionOptions={ outputEncoding: "StorageBinaryString" }) {
	return new Promise((resolve, reject) => {
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
		
		LZUTF8.compressAsync(result, compressionOptions, (compressedResult, compressionError) => {
			if (compressionError != undefined) reject(compressionError);
			else resolve(compressedResult);
		});
	});
}

async function decrypt(ciTxt, keyin=NAMASTE_ENCDECALG.defaultKey, decompressionOptions={ inputEncoding: "StorageBinaryString" }) {
	return new Promise((resolve, reject) => {
		const keyStr = String(keyin);
		let key = 0;
		for (i=0; i<keyStr.length; i++) key += keyStr.charCodeAt(i);
		
		LZUTF8.decompressAsync(ciTxt, decompressionOptions, (decompressedResult, decompressionError) => {
			if (decompressionError != undefined) reject(decompressionError);
			
			let parsedCiTxt = String(decompressedResult);
			var result = "";
			let ciTxtChunks = parsedCiTxt.match(/.{1,18}/g);
			for (i=0; i<ciTxtChunks.length; i++){
				let rawCharData = parseInt(ciTxtChunks[i]);
				let processedChar = String(Math.sqrt(rawCharData - key))
				result += String.fromCharCode(processedChar);
			}
			return resolve(unicodeToChar(result));
		});
	});
}