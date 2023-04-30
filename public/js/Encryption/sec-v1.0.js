const NAMASTE_ENCDECALG = {
	version: '1.0',
	defaultKey: null,
	dependencies: {},
	note: "Does not support Emojis"
};

function encrypt(txt, keyin) {
    let chrs = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '-', '_', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '{', '}', '[', ']', '~', '`', '?', '.', ','];
    let key = parseInt(keyin);
    let i, j;
	var result = "";
    for (j = 0; j < txt.length; j++) {
        for (i = 0; i < chrs.length; i++) {
            if (chrs[i] == txt.charAt(j)) {
                let e = Math.pow(i + chrs.length, 3) + key;
                if (result != "") {
                    result = result + "|" + e;
                } else {
                    result = "" + e;
                }
            }
        }
    }
	return result;
}

function decrypt(txtin, keyin) {
    let chrs = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '-', '_', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '{', '}', '[', ']', '~', '`', '?', '.', ','];
    let txt = parseInt(txtin);
    let key = parseInt(keyin);
    let i;
	var result = "";
	var txtarr = txtin.split("|");
    var d = Math.cbrt(txt - key) - chrs.length;
	txtarr.forEach(function(eve){
		var d = Math.cbrt(parseInt(eve)-key) - chrs.length;
	
		for (i = 0; i < chrs.length; i++) {
			if (i == d) {
				if(result != ""){
					result += chrs[i];
				} else {
					result = "" + chrs[i];
				}
				i = chrs.length;
			}
		}
	});
	return result;
}