(function(global) {
	'use strict';

	<%= contents %>

	var Gisele = {
		Model: Model,
		ModelMethods: ModelMethods,

		Field: Field,
		StringField: StringField,
		BooleanField: BooleanField,
		NumberField: NumberField,
		CustomField: CustomField
	};

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
