describe('Model', function() {
	function createModel() {
		return Model.create({
			name: 'Person',
			fields: {
				name: String,
				age: Number
			}
		});
	}
	/* globals Model */
	/**
	 * Model::create(config)
	 *
	 * config: {
	 * 		fields: {}
	 * }
	 *
	 *
	 * fields: {
	 * 		name: { type: String, maxlength: 255, required: true, pattern: '[a-z0-9-]' }
	 * 		age:  { type: Number, min: 10, max: 50 }
	 * 		relation: { type: OtherModel, collection: true }
	 * 		circular: { type: 'self' }
	 * 	}
	 */
	describe('::create(config)', function() {
		it('should create a new model constructor that subclasses the Model base class' +
			'from an array of fields',
			function() {
				var fields = [{
					name: 'model',
					type: 'self'
				}];

				var config = {
					name: 'MyModel',
					fields: fields
				};

				var MyModel = Model.create(config);

				expect(Array.isArray(MyModel.fields)).toBe(true);
				expect(MyModel.fields.length).toBe(1);

				expect(MyModel.fields[0].type).toBe(MyModel);
			});

		it('should create a new model constructor that subclasses the Model base class' +
			'from a table of fields',
			function() {
				var fields = {
					model: 'self'
				};

				var config = {
					name: 'MyModel',
					fields: fields
				};

				var MyModel = Model.create(config);

				expect(Array.isArray(MyModel.fields)).toBe(true);
				expect(MyModel.fields.length).toBe(1);

				expect(MyModel.fields[0].type).toBe(MyModel);

				var instance = new MyModel();
				expect(instance instanceof MyModel).toBe(true);
			});
	});

	describe('::createField(config)', function() {
		it('should throw an error if the config is not valid', function() {
			function test() {
				Model.createField(null);
			}

			expect(test).toThrow('Invalid field config');
		});

		it('should return a normalized field config for String constructor', function() {
			var stringField = Model.createField('name', String);
			expect(stringField).toEqual({
				name: 'name',
				type: String
			});
		});

		it('should return a normalized field config for Number constructor', function() {
			var stringField = Model.createField('age', Number);
			expect(stringField).toEqual({
				name: 'age',
				type: Number
			});
		});
	});

	describe('#__validate__()', function() {
		it('should return a map of validation errors (empty on abstract model)', function() {
			var model = new Model();
			expect(model.__validate__()).toEqual({});
		});
	});

	describe('#__init__(data)', function() {
		it('should initialize the model instance and apply the data to instance', function() {
			var data = {
				age: 30
			};

			var Person = createModel();
			var instance = new Person(data);
			expect(instance.__.age).toBe(data.age);
		});
	});

	describe('#__set__(data)', function() {
		it('should update a model property', function() {
			var Person = createModel();
			var instance = new Person();
			instance.__set__('name', 'John');

			expect(instance.__.name).toBe('John');
		});

		it('should update several model properties', function() {
			var Person = createModel();
			var instance = new Person();
			instance.__set__({
				'name': 'John'
			});

			expect(instance.__.name).toBe('John');
		});
	});

	describe('#__get__(name)', function() {
		it('should return a property value', function() {
			var Person = createModel();
			var instance = new Person();
			instance.__set__({
				'name': 'John'
			});

			expect(instance.__get__('name')).toBe('John');
		});
	});

	describe('__commit__', function() {
		it('should apply the changes from __ to $$', function () {
			var data = {
				name: 'John'
			};

			var Person = createModel();
			var instance = new Person(data);

			instance.name = 'James';

			expect(instance.$$.name).toBe('John');

			instance.__commit__();
			expect(instance.$$.name).toBe('James');
		});
	});

	describe('__rollback__', function() {
		it('should copy the values from $$ to __', function () {
			var data = {
				name: 'John'
			};

			var Person = createModel();
			var instance = new Person(data);

			expect(instance.__.name).toBe('John');
			instance.name = 'James';

			instance.__rollback__();
			expect(instance.$$.name).toBe('John');
		});
	});

	describe('getter and setter setup', function() {
		it('should read/write to __ property when a known field is changed', function() {
			var Person = createModel();
			var instance = new Person();
			instance.name = 'James';
			instance.__.age = 22;

			expect(instance.__.name).toBe('James');
			expect(instance.age).toBe(22);
		});
	});

	describe('performance', function() {
		it('should be fast', function() {
			var data = {
				name: 'John',
				age: 30
			};

			var list = new Array(1000);
			var i = 1000;
			var Person = createModel();

			var t0 = Date.now();

			while (i--) {
				list[i] = new Person(data);
			}

			var t1 = Date.now();
			console.log('Construction of 1000 models took ' + (t1 - t0) + ' milliseconds.');
		});
	});

	describe('relationship between models', function() {
		it('should handle a relationship between models', function () {
			var Person = Model.create({
				name: 'Person',
				fields: {
					name: String,
					age: Number,
					dateOfBirth: Date,
					father: 'self',
					mother: 'self'
				}
			});

			var john = new Person({
				name: 'John Doe',
				age: 30
			});

			var jane = new Person({
				name: 'Jane Doe',
				age: 27
			});

			var jack = new Person({
				name: 'Jack Doe'
				age: 8,
				dateOfBirth: '2001-12-16T03:15:00',
				father: john,
				mother: jane
			});

			console.log(jack);
		});
	});
});
