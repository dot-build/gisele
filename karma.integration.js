/* jshint node: true */
module.exports = function(config) {
	'use strict';
	var babelOptions = require(__dirname + '/babel-options.js');

	config.set({
		browsers: ['PhantomJS'],
		frameworks: ['jasmine'],
		files: [
			'vendor/es6-collections/es6-collections.js',
			'src/*.js',
			'integration/*.js'
		],
		preprocessors: {
			'src/*.js': ['babel'],
			'integration/*.js': ['babel']
		},
		babelPreprocessor: {
			options: babelOptions
		}
	});
};
