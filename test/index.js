var assert = require('assert');
var Type = require('../silly-type.js');

function isNumber(n) { return typeof n === 'number'; }

describe('silly type', function() {
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
    //var Point = Type({Point: ['x', 'y']});
    var Point = Type({Point: [isNumber, isNumber]});
    assert.throws(function() {
      Point.Point('lol', 10);
    }, /Point/);
  });
  it('nest types', function() {
    var Point = Type({Point: [isNumber, isNumber]});
    var Shape = Type({Circle: [isNumber, Point],
                      Rectangle: [Point, Point]});
    var square = Shape.Rectangle(Point.Point(1, 1), Point.Point(4, 4));
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
