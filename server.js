var express = require('express');
var app = express();
var server = require('http').createServer(app).listen(80);;
var io = require('socket.io').listen(server);

console.log("Server running..");

var users = [];
var connections = [];



app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);

	// Disconnect
	socket.on('disconnect', function(data){
		users.splice(users.indexOf(socket.username), 1);
		updateUsernames();
		connections.splice(connections.indexOf(socket), 1);
	console.log('Disconnected: %s sockets connected', connections.length);
	})
	
	// Post the message
	socket.on('post', function(data){
		io.sockets.emit('new post', {msg: data, user: socket.username});
	});


	// Login
	socket.on('login', function(data, callback){
		callback(true);
		socket.username = data;
		users.push(socket.username);
		updateUsernames();
	});

	function updateUsernames(){
		io.sockets.emit('get users', users);
	}
});