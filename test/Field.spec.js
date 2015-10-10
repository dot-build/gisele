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
        it('should only return the value (default implementation)', function() {
            var field = new Field({});
            expect(field.parse('foo')).toBe('foo');
        });
    });

    describe('#parseValue(value)', function() {
        it('should parse and return a single value', function() {
            var field = new Field({});
            spyOn(field, 'parse');

            field.parseValue('foo');
            expect(field.parse).toHaveBeenCalledWith('foo');
        });

        it('should parse and return a list of values if the field is marked as array', function() {
            var field = new Field({
                isArray: true
            });

            spyOn(field, 'parseArray');
            field.parseValue(['foo']);

            expect(field.parseArray).toHaveBeenCalledWith(['foo']);
        });
    });

    describe('#parseArray(values)', function() {
        it('should parse each item in a list and return the mapped values', function() {
            var field = new Field({
                isArray: true
            });

            field.parse = String;
            expect(field.parseArray([1, 2])).toEqual(['1', '2']);
        });

        it('should return NULL for invalid values', function() {
            var field = new Field({
                isArray: true
            });

            field.parse = String;
            expect(field.parseArray(1)).toBe(null);
            expect(field.parseArray('1')).toBe(null);
            expect(field.parseArray({})).toBe(null);
            expect(field.parseArray(arguments)).toBe(null);
        });
    });

    describe('#serialize(value)', function() {
        it('should only return the value (default implementation)', function() {
            var field = new Field({});
            expect(field.serialize('foo')).toBe('foo');
        });
    });
});

describe('StringField', function() {
    describe('#parse(value)', function() {
        it('should cast the value to string', function() {
            var field = new StringField({});
            expect(field.parse(123)).toBe('123');
            expect(field.parse(false)).toBe('false');
            expect(field.parse('foo bar ')).toBe('foo bar');
            expect(field.parse(0)).toBe('0');
        });
    });

    describe('#serialize(value)', function() {
        it('should return a string if the value is primitive', function () {
            var field = new StringField({});
            expect(field.serialize(123)).toBe('123');
            expect(field.serialize(false)).toBe('false');
            expect(field.serialize('foo bar')).toBe('foo bar');
            expect(field.serialize(0)).toBe('0');
        });

        it('should return undefined for objects', function () {
            var field = new StringField({});
            expect(field.serialize({})).toBe(undefined);
            expect(field.serialize([])).toBe(undefined);
        });
    });
});

describe('BooleanField', function() {
    describe('#parse(value)', function() {
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
    describe('#parse(value)', function() {
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
    describe('#parse(value)', function() {
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

    describe('#serialize(Date date)', function() {
        it('should convert a date to ISO8601', function () {
            var field = new DateField({});
            var date = '2011-01-10T00:00:00.000Z';
            var dateObject = new Date('2011-01-10T00:00:00.000Z');

            expect(field.serialize(dateObject)).toBe(date);
        });
    });
});

describe('CustomField', function() {
    describe('#parse(value)', function() {
        it('should return null if the value is null and the field type is a Model', function() {
            var MyModel = Model.create({});
            var field = new CustomField({
                type: MyModel
            });

            expect(field.parse(null)).toBe(null);
        });
    });

    describe('#serialize(value)', function() {
        it('should call #toJSON() on value if its supported', function () {
            var value = {
                toJSON: function () {
                    return 5;
                }
            };

            var field = new CustomField({});
            var result = field.serialize(value);

            expect(result).toBe(5);
        });

        it('should return the value unchanged', function () {
            var value = {};

            var field = new CustomField({});
            var result = field.serialize(value);

            expect(result).toBe(value);
        });
    });
});
