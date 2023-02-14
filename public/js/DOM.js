const messageContainer = document.getElementById("msg-container");
const Menu = document.getElementById("menu");
const sendButton = document.getElementById("send-btn");
const activeUserList = document.getElementById("activeUsers");

function appendMessage(message, alignment=0) {
    //0-> System Notifications; 1-> Sender; 2-> User
    const alignmentOptions = ['center', 'flex-start', 'flex-end'];
    const borderRadiusOptions = ['1.5em', '0 1.5em 1.5em 0', '1.5em 0 0 1.5em'];
	const messageElement = document.createElement('div');
    messageElement.classList.add('messageElement');
	messageElement.style.alignSelf = alignmentOptions[alignment];
	messageElement.style.borderRadius = borderRadiusOptions[alignment];
	messageElement.innerText = message;
	messageContainer.append(messageElement);
}

function openMenu(){
	Menu.classList.add('menu-open');
}

function closeMenu(){
	Menu.classList.remove('menu-open');
}

function copyToClipboard() {
	const inviteLink = location.href.split('?')[0] + "?pwd=" + user.key;
    navigator.clipboard.writeText(inviteLink);
	alert("Link copied!");
}

function listUsers(users=[]){
	activeUserList.innerHTML = null;
	users.forEach(user => {
		if (user){
			let CT = new Date(user.connectionTime);
			let li = document.createElement('li');
			let spName = document.createElement('span');
			spName.innerText = user.name;
			let spID = document.createElement('span');
			spID.innerText = user.id;
			let spCT = document.createElement('span');
			spCT.innerText = `${String(CT.getHours()).padStart(2, '0')}:${String(CT.getMinutes()).padStart(2, '0')}:${String(CT.getSeconds()).padStart(2, '0')} - ${CT.getDate()}/${CT.getMonth()+1}/${CT.getFullYear()}`;
			li.append(spName, spID, spCT);
			activeUserList.append(li);
		}
	});
}