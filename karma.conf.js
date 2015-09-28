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
			'test/*.spec.js'
		],
		preprocessors: {
			'src/*.js': ['babel'],
			// uncomment to enable ES6 on tests too
			'test/*.js': ['babel']
		},
		babelPreprocessor: {
			options: babelOptions
		}
	});
};
