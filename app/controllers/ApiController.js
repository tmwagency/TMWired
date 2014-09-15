
/**
 * Handles the db setup - adds the questions to the database if not there already
 * and handles the db connection
 */

var SocketController = null,

	twitterAPI = require('node-twitter-api'),

	twitter = null,

	pkg = require('../../package.json');


var ApiController = {

	init : function (app, server, socketController, config) {

		SocketController = socketController;

		_self.Twitter.init();

	},

	newConnection : function (socket) {

		console.log('ApiController :: newConnection');

		socket.on('API.getAccessToken', function (oauthVerifier) {

			_self.Twitter.getAccessToken(oauthVerifier);

		});

		socket.on('API.postUpdate', function (img) {

			_self.Twitter.postUpdate(img);

		});


		return _self;

	},

	Twitter : {

		//should really move into config if have time later
		keys : {
			consumerKey : 'xClEq3PngrJQNvfhbDSaAqfTv',
			consumerSecret : 'CCjtwzGN3huielmdYFoylxooWkfS76NO9QivLcjS0SWu1v2SWo',

			requestToken : null,
			requestTokenSecret : null
		},

		userKeys : {
			accessToken : null,
			accessTokenSecret : null
		},

		tweet : {
			status : 'This will be my tweet text',
			media : [], //This data must be either the raw image bytes or encoded as base64
			lat : null,
			long : null,
			display_coordinates : true
		},

		init : function () {

			twitter = new twitterAPI({
							consumerKey: _self.Twitter.keys.consumerKey,
							consumerSecret: _self.Twitter.keys.consumerSecret,
							callback: 'http://0.0.0.0:3004'
						});

			twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
				if (error) {
					console.log("Error getting OAuth request token : ", error);
				} else {
					//store token and tokenSecret somewhere, you'll need them later; redirect user
					console.log('oAuth success');
					_self.Twitter.keys.requestToken = requestToken;
					_self.Twitter.keys.requestTokenSecret = requestTokenSecret;
				}
			});

			//return our _self object
			return _self;

		},

		getAccessToken : function (oauth_verifier) {

			console.log('ApiControll :: getAccessToken');

			twitter.getAccessToken(_self.Twitter.keys.requestToken, _self.Twitter.keys.requestTokenSecret, oauth_verifier,
				function (error, accessToken, accessTokenSecret, results) {
					if (error) {
						console.log(error);
					} else {
						//store accessToken and accessTokenSecret somewhere (associated to the user)
						//Step 4: Verify Credentials belongs here
						console.log('User Access token returned');
						//if was doing for multiple connections, would need to store in a key-value pairing, but one connection so dont worry about
						_self.Twitter.userKeys.accessToken = accessToken;
						_self.Twitter.userKeys.accessTokenSecret = accessTokenSecret;

						_self.Twitter.verfiyCredentials(accessToken, accessTokenSecret);
					}
				}
			);

		},

		verfiyCredentials : function (accessToken, accessTokenSecret) {

			console.log('ApiController :: verifyCreds');

			twitter.verifyCredentials(accessToken, accessTokenSecret, function(error, data, response) {
				if (error) {
					//something was wrong with either accessToken or accessTokenSecret
					//start over with Step 1
					console.log('ApiController :: verifyCreds :: Somethign went wrong, please restart server and allow app perimissions again');
				} else {
					//accessToken and accessTokenSecret can now be used to make api-calls (not yet implemented)
					//data contains the user-data described in the official Twitter-API-docs
					//you could e.g. display his screen_name
					console.log(data["screen_name"]);

					SocketController.emitMsg('userVerified');
				}
			});

		},

		getRequestToken : function () {

			return _self.Twitter.keys.requestToken;

		},


		//post my update to twitter
		postUpdate : function () {

			var tweet = _self.Twitter.tweet;

			twitter.statuses("update_with_media", {
					status: tweet.status,
					media: tweet.media
				},
				_self.Twitter.userKeys.accessToken,
				_self.Twitter.userKeys.accessTokenSecret,
				function(error, data, response) {
					if (error) {
						// something went wrong
					} else {
						// data contains the data sent by twitter
					}
				}
			);

		}
	}
}

var _self = ApiController;
module.exports = ApiController;