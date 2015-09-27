/* jshint node: true */
'use strict';

var gulp = require('gulp'),
	karma = require('karma').server,
	version = require('./package.json').version;

function buildRelease() {
	var uglify = require('gulp-uglify'),
		multipipe = require('multipipe'),
		babel = require('gulp-babel'),
		concat = require('gulp-concat'),
		rename = require('gulp-rename'),
		wrap = require('gulp-wrap'),
		babelOptions = require(__dirname + '/babel-options.js');

	console.log('Building version ' + version);

	multipipe(
		gulp.src('src/**/*.js'),
		concat('gisele.js'),
		babel(babelOptions),
		wrap({ src: __dirname + '/build.template.js'}),
		gulp.dest('dist'),
		uglify(),
		rename({ suffix: '.min' }),
		gulp.dest('dist'),
		onError
	);
}

function runTests(done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done);
}

function tdd(done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js'
	}, done);
}

function onError(err) {
	if (err) {
		console.warn(err.message || err);
		if (err.stack) console.log(err.stack);
	}
}

gulp.task('build', ['test'], buildRelease);
gulp.task('tdd', tdd);
gulp.task('test', runTests);
gulp.task('default', ['tdd']);
