var PORT = process.env.PORT || 8081;
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
	connectionStateRecovery: {
		maxDisconnectionDuration: 2 * 60 * 1000,
		skipMiddlewares: true,
	}
});

app.use(express.static('public'));

const users = []

io.on('connection', socket => {
	socket.on('new-user', userData => {
		let user = { name: userData.name, id: socket.id, connectionTime: userData.connectionTime };
		users.push(user);
		socket.broadcast.emit('user-connected', userData.name);
		io.sockets.emit('usersList', users);
		console.log(`${userData.name} connected`);
	});
	socket.on('req-users', () => {
		io.to(socket.id).emit('usersList', users);
	});
	socket.on('send-chat-message', ({ messageBody, timeStamp }) => {
		const user = users[users.findIndex((obj) => {return obj.id == socket.id})];
		if (user) socket.broadcast.emit('chat-message', { senderName: user.name, senderID: socket.id, messageBody, timeStamp });
	});
	socket.on('send-call-request', ({ peerID, callType, timeStamp }) => {
		const user = users[users.findIndex((obj) => {return obj.id == socket.id})];
		if (user) socket.broadcast.emit('call-request', { senderName: user.name, senderID: socket.id, peerID, callType, timeStamp });
	});
	socket.on('send-end-call', ({ socketID }) => {
		const user = users[users.findIndex((obj) => {return obj.id == socket.id})];
		if (user) socket.to(socketID).emit('end-call');
	});
	socket.on('disconnect', () => {
		const userIndex = users.findIndex((obj) => {return obj.id == socket.id});
		if (users[userIndex]){
			socket.broadcast.emit('user-disconnected', users[userIndex].name);
			console.log(`${users[userIndex].name} disconnected`);
			users.splice(userIndex, 1);
			io.sockets.emit('usersList', users);
		}
	});
})

server.listen(PORT, () => {
	console.log("Listening on " + PORT);
});