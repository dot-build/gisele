/* globals Field */

class RelationField extends Field {
    parse(value) {
        const Model = this.type;

        if (!value || typeof value !== 'object') {
            return null;
        }

        if (value instanceof Model) {
            return value;
        }

        return new Model(value);
    }

    serialize(data) {
        if (data && data instanceof this.type) {
            return data.toJSON();
        }

        return null;
    }
}