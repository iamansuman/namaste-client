const socket = io({ autoConnect: false });
const peer = new Peer();
const user = { userName: null, key: null, peerID: null, currentCall: null, currentCallRemoteSocketID: null };
const SETTINGS = {
	keepLoginInfo: localStorage.getItem('keepLoginInfo')
};
const ChatDB = new Localbase('Chats');
ChatDB.config.debug = false;
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

socket.on('chat-message', async ({ senderName, senderID, messageBody, timeStamp }) => {
	const msgBody = await decrypt(messageBody, user.key);
	if (msgBody != "" || msgBody != null || msgBody != undefined){
        appendMessage(msgBody, {
            alignment: 1,
            username: senderName,
            userId: senderID,
            timeStamp: timeStamp
        });
        if (document.hidden && Notification.permission === 'granted'){
            const msgNoti = new Notification(senderName, {
                title: `From ${senderName}`,
                body: msgBody,
                icon: './imgs/app/message.svg',
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

    ChatDB.collection(`${socket.id}...${user.peerID}`).add({ senderName, senderID, messageBody, timeStamp, key: await encrypt(user.key, messageBody) }, String(timeStamp));
});

socket.on('inline-media', async ({ senderName, senderID, fileType, payload, timeStamp }) => {
    const CryptoWorker = new Worker('./js/Encryption/Workers/sec-v1.2-Worker.js');
    let workerData = {
        decrypt: true,
        key: user.key,
        payload,
        ioEncoding: 'ByteArray'
    }
    CryptoWorker.postMessage(workerData);
    CryptoWorker.onerror = CryptoWorker.onmessageerror = (e) => {
        console.error(e.data);
        CryptoWorker.terminate();
    }
    CryptoWorker.onmessage = (e) => {
        appendMedia(fileType, e.data, true, senderName, senderID);
        if (document.hidden && Notification.permission === 'granted'){
            const NotificationBody = {
                "image": "📷 Photo",
                "video": "📽 Video",
                "audio": "🎙 Audio"
            }
            const msgNoti = new Notification(senderName, {
                title: `From ${senderName}`,
                body: NotificationBody[String(fileType).split('/')[0]],
                icon: './imgs/app/gallery.svg',
                vibrate: [200, 100, 250],
                renotify: true,
                tag: 'chat-media',
                timestamp: timeStamp
            });
            msgNoti.addEventListener('click', (e) => {
                e.preventDefault();
                window.parent.parent.focus();
            });
        }
    }
});

socket.on('file', async ({ senderName, senderID, fileType, fileName, payload, timeStamp }) => {
    const CryptoWorker = new Worker('./js/Encryption/Workers/sec-v1.2-Worker.js');
    let workerData = {
        decrypt: true,
        key: user.key,
        payload,
        ioEncoding: 'ByteArray'
    }
    CryptoWorker.postMessage(workerData);
    CryptoWorker.onerror = CryptoWorker.onmessageerror = (e) => {
        console.error(e.data);
        CryptoWorker.terminate();
    }
    CryptoWorker.onmessage = (e) => {
        appendFile(fileType, fileName, e.data, true, senderName, senderID);
        if (document.hidden && Notification.permission === 'granted'){
            const msgNoti = new Notification(senderName, {
                title: `From ${senderName}`,
                body: '📃 File',
                icon: './imgs/app/file.svg',
                vibrate: [200, 100, 250],
                renotify: true,
                tag: 'chat-file',
                timestamp: timeStamp
            });
            msgNoti.addEventListener('click', (e) => {
                e.preventDefault();
                window.parent.parent.focus();
            });
        }
        CryptoWorker.terminate();
    }
});

socket.on('usersList', (users) => {
	allUsers = users;
	listUsers(allUsers);
});

socket.on('call-request', async ({ senderName, senderID, peerID, callType, timeStamp }) => {
    const remotePeerID = await decrypt(peerID, user.key);
    appendCall(callType, true, remotePeerID, senderID, senderName, timeStamp);
    if (document.hidden && Notification.permission === 'granted'){
        const msgNoti = new Notification(senderName, {
            title: `From ${senderName}`,
            body: `${callType == 'video' ? '🎥' : '📞'} ${String(callType).replace(/^\w/, char => char.toUpperCase())} Call From ${senderName}\n[Click To attend call]`,
            icon: (callType == 'video') ? './imgs/app/video-call.svg' : './imgs/app/call.svg',
            vibrate: [200, 100, 250],
            renotify: true,
            tag: 'chat-call',
            timestamp: timeStamp
        });
        msgNoti.addEventListener('click', (e) => {
            e.preventDefault();
            window.parent.parent.focus();
            joinCall(callType, remotePeerID, senderID);
        });
    }
});

socket.on('end-call', () => { endCall(true) });

socket.on('disconnect', () => {
	DOMElements.sendButton.disabled = true;
    listUsers();
	appendMessage("You got disconnected from server 😢");
	appendMessage("Attempting to reconnect... 🔌");
});

async function sendMessage(e){
    e.preventDefault();
	const message = await encrypt(e.target.elements.txtMsgBox.value, user.key);
	if (message != "" || message != null || message != undefined) {
        let timeStamp = Date.now();
		appendMessage(e.target.elements.txtMsgBox.value, {
            alignment: 2,
            timeStamp: timeStamp
        });
		socket.emit('send-chat-message', { messageBody: message, timeStamp: timeStamp });
        ChatDB.collection(`${socket.id}...${user.peerID}`).add({ senderName: user.userName, senderID: socket.id, messageBody: message, timeStamp, key: await encrypt(user.key, message) }, String(timeStamp));
		e.target.elements.txtMsgBox.value = '';
	}
	e.target.elements.txtMsgBox.focus();
}

function sendImagesVideos(files=null){
    if (files==null) return;
    for(i=0; i<files.length; i++){
        const file = files.item(i);
        const fileType = file.type.split('/')[0];
        if (file.size > 1e7) { //maxMediaSizeLimit: 1e7 or 10MB
            appendMessage(`${fileType.charAt(0).toUpperCase()}${fileType.slice(1)} exceeds file size limit of 10MB (each ${fileType})`);
            continue;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            appendMedia(fileType, reader.result, false);
            const CryptoWorker = new Worker('./js/Encryption/Workers/sec-v1.2-Worker.js');
            let workerData = {
                decrypt: false,
                key: user.key,
                payload: reader.result,
                ioEncoding: 'ByteArray'
            }
            CryptoWorker.postMessage(workerData);
            CryptoWorker.onerror = CryptoWorker.onmessageerror = (e) => {
                console.error(e.data);
                CryptoWorker.terminate();
            }
            CryptoWorker.onmessage = (e) => {
                socket.emit('send-file', { appendType: 'inlineMedia', fileType: file.type, payload: e.data });
            }
        }
    }
}

function sendFiles(files=null){
    if (files == null) return;
    for(i=0; i<files.length; i++){
        const file = files.item(i);
        if (file.size > 5e7) { //maxFileSizeLimit: 5e7 or 50MB
            appendMessage(`File exceeds size limit of 50MB (each file)`);
            continue;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            appendFile(file.type, file.name, reader.result, false, user.userName, socket.id);
            const CryptoWorker = new Worker('./js/Encryption/Workers/sec-v1.2-Worker.js');
            let workerData = {
                decrypt: false,
                key: user.key,
                payload: reader.result,
                ioEncoding: 'ByteArray'
            }
            CryptoWorker.postMessage(workerData);
            CryptoWorker.onerror = CryptoWorker.onmessageerror = (e) => {
                console.error(e.data);
                CryptoWorker.terminate();
            }
            CryptoWorker.onmessage = (e) => {
                socket.emit('send-file', { appendType: 'file', fileType: file.type, fileName: file.name, payload: e.data });
            }
        }
    }
}

async function sendCallRequest(type='audio'){
    if (user.peerID == null) return;
    const myPeerID = await encrypt(user.peerID, user.key);
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