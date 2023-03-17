const socket = io({ autoConnect: false });
const peer = new Peer();
const user = { userName: null, key: null, peerID: null, currentCall: null, currentCallRemoteSocketID: null };
let allUsers = []; //<- Not necessary, good to keep

const usp = new URLSearchParams(document.location.href.split('?')[1]);
const urlName = usp.get("name");
const urlPwd = usp.get("pwd");
if (urlName) user.userName = String(urlName);
if (urlPwd) user.key = String(urlPwd).length >=8 ? String(urlPwd) : null;

DOMElements.loginUsername.value = urlName;
DOMElements.loginPasscode.value = urlPwd;
DOMElements.loginButton.disabled = (DOMElements.loginPasscode.validity.valid === false) || (DOMElements.loginUsername.value === '');

if (Notification.permission !== 'granted') Notification.requestPermission();

peer.on('open', (id) => { user.peerID = id });

peer.on('call', (ring) => {
    user.currentCall = ring;
    user.currentCallRemoteSocketID = ring.metadata.peerSocketID;
    const callType = ring.metadata.callType;
    DOMElements.myVideo.poster = DOMElements.remoteVideo.poster = (callType=='audio') ? "./imgs/app/on-audio-call.jpg" : "./imgs/app/no-connection.jpeg";
    DOMElements.videoCallModalFloatBtn.src = (callType=='audio') ? './imgs/app/call.svg' : './imgs/app/video-call.svg' ;
    navigator.mediaDevices.getUserMedia({ video: Boolean(callType == 'video'), audio:true })
    .then((stream) => {
        DOMElements.myVideo.srcObject = stream;
        WaveformLocal.draw(stream, DOMElements.myWaveform);
        toggleView([], [DOMElements.videoCallModal]);
        // DOMElements.videoCallModal.classList.remove('hide');
        ring.answer(stream);
        ring.on('stream', (remoteStream) => {
            DOMElements.remoteVideo.srcObject = remoteStream;
            WaveformRemote.draw(remoteStream, DOMElements.remoteWaveform);
        });
        ring.on('close', () => { endCall() });
    })
    .catch((err) => { console.error(err) });
});

socket.on('connect', () => {
    socket.sendBuffer = [];
    DOMElements.sendButton.disabled = false;
    socket.emit('new-user', { name: user.userName, connectionTime: Date.now() });
	socket.emit('req-users');
    appendMessage("You joined! ⚡");
});

socket.on('user-connected', (userName) => {
    appendMessage(`${userName} connected 🤝`);
});

socket.on('user-disconnected', (disconnectedUser) => {
    appendMessage(`${disconnectedUser.name} disconnected 👋`);
    if (user.currentCallRemoteSocketID == disconnectedUser.id) endCall(true);
});

socket.on('chat-message', ({ senderName, senderID, messageBody, timeStamp }) => {
	const msgBody = decrypt(messageBody, user.key);
	if (msgBody != "" || msgBody != null || msgBody != undefined){
        appendMessage(`${senderName}: ${msgBody}`, 1);
        if (document.hidden && Notification.permission === 'granted'){
            const msgNoti = new Notification(senderName, {
                title: `From ${senderName}`,
                body: msgBody,
                icon: './imgs/namaste/namaste-192x192.png',
                vibrate: [200, 100, 250],
                renotify: true,
                tag: 'chat-message',
                timestamp: timeStamp
            });
            msgNoti.addEventListener('click', (e) => {
                e.preventDefault();
                window.parent.parent.focus();
            });
        }
    } else appendMessage(`${data.name} is trying to send a message but his/her passcode isn't the same as yours`);
});

socket.on('usersList', (users) => {
	allUsers = users;
	listUsers(allUsers);
});

socket.on('call-request', ({ senderName, senderID, peerID, callType, timeStamp }) => {
    const remotePeerID = decrypt(peerID, user.key);
    appendCall(callType, true, remotePeerID, senderID, senderName, timeStamp);
    if (document.hidden && Notification.permission === 'granted'){
        const msgNoti = new Notification(senderName, {
            title: `From ${senderName}`,
            body: `${String(callType).replace(/^\w/, char => char.toUpperCase())} Call From ${senderName}\n[Click To attend call]`,
            icon: './imgs/namaste/namaste-192x192.png',
            vibrate: [200, 100, 250],
            renotify: true,
            tag: 'chat-message',
            timestamp: timeStamp
        });
        msgNoti.addEventListener('click', (e) => {
            e.preventDefault();
            window.parent.parent.focus();
            joinCall(callType, remotePeerID, senderID);
        })
    }
});

socket.on('end-call', () => { endCall(true) });

socket.on('disconnect', () => {
	DOMElements.sendButton.disabled = true;
    listUsers();
	appendMessage("You got disconnected from server 😢");
	appendMessage("Attempting to reconnect... 🔌");
});

function sendMessage(e){
    e.preventDefault();
	const message = encrypt(e.target.elements.txtMsgBox.value, user.key);
	if (message != "" || message != null || message != undefined) {
		appendMessage(e.target.elements.txtMsgBox.value, 2);
		socket.emit('send-chat-message', { messageBody: message, timeStamp: Date.now() });
		e.target.elements.txtMsgBox.value = '';
	}
	e.target.elements.txtMsgBox.focus();
}

function sendCallRequest(type='audio'){
    if (user.peerID == null) return;
    const myPeerID = encrypt(user.peerID, user.key);
	socket.emit('send-call-request', { peerID: myPeerID, callType: type, timeStamp: Date.now() });
    appendCall(type, false, user.peerID, socket.id, user.userName, Date.now());
}

function joinCall(type='audio', peerID=null, socketID=null){
	if (peerID == null) return;
    DOMElements.myVideo.poster = DOMElements.remoteVideo.poster = (type=='audio') ? "./imgs/app/on-audio-call.jpg" : "./imgs/app/no-connection.jpeg";
    DOMElements.videoCallModalFloatBtn.src = (type=='audio') ? './imgs/app/call.svg' : './imgs/app/video-call.svg' ;
    user.currentCallRemoteSocketID = socketID;
	navigator.mediaDevices.getUserMedia({ video: Boolean(type=='video'), audio:true })
    .then((stream) => {
        DOMElements.myVideo.srcObject = stream;
        WaveformLocal.draw(stream, DOMElements.myWaveform);
        toggleView([DOMElements.videoCallModalFloatBtn], [DOMElements.videoCallModal])
        let call = user.currentCall = peer.call(peerID, stream, {metadata: { callType: type, peerSocketID: socket.id }});
        call.on('stream', (remoteStream) => {
            DOMElements.remoteVideo.srcObject = remoteStream;
            WaveformRemote.draw(remoteStream, DOMElements.remoteWaveform);
        });
        call.on('close', () => { endCall() });
    })
    .catch((err) => { console.error(err) });
}

function endCall(fromServer=false, sendRequestToSocketID=user.currentCallRemoteSocketID){
    if (user.currentCall) user.currentCall.close();
    if (DOMElements.myVideo.srcObject){
        DOMElements.myVideo.srcObject.getTracks().forEach(track => {
            track.stop();
            DOMElements.myVideo.srcObject.removeTrack(track);
        });
    }
    DOMElements.myVideo.src = '';
    DOMElements.myVideo.load();
    if (DOMElements.remoteVideo.srcObject){
        DOMElements.remoteVideo.srcObject.getTracks().forEach(track => {
            track.stop();
            DOMElements.remoteVideo.srcObject.removeTrack(track);
        });
    }
    DOMElements.remoteVideo.src = '';
    DOMElements.remoteVideo.load();
    WaveformLocal.stop();
    WaveformRemote.stop();
    user.currentCall = null;
    user.currentCallRemoteSocketID = null;
    toggleView([DOMElements.videoCallModal, DOMElements.videoCallModalFloatBtn]);
    if (!fromServer) socket.emit('send-end-call', { socketID: sendRequestToSocketID });
}