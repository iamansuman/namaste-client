const DOMElements = {
	contextMenu: document.getElementById("contextMenu"),
	toastNotification: document.getElementById("toastNotification"),
	loginModal: document.getElementById("loginModal"),
	loginUsername: document.getElementById("login_username"),
	loginPasscode: document.getElementById("login_passcode"),
	loginButton: document.getElementById("login_btn"),
	messageContainer: document.getElementById("msg-container"),
	activeUsersListContainer: document.getElementById("activeUsersListContainer"),
	settingsContainer: document.getElementById("settingsContainer"),
	sendButton: document.getElementById("send-btn"),
	activeUserList: document.getElementById("activeUsers"),
	videoCallModal: document.getElementById("videoCallModal"),
	videoCallModalFloatBtn: document.getElementById("videoCallModalFloatBtn"),
	callTimer: document.getElementById("callTimer"),
	myVideo: document.getElementById("myVideo"),
	myWaveform: document.getElementById("myWaveform"),
	remoteVideo: document.getElementById("remoteVideo"),
	remoteWaveform: document.getElementById("remoteWaveform"),
	micToggle: document.getElementById("micToggle"),
	videoToggle: document.getElementById("videoToggle"),
};

function openUsersList(){ DOMElements.activeUsersListContainer.classList.add('activeUsersListContainer-open') }
function closeUsersList(){ DOMElements.activeUsersListContainer.classList.remove('activeUsersListContainer-open') }

function openSettings(){ DOMElements.settingsContainer.classList.add('settingsContainer-open') }
function closeSettings(){ DOMElements.settingsContainer.classList.remove('settingsContainer-open') }

function Share() { navigator.share({ url: location.href.split('?')[0] + "?pwd=" + user.key }) }

function contextMenuBuilder(options=[]){
	// [{option Title, option Funcion}]
	DOMElements.contextMenu.innerHTML = null;
	let closeBtn = document.createElement('div');
	closeBtn.classList.add('contextMenuElement');
	closeBtn.innerText = 'Close Menu';
	closeBtn.addEventListener('click', () => { DOMElements.contextMenu.classList.add('hide') });
	DOMElements.contextMenu.append(closeBtn);
	for (i=0; i<options.length; i++) {
		const option = options[i];
		if (!(option.Title)) continue;
		if (!(option.Function)) continue;
		let optionElement = document.createElement('div');
		optionElement.classList.add('contextMenuElement');
		optionElement.innerText = option.Title;
		optionElement.addEventListener('click', option.Function);
		DOMElements.contextMenu.append(document.createElement('hr'));
		DOMElements.contextMenu.append(optionElement);
	}
}

function toggleView(toHide=[], toShow=[]){
	toHide.forEach((DOMElement) => DOMElement.classList.add('hide'));
	toShow.forEach((DOMElement) => DOMElement.classList.remove('hide'));
}

function toastNotification(message="", options={ notificationDuration: 3000, neverExpire: false, expireNow: false }){
	DOMElements.toastNotification.innerText = String(message);
	if (options.expireNow) {
		DOMElements.toastNotification.classList.remove('showToast');
		DOMElements.toastNotification.innerText = '';
		return;
	}
	DOMElements.toastNotification.classList.add('showToast');
	if (!options.neverExpire) setTimeout(() => {
		DOMElements.toastNotification.classList.remove('showToast');
		DOMElements.toastNotification.innerText = '';
	}, options.notificationDuration);
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

function appendMessage(message=null, options={ alignment:0, username:null, userId:null, timeStamp:null }){
	if (message==null) return;
	if (!DOMElements.videoCallModal.classList.contains('hide')) toastNotification(`${options.username ?? "Someone"}: ${message}`);
	function isValidURL(string) {
		try { new URL(string); return true }
		catch (err) { return false }
	}
	const sentences = String(message).split(' ');
    //0-> System Notifications; 1-> Sender; 2-> Sender
    const alignmentOptions = [['50%', 'translateX(-50%)'], ['0%', 'translateX(0%)'], ['100%', 'translateX(-100%)']];
    const borderRadiusOptions = ['1rem', '0 1rem 1rem 0', '1rem 0 0 1rem'];
	const messageElement = document.createElement('div');
    messageElement.classList.add('messageElement');
	messageElement.style.left = alignmentOptions[options.alignment][0];
	messageElement.style.transform = alignmentOptions[options.alignment][1];
	messageElement.style.borderRadius = borderRadiusOptions[options.alignment];
	if (options.username != null && DOMElements.messageContainer.dataset.lastMessageBy != options.userId){
		const nameStamp = document.createElement('span');
		nameStamp.innerText = options.username;
		nameStamp.title = options.userId;
		messageElement.append(nameStamp);
		const separator = document.createElement('hr');
		messageElement.append(separator);
	}
	const paragraph = document.createElement('p');
	sentences.forEach((sentence, sentenceIndex) => {
		if (sentenceIndex != 0) paragraph.append(String(" "));
		if (isValidURL(sentence)){
			let textLink = document.createElement('a');
			textLink.innerText = sentence;
			textLink.href = new URL(sentence).href;
			textLink.target = '_blank';
			textLink.rel = 'noreferrer noopener';
			paragraph.append(textLink);
		} else paragraph.append(sentence);
	});
	messageElement.append(paragraph);
	DOMElements.messageContainer.append(messageElement);
	DOMElements.messageContainer.dataset.lastMessageBy = options.userId;
	messageElement.scrollIntoView({ behavior: 'smooth' });
	if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
}

async function appendMedia(fileType=null, base64String, bySender=false, senderName=null, senderID=null){
	if (!base64String) return;
	if (fileType.split('/')[0] == 'image'){
		const photoElement = document.createElement('div');
		photoElement.classList.add('photoElement');
		const pic = document.createElement('img');
		pic.src = base64String;
		pic.ondragstart = () => { return false };
		pic.classList.add('hasContextMenu');
		if (bySender && DOMElements.messageContainer.dataset.lastMessageBy != senderID){
			const namePlaceHolder = document.createElement('span');
			namePlaceHolder.innerText = senderName;
			namePlaceHolder.title = senderID;
			photoElement.append(namePlaceHolder);
			const separator = document.createElement('hr');
			photoElement.append(separator);
		}
		photoElement.style.left = (bySender) ? '0%' : '100%';
		photoElement.style.transform = (bySender) ? 'translateX(-0%)' : 'translateX(-100%)';
		photoElement.style.borderRadius = (bySender) ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem';
		pic.addEventListener('load', () => {
			// if (bySender && DOMElements.messageContainer.dataset.lastMessageBy != senderID) photoElement.style.minHeight = `calc(2rem + ${pic.naturalHeight/2}px)`;
			// else photoElement.style.minHeight = `${pic.naturalHeight/2}px`;
			if (pic.naturalHeight > DOMElements.messageContainer.clientHeight) pic.style.height = `${DOMElements.messageContainer.clientHeight * (0.75)}px`;
			// else if (pic.naturalWidth > (69/100 * DOMElements.messageContainer.clientWidth)) pic.style.maxWidth = `${DOMElements.messageContainer.clientWidth}px`;
			photoElement.append(pic);
			DOMElements.messageContainer.append(photoElement);
			DOMElements.messageContainer.dataset.lastMessageBy = senderID;
			photoElement.scrollIntoView({ behavior: 'smooth' });
			if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
		});
		pic.addEventListener('contextmenu', (e) => {
			DOMElements.contextMenu.classList.remove('hide');
			contextMenuBuilder([
				{
					Title: 'Download', Function: () => {
						let a = document.createElement('a');
						a.href = pic.src;
						a.download = `${Date.now()}.${fileType.split('/')[1]}`;
						a.click();
					}
				}
			]);
		});
	}

	if (fileType.split('/')[0] == 'video'){
		const videoElement = document.createElement('div');
		videoElement.classList.add('videoElement');
		const vid = document.createElement('video');
		vid.src = base64String;
		vid.ondragstart = () => { return false };
		vid.classList.add('hasContextMenu');
		if (bySender && DOMElements.messageContainer.dataset.lastMessageBy != senderID){
			const namePlaceHolder = document.createElement('span');
			namePlaceHolder.innerText = senderName;
			namePlaceHolder.title = senderID;
			videoElement.append(namePlaceHolder);
			const separator = document.createElement('hr');
			videoElement.append(separator);
		}
		videoElement.style.left = (bySender) ? '0%' : '100%';
		videoElement.style.transform = (bySender) ? 'translateX(-0%)' : 'translateX(-100%)';
		videoElement.style.borderRadius = (bySender) ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem';
		vid.style.width = `${69/100 * DOMElements.messageContainer.clientWidth}px`;
		
		videoElement.append(vid);
		DOMElements.messageContainer.append(videoElement);
		DOMElements.messageContainer.dataset.lastMessageBy = senderID;
		videoElement.scrollIntoView({ behavior: 'smooth' });
		if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;

		vid.addEventListener('contextmenu', (e) => {
			DOMElements.contextMenu.classList.remove('hide');
			contextMenuBuilder([
				{
					Title: 'Download', Function: () => {
						let a = document.createElement('a');
						a.href = vid.src;
						a.download = `Namaste_${senderName}_${Date.now()}.${fileType.split('/')[1]}`;
						a.click();
					}
				},
				{ Title: 'Play', Function: () => { vid.play() } },
				{ Title: 'Pause', Function: () => { vid.pause() } },
				{ Title: 'Mute', Function: () => { vid.muted = !(vid.muted) } }
			]);
		});
	}
}

function appendFile(fileType=null, fileName=null, base64String, bySender=false, senderName=null, senderID=null){
	if (!base64String) return;
	const fileElement = document.createElement('div');
	fileElement.classList.add('fileElement');
	const hyperlink = document.createElement('a');
	hyperlink.href = base64String;
	
	const div = document.createElement('div');

	const fileNameHolder = document.createElement('span');
	fileNameHolder.style.gridArea = 'filename';
	fileNameHolder.innerText = fileName;
	fileNameHolder.title = fileName;
	div.append(fileNameHolder);
	
	let fileSize = String(base64String).length * 0.75;
	if (fileSize < 1024) fileSize = `${parseFloat(fileSize).toFixed(2)} B`;
	else if (fileSize >= (1024) && fileSize < (1024*1024)) fileSize = `${(parseFloat(fileSize)/1024).toFixed(2)} KB`;
	else if (fileSize >= (1024*1024) && fileSize < (1024*1024*1024)) fileSize = `${(parseFloat(fileSize)/1024*1024).toFixed(2)} MB`;
	else fileSize = `${(parseFloat(fileSize)/(1024*1024*1024)).toFixed(2)} GB`;
	const fileMetaHolder = document.createElement('span');
	fileMetaHolder.style.gridArea = 'filemeta';
	fileMetaHolder.innerText = `${fileSize}, ${String(fileType.split('/')[1]).toUpperCase()} File`;
	div.append(fileMetaHolder);

	const downloadBtn = document.createElement('img');
	downloadBtn.classList.add('Button');
	downloadBtn.style.gridArea = 'downloadBtn';
	downloadBtn.src = './imgs/app/download.svg';
	downloadBtn.addEventListener('click', (e) => {
		e.preventDefault();
		hyperlink.download = fileName;
		hyperlink.click();
	});
	div.append(downloadBtn);
	
	if (bySender && DOMElements.messageContainer.dataset.lastMessageBy != senderID){
		const namePlaceHolder = document.createElement('span');
		namePlaceHolder.innerText = senderName;
		namePlaceHolder.title = senderID;
		fileElement.append(namePlaceHolder);
		const separator = document.createElement('hr');
		fileElement.append(separator);
	}
	fileElement.style.left = (bySender) ? '0%' : '100%';
	fileElement.style.transform = (bySender) ? 'translateX(-0%)' : 'translateX(-100%)';
	fileElement.style.borderRadius = (bySender) ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem';
	fileElement.style.width = `${0.4 * DOMElements.messageContainer.clientWidth}px`;
	
	fileElement.append(div);
	DOMElements.messageContainer.append(fileElement);
	DOMElements.messageContainer.dataset.lastMessageBy = senderID;
	fileElement.scrollIntoView({ behavior: 'smooth' });
	if (document.hidden) DOMElements.messageContainer.scrollTop = DOMElements.messageContainer.scrollHeight;
}

function appendCall(type='audio', bySender=false, peerID=null, socketID=null, senderName=null, timeStamp=null){
	if (peerID == null || socketID == null) return;
	const requestCallElement = document.createElement('div');
	requestCallElement.classList.add('callRequestElement');
	if (bySender){
		const namePlaceHolder = document.createElement('span');
		namePlaceHolder.innerText = senderName;
		namePlaceHolder.title = socketID;
		requestCallElement.append(namePlaceHolder);
		requestCallElement.style.minHeight = `${5+2}rem`;
	} else requestCallElement.style.minHeight = `${5}rem`;
	requestCallElement.style.left = (bySender) ? '0%' : '100%';
	requestCallElement.style.transform = (bySender) ? 'translateX(-0%)' : 'translateX(-100%)';
	requestCallElement.style.borderRadius = (bySender) ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem';
	const div = document.createElement('div');
	const callImage = document.createElement('img');
	callImage.classList.add('Button');
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
	DOMElements.messageContainer.dataset.lastMessageBy = socketID;
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
		toggleView([DOMElements.loginModal]);
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

//EventListeners
window.document.addEventListener('click', () => {
	DOMElements.contextMenu.classList.add('hide');
});

DOMElements.messageContainer.addEventListener('scroll', (e) => {
	DOMElements.contextMenu.classList.add('hide');
});

window.document.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	DOMElements.contextMenu.style.top = `${(e.y + DOMElements.contextMenu.offsetHeight > window.innerHeight) ? window.innerHeight - DOMElements.contextMenu.offsetHeight : e.y}px`;
	DOMElements.contextMenu.style.left = `${(e.x + DOMElements.contextMenu.offsetWidth > window.innerWidth) ? window.innerWidth - DOMElements.contextMenu.offsetWidth : e.x}px`;
});

let imageElements = document.getElementsByTagName('img');
for (i=0; i<imageElements.length; i++) imageElements.item(i).draggable = false;

//Execution
toggleView([DOMElements.videoCallModal, DOMElements.videoCallModalFloatBtn], [DOMElements.loginModal]);
DOMElements.loginUsername.addEventListener('input', (e) => { DOMElements.loginButton.disabled = (DOMElements.loginPasscode.validity.valid === false) || (DOMElements.loginUsername.value === '') });
DOMElements.loginPasscode.addEventListener('input', (e) => { DOMElements.loginButton.disabled = (DOMElements.loginPasscode.validity.valid === false) || (DOMElements.loginUsername.value === '') });
dragElement(DOMElements.videoCallModalFloatBtn);