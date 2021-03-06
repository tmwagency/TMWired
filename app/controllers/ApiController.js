
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

		socket.on('API.postUpdate', _self.saveFile);


		return _self;

	},

	saveFile : function (data) {

		var imgData = data.imgData,
			state = data.gameState,
			userName = data.userName.toLowerCase();

		var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");

		//this will be replaced by the users name
		var filepath = imgFolder + userName + imgExt;

		require("fs").writeFile(
			filepath,
			base64Data,
			'base64',
			function(err) {
				ApiController.Twitter.postUpdate(userName, state, filepath)
			}
		);

	},

	Twitter : {

		//should really move into config if have time later
		keys : {
			// consumerKey : 'MEIijS3323F82pv9NVZjGhywJ',
			// consumerSecret : 'milsMvTUjAiRdJ77Hzj1oucp31MSqROGutSmc1wIYITbVc7Kp4',

			// accessToken : '2653464061-WsgpR2Vcb4mUF69vmY3IxV7FRySq1ODbF29va6M',
			// accessTokenSecret : 'IF7Q4W02MwfPPYHox398WSh5Ee5PLrIpJIgGGWs4QCPL7'

			consumerKey : 'A8Gj7WmIriOoqUihv2T97zNbS',
			consumerSecret : 'kAR9yV2rmOfN4nGc1n29dgJE7ZNPtbsRJtOFUGJpn395m16iUw',

			accessToken : '2829524809-mWQFZojArsYewqJGVzGH4LMBskBpRfXP1tbnzCN',
			accessTokenSecret : 'aPv6HaG5zil5DZEwHkTOBZsTQPPiIDHHCvKmgrCQk4RLh'
		},

		tweet : {
			status : {
				fail : [
					'Whups, sorry {name}. Looks like you failed #IncubatorExpo. Your loved ones have been alerted to your failure.',
					'Tough going, {name}. You have what the youth refer to as Epically Failed at SteadyHand #IncubatorExpo.',
					'We know you said you had nerves of steel, {name}, but your performance at #IncubatorExpo says otherwise.'
				],
				complete : [
					'NICE ONE {name}. You made it to the end of SteadyHand at #IncubatorExpo. Have a bit of cake.',
					'Looks like Cool Hand {name} made it the end of SteadyHand at #IncubatorExpo. Ooh, they’re so dreamy.'
				]
			},
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
		postUpdate : function (name, state, filepath) {

			var tuwm = new twitter_update_with_media({
				consumer_key: _self.Twitter.keys.consumerKey,
			    consumer_secret: _self.Twitter.keys.consumerSecret,
				token: _self.Twitter.keys.accessToken,
				token_secret: _self.Twitter.keys.accessTokenSecret
			});

			var tweetStatus = ApiController.Twitter.getStatus(state, name);

			tuwm.post(
				tweetStatus,
				filepath,
				function(err, response) {
					if (err) {
					//console.log(err);
					}
					//console.log(response);
				}
			);

		},

		getStatus : function (state, name) {

			var random;

			if (state === 'fail') {
				random = Math.floor(Math.random() * 3);
			} else if (state === 'complete'){
				random = Math.floor(Math.random() * 2);
			}

			var tweet = _self.Twitter.tweet.status[state][random];
			tweet = tweet.replace('{name}', '@' + name)

			console.log('getStatus :: ', state, random, tweet);
			return tweet;
		}
	}
}

var _self = ApiController;
module.exports = ApiController;