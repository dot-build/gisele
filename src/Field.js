class Field {
	constructor(config) {
		if (!config) {
			throw new Error('Invalid field config');
		}

		Object.keys(config).forEach((key) => this[key] = config[key]);
	}

	parse(value) {
		return value;
	}
}

Field.create = function(config) {
	switch (config.type) {
		case String:
			return new StringField(config);

		case Number:
			return new NumberField(config);

		case Boolean:
			return new BooleanField(config);

		case Date:
			return new DateField(config);

		default:
			return new CustomField(config);
	}
};

class StringField extends Field {
	parse(value) {
		return String(value !== undefined ? value : '').trim();
	}
}

class BooleanField extends Field {
	parse(value) {
		return !!value;
	}
}

class NumberField extends Field {
	parse(value) {
		return value && Number(value) || 0;
	}
}

class DateField extends Field {
	parse(value) {
		if (isFinite(value)) {
			return new Date(value);
		}

		if (typeof value === 'string') {
			let parsedTime = Date.parse(value);
			return new Date(parsedTime);
		}

		return null;
	}
}

class CustomField extends Field {
	parse(value) {
		return value !== null ? new this.type(value) : null;
	}
}
