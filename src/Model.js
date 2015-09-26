class Model {
	__validate__() {
		return {};
	}

	__define__(field) {
		let getter = () => this.__get__(field.name);
		let setter = (value) => this.__set__(field.name, value);

		let descriptor = {
			enumerable: true,
			get: getter,
			set: setter
		};

		Object.defineProperty(this, field.name, descriptor);

		if ('default' in field) {
			setter(field.name, field.default);
		}
	}

	__init__(data) {
		let defineField = (field) => this.__define__(field);

		this.__ = {};
		this.$$ = data;
		this.__fields__.forEach(defineField);
		this.__set__(data);
	}

	__set__(name, value) {
		if (arguments.length === 1) {
			Object.keys(name || {}).forEach((key) => this.__[key] = name[key]);
		}

		if (arguments.length === 2) {
			this.__[name] = value;
		}

		return this;
	}

	__get__(name) {
		return this.__[name];
	}

	__commit__() {
		this.__fields__.forEach((field) => this.$$[field.name] = this.__[field.name]);
	}

	__rollback__() {
		this.__fields__.forEach((field) => this.__[field.name] = this.$$[field.name]);
	}
}

Model.create = function createModel(config) {
	let name = config.name || 'Model';
	let fields = config.fields || [];
	let Constructor = Model.createConstructor(name);

	if (Array.isArray(fields)) {
		fields = fields.reduce(function(map, item) {
			map[item.name] = item;
			return map;
		}, {});
	}

	fields = Object.keys(fields).map(function(name) {
		let field = Model.createField(name, fields[name]);

		if (field.type === 'self') {
			field.type = Constructor;
		}

		return field;
	});

	let prototype = Object.create(Model.prototype);
	Constructor.prototype = prototype;
	Constructor.prototype.constructor = Constructor;
	Constructor.prototype.__fields__ = fields;
	Constructor.fields = fields;

	return Constructor;
};

Model.createField = function createField(name, config) {
	if (!config) {
		throw new Error('Invalid field config', config);
	}

	let type = typeof config;
	let field = config;

	// field is a constructor or a reference to the model itself (circular reference)
	if (type === 'function' || config === 'self') {
		field = {
			name,
			type: field
		};
	}

	return field;
};

const MODEL_CONSTRUCTOR = `return function %%(data){
	if (this instanceof %% === false) {
		return new %%(data);
	}

	this.__init__(data);
}`;

Model.createConstructor = function makeNamedFunction(name) {
	/* jshint evil: true */
	let code = MODEL_CONSTRUCTOR.replace(/%%/g, name);
	let fn = new Function(code);

	return fn();
};
