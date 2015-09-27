/* jshint node: true */
'use strict';

var gulp = require('gulp'),
	karma = require('karma').server,
	version = require('./package.json').version;

function buildRelease() {
	var uglify = require('gulp-uglify'),
		multipipe = require('multipipe'),
		sourcemaps = require('gulp-sourcemaps'),
		babel = require('gulp-babel'),
		concat = require('gulp-concat'),
		wrap = require('gulp-wrap'),
		babelOptions = require(__dirname + '/babel-options.js');

	console.log('Building version ' + version);

	multipipe(
		gulp.src('src/**/*.js'),
		concat('gisele.js'),
		babel(babelOptions),
		// sourcemaps.init(),
		wrap({ src: __dirname + '/build.template.js'}),
		uglify(),
		// sourcemaps.write('.'),
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
