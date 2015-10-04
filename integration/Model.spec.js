/* globals Model, Field */
describe('Model', function() {
    class Point {
        constructor(pair = [0, 0]) {
            [this.x, this.y] = pair;
        }
    }

    class PointField extends Field {
        parse(value) {
            return value && Array.isArray(value) && value.length === 2 ?
                new Point(value) : null;
        }

        serialize(value) {
            return value ? [value.x, value.y] : null;
        }
    }

    Field.register.set(Point, PointField);

    it('should handle primitive values', function() {
        var Primitive = Model.create({
            string: String,
            bool: Boolean,
            number: Number,
            date: Date,
        });

        var now = Date.now();

        var instance = new Primitive({
            string: 123,
            bool: 1,
            number: '-1',
            date: now
        });

        expect(instance.string).toBe('123');
        expect(instance.bool).toBe(true);
        expect(instance.number).toBe(-1);
        expect(instance.date).toEqual(new Date(now));
    });

    it('should handle custom fields', function() {
        var Points = Model.create({
            one: Point,
            two: Point
        });

        var data = {
            one: [1, 1],
            two: [2, 2]
        };

        var instance = new Points(data);

        expect(instance.one instanceof Point).toBe(true);
        expect(instance.two instanceof Point).toBe(true);

        var json = instance.toJSON();
        expect(json).toEqual({
            one: [1, 1],
            two: [2, 2]
        });
    });

    it('should allow to build an instance with values on read-only fields, but not allow to change them', function() {
        var User = Model.create({
            id: {
                type: Number,
                readOnly: true
            },
            name: String
        });

        var bob = new User({
            id: 1,
            name: 'Bob'
        });

        bob.id = 2;

        expect(bob.id).toBe(1);
    });

    it('should allow instance methods to access properties', function() {
        var Rectangle = Model.create({
            fields: {
                topLeft: Point,
                bottomRight: Point
            },

            methods: {
                area() {
                    let start = this.topLeft;
                    let end = this.bottomRight;

                    let width = end.x - start.x;
                    let height = end.y - start.y;

                    return width * height;
                }
            }
        });

        var rect = new Rectangle({
            topLeft: [10, 10],
            bottomRight: [15, 15]
        });

        expect(rect.area()).toBe(25);
    });

    it('should allow arrays as field values', function() {
        var Rectangle = Model.create({
            fields: {
                points: {
                    type: Point,
                    isArray: true
                }
            },

            methods: {
                area() {
                    let start = this.points[0];
                    let end = this.points[1];

                    let width = end.x - start.x;
                    let height = end.y - start.y;

                    return width * height;
                }
            }
        });

        var data = {
            points: [
                [10, 10],
                [15, 15]
            ]
        };

        var rect = new Rectangle(data);

        expect(rect.area()).toBe(25);
        expect(rect.toJSON()).toEqual(data);
    });
});
