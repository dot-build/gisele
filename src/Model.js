/* globals Field */

/**
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
        return this.constructor.__name__;
    }

    toJSON() {
        return Model.helpers.toJSON(this);
    }

    static new(config) {
        return Model.helpers.create(config);
    }

    static create(config) {
        return Model.helpers.create(config);
    }
}

/**
 * Model helpers
 * @static
 */
Model.helpers = {
    toJSON(model) {
        var sources = [model.$$.data, model.$$.changed || {}];
        var data = {};
        var result = {};

        sources.forEach(function mergeSource(source) {
            Object.keys(source).forEach(function copyProperty(key) {
                data[key] = source[key];
            });
        });

        function extractFields(field) {
            let name = field.name;
            let value;

            if (name in data) {
                value = Model.helpers.fieldToJSON(field, data[name]);
            }

            if (value !== undefined) {
                result[name] = value;
            }
        }

        Model.helpers.iterateFields(model, extractFields);

        return result;
    },

    fieldToJSON(field, value) {
        if (field.isArray && Array.isArray(value)) {
            return value.map(field.serialize, field);
        }

        return field.serialize(value);
    },

    isModel(value) {
        return value instanceof Model;
    },

    /**
     * Creates a new Model constructor using the given config
     * @param {Object} config       Model configuration
     *
     * Executes each construction step definedl on Model.constructors
     */
    create(config) {
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
            Model.helpers.initialize(this, Constructor);
            Model.helpers.applyDefaultValues(this, Constructor);
            Model.helpers.applyValues(this, data);
        };

        let fieldNames = Object.keys(fields);

        // normalized fields are instances of Field
        // with a name and a type
        let normalizedFields = fieldNames.map(function(key) {
            return Model.helpers.createField(key, fields[key], Constructor);
        });

        let constructionData = {
            name, fields: normalizedFields, customMethods
        };

        Model.constructors.forEach(function runConstructor(ctor) {
            ctor(Constructor, constructionData);
        });

        return Constructor;
    },

    /**
     * Defines a model property based on settings of a Field instance
     * Adds getter/setter to read/write on internal model objects
     *
     * @param {Object} model        Model instance
     * @param {Field} field         Field instance
     */
    defineProperty(model, field) {
        let name = field.name;
        let getter = function getter() {
            return model.$$.get(name);
        };

        let setter = Model.helpers.noop;

        if (!field.readOnly) {
            setter = function setter(value) {
                value = field.parseValue(value);
                model.$$.set(name, value);
            };
        }

        let descriptor = {
            enumerable: true,
            get: getter,
            set: setter
        };

        Object.defineProperty(model, name, descriptor);
    },

    /**
     * Initialize a model instance
     *
     * @param {Object} model            Model instance
     * @param {Function} Constructor    Constructor of instance (a Function created with Model.new)
     */
    initialize(model, Constructor) {
        let fields = Constructor.__fields__;

        fields.forEach(function initializeField(field) {
            Model.helpers.defineProperty(model, field);
        });

        Model.initializers.forEach(function runInitializer(initializer) {
            initializer(model, Constructor);
        });
    },

    noop() {},

    /**
     * Create and return a model field instance
     * @param {String} name             Field name
     * @param {Object} config           Field config
     * @param {Function} Constructor    The model constructor which will use this field
     */
    createField(name, config, Constructor) {
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

        // field is a constructor,
        // e.g.: { name: String }
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
    },

    /**
     * Apply a change to an object or a set of changes
     * @param {Object} object       The target object
     * @param {String|Object}       Property name, or an object with changes
     * @param {*} value             The value to apply (if name is a property)
     */
    applyChanges(object, name, value) {
        if (typeof name === 'object' && name) {
            Object.keys(name).forEach((key) => object[key] = name[key]);
        } else {
            object[name] = value;
        }
    },

    /**
     * Apply default values (defined on model fields) to model instance
     * @param {Object} model            Model instance
     * @param {Function} Constructor    Constructor of model instance
     */
    applyDefaultValues(model) {
        function setDefault(field) {
            if ('default' in field) {
                this.$$.setPersistent(field.name, field.default);
            }
        }

        Model.helpers.iterateFields(model, setDefault);
    },

    /**
     * Apply a set of values to a model instance
     * @param {Object} model            Model instance
     * @param {Function} Constructor    Constructor of model instance
     */
    applyValues(model, values) {
        if (!values || typeof values !== 'object') return;

        function setValue(field) {
            let name = field.name;

            if (name in values) {
                let value = field.parseValue(values[name]);
                this.$$.setPersistent(name, value);
            }
        }

        Model.helpers.iterateFields(model, setValue);
    },

    /**
     * Iterate over fields of a model instance calling the
     * iterator function with each field definition
     */
    iterateFields(model, iterator) {
        return model.constructor.__fields__.map(iterator, model);
    }
};

/**
 * Model initializers
 *
 * An array of functions called when a Model is instantiated. Each function
 * receives the model instance and the models' Constructor function
 */
Model.initializers = [];

Model.initializers.push(function setInternalMethods(model, Constructor) {
    let modelInternals = ModelMethods.create(Constructor);

    // Model methods
    Object.defineProperty(model, '$$', {
        enumerable: false,
        value: modelInternals
    });
});

Model.initializers.push(function addDirtyFlag(model) {
    // A virtual property that returns true if the model has any changes
    Object.defineProperty(model, '$$dirty', {
        enumerable: false,
        set: Model.helpers.noop,
        get: function getDirty() {
            return (model.$$.changed !== false);
        }
    });
});

/**
 * Model constructors
 *
 * An array of functions called to setup used to make a model's constructor.
 * Each function receives the Constructor and an object with data about the model,
 * namely the fields, the model name and the custom methods it may have.
 */
Model.constructors = [];

Model.constructors.push(function setupPrototype(Constructor) {
    let prototype = Object.create(Model.prototype);
    prototype.constructor = Constructor;
    Constructor.prototype = prototype;
});

Model.constructors.push(function defineStaticProperties(Constructor, data) {
    let {
        name, fields
    } = data;

    let staticProperties = {
        __fields__: fields,
        __name__: name
    };

    Object.keys(staticProperties).forEach(function addStatic(key) {
        Object.defineProperty(Constructor, key, {
            value: staticProperties[key],
            writable: false
        });
    });
});

Model.constructors.push(function addCustomMethods(Constructor, data) {
    let customMethods = data.customMethods;

    if (!customMethods) return;

    let fieldNames = data.fields.map((field) => field.name);
    let customMethodNames = Object.keys(customMethods);

    customMethodNames.forEach(function addCustomMethod(name) {
        if (fieldNames.indexOf(name) !== -1) {
            throw new Error(`Cannot override field ${name} with a custom method of same name`);
        }

        Constructor.prototype[name] = customMethods[name];
    });
});

class ModelMethods {
    setPersistent(name, value) {
        Model.helpers.applyChanges(this.data, name, value);
    }

    set(name, value) {
        if (!this.changed) {
            this.changed = {};
        }

        Model.helpers.applyChanges(this.changed, name, value);

        return this;
    }

    get(name) {
        return (this.changed && name in this.changed ? this.changed[name] : this.data[name]);
    }

    commit() {
        Model.helpers.applyChanges(this.data, this.changed);
        this.changed = false;
    }

    rollback() {
        this.changed = false;
    }
}

/**
 * Model.fn
 * Methods available on each model instance
 */
Model.fn = ModelMethods.prototype;
Model.fn.changed = false;

/**
 * Creates an instance of ModelMethods to use as a base object
 * for a model instance
 */
ModelMethods.create = function(Constructor) {
    var methods = new ModelMethods();

    methods.data = {};
    methods.Model = Constructor;

    return methods;
};
