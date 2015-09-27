describe('Field', function() {
	describe('#constructor(config)', function() {
		it('should throw an error if the config is invalid', function () {
			function test () {
				new Field();
			}

			expect(test).toThrow();
		});

		it('should initialize the field instance', function () {
			var config = {
				name: 'foo',
				type: String,
				default: 123,
				foo: 'bar'
			};

			var field = new Field(config);

			expect(field.name).toBe(config.name);
			expect(field.type).toBe(config.type);
			expect(field.default).toBe(123);
			expect(field.foo).toBe('bar');
		});
	});

	describe('#parse(value)', function() {
		it('should only return the value (default implementation)', function () {
			var field = new Field({});
			expect(field.parse('foo')).toBe('foo');
		});
	});
});

describe('StringField', function() {
	describe('#parse(value)', function () {
		it('should cast the value to string', function () {
			var field = new StringField({});
			expect(field.parse(123)).toBe('123');
			expect(field.parse(false)).toBe('false');
			expect(field.parse('foo bar ')).toBe('foo bar');
			expect(field.parse(0)).toBe('0');
		});
	});
});

describe('BooleanField', function() {
	describe('#parse(value)', function () {
		it('should cast the value to boolean', function () {
			var field = new BooleanField({});
			expect(field.parse(123)).toBe(true);
			expect(field.parse(false)).toBe(false);
			expect(field.parse('foo bar')).toBe(true);
			expect(field.parse(0)).toBe(false);
		});
	});
});

describe('NumberField', function() {
	describe('#parse(value)', function () {
		it('should cast the value to boolean', function () {
			var field = new NumberField({});
			expect(field.parse(123)).toBe(123);
			expect(field.parse(false)).toBe(0);
			expect(field.parse('123')).toBe(123);
			expect(field.parse('foo')).toBe(0);
		});
	});
});

describe('DateField', function() {
	describe('#parse(value)', function () {
		it('should cast the value to boolean', function () {
			var field = new DateField({});
			var validDate = new Date(Date.parse('2011-01-10T00:00:00.000Z'));
			var validTimestamp = new Date(1e7);

			expect(field.parse('2011-01-10T00:00:00.000Z')).toEqual(validDate);
			expect(field.parse(1e7)).toEqual(validTimestamp);
			expect(field.parse('invalid')).toBe(null);
			expect(field.parse({})).toBe(null);
		});
	});
});

describe('CustomField', function() {
	describe('#parse(value)', function () {
		it('should return null if the value is null and the field type is a Model', function () {
			var MyModel = Model.create({});
			var field = new CustomField({ type: MyModel });

			expect(field.parse(null)).toBe(null);
		});
	});
});
