var Lockr = (function() {
  'use strict';

  var lockObj = {};
  lockObj.prefix = "";

  lockObj._getPrefixedKey = function(key, options) {
    options = options || {};

    if (options.noPrefix) {
      return key;
    } else {
      return this.prefix + key;
    }
  };

  lockObj.set = function (key, value, options) {
    var query_key = this._getPrefixedKey(key, options);

    try {
      localStorage.setItem(query_key, JSON.stringify({"data": value}));
    } catch (e) {
      if (console) console.warn("lockObj didn't successfully save the '{"+ key +": "+ value +"}' pair, because the localStorage is full.");
    }
  };

  lockObj.get = function (key, missing, options) {
    var query_key = this._getPrefixedKey(key, options);
    var value;

    try {
      value = JSON.parse(localStorage.getItem(query_key));
    } catch (e) {
      if(localStorage[query_key]) {
        value = {data: localStorage.getItem(query_key)};
      } else {
        value = null;
      }
    }
    
    if(!value) {
      return missing;
    }
    else if (typeof value === 'object' && typeof value.data !== 'undefined') {
      return value.data;
    }
  };

  lockObj.sadd = function(key, value, options) {
    var query_key = this._getPrefixedKey(key, options);
    var values = lockObj.smembers(key);
    var json;

    if (values.indexOf(value) > -1) {
      return null;
    }

    try {
      values.push(value);
      json = JSON.stringify({"data": values});
      localStorage.setItem(query_key, json);
    } catch (e) {
      console.log(e);
      console.warn("lockObj didn't successfully add the "+ value +" to "+ key +" set, because the localStorage is full.");
    }
  };

  lockObj.smembers = function(key, options) {
    var query_key = this._getPrefixedKey(key, options);
    var value;

    try {
      value = JSON.parse(localStorage.getItem(query_key));
    } catch (e) {
      value = null;
    }
    
    return (value && value.data) ? value.data : [];
  };

  lockObj.sismember = function(key, value, options) {
    return lockObj.smembers(key).indexOf(value) > -1;
  };

  lockObj.keys = function() {
    var keys = [];
    var allKeys = Object.keys(localStorage);

    if (lockObj.prefix.length === 0) {
      return allKeys;
    }

    allKeys.forEach(function (key) {
      if (key.indexOf(lockObj.prefix) > -1) {
        keys.push(key.replace(lockObj.prefix, ''));
      }
    });

    return keys;
  };

  lockObj.getAll = function (includeKeys) {
    var keys = lockObj.keys();

    if (includeKeys) {
      return keys.reduce(function (accum, key) {
        var tempObj = {};
        tempObj[key] = lockObj.get(key);
        accum.push(tempObj);
        return accum;
      }, []);
    }

    return keys.map(function (key) {
      return lockObj.get(key);
    });
  };

  lockObj.srem = function(key, value, options) {
    var query_key = this._getPrefixedKey(key, options);
    var values = lockObj.smembers(key, value);
    var index = values.indexOf(value);
    var json;

    if (index > -1)
      values.splice(index, 1);

    json = JSON.stringify({"data": values});

    try {
      localStorage.setItem(query_key, json);
    } catch (e) {
      if (console) console.warn("lockObj couldn't remove the "+ value +" from the set "+ key);
    }
  };

  lockObj.rm =  function (key) {
    var queryKey = this._getPrefixedKey(key);
    localStorage.removeItem(queryKey);
  };

  lockObj.flush = function () {
    if (lockObj.prefix.length) {
      lockObj.keys().forEach(function(key) {
        localStorage.removeItem(lockObj._getPrefixedKey(key));
      });
    } else {
      localStorage.clear();
    }
  };

  return lockObj;
})();

if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = Lockr;
  }
  exports.Lockr = Lockr;
}