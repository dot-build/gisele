/**
 * @class Model
 *
 * Model layout:
 *
 * 		model = {
 * 			$$: {}					// model methods (defined in Model.fn)
 *
 * 			__: {					// Model data
 * 				$data: {}			// original data (set at construction or commited)
 * 				$changed: {}		// changed fields
 * 			}
 *
 * 			$$dirty: Boolean		// true if the model has changes to save
 * 		}
 */
class Model {
	// toString() {
	// 	return this.$$.name;
	// }
}

Model.defineProperty = function defineProperty(model, field) {
	let name = field.name;

	let getter = function() {
		return model.$$.get(name);
	};

	let setter = function(value) {
		if (field.readOnly) return;

		const Type = field.type;
		value = Type(value);

		model.$$.set(name, value);
	};

	let descriptor = {
		enumerable: true,
		get: getter,
		set: setter
	};

	Object.defineProperty(model, name, descriptor);
};

Model.initialize = function(self, Constructor) {
	let fields = Constructor.__fields__;

	fields.forEach(function(field) {
		Model.defineProperty(self, field);
	});

	var modelInternals = Object.create(Model.fn);

	modelInternals.data = {};
	modelInternals.changed = false;
	modelInternals.fields = Constructor.__fields__;
	modelInternals.name = Constructor.__name__;

	Object.defineProperty(self, '$$', {
		enumerable: false,
		value: modelInternals
	});

	Object.defineProperty(self, '$$dirty', {
		enumerable: false,
		set: Model.noop,
		get: function() {
			return (self.$$.changed !== false);
		}
	});
};

Model.noop = function noop() {};

Model.create = function createModel(config) {
	let name = config.name || 'Model';
	let fields = config.fields || [];

	let Constructor = function ModelClass(data) {
		Model.initialize(this, Constructor);

		if (typeof data === 'object' && data) {
			this.$$.setPersistent(data);
		}
	};

	// object format: { fieldName: 'self', otherField: String ... }
	if (!Array.isArray(fields)) {
		fields = Object.keys(fields).reduce(function(stack, key) {
			let field = Model.createField(key, fields[key], Constructor);
			stack.push(field);
			return stack;
		}, []);
	}

	// replaces the self reference with the actual model constructor
	fields.forEach(function(field) {
		if (field.type === 'self') {
			field.type = Constructor;
		}
	});

	let prototype = Object.create(Model.prototype);
	prototype.constructor = Constructor;
	Constructor.prototype = prototype;

	let staticProperties = {
		__fields__: fields,
		__name__: name,
		__model__: true
	};

	Object.keys(staticProperties).forEach(function(key) {
		Object.defineProperty(Constructor, key, {
			value: staticProperties[key],
			writable: false
		});
	});

	return Constructor;
};

Model.createField = function createField(name, config, Constructor) {
	if (!config) {
		throw new Error('Invalid field config', config);
	}

	if (config === 'self') {
		config = Constructor;
	}

	let type = typeof config;
	let field = config;

	// field is a constructor
	if (type === 'function') {
		field = {
			name,
			type: field
		};
	}

	if (typeof field.type !== 'function') {
		throw new Error('Invalid field type', field.type);
	}

	return field;
};

Model.applyChanges = function (object, name, value) {
	if (typeof name === 'object' && name) {
		Object.keys(name).forEach((key) => object[key] = name[key]);
	} else {
		object[name] = value;
	}
};

Model.applyConstructor = function (value, Constructor) {
	if (Constructor.__model__) {
		value = value !== null && new Constructor(value) || null;
	} else {
		value = value !== undefined && Constructor(value) || undefined;
	}
};

Model.fn = {
	setPersistent(name, value) {
		Model.applyChanges(this.data, name, value);
	},

	set(name, value) {
		if (!this.changed) {
			this.changed = {};
		}

		Model.applyChanges(this.changed, name, value);

		return this;
	},

	get(name) {
		return (this.changed && name in this.changed ? this.changed[name] : this.data[name]);
	},

	validate() {
		return {};
	},

	commit() {
		Model.applyChanges(this.data, this.changed);
		this.changed = false;
	},

	rollback() {
		this.changed = false;
	}
};

