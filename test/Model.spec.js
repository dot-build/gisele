describe('Model', function() {
	/* globals Model */
	function createModel() {
		return Model.create({
			name: 'Person',
			fields: {
				name: String,
				age: Number
			}
		});
	}

	/**
	 * Model::create(config)
	 *
	 * config: {
	 * 		name: 'ModelName',
	 * 		fields: {} or []
	 * }
	 *
	 * fields: {
	 * 		name: { type: String, maxlength: 255, required: true, pattern: '[a-z0-9-]' }
	 * 		age:  Number,
	 * 		birth: Date,
	 * 		relation: { type: OtherModel, collection: true }	// array of models
	 * 		circular: { type: 'self' }
	 * }
	 *
	 * fields: [
	 * 		name: { type: String, maxlength: 255, required: true, pattern: '[a-z0-9-]' }
	 * 		age:  { type: Number, min: 10, max: 50 }
	 * 		relation: { type: OtherModel }
	 * 		circular: { type: 'self' }
	 * ]
	 */
	describe('::create(config)', function() {
		it('should create a new model constructor from an array of fields', function() {
			var fields = [{
				name: 'model',
				type: 'self'
			}];

			var config = {
				name: 'MyModel',
				fields: fields
			};

			var MyModel = Model.create(config);

			expect(MyModel.__name__).toBe('MyModel');
			expect(Array.isArray(MyModel.__fields__)).toBe(true);
			expect(MyModel.__fields__[0]).toEqual({
				name: 'model',
				type: MyModel
			});
		});

		it('should create a new model constructor from a table of fields', function() {
			var fields = {
				model: 'self'
			};

			var config = {
				name: 'MyModel',
				fields: fields
			};

			var MyModel = Model.create(config);

			expect(MyModel.__name__).toBe('MyModel');

			expect(Array.isArray(MyModel.__fields__)).toBe(true);
			expect(MyModel.__fields__.length).toBe(1);
			expect(MyModel.__fields__[0]).toEqual({
				name: 'model',
				type: MyModel
			});
		});

		it('should subclass the base model', function() {
			var MyModel = createModel();
			var instance = new MyModel();
			expect(instance instanceof MyModel).toBe(true);
			expect(instance instanceof Model).toBe(true);
		});
	});

	describe('::defineProperty(name, field)', function() {
		it('should configure a model property', function() {
			var model = {};

			model.$$ = {
				set: jasmine.createSpy('setter'),
				get: jasmine.createSpy('getter')
			};

			Model.defineProperty(model, {
				name: 'foo',
				type: String
			});

			var foo = '_foo_';
			model.foo = foo;
			foo = model.foo;

			expect(model.$$.set).toHaveBeenCalledWith('foo', '_foo_');
			expect(model.$$.get).toHaveBeenCalledWith('foo');
		});
	});

	describe('::initialize(self, Constructor)', function() {
		it('should configure a model instance (properties and model methods)', function() {
			var self = {};

			var Ctor = function () {};
			Ctor.__fields__ = [];

			Model.initialize(self, Ctor);

			expect(typeof self.$$).toBe('object');
			expect(Object.getPrototypeOf(self.$$)).toBe(Model.fn);

			// check writable = false
			var invalidValue;
			self.$$ = {};
			expect(self.$$).not.toBe(invalidValue);

			// initial setup
			expect(self.$$.data).toEqual({});
			expect(self.$$.changed).toBe(false);
		});
	});

	describe('::createField(config)', function() {
		it('should throw an error if the config is not valid', function() {
			function test() {
				Model.createField('foo', null);
			}

			expect(test).toThrow(Error('Invalid field config'));
		});

		it('should throw an error if the type is not valid', function() {
			function test() {
				Model.createField('foo', { type: {} });
			}

			expect(test).toThrow(Error('Invalid field type'));
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

		it('should return a normalized field config for Boolean constructor', function() {
			var stringField = Model.createField('age', Boolean);
			expect(stringField).toEqual({
				name: 'age',
				type: Boolean
			});
		});

		it('should return a normalized field config for self model constructor', function() {
			function Constructor () {}

			var stringField = Model.createField('age', 'self', Constructor);
			expect(stringField).toEqual({
				name: 'age',
				type: Constructor
			});
		});
	});

	describe('Model.fn methods', function() {
		it('should handle model changes', function () {
			var data = {
				name: 'Paul'
			};

			var MyModel = createModel();
			var instance = new MyModel(data);

			// calls $$.set to apply changes on local object
			instance.name = 'New name';
			expect(instance.$$.changed.name).toBe('New name');

			// original model data is untouched
			expect(data.name).toBe('Paul');

			// reads from changed data
			expect(instance.name).toBe('New name');
			expect(instance.$$dirty).toBe(true);

			// apply the changes
			instance.$$.commit();

			// now the original data model is touched
			expect(instance.name).toBe('New name');
			expect(instance.$$dirty).toBe(false);

			instance.name = 'Other name';

			// new value saved again but not commited
			expect(instance.name).toBe('Other name');

			// revert the changes
			instance.$$.rollback();

			// previous value restored
			expect(instance.name).toBe('New name');
		});
	});

	/*
	describe('#__validate__()', function() {
		it('should return a map of validation errors (empty on abstract model)', function() {
			var model = new Model();
			expect(model.__validate__()).toEqual({});
		});
	});*/

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
			var time = t1 - t0;

			expect(time).toBeLessThan(20);
			console.log('Construction of 1000 models took ' + time + ' milliseconds.');
		});
	});

	/*describe('relationships', function() {
		it('should handle a relationship between models', function() {
			var Person = Model.create({
				name: 'Person',
				fields: {
					name: String,
					age: Number,
					dateOfBirth: Date,
					father: 'self',
					mother: {
						type: 'self',
						default: null
					}
				}
			});

			var john = {
				name: 'John Doe',
				age: 30
			};

			var foo = new Person(john);
			// console.log(foo);

			var jane = {
				name: 'Jane Doe',
				age: 27
			};

			var jack = new Person({
				name: 'Jack Doe',
				age: 8,
				dateOfBirth: '2001-12-16T03:15:00',
				father: john,
				// mother: jane
			});

			console.log(jack);
		});
	});*/
});
