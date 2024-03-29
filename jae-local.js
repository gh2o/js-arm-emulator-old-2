// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {}; // Identifies this file as the Closure base.


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide())
 *     in the form "goog.package.part".
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {*=} opt_returnValue The single value that will be returned.
 * @param {...*} var_args Optional trailing arguments. These are ignored.
 * @return {?} The first argument. We can't know the type -- just pass it along
 *      without type.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page.
      if (doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primtive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


var Util = {};
var Mem = {};
var Peripherals = {};
var CPU = {};
(function () {

	Util.hex32 = hex32;
	function hex32 (x)
	{
		var ret = x.toString (16);
		while (ret.length < 8)
			ret = "0" + ret;
		return ret;
	}

	Util.rotRight = rotRight;
	function rotRight (val, sht)
	{
		return ((val >>> sht) | (val << (32 - sht))) >>> 0;
	}

	Util.enumAll = enumAll;
	function enumAll (obj)
	{
		var all = 0;
		for (var x in obj)
			if (obj.hasOwnProperty (x))
				all |= obj[x];
		obj.ALL = all;
	}

	/**
	 * @constructor
	 */
	function Err (msg)
	{
		this.error = new Error (msg);
		this.message = msg;
	}

	Util.Error = Err;

	Object.defineProperty (Err.prototype, "stack", {
		get: function () {
			return this.error.stack;
		}
	});

})();
(function () {

	function Base () {}
	goog.mixin (Base.prototype, {
		read8: function (offset) {
			if (offset & 0x03)
				throw "unaligned 8-bit read from peripheral";
			else
				return this.read32 (offset) & 0xFF;
		},
		write8: function (offset, data) {
			if (offset & 0x03)
				throw "unaligned 8-bit write to peripheral";
			else
				this.write32 (offset, data & 0xFF);
		},
		read16: function (offset) {
			if (offset & 0x03)
				throw "unaligned 16-bit read from peripheral";
			else
				return this.read32 (offset) & 0xFFFF;
		},
		write16: function (offset, data) {
			if (offset & 0x03)
				throw "unaligned 16-bit write to peripheral";
			else
				this.write32 (offset, data & 0xFFFF);
		}
	});

	/**
	 * @enum {number}
	 */
	UART.Control = {
		RTS: 1 << 11,
		DTR: 1 << 10,
		RXE: 1 << 9,
		TXE: 1 << 8,
		LBE: 1 << 7,
		UARTEN: 1 << 0
	};
	Util.enumAll (UART.Control);

	// FIXME: loopback not implemented;

	/**
	 * @constructor
	 */
	function UART (start, callback)
	{
		this.start = start;
		this.size = 4096;
		this.callback = callback || (function () {});

		this.regControl = UART.Control.RXE | UART.Control.TXE | UART.Control.UARTEN;
		this.regLineControl = 0x60;

		this.regIntMask = 0;
		this.regIntStatus = 0;
		this.regIntFIFOSelect = 0;

		this.regBaudInt = 1;
		this.regBaudFrac = 0;
	}

	goog.inherits (UART, Base);
	Peripherals.UART = UART;

	UART.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x18:
				return 0x40;
			case 0x24: // integer baud divisor
				return this.regBaudInt;
			case 0x28: // fractional baud divisor
				return this.regBaudFrac;
			case 0x2C:
				return this.regLineControl;
			case 0x30:
				return this.regControl;
			case 0x38:
				return this.regIntMask;
			case 0xFE0:
				return 0x11;
			case 0xFE4:
				return 0x10;
			case 0xFE8:
				return 0x14;
			case 0xFEC:
				return 0x00;
			case 0xFF0:
				return 0x0D;
			case 0xFF4:
				return 0xF0;
			case 0xFF8:
				return 0x05;
			case 0xFFC:
				return 0xB1;
			default:
				throw new Error ("bad UART read from 0x" + offset.toString (16));
		}
	};

	UART.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x00:
				var cnt = this.regControl;
				if (
					(cnt & UART.Control.UARTEN) &&
					(cnt & UART.Control.TXE) &&
					!(cnt & UART.Control.LBE)
				)
					this.callback (data & 0xFF);
				break;
			case 0x24:
				this.regBaudInt = data;
				break;
			case 0x28:
				this.regBaudFrac = data;
				break;
			case 0x2c:
				this.regLineControl = data;
				break;
			case 0x30:
				if (data & ~UART.Control.ALL)
					throw "unsupported UART control: 0x" + data.toString (16);
				this.regControl = data;
				break;
			case 0x34:
				this.regIntFIFOSelect = data;
				break;
			case 0x38:
				this.regIntMask = data & 0x7FF;
				break;
			case 0x44:
				this.regIntStatus &= ~data;
				break;
			default:
				throw new Error ("bad UART write to 0x" + offset.toString (16));
		}
	};

	Peripherals.SystemRegisters = SystemRegisters;
	function SystemRegisters (start, mscallback)
	{
		this.start = start;
		this.size = 4096;
		this.mscallback = mscallback;

		this.sys24clk = 0;
		this.sys24ms = 0;
	}

	SystemRegisters.prototype.read32 = function (offset) {
		if (offset == 0x5c)
		{
			var ms = this.mscallback ();
			var dms = ms - this.sys24ms;
			this.sys24ms = ms;

			var clk = this.sys24clk =
				(this.sys24clk + dms * 24000) % 0x100000000;
			return clk >>> 0;
		}
		else
		{
			throw "bad system register " + offset;
		}
	}

	Peripherals.SystemController = SystemController;
	function SystemController (start)
	{
		this.start = start;
		this.size = 4096;
	}

	SystemController.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x00: // no clue what this is ...
				return 0;
			default:
				throw "bad system controller register " + offset;
		}
	};

	SystemController.prototype.write32 = function (offset) {
		switch (offset)
		{
			case 0x00:
				console.log (">>> FIXME: write to sys controller base");
				break;
			default:
				throw "bad system controller register " + offset;
		}
	};

	/**
	 * @constructor
	 */
	function DualTimer (start, vic, irq)
	{
		/**
		 * @constructor
		 */
		function Timer () {}
		Timer.prototype = {

			control: 0,
			load: 0,
			value: 0xFFFFFFFF,

			psc: 0,
			halted: false

		};

		this.start = start;
		this.size = 4096;
		this.timers = [new Timer (), new Timer ()];

		this.vic = vic;
		this.irq = irq;
	}

	Peripherals.DualTimer = DualTimer;

	DualTimer.prototype.read32 = function (offset) {
		if (offset < 0x40)
		{
			var timer = this.timers[offset >>> 5];
			switch (offset & 0x1F)
			{
				case 0x04:
					return timer.value;
				case 0x08:
					return timer.control;
				default:
					throw "bad timer read 0x" + offset.toString (16);
			}
		}
		else
		{
			throw "bad timer read 0x" + offset.toString (16);
		}
	};

	DualTimer.prototype.write32 = function (offset, data) {
		if (offset < 0x40)
		{
			var timer = this.timers[offset >>> 5];
			switch (offset & 0x1f)
			{
				case 0x00:
					timer.load = data;
					timer.value = data;
					timer.halted = false;
					break;
				case 0x04:
					timer.value = data;
					break;
				case 0x08:
					timer.control = data & 0xFF;
					timer.halted = false;
					break;
				case 0x0C:
					this.vic.deassert (this.irq);
					break;
				default:
					throw "bad timer write 0x" + offset.toString (16);
			}
		}
		else
		{
			throw "bad timer write 0x" + offset.toString (16);
		}
	};

	DualTimer.prototype.update = function () {
		var timers = this.timers;
		this._update (timers[0]);
		this._update (timers[1]);
	};

	DualTimer.prototype._update = function (timer) {

		/** @const */ var ENABLED = 0x80;
		/** @const */ var PERIODIC = 0x40;
		/** @const */ var INTENABLED = 0x20;
		/** @const */ var BITS32 = 0x02;
		/** @const */ var ONESHOT = 0x01;

		var cnt = timer.control;
		var mask = (cnt & BITS32) ? 0xFFFFFFFF : 0xFFFF;

		// return if not enabled or halted
		if (!(cnt & ENABLED) || timer.halted)
			return;

		// prescale
		var psb = (cnt >>> 2) & 0x03;
		var psm = 1 << (4 * psb);
		if (++timer.psc >= psm)
			timer.psc = 0;
		else
			return;
		
		// check if zero
		if ((timer.value & mask) == 0)
		{
			if (cnt & INTENABLED)
				this.vic.assert (this.irq);

			if (cnt & ONESHOT)
				timer.halted = true;
			else if (cnt & PERIODIC)
				timer.value = timer.load;
			else
				timer.value = 0xFFFFFFFF;
		}
		else
		{
			timer.value = (timer.value - 1) >>> 0;
		}
	};

	// FIXME: VIC protection
	// FIXME: vectored interrupts
	Peripherals.VIC = VIC;
	function VIC (start)
	{
		this.start = start;
		this.size = 65536;

		this.intLines = 0;

		this.regDefVectAddr = 0;
		this.regIntSelect = 0;
		this.regIntEnable = 0;
		this.regSoftLines = 0;

		this.regsVectCntl = [];
		for (var i = 0; i < 16; i++)
			this.regsVectCntl.push (0);
	}

	VIC.prototype.read32 = function (offset) {
		switch (offset)
		{
			case 0x00:
				return (this.intLines | this.regSoftLines) &
					this.regIntEnable & ~this.regIntSelect;
			case 0x04:
				return (this.intLines | this.regSoftLines) &
					this.regIntEnable & this.regIntSelect;
			case 0x08:
				return this.intLines | this.regSoftLines;
			case 0x30:
				// FIXME: read from vectaddr
				return this.regDefVectAddr;
			case 0xFE0:
				return 0x90;
			case 0xFE4:
				return 0x11;
			case 0xFE8:
				return 0x04;
			case 0xFEC:
				return 0x00;
			default:
				throw "bad VIC read " + offset;
		}
	};

	VIC.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x0C:
				if (data != 0)
					throw "VIC FIQs not implemented";
				break;
			case 0x10:
				this.regIntEnable |= data;
				break;
			case 0x14:
				this.regIntEnable &= ~data;
				break;
			case 0x18:
				this.regSoftLines |= data;
				break;
			case 0x1C:
				this.regSoftLines &= ~data;
				break;
			case 0x30:
				// FIXME: write to vectaddr
				break;
			case 0x34:
				this.regDefVectAddr = data;
				break;
			case 0x0300:
				if (data & 1)
					throw "VIC test mode not implemented";
				break;
			default:
				if (offset >= 0x200 && offset < 0x240)
				{
					var index = (offset - 0x200) >> 2;
					this.regsVectCntl[index] = data;
					break;
				}
				throw "bad VIC write " + offset + " (" + Util.hex32 (data) + ")";
		}
	};

	VIC.prototype.assert = function (line) { this.intLines |= (1 << line); };
	VIC.prototype.deassert = function (line) { this.intLines &= ~(1 << line); };

	Peripherals.SIC = SIC;
	function SIC (start)
	{
		this.start = start;
		this.size = 4096;

		this.regEnable = 0;
		this.regPICEnable = 0;
	}

	SIC.prototype.write32 = function (offset, data) {
		switch (offset)
		{
			case 0x0C:
				this.regEnable &= ~data;
				break;
			case 0x20:
				this.regPICEnable |= data;
				break;
			default:
				throw "bad SIC write " + offset + " (" + Util.hex32 (data) + ")";
		}
	};

})();
(function () {

	/** @const */ var BLOCK_BITS = 16;
	/** @const */ var BLOCK_SIZE = 1 << BLOCK_BITS;
	/** @const */ var NUM_BLOCKS = 0x100000000 / BLOCK_SIZE;

	function numBlock (x) { return x >>> BLOCK_BITS; }
	function numIndex (x) { return x & (BLOCK_SIZE - 1); }

	/** @constructor */
	function RAM (start, size)
	{
		this.blocks = new Array (NUM_BLOCKS);
		this.start = start;
		this.size = size;
	}

	RAM.prototype = {
		read8: function (offset) {
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			return (this.read32 (base) >>> shift) & 0xFF;
		},
		write8: function (offset, data) {
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			var val = this.read32 (base);
			val = (val & ~(0xFF << shift)) | ((data & 0xFF) << shift);
			this.write32 (base, val);
		},
		read16: function (offset) {
			if (offset & 0x01)
				throw 'unaligned 16-bit RAM read';
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			return (this.read32 (base) >>> shift) & 0xFFFF;
		},
		write16: function (offset, data) {
			if (offset & 0x01)
				throw 'unaligned 16-bit RAM write';
			var base = offset & ~0x03, index = offset & 0x03, shift = index * 8;
			var val = this.read32 (base);
			val = (val & ~(0xFFFF << shift)) | ((data & 0xFFFF) << shift);
			this.write32 (base, val);
		},
		read32: function (offset) {
			if ((offset & 0x03) != 0)
				throw 'unaligned 32-bit RAM read';
			var block = this.blocks[numBlock(offset)];
			return block ? block[numIndex(offset) >> 2] : 0;
		},
		write32: function (offset, data) {
			if ((offset & 0x03) != 0)
				throw 'unaligned 32-bit RAM write';
			var block = this.blocks[numBlock(offset)];
			if (!block)
			{
				block = new Uint32Array (BLOCK_SIZE / 4);
				this.blocks[numBlock(offset)] = block;
			}
			block[numIndex(offset) >> 2] = data;
		}
	};

	Mem.RAM = RAM;
})();
(function () {

	/** @constructor */
	function PhysicalMemory ()
	{
		this.devices = [];
	}

	PhysicalMemory.prototype = {
		addDevice: function (device) {
			this.devices.push (device);
		},
		findDevice: function (address) {
			var devs = this.devices;
			for (var i = 0; i < devs.length; i++)
			{
				var dev = devs[i];
				var start = dev.start;
				var size = dev.size;
				if (address >= start && address < start + size)
				{
					return dev;
				}
			}
			throw "undefined access to physical location " + Util.hex32 (address);
		},
		read8: function (address) {
			var dev = this.findDevice (address);
			return dev.read8 (address - dev.start);
		},
		write8: function (address, data) {
			var dev = this.findDevice (address);
			dev.write8 (address - dev.start, data);
		},
		read16: function (address) {
			if (address & 0x01)
				throw "unaligned 16-bit physical read";
			var dev = this.findDevice (address);
			return dev.read16 (address - dev.start);
		},
		write16: function (address, data) {
			if (address & 0x01)
				throw "unaligned 16-bit physical write";
			var dev = this.findDevice (address);
			dev.write16 (address - dev.start, data);
		},
		read32: function (address) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit physical read";
			var dev = this.findDevice (address);
			return dev.read32 (address - dev.start);
		},
		write32: function (address, data) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit physical write";
			var dev = this.findDevice (address);
			dev.write32 (address - dev.start, data);
		}
	};

	Mem.PhysicalMemory = PhysicalMemory;

})();
(function () {

	/**
	 * @constructor
	 */
	function DataAbort (address, status, domain, msg)
	{
		goog.base (this, msg);
		this.address = address;
		this.status = status;
		this.domain = domain;
	}

	goog.inherits (DataAbort, Util.Error);
	CPU.DataAbort = DataAbort;

	/**
	 * @constructor
	 */
	function MMU (cpu, pmem)
	{
		this.cpu = cpu;
		this.pmem = pmem;

		this.regDomain = 0;
		this.regTable = 0;
		this.regFaultStatus = 0;
		this.regFaultAddress = 0;
	}

	MMU.prototype = {

		read8: function (address, user) {
			address = this.translate (address, false, user);
			return this.pmem.read8 (address) & 0xFF;
		},

		write8: function (address, data, user) {
			address = this.translate (address, true, user);
			this.pmem.write8 (address, data & 0xFF);
		},

		read16: function (address, user) {
			if ((address & 0x01) != 0)
				throw "unaligned 16-bit mmu read";
			address = this.translate (address, false, user);
			return this.pmem.read16 (address) & 0xFFFF;
		},

		write16: function (address, data, user) {
			if ((address & 0x01) != 0)
				throw "unaligned 16-bit mmu write";
			address = this.translate (address, true, user);
			this.pmem.write16 (address, data & 0xFFFF);
		},

		read32: function (address, user) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit mmu read";
			address = this.translate (address, false, user);
			return this.pmem.read32 (address);
		},

		write32: function (address, data, user) {
			if ((address & 0x03) != 0)
				throw "unaligned 32-bit mmu write";
			address = this.translate (address, true, user);
			this.pmem.write32 (address, data >>> 0);
		},

		translate: function () {
			try {
				return this._translate.apply (this, arguments);
			} catch (e) {
				if (e instanceof DataAbort)
				{
					this.regFaultStatus =
						((e.domain & 0xF) << 4) | (e.status & 0xF);
					this.regFaultAddress = e.address;
				}
				throw e;
			}
		},

		_translate: function (inAddr, write, user) {

			inAddr >>>= 0;
			if (!(this.cpu.creg._value & CPU.Control.M))
				return inAddr;

			var firstDescAddr = (
				(this.regTable & 0xffffc000) |
				((inAddr >>> 18) & ~0x03)
			) >>> 0;
			var firstDesc = this.pmem.read32 (firstDescAddr);

			var domain = (firstDesc >>> 5) & 0x0F;
			var ap;
			var outAddr;

			var firstType = firstDesc & 0x03;
			switch (firstType)
			{
				case 0:
					throw new DataAbort (inAddr, 0x5, domain, "first level translation fault");
				case 2: // section
					ap = (firstDesc >>> 10) & 0x03;
					outAddr = (firstDesc & 0xFFF00000) | (inAddr & 0x000FFFFF);
					break;
				default:
					var secondDescAddr = (
						firstType == 1 ?
							(
							 	// coarse
							 	(firstDesc & 0xfffffc00) |
								((inAddr >>> 10) & 0x03fc)
							)
							:
							(
							 	// fine
								(firstDesc & 0xfffff000) |
								((inAddr >>> 8) & 0x0ffc)
							)
					) >>> 0;
					var secondDesc = this.pmem.read32 (secondDescAddr);
					var secondType = secondDesc & 0x03;
					switch (secondType)
					{
						case 0:
							throw new DataAbort (inAddr, 0x7, domain, "second level translation fault");
						case 2: // small page
							outAddr = (secondDesc & 0xfffff000) | (inAddr & 0x0fff);
							var qt = (outAddr >>> 10) & 0x03;
							ap = (secondDesc >>> (4 + 2 * qt)) & 0x03;
							break;
						default:
							throw "unimplemented second level type";
					}
					break;
			}

			// permission checks
			var domainType = (this.regDomain >> (2 * domain)) & 0x03;
			switch (domainType)
			{
				case 0:
				case 2:
					throw new DataAbort (
						inAddr,
						(firstType == 2) ? 0x9 : 0xB,
						domain, "domain fault"
					);
				case 3: // manager
					break;
				case 1: // client
					var priv = !user && (this.cpu.cpsr.getMode () != CPU.Mode.USR);
					var allowed;
					switch (ap)
					{
						case 0:
							var rs = (this.cpu.creg._value >>> 8) & 0x03;
							switch (rs)
							{
								case 0: // R=0, S=0
									allowed = false;
									break;
								case 1: // R=0, S=1
									allowed = priv && !write;
									break;
								case 2: // R=1, S=0
									allowed = !write;
									break;
								case 3: // R=1, S=1
									throw "bad RS";
									break;
							}
							break;
						case 1:
							allowed = priv;
							break;
						case 2:
							allowed = priv || !write;
							break;
						case 3:
							allowed = true;
							break;
					}
					if (!allowed)
						throw new DataAbort (
							inAddr,
							(firstType == 2) ? 0xD : 0xF,
							domain, "permission fault"
						);
					break;
			}

			return outAddr >>> 0;
		}
	};

	CPU.MMU = MMU;
})();
(function () {

	/**
	 * @enum {number}
	 */
	var Mode = {
		USR: 0x10,
		FIQ: 0x11,
		IRQ: 0x12,
		SVC: 0x13,
		ABT: 0x17,
		UND: 0x1b,
		SYS: 0x1f
	};

	CPU.Mode = Mode;

	/**
	 * @enum {number}
	 */
	var Reg = {
		R0 : 0 , R1 :  1, R2 : 2 , R3 : 3,
		R4 : 4 , R5 :  5, R6 : 6 , R7 : 7,
		R8 : 8 , R9 :  9, R10: 10, R11: 11,
		R12: 12, R13: 13, R14: 14, R15: 15,
		LR: 14, PC: 15,
		CPSR: 16, SPSR: 17
	};

	CPU.Reg = Reg;

	/**
	 * @enum {number}
	 */
	var Status = {
		N: 1 << 31,
		Z: 1 << 30,
		C: 1 << 29,
		V: 1 << 28,
		ALL: 0x0F << 28
	};

	CPU.Status = Status;

	/**
	 * @enum {number}
	 */
	var Control = {
		M: 1 << 0,
		A: 1 << 1,
		P: 1 << 4,
		D: 1 << 5,
		L: 1 << 6,
		S: 1 << 8,
		R: 1 << 9,
		V: 1 << 13
	};
	Util.enumAll (Control);

	CPU.Control = Control;

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 */
	function Register (bank, index, value)
	{
		this.bank = bank;
		this.index = index;
		this.set (value || 0);
	}
	
	Register.prototype.get = function () { return this._value; };
	Register.prototype.set = function (value) { this._value = value >>> 0; };

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 * @extends Register
	 */
	function ProgramCounter (bank, index, value) { goog.base (this, bank, index, value); }
	goog.inherits (ProgramCounter, Register);
	ProgramCounter.prototype.get = function () { return this._value + 4; };

	/**
	 * @constructor
	 * @param {string} bank
	 * @param {number} index
	 * @param {number} value
	 * @extends Register
	 */
	function StatusRegister (bank, index, value) { goog.base (this, bank, index, value); }
	goog.inherits (StatusRegister, Register);
	StatusRegister.prototype.getMode = function () {
		return this._value & 0x1F;
	};
	StatusRegister.prototype.setMode = function (mode) {
		this._value = ((this._value & ~0x1F) | (mode & 0x1F)) >>> 0;
	}

	/**
	 * @constructor
	 * @extends Register
	 */
	function ControlRegister () { goog.base (this, "cp", -1, 0); }
	goog.inherits (ControlRegister, Register);
	
	/**
	 * @constructor
	 */
	function Core (pmem, vic)
	{
		var rb = this.regbanks = new Array (32);

		// copy general bank to all modes
		var genbank = new Array (18); // 16 GP + 2 Status
		for (var i = Reg.R0; i < Reg.PC; i++)
			genbank[i] = new Register ("all", i);
		genbank[Reg.PC] = new ProgramCounter ("all", Reg.PC);
		genbank[Reg.CPSR] = new StatusRegister ("all", Reg.CPSR, 0xd3);
		genbank[Reg.SPSR] = null;

		for (var key in Mode)
		{
			if (Mode.hasOwnProperty (key))
			{
				var mode = Mode[key];
				rb[mode] = genbank.slice (0);
			}
		}

		// create mode-specific registers
		var msmap = {
			"svc": Mode.SVC,
			"abt": Mode.ABT,
			"und": Mode.UND,
			"irq": Mode.IRQ,
			"fiq": Mode.FIQ
		};

		for (var name in msmap)
		{
			if (msmap.hasOwnProperty (name))
			{
				var num = msmap[name];
				var bank = rb[num];
				bank[Reg.R13] = new Register (name, Reg.R13);
				bank[Reg.R14] = new Register (name, Reg.R14);
				bank[Reg.SPSR] = new StatusRegister (name, Reg.SPSR);
			}
		}

		// more registers for FIQ mode
		for (var i = Reg.R8; i <= Reg.R12; i++)
			rb[Mode.FIQ][i] = new Register ("fiq", i);

		// remember commonly used registers
		this.lr = genbank[Reg.LR];
		this.pc = genbank[Reg.PC];
		this.cpsr = genbank[Reg.CPSR];

		// control register(s)
		this.creg = new ControlRegister ();

		// memory management
		this.mmu = new CPU.MMU (this, pmem);

		// interrupt controller
		this.vic = vic;

		// instruction execution
		this.info = {
			Rn: null,
			Rd: null,
			Rs: null,
			Rm: null
		};
	}

	Core.prototype.getRegBank = function () {
		return this.regbanks[this.cpsr.getMode()];
	};

	Core.prototype.getReg = function (n) {
		return this.getRegBank()[n];
	};

	CPU.Core = Core;

})();
(function () {

	var Core = CPU.Core;

	var instructionTable = Core.instructionTable = [];

	Core.registerInstruction = function (func, ident1, ident2, uncond) {

		if (typeof ident1 === 'object')
		{
			if (ident1.first && ident1.last)
			{
				for (var i = ident1.first; i <= ident1.last; i++)
					Core.registerInstruction (func, i, ident2, uncond);
			}
			else
			{
				for (var i = 0; i < ident1.length; i++)
					Core.registerInstruction (func, ident1[i], ident2, uncond);
			}
			return;
		}

		if (typeof ident2 === 'object')
		{
			if (ident2.first && ident2.last)
			{
				for (var i = ident2.first; i <= ident2.last; i++)
					Core.registerInstruction (func, ident1, i, uncond);
			}
			else
			{
				for (var i = 0; i < ident2.length; i++)
					Core.registerInstruction (func, ident1, ident2[i], uncond);
			}
			return;
		}

		if (ident2 < 0)
		{
			for (var i = 0; i < 16; i++)
				Core.registerInstruction (func, ident1, i, uncond);
			return;
		}

		uncond = Boolean (uncond);
		var ident = (uncond << 12) | (ident1 << 4) | (ident2);

		if (instructionTable[ident] && instructionTable[ident] !== func)
			throw "reregistration of instruction!";
		instructionTable[ident] = func;
	};

})();
(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_CLZ, 0x16, 1, false);
	function inst_CLZ (inst, info)
	{
		var x = info.Rm.get ();

		x |= x >>> 1;
		x |= x >>> 2;
		x |= x >>> 4;
		x |= x >>> 8;
		x |= x >>> 16;

		x -= (x >>> 1) & 0x55555555;
		x = ((x >>> 2) & 0x33333333) + (x & 0x33333333);
		x = ((x >>> 4) + x) & 0x0F0F0F0F;
		x = ((x >>> 8) + x) & 0x00FF00FF;
		x = ((x >>> 16) + x) & 0x0000FFFF;

		info.Rd.set (32 - x);
	}

})();
(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_B, {first: 0xa0, last: 0xaf}, -1, false);
	function inst_B (inst, info)
	{
		var offset = (inst << 8) >> 6;
		this.pc.set (this.pc.get () + offset);
	}

	Core.registerInstruction (inst_BL, {first: 0xb0, last: 0xbf}, -1, false);
	function inst_BL (inst, info)
	{
		var offset = (inst << 8) >> 6;
		this.getReg (CPU.Reg.LR).set (this.pc._value);
		this.pc.set (this.pc.get () + offset);
	}

	Core.registerInstruction (inst_BX, 0x12, 1, false);
	function inst_BX (inst, info)
	{
		// FIXME: thumb?
		this.pc.set (info.Rm.get () & ~0x03);
	}

	Core.registerInstruction (inst_BLX, 0x12, 3, false);
	function inst_BLX (inst, info)
	{
		// FIXME: thumb?
		this.getReg (CPU.Reg.LR).set (this.pc._value);
		this.pc.set (info.Rm.get () & ~0x03);
	}

})();
(function () {

	var Core = CPU.Core;

	var coprocessors = [];

	coprocessors[15] = {
		read: function (cpu, n, m, o1, o2) {
			if (n == 0)
			{
				if (o2 == 0)
				{
					// system ID
					return 0x41069260;
				}
				else if (o2 == 1)
				{
					// cache type (none)
					return 0x01004004;
				}
			}
			else if (n == 1)
			{
				if (o2 == 0)
				{
					return cpu.creg._value;
				}
			}
			else if (n == 5)
			{
				if (o2 == 0)
				{
					return cpu.mmu.regFaultStatus;
				}
			}
			else if (n == 6)
			{
				if (o2 == 0)
				{
					return cpu.mmu.regFaultAddress;
				}
			}
			else if (n == 7)
			{
				if (m == 14 && o2 == 3)
				{
					// test, clean, and invalidate data cache
					return CPU.Status.ALL;
				}
			}
			throw "bad CP15 read: n=" + n + ", m=" + m +
				", o1=" + o1 + ", o2=" + o2;
		},
		write: function (cpu, n, m, o1, o2, data) {
			if (n == 1)
			{
				if (o2 == 0)
				{
					if (data & ~CPU.Control.ALL)
					{
						throw "attempted to set undefined control bits: " +
							Util.hex32 (data & ~CPU.Control.ALL);
					}
					cpu.creg._value = data;
					return;
				}
			}
			else if (n == 2)
			{
				cpu.mmu.regTable = data;
				return;
			}
			else if (n == 3)
			{
				cpu.mmu.regDomain = data;
				return;
			}
			else if (n == 7)
			{
				if (m == 5 && o2 == 0)
				{
					// FIXME: invalidate entire instruction cache
					return;
				}
				else if (m == 5 && o2 == 1)
				{
					// FIXME: invalidate instruction cache line (MVA)
					return;
				}
				else if (m == 7 && o2 == 0)
				{
					// FIXME: invalidate all caches
					return;
				}
				else if (m == 10 && o2 == 1)
				{
					// FIXME: clean data cache line (MVA)
					return;
				}
				else if (m == 10 && o2 == 2)
				{
					// FIXME: clean data cache line (set/way)
					return;
				}
				else if (m == 10 && o2 == 4)
				{
					// FIXME: data sync barrier
					return;
				}
				else if (m == 14 && o2 == 1)
				{
					// FIXME: clean and invalidate data cache line (MVA)
					return;
				}
			}
			else if (n == 8)
			{
				if (m == 5 && o2 == 0)
				{
					// FIXME: invalidate entire instruction TLB
					return;
				}
				else if (m == 6 && o2 == 0)
				{
					// FIXME: invalidate entire data TLB
					return;
				}
				else if (m == 6 && o2 == 2)
				{
					// FIXME: invalidate on ASID match data TLB
					return;
				}
				else if (m == 7 && o2 == 0)
				{
					// FIXME: invalidate all TLBs
					return;
				}
			}
			throw "bad CP15 write: n=" + n + ", m=" + m +
				", o1=" + o1 + ", o2=" + o2;
		}
	};

	Core.registerInstruction (inst_MRC,
		[0xE1, 0xE3, 0xE5, 0xE7, 0xE9, 0xEB, 0xED, 0xEF],
		[1, 3, 5, 7, 9, 11, 13, 15],
		false
	);
	function inst_MRC (inst, info)
	{
		var cp_num = (inst >>> 8) & 0x0F;
		var opcode_1 = (inst >>> 21) & 0x07;
		var CRn = info.Rn.index;
		var CRm = info.Rm.index;
		var opcode_2 = (inst >>> 5) & 0x07;

		var coprocessor = coprocessors[cp_num];
		if (!coprocessor)
			throw "bad coprocessor number";

		var Rd = info.Rd;
		var data = coprocessor.read (this, CRn, CRm, opcode_1, opcode_2);
		if (Rd.index == CPU.Reg.PC)
		{
			var mask = CPU.Status.ALL;
			var cpsr = this.cpsr;
			cpsr._value = (cpsr._value & ~mask) | (data & mask);
		}
		else
		{
			info.Rd.set (data);
		}
	}

	Core.registerInstruction (inst_MCR,
		[0xE0, 0xE2, 0xE4, 0xE6, 0xE8, 0xEA, 0xEC, 0xEE],
		[1, 3, 5, 7, 9, 11, 13, 15],
		false
	);
	function inst_MCR (inst, info)
	{
		var cp_num = (inst >>> 8) & 0x0F;
		var opcode_1 = (inst >>> 21) & 0x07;
		var CRn = info.Rn.index;
		var CRm = info.Rm.index;
		var opcode_2 = (inst >>> 5) & 0x07;

		var coprocessor = coprocessors[cp_num];
		if (!coprocessor)
			throw "bad coprocessor number";

		coprocessor.write (this, CRn, CRm, opcode_1, opcode_2, info.Rd.get ());
	}

})();
(function () {

	var Core = CPU.Core;

	function registerData (func, base)
	{
		// immediate
		Core.registerInstruction (func, [base | 0x20, base | 0x21], -1, false);
		// register
		var ident2 = [0, 2, 4, 6, 8, 10, 12, 14, 1, 3, 5, 7];
		Core.registerInstruction (func, [base, base | 0x01], ident2, false);
	}

	function doData (cpu, inst, info, write, func, flagsfunc)
	{
		/** @const */ var I = 1 << 25;
		/** @const */ var S = 1 << 20;
		/** @const */ var SHIFT_BY_REGISTER = 1 << 4;

		var cflag = !!(cpu.cpsr._value & CPU.Status.C);

		// first decode shifter operand
		var shifter_operand = 0;
		var shifter_carry_out = false;

		if (inst & I)
		{
			// immediate
			var rotate_imm = (inst >>> 8) & 0x0F;
			var immed_8 = inst & 0xFF;
			shifter_operand = Util.rotRight (immed_8, rotate_imm * 2);
			if (rotate_imm != 0)
				shifter_carry_out = shifter_operand & (1 << 31);
		}
		else
		{
			// register
			var shift = (inst >>> 5) & 0x03;
			var sval;
			if (inst & SHIFT_BY_REGISTER)
			{
				sval = info.Rs.get () & 0xFF;
			}
			else
			{
				var shift_imm = (inst >>> 7) & 0x1F;
				if (shift_imm != 0)
					sval = shift_imm;
				else
					sval = [0, 32, 32, -1][shift];
			}

			var rm = info.Rm.get ();
			switch (shift)
			{
				case 0:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm << sval;
						shifter_carry_out = rm & (1 << (32 - sval));
					}
					else if (sval == 32)
					{
						shifter_operand = 0;
						shifter_carry_out = rm & (1 << 0);
					}
					break;
				case 1:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm >>> sval;
						shifter_carry_out = rm & (1 << (sval - 1));
					}
					else if (sval == 32)
					{
						shifter_operand = 0;
						shifter_carry_out = rm & (1 << 31);
					}
					break;
				case 2:
					if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (sval < 32)
					{
						shifter_operand = rm >> sval;
						shifter_carry_out = rm & (1 << (sval - 1));
					}
					else
					{
						shifter_carry_out = rm & (1 << 31);
						shifter_operand = shifter_carry_out ? -1 : 0;
					}
					break;
				case 3:
					var ssub = sval & 0x1F;
					if (sval == -1)
					{
						shifter_operand = (cflag << 31) | (rm >>> 1);
						shifter_carry_out = rm & (1 << 0);
					}
					else if (sval == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = cflag;
					}
					else if (ssub == 0)
					{
						shifter_operand = rm;
						shifter_carry_out = rm & (1 << 31);
					}
					else
					{
						shifter_operand = Util.rotRight (rm, ssub);
						shifter_carry_out = rm & (1 << (ssub - 1));
					}
					break;
			}
		}

		shifter_operand >>>= 0;
		shifter_carry_out = !!shifter_carry_out;

		// do the actual operation
		var a = info.Rn.get () >>> 0;
		var b = shifter_operand >>> 0;
		var r = func (a, b) >>> 0;

		if (write)
			info.Rd.set (r);

		if (write && (inst & S) && (info.Rd.index == 15))
		{
			var spsr = cpu.getReg (CPU.Reg.SPSR);
			if (spsr)
				cpu.cpsr._value = spsr._value;
			else
				throw "attempted to set CPSR to SPSR when no SPSR exists";
		}
		else if (inst & S)
		{
			var orig = cpu.cpsr._value >>> 0;
			cpu.cpsr._value = (
				(orig & ~CPU.Status.ALL) |
				flagsfunc (a, b, r, shifter_carry_out, orig)
			) >>> 0;
		}
	}

	function commonFlagsFunc (a, b, r, sco, orig)
	{
		return (
			(r & (1 << 31) ? CPU.Status.N : 0) |
			(r == 0 ? CPU.Status.Z : 0) |
			(sco ? CPU.Status.C : 0) |
			(orig & CPU.Status.V)
		);
	}

	function addFlagsFunc (a, b, r, sco, orig)
	{
		var a31 = !!(a & (1 << 31));
		var b31 = !!(b & (1 << 31));
		var r31 = !!(r & (1 << 31));
		return (
			(r & (1 << 31) ? CPU.Status.N : 0) |
			(r == 0 ? CPU.Status.Z : 0) |
			((a31 && b31) || (b31 && !r31) || (!r31 && a31) ? CPU.Status.C : 0) |
			((a31 == b31) && (a31 != r31) ? CPU.Status.V : 0)
		);
	}

	function subFlagsFunc (a, b, r, sco, orig)
	{
		var a31 = !!(a & (1 << 31));
		var b31 = !!(b & (1 << 31));
		var r31 = !!(r & (1 << 31));
		return (
			(r & (1 << 31) ? CPU.Status.N : 0) |
			(r == 0 ? CPU.Status.Z : 0) |
			((a31 || !b31) && (!b31 || !r31) && (!r31 || a31) ? CPU.Status.C : 0) |
			((a31 != b31) && (a31 != r31) ? CPU.Status.V : 0)
		);
	}

	function rsbFlagsFunc (a, b, r, sco, orig)
	{
		return subFlagsFunc (b, a, r, sco, orig);
	}

	registerData (inst_AND, 0x00);
	function inst_AND (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a & b; },
			commonFlagsFunc
		);
	}

	registerData (inst_EOR, 0x02);
	function inst_EOR (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a ^ b; },
			commonFlagsFunc
		);
	}

	registerData (inst_SUB, 0x04);
	function inst_SUB (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a - b; },
			subFlagsFunc
		);
	}

	registerData (inst_RSB, 0x06);
	function inst_RSB (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return b - a; },
			rsbFlagsFunc
		);
	}

	registerData (inst_ADD, 0x08);
	function inst_ADD (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a + b; },
			addFlagsFunc
		);
	}

	registerData (inst_ADC, 0x0a);
	function inst_ADC (inst, info)
	{
		var c = !!(this.cpsr._value & CPU.Status.C);
		doData (
			this, inst, info, true,
			c ?
				function (a, b) { return a + b + 1; } :
				function (a, b) { return a + b; },
			addFlagsFunc
		);
	}

	registerData (inst_SBC, 0x0c);
	function inst_SBC (inst, info)
	{
		var c = !!(this.cpsr._value & CPU.Status.C);
		doData (
			this, inst, info, true,
			c ? 
				function (a, b) { return a - b; } :
				function (a, b) { return a - b - 1; },
			subFlagsFunc
		);
	}

	registerData (inst_RSC, 0x0e);
	function inst_RSC (inst, info)
	{
		var c = !!(this.cpsr._value & CPU.Status.C);
		doData (
			this, inst, info, true,
			c ? 
				function (a, b) { return b - a; } :
				function (a, b) { return b - a - 1; },
			rsbFlagsFunc
		);
	}

	registerData (inst_TST, 0x11);
	function inst_TST (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a & b; },
			commonFlagsFunc
		);
	}

	registerData (inst_TEQ, 0x13);
	function inst_TEQ (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a ^ b; },
			commonFlagsFunc
		);
	}

	registerData (inst_CMP, 0x15);
	function inst_CMP (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a - b; },
			subFlagsFunc
		);
	}

	registerData (inst_CMN, 0x17);
	function inst_CMN (inst, info)
	{
		doData (
			this, inst, info, false,
			function (a, b) { return a + b; },
			addFlagsFunc
		);
	}

	registerData (inst_ORR, 0x18);
	function inst_ORR (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a | b; },
			commonFlagsFunc
		);
	}

	registerData (inst_MOV, 0x1a);
	function inst_MOV (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return b; },
			commonFlagsFunc
		);
	}

	registerData (inst_BIC, 0x1c);
	function inst_BIC (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return a & ~b; },
			commonFlagsFunc
		);
	}

	registerData (inst_MVN, 0x1e);
	function inst_MVN (inst, info)
	{
		doData (
			this, inst, info, true,
			function (a, b) { return ~b; },
			commonFlagsFunc
		);
	}

})();
(function () {

	var Core = CPU.Core;

	function doMultiple (cpu, inst, info, func)
	{
		/** @const */ var W = 1 << 21;

		var nr = inst & 0xFFFF;
		nr = nr - ((nr >>> 1) & 0x5555);
		nr = ((nr >>> 2) & 0x3333) + (nr & 0x3333);
		nr = ((nr >>> 4) + nr) & 0x0F0F;
		nr = ((nr >>> 8) + nr) & 0x00FF;
		var nr4 = nr << 2;

		var start_address, end_address;

		var Rn = info.Rn;
		var n = Rn.get ();
		if ((n & 0x03) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		var pu = (inst >>> 23) & 0x03;
		switch (pu)
		{
			case 0:
				start_address = n - nr4 + 4;
				end_address = n;
				break;
			case 1:
				start_address = n;
				end_address = n + nr4 - 4;
				break;
			case 2:
				start_address = n - nr4;
				end_address = n - 4;
				break;
			case 3:
				start_address = n + 4;
				end_address = n + nr4;
				break;
		}

		start_address = (start_address & ~0x03) >>> 0;
		end_address = (end_address & ~0x03) >>> 0;

		func (start_address, end_address, inst & 0xFFFF, cpu.getRegBank (), cpu.mmu);

		if (inst & W)
		{
			if (pu & 0x01)
				Rn.set (n + nr4);
			else
				Rn.set (n - nr4);
		}
	}

	Core.registerInstruction (inst_LDM_1, [0x81, 0x83, 0x89, 0x8B, 0x91, 0x93, 0x99, 0x9B],
		-1, false);
	function inst_LDM_1 (inst, info)
	{
		doMultiple (
			this, inst, info,
			function (start_address, end_address, register_list, bank, mmu)
			{
				var address = start_address;
				for (var i = 0; i <= 14; i++)
				{
					if (register_list & (1 << i))
					{
						bank[i].set (mmu.read32 (address));
						address += 4;
					}
				}

				if (register_list & (1 << 15))
				{
					// FIXME: thumb?
					bank[CPU.Reg.PC].set (mmu.read32 (address) & ~0x3);
					address += 4;
				}
				
				if (end_address != address - 4)
					throw "LDM(1) memory assertion error";
			}
		);
	}

	Core.registerInstruction (inst_LDM_3, [0x85, 0x87, 0x8D, 0x8F, 0x95, 0x97, 0x9D, 0x9F],
		-1, false);
	function inst_LDM_3 (inst, info)
	{
		doMultiple (
			this, inst, info,
			function (start_address, end_address, register_list, bank, mmu)
			{
				var address = start_address;
				for (var i = 0; i <= 14; i++)
				{
					if (register_list & (1 << i))
					{
						bank[i].set (mmu.read32 (address));
						address += 4;
					}
				}

				var cpsr = bank[CPU.Reg.CPSR];
				var spsr = bank[CPU.Reg.SPSR];
				if (spsr)
					cpsr._value = spsr._value;
				else
					throw "LDM(3) without SPSR";

				if (register_list & (1 << 15))
				{
					// FIXME: thumb?
					bank[CPU.Reg.PC].set (mmu.read32 (address) & ~0x3);
					address += 4;
				}
				else
				{
					throw "LDM(3) without PC";
				}

				if (end_address != address - 4)
					throw "LDM(3) memory assertion error";
			}
		);
	}

	Core.registerInstruction (inst_STM_1, [0x80, 0x82, 0x88, 0x8A, 0x90, 0x92, 0x98, 0x9A],
		-1, false);
	function inst_STM_1 (inst, info)
	{
		doMultiple (
			this, inst, info,
			function (start_address, end_address, register_list, bank, mmu)
			{
				var address = start_address;
				for (var i = 0; i <= 15; i++)
				{
					if (register_list & (1 << i))
					{
						mmu.write32 (address, bank[i].get ());
						address += 4;
					}
				}

				if (end_address != address - 4)
					throw "STM(1) memory assertion error";
			}
		);
	}

})();
(function () {

	var Core = CPU.Core;

	function registerAccess (func, load, bite, user)
	{
		/** @const */ var P = 0x10;
		/** @const */ var U = 0x08;
		/** @const */ var B = 0x04;
		/** @const */ var W = 0x02;
		/** @const */ var L = 0x01;

		var base = 0x40 | (load ? L : 0) | (bite ? B : 0);

		var ident1;
		if (user)
			ident1 = [base | W];
		else
			ident1 = [base, base | P, base | W | P];

		// add U flag
		var len = ident1.length;
		for (var i = 0; i < len; i++)
			ident1.push (ident1[i] | U);

		// immediate
		Core.registerInstruction (func, ident1, -1, false);
		
		// register
		for (var i = 0; i < ident1.length; i++)
			ident1[i] |= 0x20;
		Core.registerInstruction (func, ident1, [0, 2, 4, 6, 8, 10, 12, 14], false);
	}

	function doAccess (cpu, inst, info, alignment, func)
	{
		/** @const */ var P = 1 << 24;
		/** @const */ var U = 1 << 23;
		/** @const */ var W = 1 << 21;
		/** @const */ var NOT_I = 1 << 25;

		var Rn = info.Rn;
		var n = Rn.get ();

		var index;
		if (inst & NOT_I)
		{
			// register offset
			var m = info.Rm.get ();
			var shift = (inst >>> 5) & 0x03;
			var shift_imm = (inst >>> 7) & 0x1F;
			switch (shift)
			{
				case 0:
					index = m << shift_imm;
					break;
				case 1:
					if (shift_imm == 0)
						index = 0;
					else
						index = m >>> shift_imm;
					break;
				case 2:
					if (shift_imm == 0)
						index = (m & (1 << 31)) ? -1 : 0;
					else
						index = m >> shift_imm;
					break;
				case 3:
					if (shift_imm == 0)
						index = (!!(cpu.cpsr._value & CPU.Status.C) << 31) | (m >>> 1);
					else
						index = Util.rotRight (m, shift_imm);
					break;
			}
		}
		else
		{
			// immediate offset
			index = inst & 0x0FFF;
		}

		if (!(inst & U))
			index = -index;

		var p = !!(inst & P);
		var w = !!(inst & W);

		var address = p ? n + index : n;
		address >>>= 0;

		if ((address & (alignment - 1)) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		func (address, info.Rd, cpu.mmu);

		if (p && w)
			Rn.set (address);
		else if (!p)
			Rn.set (address + index);
	}

	registerAccess (inst_LDR, true, false, false);
	function inst_LDR (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: assumed that U == 0
				var data = mmu.read32 (address & ~0x03);
				data = Util.rotRight (data, 8 * (address & 0x03));

				if (Rd.index == 15)
				{
					// FIXME: thumb?
					Rd.set (data & ~0x03);
				}
				else
				{
					Rd.set (data);
				}
			}
		);
	}

	registerAccess (inst_STR, false, false, false);
	function inst_STR (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: armv5 specific
				mmu.write32 (address & ~0x03, Rd.get ());
			}
		);
	}

	registerAccess (inst_LDRB, true, true, false);
	function inst_LDRB (inst, info)
	{
		doAccess (
			this, inst, info, 1,
			function (address, Rd, mmu) {
				Rd.set (mmu.read8 (address));
			}
		);
	}

	registerAccess (inst_STRB, false, true, false);
	function inst_STRB (inst, info)
	{
		doAccess (
			this, inst, info, 1,
			function (address, Rd, mmu) {
				mmu.write8 (address, Rd.get () & 0xFF);
			}
		);
	}

	registerAccess (inst_LDRT, true, false, true);
	function inst_LDRT (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: assumed that U==0
				var data = mmu.read32 (address & ~0x03, true);
				data = Util.rotRight (data, 8 * (address & 0x03));
				Rd.set (data); // unpredictable if Rd is PC
			}
		);
	}

	registerAccess (inst_STRT, false, false, true);
	function inst_STRT (inst, info)
	{
		doAccess (
			this, inst, info, 4,
			function (address, Rd, mmu) {
				// FIXME: armv5 specific
				mmu.write32 (address & ~0x03, Rd.get (), true);
			}
		);
	}

	registerAccess (inst_LDRBT, true, true, true);
	function inst_LDRBT (inst, info)
	{
		doAccess (
			this, inst, info, 1,
			function (address, Rd, mmu) {
				Rd.set (mmu.read8 (address, true));
			}
		);
	}

	Core.registerInstruction (inst_PLD, [0x55, 0x5D], -1, true);
	Core.registerInstruction (inst_PLD, [0x75, 0x7D], [0, 2, 4, 6, 8, 10, 12, 14], true);
	function inst_PLD (inst, info)
	{
		// only to do pre/post-index
		doAccess (this, inst, info, 1, function () {});
	}

})();
(function () {

	var Core = CPU.Core;

	function registerMiscAccess (func, load, ident2)
	{
		var base = load ? 0x01 : 0x00;
		for (var i = 0; i < 32; i += 2)
		{
			var ident1 = base | i;
			Core.registerInstruction (func, ident1, ident2, false);
		}
	}

	function doMiscAccess (cpu, inst, info, alignment, func)
	{
		/** @const */ var I = 1 << 22;
		/** @const */ var P = 1 << 24;
		/** @const */ var U = 1 << 23;
		/** @const */ var W = 1 << 21;

		var Rn = info.Rn;
		var n = Rn.get ();

		var index;
		if (inst & I)
			index = ((inst >>> 4) & 0xF0) | (inst & 0x0F);
		else
			index = info.Rm.get ();

		if (!(inst & U))
			index = -index;

		var p = !!(inst & P);
		var w = !!(inst & W);

		var address = p ? n + index : n;
		address >>>= 0;

		if ((address & (alignment - 1)) && (cpu.creg._value & CPU.Control.A))
			throw "access alignment fault";

		func (address, info.Rd, cpu.mmu, cpu);

		if (p && w)
			Rn.set (address);
		else if (!p)
			Rn.set (address + index);
	}

	registerMiscAccess (inst_LDRH, true, 11);
	function inst_LDRH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable LDRH";
				Rd.set (mmu.read16 (address));
			}
		);
	}

	registerMiscAccess (inst_STRH, false, 11);
	function inst_STRH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable STRH";
				mmu.write16 (address, Rd.get ());
			}
		);
	}

	// LDRD is actually encoded as a non-load instruction
	registerMiscAccess (inst_LDRD, false /* WTF */, 13);
	function inst_LDRD (inst, info)
	{
		doMiscAccess (
			this, inst, info, 8,
			function (address, Rd, mmu, cpu) {
				if (address & 0x07)
					throw "unpredictable LDRD";
				if ((Rd.index & 0x01) || (Rd.index == 14))
					throw "unpredictable LDRD";
				Rd.set (mmu.read32 (address));
				cpu.getReg (Rd.index + 1).set (mmu.read32 (address + 4));
			}
		);
	}

	registerMiscAccess (inst_LDRSB, true, 13);
	function inst_LDRSB (inst, info)
	{
		doMiscAccess (
			this, inst, info, 1,
			function (address, Rd, mmu, cpu) {
				Rd.set (mmu.read8 (address) << 24 >> 24);
			}
		);
	}

	registerMiscAccess (inst_STRD, false, 15);
	function inst_STRD (inst, info)
	{
		doMiscAccess (
			this, inst, info, 8,
			function (address, Rd, mmu, cpu) {
				if (address & 0x07)
					throw "unpredictable STRD";
				if ((Rd.index & 0x01) || (Rd.index == 14))
					throw "unpredictable STRD";
				mmu.write32 (address, Rd.get ());
				mmu.write32 (address + 4, cpu.getReg (Rd.index + 1).get ());
			}
		);
	}

	registerMiscAccess (inst_LDRSH, true, 15);
	function inst_LDRSH (inst, info)
	{
		doMiscAccess (
			this, inst, info, 2,
			function (address, Rd, mmu, cpu) {
				if (address & 0x01)
					throw "unpredictable LDRSH";
				Rd.set (mmu.read16 (address) << 16 >> 16);
			}
		);
	}

})();
(function () {

	var Core = CPU.Core;

	function mult32 (p, q)
	{
		var a = p >>> 16;
		var b = p & 0xFFFF;
		var c = q >>> 16;
		var d = q & 0xFFFF;

		var r = ((a * d + b * c) << 16) + (b * d);
		return r >>> 0;
	}

	function umult64 (p, q)
	{
		var a = p >>> 16;
		var b = p & 0xFFFF;
		var c = q >>> 16;
		var d = q & 0xFFFF;

		// multiply base parts
		var lo = b * d;
		var hi = a * c;

		// add middle part
		var mid = a * d + b * c;
		hi += (mid > 0xFFFFFFFF) ? 0x10000 : 0;
		lo += (mid << 16) >>> 0;
		hi += (mid >>> 16);

		// do carry
		hi += (lo > 0xFFFFFFFF) ? 1 : 0;

		// truncate
		lo >>>= 0;
		hi >>>= 0;

		return {lo: lo, hi: hi};
	}

	function smult64 (p, q)
	{
		var ret = umult64 (Math.abs (p), Math.abs (q));
		if ((p ^ q) & (1 << 31))
		{
			// flip
			ret.hi = ~ret.hi >>> 0;
			ret.lo = -ret.lo >>> 0;
			if (ret.lo == 0) // carry
				ret.hi = (ret.hi + 1) >>> 0;
		}
		return ret;
	}

	function setFlags (cpu, nin, z)
	{
		var val = cpu.cpsr._value;
		val = (val & ~(CPU.Status.N | CPU.Status.Z)) |
			(nin & (1 << 31) ? CPU.Status.N : 0) |
			(z ? CPU.Status.Z : 0);
		cpu.cpsr._value = val;
	}

	/** @const */ var S = 1 << 20;

	Core.registerInstruction (inst_MUL, [0x00, 0x01], 9, false);
	function inst_MUL (inst, info)
	{
		// Rn and Rd are swapped
		var Rd = info.Rn;
		var Rs = info.Rs;
		var Rm = info.Rm;

		var res = mult32 (Rm.get (), Rs.get ());
		Rd.set (res);
		if (inst & S)
			setFlags (this, res, res == 0);
	}

	Core.registerInstruction (inst_MLA, [0x02, 0x03], 9, false);
	function inst_MLA (inst, info)
	{
		// Rn and Rd are swapped
		var Rn = info.Rd;
		var Rd = info.Rn;
		var Rs = info.Rs;
		var Rm = info.Rm;

		var res = mult32 (Rm.get (), Rs.get ()) + Rn.get ();
		Rd.set (res);
		if (inst & S)
			setFlags (this, res, res == 0);
	}

	Core.registerInstruction (inst_SMULL_UMULL_SMLAL_UMLAL,
		[0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F], 9, false);
	function inst_SMULL_UMULL_SMLAL_UMLAL (inst, info)
	{
		/** @const */ var S = 1 << 20;
		/** @const */ var ACCUM = 1 << 21;
		/** @const */ var SIGNED = 1 << 22;

		var RdHi = info.Rn;
		var RdLo = info.Rd;
		var Rs = info.Rs;
		var Rm = info.Rm;
		
		var p = Rm.get (), q = Rs.get ();
		var r = (inst & SIGNED) ? smult64 (p, q) : umult64 (p, q);

		var tlo = r.lo;
		var thi = r.hi;

		if (inst & ACCUM)
		{
			tlo += RdLo.get ();
			thi += RdHi.get () + (tlo > 0xFFFFFFFF ? 1 : 0);
		}

		RdLo.set (tlo);
		RdHi.set (thi);

		if (inst & S)
			setFlags (this, thi, (tlo == 0) && (thi == 0));
	}

})();
(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_SWP, 0x10, 9, false);
	function inst_SWP (inst, info)
	{
		var address = info.Rn.get ();
		if ((address & 0x03) && (this.creg._value & CPU.Control.A))
			throw "swp alignment fault";

		// assumed that U==0
		var temp = this.mmu.read32 (address & ~0x03);
		temp = Util.rotRight (temp, 8 * (address & 0x03));
		this.mmu.write32 (address & ~0x03, info.Rm.get ());
		info.Rd.set (temp);
	}

})();
(function () {

	var Core = CPU.Core;

	Core.registerInstruction (inst_MRS_CPSR, 0x10, 0, false);
	function inst_MRS_CPSR (inst, info) { info.Rd.set (this.cpsr.get ()); }

	Core.registerInstruction (inst_MRS_SPSR, 0x14, 0, false);
	function inst_MRS_SPSR (inst, info)
	{	
		var spsr = this.getReg (CPU.Reg.SPSR);
		if (!spsr)
			throw "attempted to read non-existent SPSR";
		info.Rd.set (spsr.get ());
	}

	Core.registerInstruction (inst_MSR, [0x32, 0x36], -1, false);
	Core.registerInstruction (inst_MSR, [0x12, 0x16], 0, false);
	function inst_MSR (inst, info)
	{
		// masks for armv4
		/** @const */ var UnallocMask = 0x0FFFFF20;
		/** @const */ var UserMask = 0xF0000000;
		/** @const */ var PrivMask = 0x000000DF;
		/** @const */ var StateMask = 0x00000000;

		/** @const */ var I = 1 << 25;
		/** @const */ var R = 1 << 22;

		var field_mask = (inst >>> 16) & 0x0F;
		var operand;

		if (inst & I)
		{
			var immed_8 = inst & 0xFF;
			var rotate_imm = (inst >>> 8) & 0x0F;
			operand = Util.rotRight (immed_8, rotate_imm * 2);
		}
		else
		{
			operand = info.Rm.get ();
		}

		if (operand & UnallocMask)
			throw "attempted to set reserved PSR bits";

		var byte_mask =
			(inst & (1 << 16) ? 0x000000FF : 0) |
			(inst & (1 << 17) ? 0x0000FF00 : 0) |
			(inst & (1 << 18) ? 0x00FF0000 : 0) |
			(inst & (1 << 19) ? 0xFF000000 : 0);
		var mask;

		if (inst & R)
		{
			var spsr = this.getReg (CPU.Reg.SPSR);
			if (!spsr)
				throw "attempted to read non-existent SPSR";

			mask = byte_mask & (UserMask | PrivMask | StateMask);
			spsr._value = (spsr._value & ~mask) | (operand & mask);
		}
		else
		{
			if (this.cpsr.getMode () != CPU.Mode.USR)
			{
				if (operand & StateMask)
					throw "attempted to set non-ARM state";
				else
					mask = byte_mask & (UserMask | PrivMask);
			}
			else
				mask = byte_mask & UserMask;
			this.cpsr._value = (this.cpsr._value & ~mask) | (operand & mask);
		}
	}

})();
(function () {

	/** @const */ var PSR_I = 1 << 7;
	/** @const */ var PSR_F = 1 << 6;

	var Core = CPU.Core;

	var instructionTable = Core.instructionTable;

	function evaluateCondition (cond, cpsr)
	{
		var val = cpsr._value;
		var N = !!(val & CPU.Status.N);
		var Z = !!(val & CPU.Status.Z);
		var C = !!(val & CPU.Status.C);
		var V = !!(val & CPU.Status.V);

		switch (cond)
		{
			case 0: return Z;
			case 1: return !Z;
			case 2: return C;
			case 3: return !C;
			case 4: return N;
			case 5: return !N;
			case 6: return V;
			case 7: return !V;
			case 8: return C && !Z;
			case 9: return !C || Z;
			case 10: return N == V;
			case 11: return N != V;
			case 12: return !Z && (N == V);
			case 13: return Z || (N != V);
			case 14: return true;
			case 15: return true;
			default: throw "unhandled condition";
		}
	}

	Core.prototype.enterException = function (mode, vect, target, nofiq) {

		var cpsr = this.cpsr;
		var creg = this.creg;

		// save cpsr
		var spsr = cpsr._value;

		// set cpsr (FIXME: thumb?)
		cpsr._value = (cpsr._value & ~0x1F) | (mode & 0x1F); // set mode
		cpsr._value |= PSR_I | (nofiq ? PSR_F : 0); // disable interrupts

		// then return target (+4)
		this.getReg (CPU.Reg.LR).set (target + 4);

		// then SPSR
		this.getReg (CPU.Reg.SPSR).set (spsr);

		// do jump
		this.pc.set (vect | (creg._value & CPU.Control.V ? 0xFFFF0000 : 0));
	};

	Core.prototype.tick = function () {

		var cpsr = this.cpsr;

		// check for interrupts
		var vic = this.vic;

		var iss = (vic.intLines | vic.regSoftLines) & vic.regIntEnable;
		var ris = vic.regIntSelect;

		if ((iss & ris) && !(cpsr._value & PSR_F))
		{
			this.enterException (CPU.Mode.FIQ, 0x1C, this.pc._value, true);
			return;
		}

		if ((iss & ~ris) && !(cpsr._value & PSR_I))
		{
			this.enterException (CPU.Mode.IRQ, 0x18, this.pc._value, false);
			return;
		}

		// only run after that
		var inst = this.mmu.read32 (this.pc._value);
		this.pc._value += 4;

		var cond = inst >>> 28;
		if (cond < 14 && !evaluateCondition (cond, cpsr))
			return;

		var ident = 
			((cond == 15) << 12) |
			((inst >>> 16) & 0x0FF0) |
			((inst >>> 4) & 0x0F);

		var func = instructionTable[ident];

		if (!func)
		{
			var ident1 = (ident >>> 4) & 0xFF;;
			var ident2 = ident & 0x0F;
			var uncond = (cond == 15);

			var msg = 'undefined instruction at ' + Util.hex32 (this.pc._value - 4) +
				' : ' + Util.hex32 (inst);
			console.log (msg);
			console.log ('ident1 = 0x' + ident1.toString (16));
			console.log ('ident2 = 0x' + ident2.toString (16));
			console.log ('unconditional = ' + uncond);
			throw msg;
		}

		var bank = this.getRegBank ();
		var info = this.info;
		info.Rn = bank[(inst >>> 16) & 0x0F];
		info.Rd = bank[(inst >>> 12) & 0x0F];
		info.Rs = bank[(inst >>>  8) & 0x0F];
		info.Rm = bank[(inst       ) & 0x0F];

		try {
			func.call (this, inst, info);
		} catch (e) {
			// closure compiler workaround
			if ((e === CPU.DataAbort) || (e instanceof CPU.DataAbort))
			{
				// FIXME: might be incorrect if data access occurs after PC changed
				this.enterException (CPU.Mode.ABT, 0x10, this.pc._value, false);
			}
			else
			{
				console.log ("error executing " + Util.hex32 (this.pc._value - 4));
				this.dumpRegisters ();
				throw e;
			}
		}
	};

	Core.prototype.dumpRegisters = function () {
		console.log ("registers:");
		for (var i = 0; i < 18; i++)
		{
			var reg = this.getReg (i);
			console.log ("  " + reg.bank + "\t" + i + " = " + Util.hex32 (reg._value));
		}
	};

})();
var Board = (function () {

	function Board ()
	{
		var me = this;

		var pmem = this.pmem = new Mem.PhysicalMemory ();

		var vic = this.vic = new Peripherals.VIC (0x10140000);
		var sic = this.sic = new Peripherals.SIC (0x10003000);
		pmem.addDevice (new Mem.RAM (0x0, 0x08000000));
		pmem.addDevice (vic);
		pmem.addDevice (sic);
		pmem.addDevice (new Peripherals.SystemController (0x101e0000));
		pmem.addDevice (new Peripherals.SystemRegisters (0x10000000,
			function () { return me.getMilliseconds.apply (null, arguments); }));
		pmem.addDevice (new Peripherals.UART (0x101f1000,
			function () { me.uartWrite.apply (null, arguments); }));
		var timer1 = this.timer1 = new Peripherals.DualTimer (0x101e2000, vic, 4);
		var timer2 = this.timer2 = new Peripherals.DualTimer (0x101e3000, vic, 5);
		pmem.addDevice (timer1);
		pmem.addDevice (timer2);

		var cpu = this.cpu = new CPU.Core (pmem, vic);
	}

	Board.prototype.uartWrite = function () {
		throw new Error ("uartWrite not implemented");
	};

	Board.prototype.getMilliseconds = function () {
		throw new Error ("getMilliseconds not implemented");
	};

	Board.prototype.tick = function () {
		var cpu = this.cpu;
		this.timer1.update ();
		this.timer2.update ();
		cpu.tick ();
	};

	return Board;

})();
function load (mem, addr, buf)
{
	for (var off = 0; off < buf.length; off += 4)
	{
		mem.write32 (addr + off, buf.readUInt32LE (off, true));
	}
}

var board = new Board ();

board.uartWrite = function (data) {
	process.stdout.write (String.fromCharCode (data));
};
board.getMilliseconds = function () {
	var hrt = process.hrtime ();
	return (hrt[0] * 1000) + (hrt[1] / 1000000);
};

var fs = require ('fs');
load (board.pmem, 0x00008000, fs.readFileSync('./resources/image'));
load (board.pmem, 0x01000000, fs.readFileSync('./resources/board.dtb'));
load (board.pmem, 0x01200000, fs.readFileSync('./resources/rootfs.cpio'));

board.cpu.pc.set (0x00008000);
board.cpu.getReg (0).set (0);
board.cpu.getReg (1).set (0);
board.cpu.getReg (2).set (0x01000000);

while (true)
	board.tick ();

/*
var sc = 0;
try {
	while (true)
	{
		var rg = sc > 9585000;
		if (rg) console.log ("executing " + Util.hex32 (board.cpu.pc._value));
		board.tick ();
		if (rg) board.cpu.dumpRegisters ();
		sc++;
	}
} catch (e) {
	console.log ('!!! instruction count: ' + sc);
	throw e;
}
*/

/*
var pcs = new Array (2000);
var pcsi = 0;

try {
	while (true)
	{
		pcs[pcsi] = [board.cpu.pc._value];
		pcsi = (pcsi + 1) % 2000;
		board.tick ();
	}
} catch (e) {
	pcs.slice (pcsi).concat (pcs.slice (0, pcsi)).forEach (function (x) {
		console.log (Util.hex32 (x));
	});
	throw e;
}
*/
