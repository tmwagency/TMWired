var TMW = window.TMW || {};

TMW.Wired = {
	socket : null,
	isConnected : false,

	videoOutput : document.querySelector('video'),
	videoWidth : 0,
	videoHeight : 0,
	canvas : document.querySelector('.photoWindow'),
	ctx : null,
	photo : document.querySelector('.photo'),

	isAnimating : false,
	animationDelay : 500,

	queuedScreens : [],


	init : function () {

		this.makeSocketConnection();

		this.initEvents();

		this.initCamera();

	},

	makeSocketConnection : function () {

		log('script.js :: making connection');

		var connectionURL = window.location.hostname;

		this.socket = io.connect(connectionURL);

	},

	initEvents : function () {

		//will receive this event from the server when a connection is made
		TMW.Wired.socket.on('connectSuccess', TMW.Wired.connectedToServer);

		TMW.Wired.socket.on('userVerified', TMW.Wired.userVerified);

		TMW.Wired.socket.on('changeView', TMW.Wired.changeView);

		TMW.Wired.socket.on('capture', TMW.Wired.captureScreenShot);

	},


	connectedToServer : function (state) {

		log('script.js :: connectedToServer');


		TMW.Wired.isConnected = true;

		//do some logging on stuff here
		$('.form--login').on('submit', function (e) {
			var userDetails = {
				username : $('.control--username').value
			};

			//need to actually check if the user exists
			TMW.Wired.userVerified();

			e.preventDefault();
		});


		//testing
		// TMW.Wired.changeView({view : 'loader'});
		// TMW.Wired.changeView({view : 'inPlay'});
		//
		//TMW.Wired.setupPhotoDimensions();
		//TMW.Wired.captureScreenShot();
		//
		//

		// FAIL/SUCCESS DEBUG
		//TMW.Wired.changeView({view : 'fail'});
		//TMW.Wired.changeView({view : 'complete'});


	},

	userVerified : function () {
		//simply here in case we want to do anything in between these states
		//UI is informed of successful oauth from User

		//respond that UI is now ready and to check if the Arduino is ready
		TMW.Wired.socket.emit('userLoggedIn');
	},


	getParameterByName : function (name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	},


	changeView : function (data) {

		log('script.js :: [changeView] data:', data);

		//if we’re animating something, then add our view change to a queue and recall in a second
		if (TMW.Wired.isAnimating) {
			log('script.js :: already animating something');

			if (TMW.Wired.queuedScreen && data.view !== TMW.Wired.queuedScreen[TMW.Wired.queuedScreen.length]) {
				log('script.js :: adding view ' + data.view + ' to animation queue');
				TMW.Wired.queuedScreens = data.view;
			}

			setTimeout(function () {
				TMW.Wired.changeView(data);
			}, 1000);

		} else {

			switch (data.view) {
				case 'loader':
					$('.form--login').style.display = 'none';
					$('.loading').classList.remove('isHidden');

					TMW.Wired.isAnimating = true;
					TMW.Wired.setAnimationTimer();

					break;
				case 'inPlay':
					document.querySelector('.loading').classList.add('isHidden');

					TMW.Wired.isAnimating = true;

					TMW.Wired.setAnimationTimer(function () {
						document.querySelector('video').classList.remove('isHidden');
						TMW.Wired.setupPhotoDimensions();
					});
					break;
				case 'complete':
					console.log('I AM COMPLETED')

					// TODO : set some kind of view state to 'user-fail'
					document.querySelector('.successView').classList.remove('isHidden');
					break;
				case 'fail':
					console.log('I AM FAILURE');

					// TODO : set some kind of view state to 'user-fail'
					document.querySelector('.failView').classList.remove('isHidden');
					break;
			}

		}


	},


	setAnimationTimer : function (cb) {

		setTimeout(function () {
			TMW.Wired.isAnimating = false;

			if (typeof cb === 'function')
				cb();

		}, TMW.Wired.animationDelay);

	},




	hasGetUserMedia : function () {
	  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia);
	},

	initCamera : function () {

		if (this.hasGetUserMedia()) {
			// Good to go!
			log('script.js :: Camera support detected – woop')
			//cross browser bit to alias prefix back to actual call
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

			this.findSources();

		} else {
			log('script.js :: getUserMedia Not Supported – boooooooo')
		}

	},

	//uses MediaStreamTrack to get a list of available sources for the interface
	findSources : function () {

		if (typeof MediaStreamTrack === 'undefined') {
			log('script.js :: This browser does not support MediaStreamTrack :(');
		} else {
			log('script.js :: MediaStreamTrack.getSources');
			MediaStreamTrack.getSources(this.gotSources);
		}

	},

	gotSources : function (sourceInfos) {

		for (var i = 0; i != sourceInfos.length; ++i) {
			var sourceInfo = sourceInfos[i];

			//we only care about video sources, ignore the rest
			if (sourceInfo.kind === 'video') {
				//try and match our external webcam id
				log('script.js :: Trying to match external webcam ID...');
				//if (sourceInfo.id.match(/89e0d0c17efbd5c0525e4db7b6c67e6f557d4456a82da194ebda964d2de72a57/)) {
					log('Matched External Camera Id');
					TMW.Wired.startStream(sourceInfo.id);
				// }
				// else {
				// 	log('script.js :: Failed to match external webcam ID.');
				// }
			}
		}

	},

	startStream : function (videoSource) {

		if (!!window.stream) {
			MW.Wired.videoOutput.src = null;
			window.stream.stop();
		}

		var constraints = {
			video: {
				optional: [{sourceId: videoSource}]
			}
		};

		navigator.getUserMedia(constraints, this.cameraSuccessCallback, this.cameraErrorCallback);

	},

	cameraSuccessCallback : function (stream) {

		window.stream = stream; //makes stream available to console
		TMW.Wired.videoOutput.src = window.URL.createObjectURL(stream);
		TMW.Wired.videoOutput.play();

	},

	setupPhotoDimensions : function () {

		TMW.Wired.videoWidth = TMW.Wired.videoOutput.videoWidth;
		TMW.Wired.videoHeight = TMW.Wired.videoOutput.videoHeight;

		TMW.Wired.canvas.setAttribute('width', TMW.Wired.videoWidth);
		TMW.Wired.canvas.setAttribute('height', TMW.Wired.videoHeight);

		TMW.Wired.ctx = TMW.Wired.canvas.getContext('2d');

	},


	//captures whatever is on the camera at the time the function is called
	captureScreenShot : function (state) {

		TMW.Wired.ctx.drawImage(TMW.Wired.videoOutput, 0, 0, TMW.Wired.videoWidth, TMW.Wired.videoHeight);

		//change state based on win/lose
		TMW.Wired.changeView({
			view : state
		});

		var data = TMW.Wired.canvas.toDataURL('image/png');
		TMW.Wired.photo.setAttribute('src', data);

		//emit tweet status message here
		TMW.Wired.socket.emit('API.postUpdate', {
			imgData : data,
			gameState : state
		});

	},

	cameraErrorCallback : function (e) {
		log(e);
	},

};


//  ================
//  === EASY LOG ===
//  ================
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
		window.log = function f() {
				log.history = log.history || [];
				log.history.push(arguments);
				if (this.console) {
						var args = arguments,
								newarr;
						try {
								args.callee = f.caller;
						} catch (e) {}
						newarr = [].slice.call(args);
						if (typeof console.log === 'object')  {
							log.apply.call(console.log, console, newarr);
						} else {
							console.log.apply(console, newarr);
						}
				}
		};

//  ========================
//  === Prepend function ===
//  ========================

Element.prototype.prependChild = function(child) { this.insertBefore(child, this.firstChild); };

//  ===========================
//  === Allow bind for IE9< ===
//  ===========================
		if(!function(){}.bind){
		  Function.prototype.bind = function(){
			var me = this
			, shift = [].shift
			, he = shift.apply(arguments)
			, ar = arguments
			return function(){
			  return me.apply(he, ar);
			}
		  }
		}

//  ============================================
//  === getElementsByClassName for everyone! ===
//  ============================================
		if (typeof document.getElementsByClassName!='function') {
			document.getElementsByClassName = function() {
				var elms = document.getElementsByTagName('*');
				var ei = new Array();
				for (i=0;i<elms.length;i++) {
					if (elms[i].getAttribute('class')) {
						ecl = elms[i].getAttribute('class').split(' ');
						for (j=0;j<ecl.length;j++) {
							if (ecl[j].toLowerCase() == arguments[0].toLowerCase()) {
								ei.push(elms[i]);
							}
						}
					} else if (elms[i].className) {
						ecl = elms[i].className.split(' ');
						for (j=0;j<ecl.length;j++) {
							if (ecl[j].toLowerCase() == arguments[0].toLowerCase()) {
								ei.push(elms[i]);
							}
						}
					}
				}
				return ei;
			}
		}


/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

	window.matchMedia || (window.matchMedia = function() {
		"use strict";

		// For browsers that support matchMedium api such as IE 9 and webkit
		var styleMedia = (window.styleMedia || window.media);

		// For those that don't support matchMedium
		if (!styleMedia) {
			var style       = document.createElement('style'),
				script      = document.getElementsByTagName('script')[0],
				info        = null;

			style.type  = 'text/css';
			style.id    = 'matchmediajs-test';

			script.parentNode.insertBefore(style, script);

			// 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
			info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

			styleMedia = {
				matchMedium: function(media) {
					var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

					// 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
					if (style.styleSheet) {
						style.styleSheet.cssText = text;
					} else {
						style.textContent = text;
					}

					// Test if media query is true or false
					return info.width === '1px';
				}
			};
		}

		return function(media) {
			return {
				matches: styleMedia.matchMedium(media || 'all'),
				media: media || 'all'
			};
		};
	}());

//  =============================================
//  === shim layer for requestAnimationFrame  ===
//  === with setTimeout fallback              ===
//  =============================================

	window.requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       ||
			  window.webkitRequestAnimationFrame ||
			  window.mozRequestAnimationFrame    ||
			  function( callback ){
				window.setTimeout(callback, 1000 / 60);
			  };
	})();

//  ===========================================
//  === globals Element:true, NodeList:true ===
//  ===========================================

		$ = (function (document, $) {
			var element = Element.prototype,
				nodeList = NodeList.prototype,
				forEach = 'forEach',
				trigger = 'trigger',
				each = [][forEach],

				dummyEl = document.createElement('div');

			nodeList[forEach] = each;

			element.on = function (event, fn) {
				this.addEventListener(event, fn, false);
				return this;
			};

			nodeList.on = function (event, fn) {
				each.call(this, function (el) {
					el.on(event, fn);
				});
				return this;
			};

			element.trigger = function (type, data) {
				var event = document.createEvent('HTMLEvents');
				event.initEvent(type, true, true);
				event.data = data || {};
				event.eventName = type;
				event.target = this;
				this.dispatchEvent(event);
				return this;
			};

			nodeList.trigger = function (event) {
				each.call(this, function (el) {
					el[trigger](event);
				});
				return this;
			};

			$ = function (s) {
				var r = document.querySelectorAll(s || '☺'),
					length = r.length;
				return length == 1 ? r[0] : !length ? nodeList : r;
			};

			$.on = element.on.bind(dummyEl);
			$.trigger = element[trigger].bind(dummyEl);

			return $;
		})(document);

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-01-31
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if ("document" in self && !("classList" in document.createElement("_"))) {

	(function (view) {

		"use strict";

		if (!('Element' in view)) return;

		var
			  classListProp = "classList"
			, protoProp = "prototype"
			, elemCtrProto = view.Element[protoProp]
			, objCtr = Object
			, strTrim = String[protoProp].trim || function () {
				return this.replace(/^\s+|\s+$/g, "");
			}
			, arrIndexOf = Array[protoProp].indexOf || function (item) {
				var
					  i = 0
					, len = this.length
				;
				for (; i < len; i++) {
					if (i in this && this[i] === item) {
						return i;
					}
				}
				return -1;
			}
			// Vendors: please allow content code to instantiate DOMExceptions
			, DOMEx = function (type, message) {
				this.name = type;
				this.code = DOMException[type];
				this.message = message;
			}
			, checkTokenAndGetIndex = function (classList, token) {
				if (token === "") {
					throw new DOMEx(
						  "SYNTAX_ERR"
						, "An invalid or illegal string was specified"
					);
				}
				if (/\s/.test(token)) {
					throw new DOMEx(
						  "INVALID_CHARACTER_ERR"
						, "String contains an invalid character"
					);
				}
				return arrIndexOf.call(classList, token);
			}
			, ClassList = function (elem) {
				var
					  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
					, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
					, i = 0
					, len = classes.length
				;
				for (; i < len; i++) {
					this.push(classes[i]);
				}
				this._updateClassName = function () {
					elem.setAttribute("class", this.toString());
				};
			}
			, classListProto = ClassList[protoProp] = []
			, classListGetter = function () {
				return new ClassList(this);
			}
		;
		// Most DOMException implementations don't allow calling DOMException's toString()
		// on non-DOMExceptions. Error's toString() is sufficient here.
		DOMEx[protoProp] = Error[protoProp];
		classListProto.item = function (i) {
			return this[i] || null;
		};
		classListProto.contains = function (token) {
			token += "";
			return checkTokenAndGetIndex(this, token) !== -1;
		};
		classListProto.add = function () {
			var
				  tokens = arguments
				, i = 0
				, l = tokens.length
				, token
				, updated = false
			;
			do {
				token = tokens[i] + "";
				if (checkTokenAndGetIndex(this, token) === -1) {
					this.push(token);
					updated = true;
				}
			}
			while (++i < l);

			if (updated) {
				this._updateClassName();
			}
		};
		classListProto.remove = function () {
			var
				  tokens = arguments
				, i = 0
				, l = tokens.length
				, token
				, updated = false
			;
			do {
				token = tokens[i] + "";
				var index = checkTokenAndGetIndex(this, token);
				if (index !== -1) {
					this.splice(index, 1);
					updated = true;
				}
			}
			while (++i < l);

			if (updated) {
				this._updateClassName();
			}
		};
		classListProto.toggle = function (token, force) {
			token += "";

			var
				  result = this.contains(token)
				, method = result ?
					force !== true && "remove"
				:
					force !== false && "add"
			;

			if (method) {
				this[method](token);
			}

			return !result;
		};
		classListProto.toString = function () {
			return this.join(" ");
		};

		if (objCtr.defineProperty) {
			var classListPropDesc = {
				get: classListGetter
				, enumerable: true
				, configurable: true
			};
			try {
				objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
			} catch (ex) { // IE 8 doesn't support enumerable:true
				if (ex.number === -0x7FF5EC54) {
					classListPropDesc.enumerable = false;
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				}
			}
		} else if (objCtr[protoProp].__defineGetter__) {
			elemCtrProto.__defineGetter__(classListProp, classListGetter);
		}

	}(self));

}



TMW.Wired.init();