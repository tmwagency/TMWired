
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var express = require('express'),
	io = require('socket.io'), //socket.io - used for our websocket connection
	client = require('socket.io-client'),
	_ = require('underscore'),

	socketServer = null,
	msgController = require('./msgController'),

	pkg = require('../../package.json');


var WebController = {



}


module.exports = WebController;


