module.exports = function (grunt) {

	'use strict';

	// ====================
	// == Edit this section
	var jsFileList = [
		'public/js/socket.io.js',
		'public/js/underscore-min.js',
		'public/js/script.js'
	];
	var distDir = 'public/js/dist/';
	var jsFile = 'script.min.js';

	var cssFile = 'kickoff';
	// ====================
	// ====================

	// Load some stuff
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
		pkg: require('./package'),

		jshint: {
			all: jsFileList,
			options: {
				jshintrc: '.jshintrc'
			}
		},

		/**
		 * Sass compilation using grunt-sass
		 * https://github.com/gruntjs/grunt-contrib-sass
		 * Includes kickoff.scss and kickoff-old-ie.scss by default
		 * Also creates source maps
		 */
		sass: {
			kickoff: {
				options: {
					unixNewlines: true,
					style: 'expanded',
					lineNumbers: false,
					debugInfo : false,
					precision : 8,
					sourcemap: true
				},
				files: {
					'public/css/temp/kickoff.css'       : 'public/scss/kickoff.scss',
					'public/css/temp/kickoff-old-ie.css': 'public/scss/kickoff-old-ie.scss'
				}
			}
		},


		/**
		 * Autoprefixer
		 * https://github.com/nDmitry/grunt-autoprefixer
		 * https://github.com/ai/autoprefixer
		 * Auto prefixes your CSS using caniuse data
		 */
		autoprefixer: {
			options: {
				// We are supporting the last 2 browsers, any browsers with >1% market share,
				// and ensuring we support IE8+ with prefixes
				browsers: ['> 5%', 'last 4 versions', 'firefox > 3.6', 'ie > 7'],
				map: true
			},

			kickoff: {
				expand: true,
				flatten: true,
				src: 'public/css/temp/*.css',
				dest: 'public/css/'
			}
		},


		/**
		 * CSSO
		 * https://github.com/t32k/grunt-csso
		 * Minify CSS files with CSSO
		 */
		csso: {
			dist: {
				options: {
					restructure: false //turns structural optimisations off as can mess up fallbacks http://bem.info/tools/optimizers/csso/description/
				},
				files: {
					'public/css/kickoff.css'       : 'public/css/kickoff.css',
					'public/css/kickoff-old-ie.css': 'public/css/kickoff-old-ie.css'
				},

			}
		},

		uglify: {
			options: {
				// mangle: Turn on or off mangling
				mangle: true,

				// beautify: beautify your code for debugging/troubleshooting purposes
				beautify: false,

				// report: Show file size report
				report: 'gzip',

				// sourceMap: @string. The location of the source map, relative to the project
				sourceMap: distDir + jsFile + '.map',

				// sourceMappingURL: @string. The string that is printed to the final file
				sourceMappingURL: jsFile +'.map',

				// sourceMapRoot: @string. The location where your source files can be found. This sets the sourceRoot field in the source map.
				sourceMapRoot: '../../'

				// sourceMapPrefix: @integer. The number of directories to drop from the path prefix when declaring files in the source map.
				// sourceMapPrefix: 1,

			},
			js: {
				src: jsFileList,
				dest: distDir + jsFile
			}
		},

		watch: {
			scss: {
				files: ['public/scss/**/*.scss'],
				tasks: [
					'sass:kickoff',
					'autoprefixer:kickoff'
				]
			},

			js: {
				files: [
					'Gruntfile.js',
					'public/js/**/*.js',
					'public/js/libs/**/*.js'
				],
				tasks: ['uglify']
			},
			livereload: {
				options: { livereload: true },
				files: [
					'public/css/*.css'
				]
			}
		}
	});

	// =============
	// === Tasks ===
	// =============
	// A task for development
	grunt.registerTask('dev', ['uglify', 'sass:dev']);

	// A task for deployment
	grunt.registerTask('deploy', ['uglify', 'sass:kickoff']);

	// Default task
	grunt.registerTask('default', ['uglify', 'sass:dev']);

};
