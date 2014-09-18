
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var
	//serialport stuff
	com = require("serialport"),
	SerialPort = com.SerialPort,
	sp = null,
	isConnectionOpen = false,
	buffer = '',

	timer = null,
	uiState = null,

	SocketController = null,

	pkg = require('../../package.json');


var MsgController = {

	init : function (app, server, socketController, config) {

		SocketController = socketController;

		//setup our Arduino connection
		//commented out for testing purposes
		
		//_self.Arduino.setupConnection();

		return _self;

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
			sp = new SerialPort("COM10", {
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


	//this handles all of our UI connections detected through our socketController
	//newConnection gets called on every new connection and sets up events for that socket
	UI : {

		newConnection : function (socket) {

			_self.UI.initCustomEvents(socket);

			uiState = 'connected';
			SocketController.emitMsg('connectSuccess');

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

		receiveMsg : function (msg) {

			console.log('ui : message received : ' + msg);

			//dependent on msg, fire different responses
			switch (msg) {
				case 'notready':
					_self.UI.sendStartSignal(500);
					break;
				case 'ready':
					SocketController.emitMsg('changeView', { view : 'inPlay' });
					break;
				case 'fail':
					SocketController.emitMsg('capture', { state : 'fail' });
				case 'complete':
					SocketController.emitMsg('capture', { state : 'complete' });
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
				SocketController.emitMsg('changeView', { view : 'loader' });
			}

		}
	}
}

var _self = MsgController;

module.exports = MsgController;


