/**
 * Model Field
 */
class Field {
    constructor(config) {
        if (!config) {
            throw new Error('Invalid field config');
        }

        Object.keys(config).forEach((key) => this[key] = config[key]);
    }

    parseValue(value) {
        if (this.isArray) {
            return this.parseArray(value);
        }

        return this.parse(value);
    }

    parseArray(value) {
        if (!Array.isArray(value)) {
            return null;
        }

        return value.map(this.parse, this);
    }

    parse(value) {
        return value;
    }

    serialize(value) {
        return value;
    }

    static create(config) {
        let type = config.type;
        let FieldConstructor = Field.registry.get(type) || GenericField;

        return new FieldConstructor(config);
    }
}

Field.registry = new Map();

class StringField extends Field {
    parse(value) {
        return String(value !== undefined ? value : '').trim();
    }

    serialize(value) {
        return typeof value !== 'object' ? String(value) : undefined;
    }
}

class BooleanField extends Field {
    parse(value) {
        return !!value;
    }
}

class NumberField extends Field {
    parse(value) {
        return value && Number(value) || 0;
    }
}

class DateField extends Field {
    parse(value) {
        if (isFinite(value)) {
            return new Date(value);
        }

        if (typeof value === 'string') {
            let parsedTime = Date.parse(value);

            if (!isFinite(parsedTime)) return null;

            return new Date(parsedTime);
        }

        return null;
    }

    serialize(value) {
        return value instanceof Date ? value.toJSON() : undefined;
    }
}

class GenericField extends Field {
    parse(value) {
        return value !== null ? new this.type(value) : null;
    }

    serialize(value) {
        if (value && typeof value.toJSON === 'function') {
            return value.toJSON();
        }

        return value;
    }
}

Field.add = Field.registry.set.bind(Field.registry);
Field.get = Field.registry.get.bind(Field.registry);

/**
 * Default constructor/field for primitive values
 */
Field.registry.set(String, StringField);
Field.registry.set(Number, NumberField);
Field.registry.set(Boolean, BooleanField);
Field.registry.set(Date, DateField);

Field.Generic = GenericField;
