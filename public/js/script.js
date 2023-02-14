var allUsers = [];
const user = { userName: null, key: null };

const usp = new URLSearchParams(document.location.href.split('?')[1]);
const urlName = usp.get("name");
const urlPwd = usp.get("pwd");

if (urlName != null || urlName != undefined) user.userName = urlName
else user.userName = prompt('What is your name?');
if (urlPwd != null || urlPwd != undefined) user.key = urlPwd
else user.key = parseInt(prompt('Please enter a passcode\n(In numbers only)\nMinimum 8 digits preferred'));

// window.history.replaceState(null, null, "/");

const socket = io('/');
socket.emit('new-user', { name: user.userName, connectionTime: Date.now() });

socket.on('connect', () => {
	appendMessage("You joined! ⚡");
	sendButton.disabled = false;
	socket.emit('req-users');
	socket.on('rec-users', (users) => {
        allUsers = users;
		listUsers(allUsers);
	})
})

socket.on('user-connected', (name) => {
    appendMessage(`${name} connected`)
})

socket.on('chat-message', (data) => {
	const tempmsg = decrypt(`${data.message}`, user.key);
	if (tempmsg != "" || tempmsg != null || tempmsg != undefined) appendMessage(`${data.name}: ${tempmsg}`, 1)
    else appendMessage(`${data.name} is trying to send a message but his/her passcode isn't the same as yours`)
})

socket.on('allUsers', users => {
	allUsers = users;
	listUsers(allUsers);
});

socket.on('disconnect', () => {
	sendButton.disabled = true;
	appendMessage("You got disconnected 😢");
	appendMessage("Reload this page to reconnect 🔌");
});

function sendMessage(e){
    e.preventDefault()
	const message = encrypt(e.target.elements.txtMsgBox.value, user.key)
	if (message != "" || message != null || message != undefined) {
		appendMessage("You: " + e.target.elements.txtMsgBox.value, 2)
		socket.emit('send-chat-message', message)
		e.target.elements.txtMsgBox.value = ''
	}
	e.target.elements.txtMsgBox.focus();
}