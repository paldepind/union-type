var assert = require('assert');
var Type = require('../union-type.js');

function isNumber(n) { return typeof n === 'number'; }

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
  it('checks for types with instanceof', function() {
    var Name = Type({Name: [String]});
    var name = Name.Name('Thumper');
    assert.equal(name[0], 'Thumper');
  });
  it('throws on incorrect primitive', function() {
    var Name = Type({Name: [String]});
    assert.throws(function() {
      Name.Name(12);
    }, /Name/);
  });
  it('nest types', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    var Shape = Type({Circle: [isNumber, Point],
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
  it('case', function() {
    var Action = Type({Translate: [isNumber, isNumber], Rotate: [isNumber]});
    var action = Action.Translate(10, 8);
    var sum = Type.case({
      Translate: function(x, y) {
        assert.equal(x, 10);
        assert.equal(y, 8);
        return x + y;
      },
      Rotate: function(n) { return n; },
    });
    assert.equal(sum(Action.Translate(10, 8)), 18);
    assert.equal(sum(Action.Rotate(30)), 30);
  });
});
