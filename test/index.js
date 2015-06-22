var assert = require('assert');
var Type = require('../union-type.js');

function isNumber(n) { return typeof n === 'number'; }

function T() { return true; }

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
  describe('case', function() {
    var Action = Type({Translate: [isNumber, isNumber], Rotate: [isNumber]});
    var sum = Action.case({
      Translate: function(x, y) {
        return x + y;
      },
      Rotate: function(n) { return n; },
    });
    it('works on types', function() {
      assert.equal(sum(Action.Translate(10, 8)), 18);
      assert.equal(sum(Action.Rotate(30)), 30);
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
        Translate: function() { throw new Error(); },
      });
      assert.throws(function() {
        fn(Action.Rotate(30));
      }, /unhandled/);
    });
  });
  describe('caseOn', function() {
    var Modification = Type({Append: [Number], Remove: [Number], Sort: []});
    var update = Modification.caseOn({
      Append: function(number, list) { return list.concat([number]); },
      Remove: function(number, list) {
        var idx = list.indexOf(number);
        return list.slice(0, idx).concat(list.slice(idx+1));
      },
      Sort: function(list) { return list.sort(); },
    });
    it('passes argument along to case functions', function() {
      assert.deepEqual(update(Modification.Append(3), [1, 2]), [1, 2, 3]);
      assert.deepEqual(update(Modification.Remove(2), [1, 2, 3, 4]), [1, 3, 4]);
      assert.deepEqual(update(Modification.Sort(), [1, 3, 2]), [1, 2, 3]);
    });
    it('partially applied to same action does not affect each other', function() {
      var append3 = update(Modification.Append(3));
      assert.deepEqual(append3([1, 2]), [1, 2, 3]);
      assert.deepEqual(append3([5, 4]), [5, 4, 3]);
    });
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
});
