module.exports = function(config) {
	var babelOptions = require(__dirname + '/babel-options.js');

	config.set({
		browsers: ['PhantomJS'],
		frameworks: ['jasmine'],
		files: ['src/**/*.js', 'test/**/*.spec.js'],
		preprocessors: {
			'src/**/*.js': ['babel']
		},
		babelPreprocessor: {
			options: babelOptions
			/*,
			filename: function(file) {
				return file.originalPath.replace(/\.js$/, '.es5.js');
			},
			sourceFileName: function(file) {
				return file.originalPath;
			}*/
		}
	});
};
