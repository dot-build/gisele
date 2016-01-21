describe('Model.helpers', function() {
    /* globals Model, ModelMethods, Field */
    describe('::defineProperty(name, field)', function() {
        it('should configure a model property', function() {
            var model = {};

            model.$$ = {
                set: jasmine.createSpy('setter'),
                get: jasmine.createSpy('getter')
            };

            var field = Field.create({
                name: 'foo',
                type: String
            });

            Model.helpers.defineProperty(model, field);

            var foo = '_foo_';
            model.foo = foo;
            foo = model.foo;

            expect(model.$$.set).toHaveBeenCalledWith('foo', '_foo_');
            expect(model.$$.get).toHaveBeenCalledWith('foo');
        });

        it('should NOT allow to write a readOnly field', function() {
            var model = {};

            model.$$ = {
                set: jasmine.createSpy('setter'),
                get: jasmine.createSpy('getter')
            };

            var field = Field.create({
                name: 'foo',
                type: String,
                readOnly: true
            });

            Model.helpers.defineProperty(model, field);
            model.foo = 'foo';

            expect(model.$$.set).not.toHaveBeenCalled();
        });
    });

    describe('::initialize(self, Constructor)', function() {
        it('should configure a model instance (properties and model methods)', function() {
            var self = {};

            var Ctor = function DummyConstructor() {};
            Ctor.__fields__ = [];

            Model.helpers.initialize(self, Ctor);

            expect(self.$$ instanceof ModelMethods).toBe(true);

            // check writable = false
            var invalidValue = {};
            try {
                self.$$ = invalidValue;
            } catch (e) {}

            expect(self.$$).not.toBe(invalidValue);

            // initial setup
            expect(self.$$.data).toEqual({});
            expect(self.$$.changed).toBe(false);
            expect(self.$$.Model).toBe(Ctor);
        });
    });

    describe('::createField(config)', function() {
        it('should throw an error if the config is not valid', function() {
            function test() {
                Model.helpers.createField('foo', null);
            }

            expect(test).toThrow(Error('Invalid field config'));
        });

        it('should throw an error if the type is not valid', function() {
            function test() {
                Model.helpers.createField('foo', {
                    type: {}
                });
            }

            expect(test).toThrow(Error('Invalid field type'));
        });

        it('should replace a circular reference with the model constructor', function() {
            function Constructor() {}

            var field = Model.helpers.createField('test', 'self', Constructor);

            expect(field instanceof Field).toBe(true);
            expect(field.type).toBe(Constructor);

            field = Model.helpers.createField('test', {
                type: 'self'
            }, Constructor);

            expect(field instanceof Field).toBe(true);
            expect(field.type).toBe(Constructor);
        });

        it('should return an instance of Field', function() {
            function Constructor() {}

            var customField = Model.helpers.createField('age', 'self', Constructor);
            expect(customField.name).toBe('age');
            expect(customField.type).toBe(Constructor);
        });
    });

    describe('::applyValues(model, Constructor, data)', function() {
        it('should apply a set of values to a model instance using the field constructors', function() {
            var Person = Model.new({
                name: 'Person',
                fields: {
                    name: String,
                    age: Number
                }
            });

            var TestModel = Model.new({
                fields: {
                    string: String,
                    number: Number,
                    bool: Boolean,
                    self: 'self',
                    person: Person
                }
            });

            var dataStructure = {
                string: 'foo',
                number: '123',
                bool: 1,
                self: null,
                ignore: 'this',
                person: {
                    name: 'John',
                    age: 30
                }
            };

            var instance = new TestModel(dataStructure);

            expect(instance.string).toBe('foo');
            expect(instance.number).toBe(123);
            expect(instance.bool).toBe(true);
            expect(instance.self).toBe(null);
            expect(instance.ignore).toBe(undefined);

            expect(instance.person instanceof Person).toBe(true);
            expect(instance.person.name).toBe('John');
            expect(instance.person.age).toBe(30);
        });
    });
});
