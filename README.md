# Gisele

Because Bündchen is too fancy to name a model library

## In one line

A base class to write data models in Javascript. Give it a set of fields and it will handle the model state

## Usage

```
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

fruit.name = 'Lemon';

console.log(fruit.$$dirty)
// true

fruit.$$.commit();

console.log(fruit.$$dirty)
// false

fruit.name = 'Apple';

fruit.$$.rollback();

console.log(fruit.name)
// 'Lemon'


```
