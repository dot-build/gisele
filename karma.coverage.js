var setBaseConfig = require('./karma.conf.js');

module.exports = function(config) {
	'use strict';

	setBaseConfig(config);

	var preprocessors = config.preprocessors;
	preprocessors['src/*.js'].push(['coverage']),

	config.set({
		autoWatch: true,
		reporters: (config.reporters||[]).concat('coverage'),
		plugins: (config.plugins||[]).concat('karma-coverage'),

		preprocessors: preprocessors,

		coverageReporter: {
			type: 'html',
			dir: 'coverage/'
		}
	});
};
