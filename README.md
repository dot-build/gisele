# Gisele

Because Bündchen is too fancy to name a model library

## In one line

A base class to write data models in Javascript. Give it a set of fields and it will handle the model state

## Usage

```
var Person = Model.create({
	name: 'Person',
	fields: {
		name: String,
		age: Number,
		dateOfBirth: Date,
		father: 'self',
		mother: 'self'
	}
});

var john = new Person({
	name: 'John Doe',
	age: 30
});

var jane = new Person({
	name: 'Jane Doe',
	age: 27
});

var jack = new Person({
	name: 'Jack Doe'
	dateOfBirth: '2001-12-16T03:15:00',
	father: john,
	mother: jane
});

jack.age = 12;

console.log(jack.$$state) // 'dirty' or Model.DIRTY
jack.__commit__();

console.log(jack.$$state) // 'pristine' or Model.PRISTINE

jack.age = 11

```
