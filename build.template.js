(function(global) {
	'use strict';

	var Gisele = {
		Model: Model,
		Collection: Collection
	};

	<%= contents %>

	if (typeof define === 'function' && define.amd) {
		define(function() {
			return Gisele;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Gisele;
	} else {
		global.Gisele = Gisele;
	}

})(this);
