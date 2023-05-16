importScripts('https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js');
const NAMASTE_ENCDECALG = {
	version: '1.3[WebWorker]',
	defaultKey: "00000000",
	dependencies: {
		"lzutf8": ["https://github.com/rotemdan/lzutf8.js/", "https://unpkg.com/lzutf8@latest/build/production/lzutf8.min.js"],
	},
	note: "This is the Web Worker version of v1.3 for optimised encryption and decryption."
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

async function encrypt(plTxt, keyin=NAMASTE_ENCDECALG.defaultKey, ioEncoding="ByteArray") {
    const keyStr = String(keyin);
    let key = 0;
    for (i=0; i<keyStr.length; i++) key += keyStr.charCodeAt(i);
    console.log(key);
    
    var parsedPlTxt = charToUnicode(plTxt);
    var result = "";
    
    for (i = 0; i < parsedPlTxt.length; i++) {
        let charCode = parsedPlTxt.charCodeAt(i);
        let processedChar = String(Math.pow(charCode, 2) + key) + '|';
        result += processedChar;
    }
    
    let a =LZUTF8.compress(result, { outputEncoding: ioEncoding })
    console.log(a);
    return a;
}

async function decrypt(ciTxt, keyin=NAMASTE_ENCDECALG.defaultKey, ioEncoding="ByteArray") {
    const keyStr = String(keyin);
    let key = 0;
    for (i=0; i<keyStr.length; i++) key += keyStr.charCodeAt(i);
    let parsedCiTxt = String(LZUTF8.decompress(ciTxt, { inputEncoding: ioEncoding }));
    var result = "";
    let ciTxtChunks = parsedCiTxt.match(/.{1,18}/g);
    for (i=0; i<ciTxtChunks.length; i++){
        let rawCharData = parseInt(ciTxtChunks[i]);
        let processedChar = String(Math.sqrt(rawCharData - key))
        result += String.fromCharCode(processedChar);
    }
    return unicodeToChar(result);
}

onmessage = async (e) => {
    if (e.data.decrypt){
        let output = await decrypt(new Uint8Array(e.data.payload), e.data.key, e.data.ioEncoding);
        postMessage(output);
        close();
    } else {
        let output = await encrypt(e.data.payload, e.data.key, e.data.ioEncoding);
        postMessage(output);
        close();
    }
}