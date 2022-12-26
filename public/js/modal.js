var linkEle = document.getElementById("joinlink")
var modal = document.getElementById("myModal");
var btn = document.getElementById("share");
var span = document.getElementsByClassName("close")[0];

let inviteLink = "https://saynamaste.herokuapp.com/?pwd=" + key;
linkEle.innerHTML = inviteLink;

btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function copyToClipboard() {
    navigator.clipboard.writeText(inviteLink);
}

function shareOnWhatsApp() {
    window.open(encodeURI("https://wa.me/?text=Hey Pal!\nCheck this online messenger *SayNamaste*\nClick the link below to chat now\n\n" + inviteLink))
}