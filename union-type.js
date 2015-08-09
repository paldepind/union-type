var curryN = require('ramda/src/curryN');

function isString(s) { return typeof s === 'string'; }
function isNumber(n) { return typeof n === 'number'; }
function isBoolean(b) { return typeof b === 'boolean'; }
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}
function isFunction(f) { return typeof f === 'function'; }
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

function validate(group, validators, name, args) {
  var validator, v, i;
  for (i = 0; i < args.length; ++i) {
    v = args[i];
    validator = mapConstrToFn(group, validators[i]);
    if ((typeof validator === 'function' && validator(v)) || validator.isPrototypeOf(v)) {
    } else {
      throw new TypeError('wrong value ' + v + ' passed to location ' + i + ' in ' + name);
    }
  }
}

function valueToArray(value) {
  return Array.prototype.slice.call(value);
}

function extractValues(keys, obj) {
  var arr = [], i;
  for (i = 0; i < keys.length; ++i) arr[i] = obj[keys[i]];
  return arr;
}

function Constructor(group, name, fields) {
  var constructors = {}, validators, keys, i;
  if (isArray(fields)) {
    validators = fields;
  } else {
    keys = Object.keys(fields);
    validators = extractValues(keys, fields);
  }
  function construct() {
    var val = Object.create(group), i;
    val.length = validators.length;
    val.name = name;
    if (Type.disableChecking !== true) validate(group, validators, name, arguments);
    for (i = 0; i < arguments.length; ++i) {
      val[i] = arguments[i];
      if (keys !== undefined) val[keys[i]] = arguments[i];
    }
    return val;
  }
  constructors[name] = curryN(validators.length, construct);
  if (keys !== undefined) {
    constructors[name+'Of'] = function(obj) {
      return construct.apply(undefined, extractValues(keys, obj));
    };
  }
  return constructors;
}

function rawCase(type, cases, value, arg) {
  if (!type.isPrototypeOf(value)) throw new TypeError('wrong type passed to case');
  var name = value.name in cases ? value.name
           : '_' in cases        ? '_'
                                 : undefined;
  if (name === undefined) {
    throw new Error('unhandled value passed to case');
  } else {
    return cases[name].apply(undefined, arg !== undefined ? valueToArray(value).concat([arg]) : value);
  }
}

var typeCase = curryN(3, rawCase);
var caseOn = curryN(4, rawCase);

function createIterator() {
  return {
    idx: 0,
    val: this,
    next: function() {
      return this.idx === this.val.length ? {done: true} : {value: this.val[this.idx++]};
    }
  };
}

function Type(desc, methods) {
  var key, res, obj = methods === undefined ? {} : methods;
  obj.case = typeCase(obj);
  obj.caseOn = caseOn(obj);
  obj[Symbol ? Symbol.iterator : '@@iterator'] = createIterator;
  for (key in desc) {
    res = Constructor(obj, key, desc[key]);
    obj[key] = res[key];
    obj[key+'Of'] = res[key+'Of'];
  }
  return obj;
}

Type.disableChecking = process !== undefined && process.env.NODE_ENV === 'production';

module.exports = Type;
