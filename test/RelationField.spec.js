/* globals Field, RelationField, Model */

const fields = { id: Number };

class RelatedField extends RelationField {}
class RelatedModel extends Model.create(fields) {}

describe('RelationField', function() {
    let instance;

    beforeEach(function () {
        instance = new RelatedField({ type: RelatedModel });
    });

    it('should extend Field', function () {
        let instance = new RelationField({});
        expect(instance instanceof Field).toBe(true);
    });

    describe('#parse', function() {
        it('should return the model instance', function () {
            let model = new RelatedModel();

            expect(instance.parse(model)).toBe(model);
        });

        it('should return a new model instance', function () {
            let data = { id: 1 };

            let result = instance.parse(data);

            expect(result instanceof RelatedModel).toBe(true);
            expect(result.id).toBe(data.id);
        });

        it('should return null for primitive values', function () {
            expect(instance.parse(false)).toBe(null);
            expect(instance.parse(true)).toBe(null);
            expect(instance.parse('')).toBe(null);
            expect(instance.parse('foo')).toBe(null);
            expect(instance.parse(undefined)).toBe(null);
            expect(instance.parse(null)).toBe(null);
            expect(instance.parse(0)).toBe(null);
            expect(instance.parse(1)).toBe(null);
            expect(instance.parse()).toBe(null);
        });
    });

    describe('#serialize()', function() {
        it('should return a call of toJSON() on model instances', function () {
            let data = { id: 123 };
            let model = new RelatedModel(data);

            spyOn(model, 'toJSON').and.callThrough();

            expect(instance.serialize(model)).toEqual(data);
        });

        it('should return null', function () {
            expect(instance.serialize()).toBe(null);
            expect(instance.serialize(0)).toBe(null);
            expect(instance.serialize(1)).toBe(null);
            expect(instance.serialize(false)).toBe(null);
            expect(instance.serialize(true)).toBe(null);
            expect(instance.serialize(undefined)).toBe(null);
            expect(instance.serialize('foo')).toBe(null);
        });
    });
});

