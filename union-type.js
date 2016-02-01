var curryN = require('ramda/src/curryN');

if (process.env.NODE_ENV !== 'production') {
  var isString = function(s) { return typeof s === 'string'; };
  var isNumber = function(n) { return typeof n === 'number'; };
  var isBoolean = function(b) { return typeof b === 'boolean'; };
  var isObject = function(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  };
  var isFunction = function(f) { return typeof f === 'function'; };
  var isArray = Array.isArray || function(a) { return 'length' in a; };

  var mapConstrToFn = function(group, constr) {
    return constr === String    ? isString
         : constr === Number    ? isNumber
         : constr === Boolean   ? isBoolean
         : constr === Object    ? isObject
         : constr === Array     ? isArray
         : constr === Function  ? isFunction
         : constr === undefined ? group
                                : constr;
  };

  var numToStr = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

  var validate = function(group, validators, name, args) {
    var validator, v, i;
    for (i = 0; i < args.length; ++i) {
      v = args[i];
      validator = mapConstrToFn(group, validators[i]);
      if (process.env.NODE_ENV !== 'production' && !validator.isPrototypeOf(v) &&
          (typeof validator !== 'function' || !validator(v))) {
        throw new TypeError('wrong value ' + v + ' passed to location ' + numToStr[i] + ' in ' + name);
      }
    }
  };
}

function valueToArray(value) {
  var i, arr = [];
  for (i = 0; i < value.keys.length; ++i) {
    arr.push(value[value.keys[i]]);
  }
  return arr;
}

function extractValues(keys, obj) {
  var arr = [], i;
  for (i = 0; i < keys.length; ++i) arr[i] = obj[keys[i]];
  return arr;
}

function constructor(group, name, fields) {
  var validators, keys = Object.keys(fields), i;
  if (isArray(fields)) {
    validators = fields;
  } else {
    validators = extractValues(keys, fields);
  }
  function construct() {
    var val = Object.create(group), i;
    val.keys = keys;
    val.name = name;
    if (process.env.NODE_ENV !== 'production') {
      validate(group, validators, name, arguments);
    }
    for (i = 0; i < arguments.length; ++i) {
      val[keys[i]] = arguments[i];
    }
    return val;
  }
  group[name] = curryN(keys.length, construct);
  if (keys !== undefined) {
    group[name+'Of'] = function(obj) {
      return construct.apply(undefined, extractValues(keys, obj));
    };
  }
}

function rawCase(type, cases, value, arg) {
  var wildcard = false;
  var handler = cases[value.name];
  if (handler === undefined) {
    handler = cases['_'];
    wildcard = true;
  }
  if (process.env.NODE_ENV !== 'production') {
    if (!type.isPrototypeOf(value)) {
      throw new TypeError('wrong type passed to case');
    } else if (handler === undefined) {
      throw new Error('non-exhaustive patterns in a function');
    }
  }
  var args = wildcard === true ? [arg]
           : arg !== undefined ? valueToArray(value).concat([arg])
           : valueToArray(value);
  return handler.apply(undefined, args);
}

var typeCase = curryN(3, rawCase);
var caseOn = curryN(4, rawCase);

function createIterator() {
  return {
    idx: 0,
    val: this,
    next: function() {
      var keys = this.val.keys;
      return this.idx === keys.length
	? {done: true}
        : {value: this.val[keys[this.idx++]]};
    }
  };
}

function Type(desc, methods) {
  var key, res, obj = methods === undefined ? {} : methods;
  obj.case = typeCase(obj);
  obj.caseOn = caseOn(obj);
  obj[Symbol ? Symbol.iterator : '@@iterator'] = createIterator;
  for (key in desc) {
    res = constructor(obj, key, desc[key]);
  }
  return obj;
}

module.exports = Type;
