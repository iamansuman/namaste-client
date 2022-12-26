const socket = io('/')
const userPane = document.getElementById('left-pane')
const messageContainer = document.getElementById('msg-contain')
const sendBtn = document.getElementById('send-button')
// const messageInput = document.getElementById('message-input')
var messageInput = document.getElementById('message-input')
const namelist = document.getElementById('activeUsers');

var allUsers = []
var key;
var uname;

const url = document.location.href
const params = url.split("?")
var usp = new URLSearchParams(params[1])
var urlName = usp.get("name")
var urlPwd = usp.get("pwd")

if (urlName != null || urlName != undefined) {
	uname = urlName
}
if (urlPwd != null || urlPwd != undefined) {
	key = urlPwd
}


if (uname == undefined || uname == null) {
	uname = prompt('What is your name?')
}
if (key == undefined || key == null) {
	key = prompt('Please enter a passcode\n(In numbers only)\nMinimum 8 digits preferred')
}

messageInput.focus();
appendMessage('You joined')
socket.emit('new-user', uname)

socket.on('chat-message', (data) => {
	var tempmsg = decrypt(`${data.message}`, key);
	if (tempmsg != "" || tempmsg != null || tempmsg != undefined)
		appendMessageL(`${data.name}: ` + decrypt(`${data.message}`, key))
	else
		appendMessageL(`${data.name} is trying to send a message but his/her passcode isn't the same as yours`)
})

socket.on('user-connected', (name) => {
	appendMessage(`${name} connected`)
})

socket.on('allUsers', users => {
	allUsers = users;
	appendUsers(allUsers);
});

socket.on('user-disconnected', (name) => {
	namelist.style.color = 'red'
	appendMessage(`${name} disconnected`)
});

socket.on('connect', () => {
	appendMessage("You got connected!");
	socket.emit('req-users');
	socket.on('rec-users', (users) => {
		appendUsers(users);
	})
})

socket.on('disconnect', () => {
	appendMessage("You got disconnected :(");
	appendMessage("Reload this page to reconnect")
});

messageInput.addEventListener('keypress', (e) => {
	if (e.key == "Enter") sendBtn.click()
});

sendBtn.addEventListener('click', e => {
	e.preventDefault()
	const message = encrypt(messageInput.value, key)
	if (message != "" || message != null || message != undefined) {
		appendMessageR("You: " + messageInput.value)
		socket.emit('send-chat-message', message)
		messageInput.value = ''
	}
	messageInput.focus();
})

window.addEventListener('keypress', (e) => {
	if (e.key == '/') {
		e.preventDefault();
		messageInput.focus();
	}
});

function appendMessage(message) {
	const messageElement = document.createElement('div')
	messageElement.style.display = 'flex';
	messageElement.style.justifyContent = 'center';
	messageElement.innerText = message
	messageContainer.append(messageElement)
}

function appendMessageL(message) {
	const messageElement = document.createElement('div')
	messageElement.style.display = 'flex';
	messageElement.style.justifyContent = 'left';
	messageElement.style.paddingLeft = '10px';
	messageElement.innerText = message
	messageContainer.append(messageElement)
}

function appendMessageR(message) {
	const messageElement = document.createElement('div')
	messageElement.style.display = 'flex';
	messageElement.style.justifyContent = 'right';
	messageElement.style.paddingRight = '10px';
	messageElement.innerText = message
	messageContainer.append(messageElement)
}

function appendUsers(arr) {
	namelist.innerHTML = null;
	arr.forEach(user => {
		if (user){
			li = document.createElement('li');
			li.innerText = user.name;
			li.setAttribute('data-id', user.id);
			namelist.append(li);
		}
	});
}