/* globals Field */
/**
 * @class Model
 *
 * Model layout:
 *
 *      model = {
 *          $$: {}                  // model methods (instance of ModelMethods class)
 *          $$dirty: Boolean        // true if the model has changes to save
 *
 *          // ... properties and custom methods
 *      }
 */
class Model {
    toString() {
        return this.$$model.__name__;
    }

    toJSON() {
        return Model.toJSON(this);
    }
}

Model.toJSON = function(model) {
    var sources = [model.$$.data, model.$$.changed || {}];
    var data = {};
    var result = {};

    sources.forEach(function(source) {
        Object.keys(source).forEach(function(key) {
            data[key] = source[key];
        });
    });

    function extractFields(field) {
        let name = field.name;
        let value;

        if (name in data) {
            value = Model.fieldToJSON(field, data[name]);
        }

        if (value !== undefined) {
            result[name] = value;
        }
    }

    Model.iterateFields(model, extractFields);

    return result;
};

Model.fieldToJSON = function(field, value) {
    if (field.isArray) {
        return value.map(field.toJSON);
    }

    return field.toJSON(value);
};

Model.isModel = function(value) {
    return value instanceof Model;
};

/**
 * Creates a new Model constructor using the given config
 * @param {Object} config       Model configuration
 */
Model.create = function createModel(config) {
    if (typeof config !== 'object') {
        throw new Error('Invalid model configuration');
    }

    var name, fields, customMethods;

    if (config.fields) {
        name = config.name || 'Model';
        fields = config.fields || {};
        customMethods = config.methods;
    } else {
        name = 'Model';
        fields = config;
    }

    let Constructor = function Gisele(data) {
        Model.initialize(this, Constructor);
        Model.applyDefaultValues(this, Constructor);
        Model.applyValues(this, data);
    };

    let fieldNames = Object.keys(fields);

    // object format: { fieldName: 'self', otherField: String ... }
    fields = fieldNames.map(function(key) {
        return Model.createField(key, fields[key], Constructor);
    });

    let prototype = Object.create(Model.prototype);
    prototype.constructor = Constructor;
    Constructor.prototype = prototype;

    let staticProperties = {
        __fields__: fields,
        __name__: name
    };

    Object.keys(staticProperties).forEach(function(key) {
        Object.defineProperty(Constructor, key, {
            value: staticProperties[key],
            writable: false
        });
    });

    if (customMethods) {
        Object.keys(customMethods).forEach(function(name) {
            if (fieldNames.indexOf(name) !== -1) {
                throw new Error(`Cannot override field ${name} with a custom method of same name`);
            }

            Constructor.prototype[name] = customMethods[name];
        });
    }

    return Constructor;
};

/**
 * Defines a model property based on settings of a Field instance
 * Adds getter/setter to read/write on internal model object
 *
 * @param {Object} model        Model instance
 * @param {Field} field         Field instance
 */
Model.defineProperty = function defineProperty(model, field) {
    let name = field.name;
    let getter = function() {
        return model.$$.get(name);
    };

    let setter = Model.noop;

    if (!field.readOnly) {
        setter = function setter(value) {
            value = field.parse(value);
            model.$$.set(name, value);
        };
    }

    let descriptor = {
        enumerable: true,
        get: getter,
        set: setter
    };

    Object.defineProperty(model, name, descriptor);
};

/**
 * Initialize a model instance
 *
 * @param {Object} model            Model instance
 * @param {Function} Constructor    Constructor of instance (a Function created with Model.create)
 */
Model.initialize = function(model, Constructor) {
    let fields = Constructor.__fields__;

    fields.forEach(function(field) {
        Model.defineProperty(model, field);
    });

    var modelInternals = ModelMethods.create(Constructor);

    // Model methods
    Object.defineProperty(model, '$$', {
        enumerable: false,
        value: modelInternals
    });

    // Virtual property. Returns true if the model has any changes
    Object.defineProperty(model, '$$dirty', {
        enumerable: false,
        set: Model.noop,
        get: function() {
            return (model.$$.changed !== false);
        }
    });

    Object.defineProperty(model, '$$model', {
        enumerable: false,
        writable: false,
        value: Constructor
    });
};

Model.noop = function noop() {};

/**
 * Create and return a model field instance
 * @param {String} name             Field name
 * @param {Object} config           Field config
 * @param {Function} Constructor    The model constructor which will use this field
 */
Model.createField = function createField(name, config, Constructor) {
    if (!config) {
        throw new Error('Invalid field config', config);
    }

    // replace the 'self' reference with the actual model Constructor
    if (config === 'self') {
        config = Constructor;
    } else if (config.type === 'self') {
        config.type = Constructor;
    }

    let type = typeof config;
    let field = config;

    // field is a constructor
    if (type === 'function') {
        field = {
            type: field
        };
    }

    if (!field.name) {
        field.name = name;
    }

    if (typeof field.type !== 'function') {
        throw new Error('Invalid field type', field.type);
    }

    return Field.create(field);
};

/**
 * Apply a change to an object or a set of changes
 * @param {Object} object       The target object
 * @param {String|Object}       Property name, or an object with changes
 * @param {*} value             The value to apply (if name is a property)
 */
Model.applyChanges = function(object, name, value) {
    if (typeof name === 'object' && name) {
        Object.keys(name).forEach((key) => object[key] = name[key]);
    } else {
        object[name] = value;
    }
};

/**
 * Apply default values (defined on model fields) to model instance
 * @param {Object} model            Model instance
 * @param {Function} Constructor    Constructor of model instance
 */
Model.applyDefaultValues = function(model) {
    function setDefault(field) {
        if ('default' in field) {
            this.$$.setPersistent(field.name, field.default);
        }
    }

    Model.iterateFields(model, setDefault);
};

/**
 * Apply a set of values to a model instance
 * @param {Object} model            Model instance
 * @param {Function} Constructor    Constructor of model instance
 */
Model.applyValues = function(model, values) {
    if (!values || typeof values !== 'object') return;

    function setValue(field) {
        let name = field.name;

        if (name in values) {
            let value = field.parse(values[name]);
            this.$$.setPersistent(name, value);
        }
    }

    Model.iterateFields(model, setValue);
};

Model.iterateFields = function(model, iterator) {
    model.$$model.__fields__.forEach(iterator, model);
};

class ModelMethods {
    setPersistent(name, value) {
        Model.applyChanges(this.data, name, value);
    }

    set(name, value) {
        if (!this.changed) {
            this.changed = {};
        }

        Model.applyChanges(this.changed, name, value);

        return this;
    }

    get(name) {
        return (this.changed && name in this.changed ? this.changed[name] : this.data[name]);
    }

    commit() {
        Model.applyChanges(this.data, this.changed);
        this.changed = false;
    }

    rollback() {
        this.changed = false;
    }
}

/**
 * Creates an instance of ModelMethods to use as a base object
 * for a model instance
 */
ModelMethods.create = function() {
    var methods = new ModelMethods();

    methods.data = {};
    methods.changed = false;

    return methods;
};

/**
 * Model.fn
 * Methods available on each model instance
 */
Model.fn = ModelMethods.prototype;
