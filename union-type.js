var R = require('ramda');

function isString(s) { return typeof s === 'string'; }
function isNumber(n) { return typeof n === 'number'; }
function isObject(value) {
  var type = typeof value;
  return type == 'function' || (!!value && type == 'object');
}
function isFunction(f) { return typeof f === 'function'; }
var isArray = Array.isArray || function(a) { return 'length' in a; };

function mapConstrToFn(constr) {
  return constr === String   ? isString
       : constr === Number   ? isNumber
       : constr === Object   ? isObject
       : constr === Function ? isFunction
                             : constr;
}

function Constructor(group, name, validators) {
  validators = validators.map(mapConstrToFn);
  var constructor = R.curryN(validators.length, function() {
    var val = [], v, validator;
    for (var i = 0; i < arguments.length; ++i) {
      v = arguments[i];
      validator = validators[i];
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
