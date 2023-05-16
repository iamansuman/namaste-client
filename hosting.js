if (process.env.APP_STATE === 'PROD') console.log = function() {}

const PORT = process.env.PORT || 8081;

const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use(express.static('public'));

server.listen(PORT, () => {
	console.log("Listening on " + PORT);
});