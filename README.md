# union-type

A small JavaScript library for defining and using union types.

Union types are a way to group different values together. You can think of them
as a powerful form of enums with the possibility to have additional data
associated with the possible values.

## Table of contents

* [Tutorial](#tutorial)
  * [Defining a union type](#defining-a-union-type)
  * [Constructing a union type](#constructing-a-union-type)
  * [Switching on union types](#switching-on-union-types)
  * [Extracting fields from a union type](#extracting-fields-from-a-union-type)
  * [Recursive union types](recursive-union-types)
* [Author & license](author--license)

## Tutorial

### Defining a union type

union-type exports a single function `Type`. Union types are created by
passing the `Type` function a definition object.

```javascript
function isNumber(n) { return typeof n === 'number'; }
var Point = Type({Point: [isNumber, isNumber]});
```

The keys of the object are the names of the values that the type can have. The
values of the object are arrays describing the fields of the value. The fields
can be described by a _validator function_. When a value of the type is
constructed the values passed to the constructor will have to pass the
validator predicate.

Alternatively the fields can be specified by one of the standard built-in
constructors `Number`, `String`, `Object`, `Array` or `Function`. union-type
will detect these constructors and convert them to matching validator functions.
Thus the above example is equivalent to this:

```javascript
var Point = Type({Point: [Number, Number]});
```

Finally fields can be described in terms of other types.

```javascript
var Shape = Type({
  Circle: [Number, Point],
  Rectangle: [Point, Point]
});
```

The values of a type can also have no fields at all.

```javascript
var NotifySetting = Type({Mute: [], Vibrate: [], Sound: [Number]});
```

### Constructing a union type

The `Type` function returns an object with constructor function for the
different specified values. Thus, once you've defined a union type like this

```javascript
var Point = Type({Point: [Number, Number]});
var Shape = Type({
  Circle: [Number, Point],
  Rectangle: [Point, Point]
});
```

You can create values like this:

```javascript
var center = Point.Point(12, 7);
var radius = 8;
var circle = Shape.Circle(radius, center);
```

If you in any way pass a field value that does not match the specification a
helpful error is thrown.

```javascript
var p = Point.Point('bad', 4);
// throws TypeError: wrong value bad passed to location 0 in Point
```

### Switching on union types

Every created type has a `case` function available along with its value
constructors. `case` can be used as a control structure for handling the
different values a type can have:

```javascript
var Move = Type({Up: [], Right: [], Down: [], Left: []});

var player = {x: 0, y: 0};

var advancePlayer = function(move, player) {
  return Move.case({
    Up: function() { return {x: player.x, y: player.y - 1}; },
    Right: function() { return {x: player.x + 1, y: player.y}; },
    Down: function() { return {x: player.x, y: player.y + 1}; },
    Left: function() { return {x: player.x - 1, y: player.y}; },
  }, move);
};
```

Or with ECMAScript 6 syntax.

```javascript
const advancePlayer = (move, player) =>
  Move.case({
    Up: () => ({x: player.x, y: player.y - 1}),
    Right: () => ({x: player.x + 1, y: player.y}),
    Down: () => ({x: player.x, y: player.y + 1}),
    Left: () => ({x: player.x - 1, y: player.y}),
  }, move);
```

`case` will extract the fields of a value and pass them in order to the
relevant function. A function to calculate the area of a shape could, for
instance, look like this.

```javascript
var Shape = Type({Circle: [Number, Point],
                  Rectangle: [Point, Point]});
var area = (shape) =>
  Shape.case({
    Circle: (radius, _) => Math.PI * radius * radius,
    Rectangle: (p1, p2) => (p2[0] - p1[0]) * (p2[1] - p1[0])
  }, shape);
```

`case` is curried so we could have created the above function simply by
not passing the second parameter to `case`.

```javascript
var area = Shape.case({
  Circle: (radius, _) => Math.PI * radius * radius,
  Rectangle: (p1, p2) => (p2[0] - p1[0]) * (p2[1] - p1[0])
});
```

`caseOn` is similar to `case`, but allows passing additional data directly
into each case function. With `caseOn`, the `advancePlayer` example from
before could be written in "point-free style" like this:

```javascript
// No need to wrap this into a function that passes `player`
const advancePlayer = Move.caseOn({
  Up: (player) => ({x: player.x, y: player.y - 1}),
  Right: (player) => ({x: player.x + 1, y: player.y}),
  Down: (player) => ({x: player.x, y: player.y + 1}),
  Left: (player) => ({x: player.x - 1, y: player.y})
});

advancePlayer(Move.Up(), player);
```

As a catch all you can supply a property with the key `_` to case. When a type
doesn't match another handler `_` will be used.

```javascript
const advancePlayerOnlyUp = (move, player) =>
  Move.case({
    Up: () => ({x: player.x, y: player.y - 1}),
    _: () => player,
  });
```

### Extracting fields from a union type

The value of a union type is an array. This makes it easy to access the
different fields.

```javascript
var Person = Type({Person: [String, Number, Shape]});
var person = Person.Person('Simon', 21, Circle);
var name = person[0];
var age = person[1];
var favoriteShape = person[2];
```

Using the destructuring assignment in ECMAScript 6 it is possible to
concisely extract all fields of a type.

```javascript
var [name, age, favoriteShape] = person;
```

### Recursive union types

It is possible to define recursive union types. In the example below, `List` is
being used in it's own definition, thus it is still `undefined` when being
passed to `Type`. Therefore `Type` interprets `undefined` as being a recursive
invocation of the type currently being defined.

```javascript
var List = Type({Nil: [], Cons: [R.T, List]});
```

We can write a function that recursively prints the content of our cons list.

```javascript
var toString = List.case({
  Cons: (head, tail) => head + ' : ' + toString(tail),
  Nil: () => 'Nil',
});

var list = List.Cons(1, List.Cons(2, List.Cons(3, List.Nil())));
console.log(toString(list)); // => '1 : 2 : 3 : Nil'
```

## Author & license

union-type was made by [paldepind](https://twitter.com/paldepind) and is
released under the MIT license. I hope you find it useful.

