
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var
	//socketio ui stuff
	io = require('socket.io'), //socket.io - used for our websocket connection
	client = require('socket.io-client'),
	socketServer = null,

	MsgController = require('./MsgController')
	ApiController = require('./ApiController')

	pkg = require('../../package.json');


var SocketController = {

	setup : function (app, server, config) {

		//Start a Socket.IO listen
		socketServer = io.listen(server);

		//  ==================
		//  === ON CONNECT ===
		//  ==================

		//If a client connects, give them the current data that the server has tracked
		//so here that would be how many tweets of each type we have stored
		socketServer.sockets.on('connection', function(socket) {
			console.log('ui : new connection logged');

			MsgController.UI.newConnection(socket);
			ApiController.newConnection(socket);
		});

		//  ============================
		//  === SERVER ERROR LOGGING ===
		//  ============================

		socketServer.sockets.on('close', function(socket) {
			console.log('ui : socketServer has closed');
		});

	},

	emitMsg : function (msg, data) {

		socketServer.sockets.emit(msg, data);

	}
}

var _self = SocketController;

module.exports = SocketController;