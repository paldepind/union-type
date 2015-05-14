# silly-type
A JavaScript library for defining and using something that resembles
data types

Implementation is currently 40 SLOC.

# Usage

Create a type by passing a definition object to `Type`. The keys of the
objects are the names of the values that the type can have. The values are,
potentially empty, arrays of validator functions or existing types describing
the field that the value consists of.

```javascript
function isNumber(n) { return typeof n === 'number'; }

var Point = Type({Point: [isNumber, isNumber]});
```

This exposes a type constructor on the returned object.

```javascript
var p = Point.Point(1, 4);
```
If you pass a value for which the validator function does not return
`true` an error is thrown.

```javascript
var p = Point.Point('1', 4);
// throws TypeError: wrong value passed to Point
```

Instead of a validator function you can construct types out of other
types.

```javascript
var Shape = Type({Circle: [isNumber, Point],
                  Rectangle: [Point, Point]});
var circle = Shape.Circle(10, Point.Point(3, 4));
```

You can extract the value of a type with `Type.case`.

```javascript
var Shape = Type({Circle: [isNumber, Point],
                  Rectangle: [Point, Point]});
var circle = Shape.Circle(10, Point.Point(3, 4));
var areaOfCircle = Type.case({
  Circle: (radius, _) => Math.PI * radius * radius,
  Rectangle: (p1, p2) => (p2[0] - p1[0]) * (p2[1] - p1[0])
}, circle);
```

Since `Type.case` is curried you can create a general `area` function by
not passing the second parameter to `Type.case`.

```javascript
var area = Type.case({
  Circle: (radius, _) => Math.PI * radius * radius,
  Rectangle: (p1, p2) => (p2[0] - p1[0]) * (p2[1] - p1[0])
});
```
