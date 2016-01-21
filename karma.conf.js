/* jshint node: true */
module.exports = function(config) {
	'use strict';

	config.set({
		port: 9870,
		browsers: ['PhantomJS'],
		frameworks: ['jasmine'],
		reporters: ['dots'],
		files: [
			require.resolve('babel-polyfill/browser'),
			'src/*.js',
			'test/*.spec.js'
		],
		preprocessors: {
			'src/*.js': ['babel'],
			'test/*.js': ['babel']
		}
	});
};
