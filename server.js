var PORT = process.env.PORT || 8081
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const users = []

io.on('connection', socket => {
	socket.on('new-user', name => {
		user = {name:name, id:socket.id}
		users.push(user);
		socket.broadcast.emit('user-connected', name);
		io.sockets.emit('allUsers', users);
		console.log(`${name} connected`);
	})
	socket.on('req-users', () => {
		io.sockets.emit('allUsers', users);
	});
	socket.on('send-chat-message', message => {
		if (users[users.findIndex((obj) => {return obj.id == socket.id})]) {
			socket.broadcast.emit('chat-message', { message: message, name: users[users.findIndex((obj) => {return obj.id == socket.id})].name });
			console.log(`${users[users.findIndex((obj) => {return obj.id == socket.id})].name}: ${message}`);
		}
	})
	socket.on('disconnect', () => {
		if (users[users.findIndex((obj) => {return obj.id == socket.id})]){
			socket.broadcast.emit('user-disconnected', users[users.findIndex((obj) => {return obj.id == socket.id})].name);
			console.log(`${users[users.findIndex((obj) => {return obj.id == socket.id})].name} disconnected`);
			users.splice(users.findIndex((obj) => {return obj.id == socket.id}), 1);
			io.sockets.emit('allUsers', users);
		}
	})
})

server.listen(PORT, () => {
	console.log("Listening on " + PORT);
})