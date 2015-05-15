var R = require('ramda');

function Constructor(group, name, validators) {
  var constructor = R.curryN(validators.length, function() {
    var val = [];
    for (var i = 0; i < arguments.length; ++i) {
      var v = arguments[i];
      var validator = validators[i];
      if ((typeof validator === 'function' && validator(v)) ||
          (v !== undefined && v !== null && v.of === validator)) {
        val[i] = arguments[i];
      } else {
        throw new TypeError('wrong value passed to ' + name);
      }
    }
    val.of = group;
    val.name = name;
    return val;
  });
  return constructor;
}

var caze = R.curry(function(cases, action) {
  return cases[action.name].apply(undefined, action);
});

function Type(desc) {
  var obj = {};
  for (var key in desc) {
    obj[key] = Constructor(obj, key, desc[key]);
  }
  return obj;
}

Type.case = caze;

module.exports = Type;
