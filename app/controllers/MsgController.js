
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var express = require('express'),
	_ = require('underscore'),

	msgController = require('./msgController'),

	//serialport stuff
	com = require("serialport"),
	SerialPort = com.SerialPort,
	sp = null,
	isConnectionOpen = false,
	buffer = '',

	//socketio ui stuff
	io = require('socket.io'), //socket.io - used for our websocket connection
	client = require('socket.io-client'),
	socketServer = null,
	timer = null,
	uiState = null,

	pkg = require('../../package.json');


var MsgController = {

	init : function (app, server, config) {

		//setup our Arduino connection
		_self.Arduino.setupConnection();
		_self.UI.setupConnection(app, server, config);

	},

	sendMessage : function (to, msg) {

		if (to === 'server') {

			_self.Arduino.writeOutput(msg);

		} else if (to === 'ui') {

			_self.UI.receiveMsg(msg.toLowerCase())

		}

	},

	Arduino : {

		setupConnection : function () {

			//connect to the arduino through it’s path
			//sp = new SerialPort("/dev/tty.usbserial-A92HH373", {
			sp = new SerialPort("COM8", {
				baudrate: 9600,
	    		parser: require("serialport").parsers.readline('\r\n')
			});

			//wait for our connection to open up
			sp.on('open', _self.Arduino.onSerialOpen);

		},


		//takes a string and writes it to the arduino
		writeOutput : function (data) {

			sp.write(data, function (error) {
				if (error !== undefined) {
					console.log(error);
				}
			});

		},

		onSerialOpen : function () {

			console.log('arduino : connection opened');
			//now our connection is open, we can read/write as much as we want, so set the state to reflect this
			isConnectionOpen = true;

			//setup the receiver for any data coming through from the arduino
			sp.on('data', _self.Arduino.onDataReceived);

		},

		onDataReceived : function (data) {

			var dataString = data.toString();

			console.log('arduino : data received : ' + dataString);

			switch (dataString) {
				case 'NOTREADY':
					_self.sendMessage('ui', 'notready');
					break;
				case 'READY':
					_self.sendMessage('ui', 'ready');
					break;
				case 'FAIL':
					_self.sendMessage('ui', 'fail');
					break;
				case 'COMPLETE':
					_self.sendMessage('ui', 'complete');
					break;
			}

		}
	},

	UI : {

		setupConnection : function (app, server, config) {

			//Start a Socket.IO listen
			socketServer = io.listen(server);

			//  ==================
			//  === ON CONNECT ===
			//  ==================

			//If a client connects, give them the current data that the server has tracked
			//so here that would be how many tweets of each type we have stored
			socketServer.sockets.on('connection', function(socket) {
				console.log('ui : new connection logged');

				_self.UI.initCustomEvents(socket);

				uiState = 'connected';
				_self.UI.emitMsg('connectSuccess');
			});

			//  ============================
			//  === SERVER ERROR LOGGING ===
			//  ============================

			socketServer.sockets.on('close', function(socket) {
				console.log('ui : socketServer has closed');
			});

		},

		initCustomEvents : function (socket) {

			socket.on('userLoggedIn', function () {
				console.log('ui : user is ready');

				//see if the arduino is in a ready state
				_self.UI.sendStartSignal();

				//ui is in a loading state while it waits for the arduino to respond that it is ready
				uiState = 'loading';
			});

			socket.on('disconnect', function() {
				console.log('ui : user has disconnected');

				//clear timer if user disconnects
				clearTimeout(timer);
			});

		},

		emitMsg : function (msg, data) {

			socketServer.sockets.emit(msg, data);

		},

		receiveMsg : function (msg) {

// //temp switcher so we can fake it always being ready)
// if (msg === 'notready') {
// 	msg = 'ready';
// }

			console.log('ui : message received : ' + msg);

			//dependent on msg, fire different responses
			switch (msg) {
				case 'notready':
					_self.UI.sendStartSignal(500);
					break;
				case 'ready':
					_self.UI.emitMsg('changeView', { view : 'inPlay' });
					break;
				case 'fail':
				case 'complete':
					_self.UI.emitMsg('capture');
					break;
			}

		},

		sendStartSignal : function (delay) {

			delay = (delay !== null ? delay : 0);

			//writes 0 to the server to see if its ready
			//waits x milliseconds if delay is set
			timer = setTimeout(function () {
				_self.sendMessage('server', '0');
			}, delay);

			if (uiState === 'connected') {
				_self.UI.emitMsg('changeView', { view : 'loader' });
			}

		}
	}
}

var _self = MsgController;


module.exports = MsgController;


