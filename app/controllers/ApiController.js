
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var SocketController = null,

	twitterAPI = require('twitter'),

	twitter_update_with_media = require('../twitter_update_with_media'),

	fs = require('fs'),
	path = require('path'),

	twitter = null,

	imgFolder = 'public/img/shots/',
	imgExt = '.png',

	pkg = require('../../package.json');


var ApiController = {

	init : function (app, server, socketController, config) {

		SocketController = socketController;

		_self.Twitter.init();

	},

	newConnection : function (socket) {

		console.log('ApiController :: newConnection');



		socket.on('API.postUpdate', function (imgData) {

			_self.saveFile(imgData);

		});


		return _self;

	},

	saveFile : function (imgData, name) {


		var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");

		//this will be replaced by the users name
		var name = 'ash',
			filepath = imgFolder + name + imgExt;

		require("fs").writeFile(
			filepath,
			base64Data,
			'base64',
			function(err) {
				ApiController.Twitter.postUpdate(name, filepath)
			}
		);

	},

	Twitter : {

		//should really move into config if have time later
		keys : {
			consumerKey : 'xClEq3PngrJQNvfhbDSaAqfTv',
			consumerSecret : 'CCjtwzGN3huielmdYFoylxooWkfS76NO9QivLcjS0SWu1v2SWo',

			accessToken : '2457920262-duT0pTW1lP7oyi6c5L4mWprsZQNF4SDiDiQ5LIs',
			accessTokenSecret : 'VFrKmso3izXk4DZmR2rZAOlt5lglXwPbYtEkdjyhiTMVp'
		},

		tweet : {
			status : 'I’ve been playing TMWired, I scored blah - and my name is ',
			media : [], //This data must be either the raw image bytes or encoded as base64
			lat : null,
			long : null,
			display_coordinates : true
		},

		init : function () {

			//return our _self object
			return _self;

		},



		//post my update to twitter
		postUpdate : function (name, filepath) {

			var tweet = _self.Twitter.tweet,
				tweetStatus = tweet.status + name;

			var tuwm = new twitter_update_with_media({
				consumer_key: _self.Twitter.keys.consumerKey,
			    consumer_secret: _self.Twitter.keys.consumerSecret,
				token: _self.Twitter.keys.accessToken,
				token_secret: _self.Twitter.keys.accessTokenSecret
			});

			tuwm.post(
				tweetStatus,
				filepath,
				function(err, response) {
					if (err) {
					console.log(err);
					}
					console.log(response);
				}
			);

		}
	}
}

var _self = ApiController;
module.exports = ApiController;