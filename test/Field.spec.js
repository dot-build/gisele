/* globals Field, CustomField, StringField, BooleanField, NumberField, DateField, Model */
describe('Field', function() {
    describe('#constructor(config)', function() {
        it('should throw an error if the config is invalid', function() {
            function test() {
                new Field();
            }

            expect(test).toThrow();
        });

        it('should initialize the field instance', function() {
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
        it('should parse and return a single value', function() {
            var field = new Field({});
            spyOn(field, 'parseValue');

            field.parse('foo');
            expect(field.parseValue).toHaveBeenCalledWith('foo');
        });

        it('should parse and return a list of values if the field is marked as array', function() {
            var field = new Field({
                isArray: true
            });

            spyOn(field, 'parseArray');
            field.parse(['foo']);

            expect(field.parseArray).toHaveBeenCalledWith(['foo']);
        });
    });

    describe('#parseValue(value)', function() {
        it('should only return the value (default implementation)', function() {
            var field = new Field({});
            expect(field.parse('foo')).toBe('foo');
        });
    });

    describe('#parseArray(values)', function() {
        it('should parse each item in a list and return the mapped values', function() {
            var field = new Field({
                isArray: true
            });

            field.parseValue = String;
            expect(field.parseArray([1, 2])).toEqual(['1', '2']);
        });

        it('should return NULL for invalid values', function() {
            var field = new Field({
                isArray: true
            });

            field.parseValue = String;
            expect(field.parseArray(1)).toBe(null);
            expect(field.parseArray('1')).toBe(null);
            expect(field.parseArray({})).toBe(null);
            expect(field.parseArray(arguments)).toBe(null);
        });
    });

    describe('#toJSON(value)', function() {
        it('should only return the value (default implementation)', function() {
            var field = new Field({});
            expect(field.toJSON('foo')).toBe('foo');
        });
    });
});

describe('StringField', function() {
    describe('#parseValue(value)', function() {
        it('should cast the value to string', function() {
            var field = new StringField({});
            expect(field.parse(123)).toBe('123');
            expect(field.parse(false)).toBe('false');
            expect(field.parse('foo bar ')).toBe('foo bar');
            expect(field.parse(0)).toBe('0');
        });
    });
});

describe('BooleanField', function() {
    describe('#parseValue(value)', function() {
        it('should cast the value to boolean', function() {
            var field = new BooleanField({});
            expect(field.parse(123)).toBe(true);
            expect(field.parse(false)).toBe(false);
            expect(field.parse('foo bar')).toBe(true);
            expect(field.parse(0)).toBe(false);
        });
    });
});

describe('NumberField', function() {
    describe('#parseValue(value)', function() {
        it('should cast the value to boolean', function() {
            var field = new NumberField({});
            expect(field.parse(123)).toBe(123);
            expect(field.parse(false)).toBe(0);
            expect(field.parse('123')).toBe(123);
            expect(field.parse('foo')).toBe(0);
        });
    });
});

describe('DateField', function() {
    describe('#parseValue(value)', function() {
        it('should cast the value to boolean', function() {
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
    describe('#parseValue(value)', function() {
        it('should return null if the value is null and the field type is a Model', function() {
            var MyModel = Model.create({});
            var field = new CustomField({
                type: MyModel
            });

            expect(field.parse(null)).toBe(null);
        });
    });
});
