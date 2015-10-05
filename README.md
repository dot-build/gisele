# Gisele

Because Bündchen is too fancy to name a model library

## In one line

A base class to write data models in Javascript. Give it a set of fields and it will handle the model state

Read more [in this blog post](http://darlanalv.es/en/other/177b217cf0-Gisele-a-model-library/index.html?utm_source=github&utm_medium=readme&utm_campaign=gh)

## Usage

```js
var Fruit = Model.create({
	name: 'Fruit',
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

Each declared field is managed and the changes are tracked apart from the pristine data, so the model can be reset or the changes applied after we actually saved the changes somewhere.

```js

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
