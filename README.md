# Gisele

Because Bündchen is too fancy to name a model library

## TL;DR

	A base class to write data models in Javascript. Give it a set of fields and it will handle the model state

Gisele is a data modeling library to create Model classes. It is used to wrap plain objects and provide extensibility without
needing to use weird properties for data bindings.

Read more [in this blog post](http://darlanalv.es/en/other/177b217cf0-Gisele-a-model-library/index.html?utm_source=github&utm_medium=readme&utm_campaign=gh)

## Usage

```js
var Fruit = Model.create({
	name: 'Fruit',

	// use constructors to define the field type
	fields: {
		name: String,
		calories: { type: Number, default: 100 },
		isFruit: { type: Boolean, default: true },
	}
});

var fruit = new Fruit({
	name: 'Orange',
	calories: 120
});

```

## Plugins

Extended features:

- [gisele-validation](https://github.com/darlanalves/gisele-validation)


## Changes, commit and rollback

Each declared field is managed and the changes are tracked apart from the pristine data, so the model can be reset or the changes applied after we actually saved the changes somewhere.

The model methods are accessible under a `$$` property to avoid conflicts with property names.

```js

var fruit = new Fruit({});

fruit.name = 'Lemon';

console.log(fruit.$$dirty)
// true

// apply the changes
fruit.$$.commit();

console.log(fruit.$$dirty)
// false

fruit.name = 'Apple';

// rollback current changes
fruit.$$.rollback();

console.log(fruit.name)
// 'Lemon'

```
