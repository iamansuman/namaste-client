const DOMElements = {
	loginModal: document.getElementById("loginModal"),
	loginUsername: document.getElementById("login_username"),
	loginPasscode: document.getElementById("login_passcode"),
	loginButton: document.getElementById("login_btn"),
	messageContainer: document.getElementById("msg-container"),
	activeUsersListContainer: document.getElementById("activeUsersListContainer"),
	sendButton: document.getElementById("send-btn"),
	activeUserList: document.getElementById("activeUsers"),
	videoCallModal: document.getElementById("videoCallModal"),
	videoCallModalFloatBtn: document.getElementById("videoCallModalFloatBtn"),
	myVideo: document.getElementById("myVideo"),
	myWaveform: document.getElementById("myWaveform"),
	remoteVideo: document.getElementById("remoteVideo"),
	remoteWaveform: document.getElementById("remoteWaveform"),
};

document.addEventListener('contextmenu', (e) => e.preventDefault());

function openUsersList(){
	DOMElements.activeUsersListContainer.classList.add('activeUsersListContainer-open');
}

function closeUsersList(){
	DOMElements.activeUsersListContainer.classList.remove('activeUsersListContainer-open');
}

function copyToClipboard() {
	const inviteLink = location.href.split('?')[0] + "?pwd=" + user.key;
    navigator.clipboard.writeText(inviteLink);
	alert("Link copied!");
}

function toggleView(toHide=[], toShow=[]){
	toHide.forEach((DOMElement) => DOMElement.classList.add('hide'));
	toShow.forEach((DOMElement) => DOMElement.classList.remove('hide'));
}

function dragElement(DOMElement = new HTMLElement){
	DOMElement.style.left = `${0}px`;
	DOMElement.style.top = `${(window.innerHeight/2) - DOMElement.offsetHeight}px`;
	let InitialMousePosX = 0, InitialMousePosY = 0, FinalMousePosX = 0, FinalMousePosY = 0;
	DOMElement.onmousedown = (e) => {
		e = e || window.event;
		e.preventDefault();
		InitialMousePosX = e.clientX;
		InitialMousePosY = e.clientY;
    	document.onmousemove = (e) => {
			e = e || window.event;
			e.preventDefault();
			FinalMousePosX = InitialMousePosX - e.clientX;
			FinalMousePosY = InitialMousePosY - e.clientY;
			InitialMousePosX = e.clientX;
			InitialMousePosY = e.clientY;
			let wannaBeXPos = DOMElement.offsetLeft - FinalMousePosX;
			let wannaBeYPos = DOMElement.offsetTop - FinalMousePosY;
			if (wannaBeXPos < 0) DOMElement.style.left = `${0}px`;
			else if (wannaBeXPos > (window.innerWidth - DOMElement.offsetWidth)) DOMElement.style.left = `${window.innerWidth - DOMElement.offsetWidth}px`;
			else DOMElement.style.left = `${wannaBeXPos}px`;
			if (wannaBeYPos < 0) DOMElement.style.top = `${0}px`;
			else if (wannaBeYPos > (window.innerHeight - DOMElement.offsetHeight)) DOMElement.style.top = `${window.innerHeight - DOMElement.offsetHeight}px`;
			else DOMElement.style.top = `${wannaBeYPos}px`;
		}
		document.onmouseup = (e) => {
			e.stopPropagation();
			DOMElement.style.left = (DOMElement.offsetLeft < window.innerWidth/2) ? `${0}px` : `${window.innerWidth - DOMElement.offsetWidth}px`;
    		document.onmousemove = null;
			document.onmouseup = null;
		}
	}
}

function listUsers(users=allUsers, clearTable=false){
	DOMElements.activeUserList.getElementsByTagName('tbody')[0].innerHTML = null;
	if (clearTable) return;
	if (users) users.forEach(user => {
		if (user){
			let CT = new Date(user.connectionTime);
			let tr = document.createElement('tr');
			let tdName = document.createElement('td');
			let tdConnectionID = document.createElement('td');
			let tdConnectionTime = document.createElement('td');
			if (user.id == socket.id) tr.style.backgroundColor = 'var(--theme-color-dark)';
			tdName.innerText = user.name;
			tdConnectionID.innerText = user.id;
			tdConnectionTime.innerText = `${CT.getDate()}/${CT.getMonth()+1}/${CT.getFullYear()} at ${String(CT.getHours()).padStart(2, '0')}:${String(CT.getMinutes()).padStart(2, '0')}:${String(CT.getSeconds()).padStart(2, '0')}`;
			tr.append(tdName, tdConnectionID, tdConnectionTime);
			DOMElements.activeUserList.getElementsByTagName('tbody')[0].append(tr);
			tr.scrollIntoView({ behavior: 'smooth' });
			if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
		}
	});
}

function appendMessage(message=null, alignment=0, timeStamp=null){
	if (message==null) return;
    //0-> System Notifications; 1-> Sender; 2-> Sender
    const alignmentOptions = ['center', 'flex-start', 'flex-end'];
    const borderRadiusOptions = ['1rem', '0 1rem 1rem 0', '1rem 0 0 1rem'];
	const messageElement = document.createElement('div');
    messageElement.classList.add('messageElement');
	messageElement.style.alignSelf = alignmentOptions[alignment];
	messageElement.style.borderRadius = borderRadiusOptions[alignment];
	messageElement.innerText = message;
	DOMElements.messageContainer.append(messageElement);
	messageElement.scrollIntoView({ behavior: 'smooth' });
	if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
}

function appendCall(type='audio', bySender=false, peerID=null, socketID=null, senderName=null, timeStamp=null){
	if (peerID == null || socketID == null) return;
	const requestCallElement = document.createElement('div');
	requestCallElement.classList.add('callRequestElement');
	if (bySender){
		const namePlaceHolder = document.createElement('span');
		namePlaceHolder.innerText = senderName;
		requestCallElement.append(namePlaceHolder);
		requestCallElement.style.minHeight = `${5+2}rem`;
	} else requestCallElement.style.minHeight = `${5}rem`;
	requestCallElement.style.alignSelf = (bySender) ? 'flex-start' : 'flex-end';
	requestCallElement.style.borderRadius = (bySender) ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem';
	const div = document.createElement('div');
	const callImage = document.createElement('img');
	callImage.src = (type=='video') ? "./imgs/app/video-call.svg" : "./imgs/app/call.svg";
	div.append(callImage);
	const callBtn = document.createElement('button');
	callBtn.innerText = `Ring ${senderName}`;
	callBtn.disabled = !Boolean(bySender);
	callBtn.addEventListener('click', (e) => {
		e.preventDefault();
		joinCall(type, peerID, socketID);
	});
	div.append(callBtn);
	requestCallElement.append(div);
	DOMElements.messageContainer.append(requestCallElement);
	requestCallElement.scrollIntoView({ behavior: 'smooth' });
	if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
}

function passCreds(e, resetFields=true){
	if (e) e.preventDefault();
	DOMElements.loginButton.disabled = true;
	const userName = String(DOMElements.loginUsername.value);
	const userPass = String(DOMElements.loginPasscode.value);
	if (userName && userPass.length >= 8 && socket && peer){
		user.userName = userName;
		user.key = userPass;
		toggleView([DOMElements.loginModal])
		// DOMElements.loginModal.classList.add('hide');
    	socket.connect();
	} else {
		alert("Invalid Username or Passcode");
		if (resetFields){
			DOMElements.loginUsername.value = '';
			DOMElements.loginPasscode.value = '';
			DOMElements.loginButton.disabled = true;
		}
	}
}

//Execution
toggleView([DOMElements.videoCallModal, DOMElements.videoCallModalFloatBtn], [DOMElements.loginModal]);
DOMElements.loginUsername.addEventListener('input', (e) => { DOMElements.loginButton.disabled = (DOMElements.loginPasscode.validity.valid === false) || (DOMElements.loginUsername.value === '') });
DOMElements.loginPasscode.addEventListener('input', (e) => { DOMElements.loginButton.disabled = (DOMElements.loginPasscode.validity.valid === false) || (DOMElements.loginUsername.value === '') });
dragElement(DOMElements.videoCallModalFloatBtn);