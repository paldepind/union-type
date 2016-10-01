var assert = require('assert');
var Type = require('../union-type.js');

function isNumber(n) { return typeof n === 'number'; }
function T() { return true; }
function add(n) {
  return function(m) { return n + m; };
}

describe('union type', function() {
  it('returns type with constructors', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    assert.equal('function', typeof Point.Point);
  });
  it('constructors create object with fields in array', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    var point = Point.Point(5, 10);
    assert.equal(5, point[0]);
    assert.equal(10, point[1]);
  });
  it('throws if field value does not pass validator', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    assert.throws(function() {
      Point.Point('lol', 10);
    }, /Point/);
  });
  describe('primitives', function() {
    it('accepts strings with primitive constructors', function() {
      var Name = Type({Name: [String]});
      var name = Name.Name('Thumper');
      assert.equal(name[0], 'Thumper');
    });
    it('throws on strings with primitive constructors', function() {
      var Name = Type({Name: [String]});
      assert.throws(function() {
        var name = Name.Name(12);
      }, /Name/);
    });
    it('accepts number with primitive constructors', function() {
      var Age = Type({Age: [Number]});
      assert.equal(Age.Age(12)[0], 12);
    });
    it('throws on number with primitive constructors', function() {
      var Age = Type({Age: [Number]});
      assert.throws(function() {
        Age.Age('12');
      }, /wrong value/);
    });
    it('throws on too many arguments', function() {
      var Foo = Type({Foo: [Number, Number]});
      assert.throws(function() {
        Foo.Foo(3, 3, 3);
      }, /too many arguments/);
    });
    it('accepts boolean true with primitive constructors', function() {
      var Exists = Type({Exists: [Boolean]});
      assert.equal(Exists.Exists(true)[0], true);
    });
    it('accepts boolean false with primitive constructors', function() {
      var Exists = Type({Exists: [Boolean]});
      assert.equal(Exists.Exists(false)[0], false);
    });
    it('throws on boolean with primitive constructors', function() {
      var Exists = Type({Exists: [Boolean]});
      assert.throws(function() {
        Exists.Exists('12');
      }, /wrong value/);
    });
  });
  it('array of types', function() {
    var Point = Type({Point: [Number, Number]});
    var Shape = Type({Shape: [Type.ListOf(Point)]}).Shape;
    assert.throws(function() {
      Shape([1, Point.Point(1,2), 3]);
    }, /wrong value 1 passed to location first in List/);
    assert.throws(function() {
      Shape([Point.Point(1, 2), Point.Point('3', 1)]);
    }, /wrong value/);
    Shape([Point.Point(1, 2), Point.Point(1, 2)]);
    Shape([]);
    assert.throws(function() {
      Shape("not a List")
    }, /wrong value/);
  });
  it('nest types', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    var Shape = Type({Circle: [Number, Point],
                      Rectangle: [Point, Point]});
    var square = Shape.Rectangle(Point.Point(1, 1), Point.Point(4, 4));
  });
  it('throws if field value is not of correct type', function() {
    var Length = Type({Length: [isNumber]});
    var Shape = Type({Rectangle: [Length, Length]});
    assert.throws(function() {
      Shape.Rectangle(1, Length.Length(12));
    }, /Rectangle/);
  });
  describe('records', function() {
    it('can create types from object descriptions', function() {
      var Point = Type({Point: {x: Number, y: Number}});
    });
    it('can create values from objects', function() {
      var Point = Type({Point: {x: Number, y: Number}});
      var p = Point.PointOf({x: 1, y: 2});
      assert.equal(p.x, 1);
      assert.equal(p.y, 2);
    });
    it('can create values from arguments', function() {
      var Point = Type({Point: {x: Number, y: Number}});
      var p = Point.Point(1, 2);
      assert.equal(p.x, 1);
      assert.equal(p.y, 2);
    });
    it('does not add numerical properties to records', function() {
      var Point = Type({Point: {x: Number, y: Number}});
      var p = Point.Point(1, 2);
      assert.equal(p[0], undefined);
      assert.equal(p[1], undefined);
    });
  });
  describe('type methods', function() {
    it('can add instance methods', function() {
      var Maybe = Type({Just: [T], Nothing: []});
      Maybe.prototype.map = function(fn) {
        return Maybe.case({
          Nothing: () => Maybe.Nothing(),
          Just: (v) => Maybe.Just(fn(v))
        }, this);
      };
      var just1 = Maybe.Just(1);
      var just4 = just1.map(add(3));
      assert.equal(just4[0], 4);
      var nothing = Maybe.Nothing();
      var alsoNothing = nothing.map(add(3));
      assert.equal(alsoNothing._name, 'Nothing');
    });
  });
  describe('case', function() {
    var Action = Type({
      Translate: [isNumber, isNumber],
      Rotate: [isNumber],
      Scale: {x: Number, y: Number}
    });
    var sum = Action.case({
      Translate: function(x, y) {
        return x + y;
      },
      Rotate: function(n) { return n; },
      Scale: function(x, y) {
	return x + y;
      }
    });
    it('works on types', function() {
      assert.equal(sum(Action.Translate(10, 8)), 18);
      assert.equal(sum(Action.Rotate(30)), 30);
    });
    it('destructs record types', function() {
      assert.equal(sum(Action.ScaleOf({x: 3, y: 4})), 7);
    });
    it('throws on incorrect type', function() {
      var AnotherAction = Type({Translate: [Number]});
      assert.throws(function() {
        sum(AnotherAction.Translate(12));
      }, /wrong type/);
    });
    it('calls back to placeholder', function() {
      var called = false;
      var fn = Action.case({
        Translate: function() { throw new Error(); },
        _: function() { called = true; }
      });
      fn(Action.Rotate(30));
    });
    it('throws if no case handler found', function() {
      var called = false;
      var fn = Action.case({
        Translate: function() { throw new Error(); }
      });
      assert.throws(function() {
        fn(Action.Rotate(30));
      }, /exhaustive/);
    });
    it('does not throw with Type.check = false if no case handler found', function() {
      Type.check = false;
      Action.case({
        Translate: function(x, y) {
          return x + y;
        }
      }, Action.Rotate(90));
      Type.check = true;
    });
  });
  describe('caseOn', function() {
    var Modification = Type({Append: [Number], Remove: [Number], Slice: [Number, Number], Sort: []});
    var update = Modification.caseOn({
      Append: function(number, list) {
	return list.concat([number]);
      },
      Remove: function(number, list) {
        var idx = list.indexOf(number);
        return list.slice(0, idx).concat(list.slice(idx+1));
      },
      Slice: function(begin, end, list) { return list.slice(begin, end); },
      Sort: function(list) { return list.sort(); }
    });
    it('passes argument along to case functions', function() {
      assert.deepEqual(update(Modification.Append(3), [1, 2]), [1, 2, 3]);
      assert.deepEqual(update(Modification.Remove(2), [1, 2, 3, 4]), [1, 3, 4]);
      assert.deepEqual(update(Modification.Slice(1, 4), [1, 2, 3, 4, 5]), [2, 3, 4]);
      assert.deepEqual(update(Modification.Sort(), [1, 3, 2]), [1, 2, 3]);
    });
    it('partially applied to same action does not affect each other', function() {
      var append3 = update(Modification.Append(3));
      assert.deepEqual(append3([1, 2]), [1, 2, 3]);
      assert.deepEqual(append3([5, 4]), [5, 4, 3]);
    });
  });
  describe('caseOn _', function() {
    var Action = Type({Jump: [], Move: [Number]});
    var Context = {x: 1, y: 2};
    var update = Action.caseOn({
      _: function(context) { return context; }
    });
    it('does not extract fields when matching _', function() {
      assert.deepEqual(update(Action.Jump(), Context), Context);
      assert.deepEqual(update(Action.Move(5), Context), Context);
    });
  });
  describe('case instance method', function() {
    var Maybe = Type({Just: [Number], Nothing: []});
    assert.equal(3, Maybe.Just(1).case({
      Nothing: function () { return 'oops'; },
      Just: function (n) { return n + 2; }
    }));
  });
  describe('recursive data types', function() {
    var List = Type({Nil: [], Cons: [T, List]});
    it('can create single element list', function() {
      var list = List.Cons(1, List.Nil());
    });
    it('can get head', function() {
      var list = List.Cons(1, List.Cons(2, List.Cons(3, List.Nil())));
      function head(list) { return list[0]; }
      function tail(list) { return list[1]; }
      var toString = List.case({
        Cons: function(head, tail) { return head + ' : ' + toString(tail); },
        Nil: function() { return 'Nil'; }
      });
      assert.equal(toString(list), '1 : 2 : 3 : Nil');
    });
  });
  describe('iterator support', () => {
    it('is can be destructured like array', () => {
      var {Point, PointOf} = Type({Point: {x: Number, y: Number, z: Number}});
      var p1 = PointOf({x: 1, y: 2, z: 3});
      var p2 = Point(1, 2, 3);
      var [x, y, z] = p1;
      assert.deepEqual([x, y, z], [1, 2, 3]);
    });
  });
});
