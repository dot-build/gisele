(function(global) {

	'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Model = function () {
    function Model() {
        _classCallCheck(this, Model);
    }

    _createClass(Model, [{
        key: 'toString',
        value: function toString() {
            return this.constructor.__name__;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return Model.helpers.toJSON(this);
        }
    }], [{
        key: 'new',
        value: function _new(config) {
            return Model.helpers.create(config);
        }
    }, {
        key: 'create',
        value: function create(config) {
            return Model.helpers.create(config);
        }
    }]);

    return Model;
}();

/**
 * Model helpers
 * @static
 */

Model.helpers = {
    toJSON: function toJSON(model) {
        var sources = [model.$$.data, model.$$.changed || {}];
        var data = {};
        var result = {};

        sources.forEach(function mergeSource(source) {
            Object.keys(source).forEach(function copyProperty(key) {
                data[key] = source[key];
            });
        });

        function extractFields(field) {
            var name = field.name;
            var value = undefined;

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
    fieldToJSON: function fieldToJSON(field, value) {
        if (field.isArray && Array.isArray(value)) {
            return value.map(field.serialize, field);
        }

        return field.serialize(value);
    },
    isModel: function isModel(value) {
        return value instanceof Model;
    },

    /**
     * Creates a new Model constructor using the given config
     * @param {Object} config       Model configuration
     *
     * Executes each construction step definedl on Model.constructors
     */
    create: function create(config) {
        if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
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

        var Constructor = function Gisele(data) {
            Model.helpers.initialize(this, Constructor);
            Model.helpers.applyDefaultValues(this, Constructor);
            Model.helpers.applyValues(this, data);
        };

        var fieldNames = Object.keys(fields);

        // normalized fields are instances of Field
        // with a name and a type
        var normalizedFields = fieldNames.map(function (key) {
            return Model.helpers.createField(key, fields[key], Constructor);
        });

        var constructionData = {
            name: name, fields: normalizedFields, customMethods: customMethods
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
    defineProperty: function defineProperty(model, field) {
        var name = field.name;
        var getter = function getter() {
            return model.$$.get(name);
        };

        var setter = Model.helpers.noop;

        if (!field.readOnly) {
            setter = function setter(value) {
                value = field.parseValue(value);
                model.$$.set(name, value);
            };
        }

        var descriptor = {
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
    initialize: function initialize(model, Constructor) {
        var fields = Constructor.__fields__;

        fields.forEach(function initializeField(field) {
            Model.helpers.defineProperty(model, field);
        });

        Model.initializers.forEach(function runInitializer(initializer) {
            initializer(model, Constructor);
        });
    },
    noop: function noop() {},

    /**
     * Create and return a model field instance
     * @param {String} name             Field name
     * @param {Object} config           Field config
     * @param {Function} Constructor    The model constructor which will use this field
     */
    createField: function createField(name, config, Constructor) {
        if (!config) {
            throw new Error('Invalid field config', config);
        }

        // replace the 'self' reference with the actual model Constructor
        if (config === 'self') {
            config = Constructor;
        } else if (config.type === 'self') {
            config.type = Constructor;
        }

        var type = typeof config === 'undefined' ? 'undefined' : _typeof(config);
        var field = config;

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
    applyChanges: function applyChanges(object, name, value) {
        if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object' && name) {
            Object.keys(name).forEach(function (key) {
                return object[key] = name[key];
            });
        } else {
            object[name] = value;
        }
    },

    /**
     * Apply default values (defined on model fields) to model instance
     * @param {Object} model            Model instance
     * @param {Function} Constructor    Constructor of model instance
     */
    applyDefaultValues: function applyDefaultValues(model) {
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
    applyValues: function applyValues(model, values) {
        if (!values || (typeof values === 'undefined' ? 'undefined' : _typeof(values)) !== 'object') return;

        function setValue(field) {
            var name = field.name;

            if (name in values) {
                var value = field.parseValue(values[name]);
                this.$$.setPersistent(name, value);
            }
        }

        Model.helpers.iterateFields(model, setValue);
    },

    /**
     * Iterate over fields of a model instance calling the
     * iterator function with each field definition
     */
    iterateFields: function iterateFields(model, iterator) {
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
    var modelInternals = ModelMethods.create(Constructor);

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
            return model.$$.changed !== false;
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
    var prototype = Object.create(Model.prototype);
    prototype.constructor = Constructor;
    Constructor.prototype = prototype;
});

Model.constructors.push(function defineStaticProperties(Constructor, data) {
    var name = data.name;
    var fields = data.fields;

    var staticProperties = {
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
    var customMethods = data.customMethods;

    if (!customMethods) return;

    var fieldNames = data.fields.map(function (field) {
        return field.name;
    });
    var customMethodNames = Object.keys(customMethods);

    customMethodNames.forEach(function addCustomMethod(name) {
        if (fieldNames.indexOf(name) !== -1) {
            throw new Error('Cannot override field ' + name + ' with a custom method of same name');
        }

        Constructor.prototype[name] = customMethods[name];
    });
});

var ModelMethods = function () {
    function ModelMethods() {
        _classCallCheck(this, ModelMethods);
    }

    _createClass(ModelMethods, [{
        key: 'setPersistent',
        value: function setPersistent(name, value) {
            Model.helpers.applyChanges(this.data, name, value);
        }
    }, {
        key: 'set',
        value: function set(name, value) {
            if (!this.changed) {
                this.changed = {};
            }

            Model.helpers.applyChanges(this.changed, name, value);

            return this;
        }
    }, {
        key: 'get',
        value: function get(name) {
            return this.changed && name in this.changed ? this.changed[name] : this.data[name];
        }
    }, {
        key: 'commit',
        value: function commit() {
            Model.helpers.applyChanges(this.data, this.changed);
            this.changed = false;
        }
    }, {
        key: 'rollback',
        value: function rollback() {
            this.changed = false;
        }
    }]);

    return ModelMethods;
}();

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
ModelMethods.create = function (Constructor) {
    var methods = new ModelMethods();

    methods.data = {};
    methods.Model = Constructor;

    return methods;
};

/**
 * Model Field
 */

var Field = function () {
    function Field(config) {
        var _this = this;

        _classCallCheck(this, Field);

        if (!config) {
            throw new Error('Invalid field config');
        }

        Object.keys(config).forEach(function (key) {
            return _this[key] = config[key];
        });
    }

    _createClass(Field, [{
        key: 'parseValue',
        value: function parseValue(value) {
            if (this.isArray) {
                return this.parseArray(value);
            }

            return this.parse(value);
        }
    }, {
        key: 'parseArray',
        value: function parseArray(value) {
            if (!Array.isArray(value)) {
                return null;
            }

            return value.map(this.parse, this);
        }
    }, {
        key: 'parse',
        value: function parse(value) {
            return value;
        }
    }, {
        key: 'serialize',
        value: function serialize(value) {
            return value;
        }
    }], [{
        key: 'create',
        value: function create(config) {
            var type = config.type;
            var FieldConstructor = Field.registry.get(type) || GenericField;

            return new FieldConstructor(config);
        }
    }]);

    return Field;
}();

Field.registry = new Map();

var StringField = function (_Field) {
    _inherits(StringField, _Field);

    function StringField() {
        _classCallCheck(this, StringField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(StringField).apply(this, arguments));
    }

    _createClass(StringField, [{
        key: 'parse',
        value: function parse(value) {
            return String(value !== undefined ? value : '').trim();
        }
    }, {
        key: 'serialize',
        value: function serialize(value) {
            return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object' ? String(value) : undefined;
        }
    }]);

    return StringField;
}(Field);

var BooleanField = function (_Field2) {
    _inherits(BooleanField, _Field2);

    function BooleanField() {
        _classCallCheck(this, BooleanField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(BooleanField).apply(this, arguments));
    }

    _createClass(BooleanField, [{
        key: 'parse',
        value: function parse(value) {
            return !!value;
        }
    }]);

    return BooleanField;
}(Field);

var NumberField = function (_Field3) {
    _inherits(NumberField, _Field3);

    function NumberField() {
        _classCallCheck(this, NumberField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(NumberField).apply(this, arguments));
    }

    _createClass(NumberField, [{
        key: 'parse',
        value: function parse(value) {
            return value && Number(value) || 0;
        }
    }]);

    return NumberField;
}(Field);

var DateField = function (_Field4) {
    _inherits(DateField, _Field4);

    function DateField() {
        _classCallCheck(this, DateField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DateField).apply(this, arguments));
    }

    _createClass(DateField, [{
        key: 'parse',
        value: function parse(value) {
            if (isFinite(value)) {
                return new Date(value);
            }

            if (typeof value === 'string') {
                var parsedTime = Date.parse(value);

                if (!isFinite(parsedTime)) return null;

                return new Date(parsedTime);
            }

            return null;
        }
    }, {
        key: 'serialize',
        value: function serialize(value) {
            return value instanceof Date ? value.toJSON() : undefined;
        }
    }]);

    return DateField;
}(Field);

var GenericField = function (_Field5) {
    _inherits(GenericField, _Field5);

    function GenericField() {
        _classCallCheck(this, GenericField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(GenericField).apply(this, arguments));
    }

    _createClass(GenericField, [{
        key: 'parse',
        value: function parse(value) {
            return value !== null ? new this.type(value) : null;
        }
    }, {
        key: 'serialize',
        value: function serialize(value) {
            if (value && typeof value.toJSON === 'function') {
                return value.toJSON();
            }

            return value;
        }
    }]);

    return GenericField;
}(Field);

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

/* globals Field */

var RelationField = function (_Field6) {
    _inherits(RelationField, _Field6);

    function RelationField() {
        _classCallCheck(this, RelationField);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RelationField).apply(this, arguments));
    }

    _createClass(RelationField, [{
        key: 'parse',
        value: function parse(value) {
            var Model = this.type;

            if (!value || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') {
                return null;
            }

            if (value instanceof Model) {
                return value;
            }

            return new Model(value);
        }
    }, {
        key: 'serialize',
        value: function serialize(data) {
            if (data && data instanceof this.type) {
                return data.toJSON();
            }

            return null;
        }
    }]);

    return RelationField;
}(Field);

	var Gisele = {
		Model: Model,
		Field: Field,
		RelationField: RelationField
	};

	if (typeof define === 'function' && define.amd) {
		define(function() {
			return Gisele;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Gisele;
	} else {
		global.Gisele = Gisele;
	}

})(this);