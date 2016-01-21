// Generated by CoffeeScript 1.10.0

/**
 * 转换 html 到 virtual Dom 
 * @date 2016-01-08 20:12:21
 * @author vfasky <vfasky@gmail.com>
 * @link http://vfasky.com
 */
'use strict';
var _domId, _signReg, _strEndReg, bNS, domToScript, htmlparser, parseDom, parseTree, parserAttr, parserAttrEach, parserAttrFor, parserAttrIf, parserAttrUnless, parserBinders, parserFormatters;

htmlparser = require('htmlparser2');

_domId = 0;

_signReg = /\{([^}]+)\}/g;

_strEndReg = /[^]+""$/;

bNS = function(len) {
  var i;
  return ((function() {
    var j, ref, results;
    results = [];
    for (i = j = 0, ref = len * 4; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      results.push('');
    }
    return results;
  })()).join(' ');
};


/* 
 * 解释 <div mc-each-v="scope.list"></div>
 */

parserAttrEach = function(code, dom, ix, attrKey) {
  var _arr, _ix, _vName;
  delete dom.attribs[attrKey];
  _ix = '__mc__$ix_';
  _arr = code;
  _vName = attrKey.replace('mc-each-', '');
  return "\n" + (bNS(ix + 1)) + " // each " + attrKey + " = " + code + "\n" + (bNS(ix + 1)) + " var __mc__arr;\n" + (parserFormatters(_arr, '__mc__arr', ix)) + "\n" + (bNS(ix + 1)) + " __mc__arr = __mc__arr.length ? __mc__arr : [];\n" + (bNS(ix + 1)) + " for(var " + _ix + "=0, len=__mc__arr.length; " + _ix + " < len; " + _ix + "++){\n" + (bNS(ix + 1)) + "     var " + _vName + " = __mc__arr[" + _ix + "];\n" + (bNS(ix + 1)) + "     " + (parseDom(dom, ix + 1)) + "\n" + (bNS(ix + 1)) + " }// endEach\n";
};


/* 
 * 解释 <div mc-for="v, k in scope.list"></div>
 */

parserAttrFor = function(code, dom, ix) {
  var _arr, _ix, _key, _obj, _vName, _val, script;
  delete dom.attribs['mc-for'];
  script = '';
  if (code.indexOf(' in ') !== -1) {
    _ix = '__mc__$ix_';
    _arr = code.split(' in ').pop();
    _vName = code.split(' ')[0].replace(',', '');
    if (code.indexOf(',') !== -1) {
      _ix = code.split(',').pop().split(' in')[0].trim();
    }
    script = "\n" + (bNS(ix + 1)) + " // for " + code + "\n" + (bNS(ix + 1)) + " var __mc__arr = " + _arr + ".length ? " + _arr + " : [];\n" + (bNS(ix + 1)) + " for(var " + _ix + "=0, len=__mc__arr.length; " + _ix + " < len; " + _ix + "++){\n" + (bNS(ix + 1)) + "     var " + _vName + " = __mc__arr[" + _ix + "];\n" + (bNS(ix + 1)) + "     " + (parseDom(dom, ix + 1)) + "\n";
  } else if (code.indexOf(' of ') !== -1) {
    _key = code.split(' of ')[0];
    _obj = code.split(' of ').pop();
    _val = '_';
    if (_key.indexOf(',') !== -1) {
      _val = _key.split(',').pop();
      _key = _key.split(',')[0];
    }
    script = "\n" + (bNS(ix + 1)) + " // for " + code + "\n" + (bNS(ix + 1)) + " var __mc__obj = " + _obj + " || {};\n" + (bNS(ix + 1)) + " for(var " + _key + " in __mc__obj){\n" + (bNS(ix + 1)) + "     var " + _val + " = __mc__obj[" + _key + "] || {};\n" + (bNS(ix + 1)) + "     " + (parseDom(dom, ix + 1)) + "\n";
  }
  return script += (bNS(ix + 1)) + " } // endFor \n";
};


/* 
 * 解释 if
 */

parserAttrIf = function(code, dom, ix) {
  var script;
  script = '';
  delete dom.attribs['mc-if'];
  return script = "\n" + (bNS(ix + 1)) + " // if " + code + "\n" + (bNS(ix + 1)) + " if( " + code + " ){\n" + (bNS(ix + 1)) + "    " + (parseDom(dom, ix + 1)) + "\n" + (bNS(ix + 1)) + " }// endif \n";
};


/* 
 * 解释 unless
 */

parserAttrUnless = function(code, dom, ix) {
  var script;
  script = '';
  delete dom.attribs['mc-unless'];
  return script = "\n" + (bNS(ix + 1)) + " // if " + code + "\n" + (bNS(ix + 1)) + " if( !(" + code + ") ){\n" + (bNS(ix + 1)) + "    " + (parseDom(dom, ix + 1)) + "\n" + (bNS(ix + 1)) + " }// endif \n";
};


/* 
 * 解释属性
 */

parserAttr = function(attribs, ix) {
  var attr, script;
  script = '';
  attr = Object.keys(attribs);
  attr.forEach(function(key) {
    var val;
    val = attribs[key];
    if (key.indexOf('mc-') === 0) {
      key = key.replace('mc-', '');
      if (key.indexOf('on-') === 0) {
        return script += (bNS(ix + 1)) + " __mc__attr['" + key + "'] = '" + val + "';";
      } else {
        script += "" + (parserFormatters(val, "__mc__attr['" + key + "']", ix));
        return script += "" + (parserBinders(key, ix));
      }
    } else {
      return script += (bNS(ix + 1)) + " __mc__attr['" + key + "'] = '" + val + "';";
    }
  });
  return script + '\n';
};

parserFormatters = function(key, valName, ix) {
  var domVal, funcs, script;
  key = key.trim();
  if (key.indexOf('|') === -1) {
    return (bNS(ix + 1)) + " " + valName + " = " + key + "; \n";
  }
  funcs = key.split(' | ');
  domVal = funcs[0];
  funcs.splice(0, 1);
  script = "    \n" + (bNS(ix + 1)) + " " + valName + " = (function(x){\n    ";
  funcs.forEach(function(fun) {
    var args, formatter;
    args = [];
    fun.split(' ').forEach(function(v) {
      var val;
      val = v.trim();
      if (val.length > 0) {
        return args.push(val);
      }
    });
    formatter = args[0];
    args[0] = 'x';
    return script += (bNS(ix + 2)) + " // " + formatter + "\n" + (bNS(ix + 2)) + " if( __mc_T_formatters.hasOwnProperty('" + formatter + "') ) {\n" + (bNS(ix + 2)) + "     x = __mc_T_formatters['" + formatter + "'](" + (args.join(',')) + ");\n" + (bNS(ix + 2)) + " } // end " + formatter + " \n";
  });
  script += (bNS(ix + 2)) + " return x;\n" + (bNS(ix + 1)) + " })(" + domVal + ");\n";
  return script;
};

parserBinders = function(sKey, sVal, ix) {
  var script;
  return script = (bNS(ix + 1)) + " // binders check\n" + (bNS(ix + 1)) + " if( __mc_T_binders.hasOwnProperty('" + sKey + "') ){\n" + (bNS(ix + 1)) + "    __mc__isBindObserve = true;\n" + (bNS(ix + 1)) + "    __mc__binderData.push({attrName: '" + sKey + "', value: __mc__attr['" + sKey + "']});\n" + (bNS(ix + 1)) + " }// end \n";
};


/*
 * 解释dom结构
 */

parseDom = function(dom, ix) {
  var attr, attrKeys, code, id, j, len1, mapTree, mapTreeId, script, text;
  id = _domId++;
  script = "\n" + (bNS(ix + 1)) + " var __mc__children_" + id + " = [], __mc__attr = {}, __mc__isBindObserve = false, __mc__binderData = [];\n";
  if (dom.attribs) {
    if (dom.attribs['mc-for']) {
      return parserAttrFor(dom.attribs['mc-for'], dom, ix);
    }
    if (dom.attribs['mc-if']) {
      return parserAttrIf(dom.attribs['mc-if'], dom, ix);
    }
    if (dom.attribs['mc-unless']) {
      return parserAttrUnless(dom.attribs['mc-unless'], dom, ix);
    }
    attrKeys = Object.keys(dom.attribs);
    for (j = 0, len1 = attrKeys.length; j < len1; j++) {
      attr = attrKeys[j];
      if (attr.indexOf('mc-each-') === 0) {
        return parserAttrEach(dom.attribs[attr], dom, ix, attr);
      }
    }
    script += parserAttr(dom.attribs, ix);
  }
  if (dom.children && dom.children.length > 0) {
    script += parseTree(dom.children, ix, "__mc__children_" + id);
  }
  if (dom.name) {
    script += "\n" + (bNS(ix + 1)) + " var __mc__new_el = new __mc_T_El('" + dom.name + "', __mc__attr, __mc__children_" + id + ");";
    script += (bNS(ix + 1)) + " var __mc__attr__keys = Object.keys(__mc__attr);\n" + (bNS(ix + 1)) + " __mc__attr__keys.forEach(function(attr){\n" + (bNS(ix + 1)) + "     if(attr.indexOf('on-') === 0){ __mc__isBindObserve = true; }\n" + (bNS(ix + 1)) + " });\n" + (bNS(ix + 1)) + " if(__mc__isBindObserve){\n" + (bNS(ix + 1)) + "     __mc__new_el.bindTemplate(__mc__observe); \n" + (bNS(ix + 1)) + "     for(var __mc_i = 0, __mc_len = __mc__binderData.length; __mc_i < __mc_len; __mc_i++){ \n" + (bNS(ix + 1)) + "         var __mc_v = __mc__binderData[__mc_i];\n" + (bNS(ix + 1)) + "         __mc__new_el.bindBinder(__mc_v.attrName, __mc_v.value);\n" + (bNS(ix + 1)) + "     }\n" + (bNS(ix + 1)) + " }\n";
    script += "\n" + (bNS(ix + 1)) + " tree.push( __mc__new_el );";
  } else if (dom.type === 'text') {
    dom.data = dom.data.replace(/\n/g, ' ');
    text = dom.data;
    if (_signReg.test(text)) {
      mapTree = [];
      mapTreeId = 0;
      code = text.replace(_signReg, function(key, val) {
        var reKey;
        reKey = "__mc__rp__key_" + (mapTreeId++);
        script += "\n" + (bNS(ix + 1)) + " var " + reKey + ";";
        mapTree.push({
          key: reKey,
          val: val
        });
        return '" + ' + reKey + ' + "';
      });
      code = '"' + code;
      if (false === _strEndReg.test(code)) {
        code += '"';
      }
      mapTree.forEach(function(v) {
        return script += "\n" + (parserFormatters(v.val, v.key, ix));
      });
      script += "\n" + (bNS(ix + 1)) + " tree.push( " + code + " );";
    } else {
      script += "\n" + (bNS(ix + 1)) + " tree.push( '" + dom.data + "' );";
    }
  }
  return script;
};

parseTree = function(tree, ix, children) {
  var script, treeId;
  if (ix == null) {
    ix = 0;
  }
  if (children == null) {
    children = '__mc__children_0';
  }
  treeId = _domId;
  script = "\n" + (bNS(ix + 1)) + " (function(scope, tree){ // startTree " + treeId + "\n";
  tree.forEach(function(dom, id) {
    if (dom.type !== 'text' || (dom.type === 'text' && dom.data.trim().length > 0)) {
      return script += "" + (parseDom(dom, ix + 1));
    }
  });
  script += "\n" + (bNS(ix + 1)) + " })(scope, " + children + "); // endTree " + treeId + "\n";
  return script;
};

domToScript = function(tree) {
  var script;
  script = "'use strict'\nvar mcore = require('mcore');\nvar __mc_T_El = mcore.virtualDom.Element;\nvar __mc_T_formatters = mcore.Template.formatters;\nvar __mc_T_binders = mcore.Template.binders;\n \nmodule.exports = function(scope, __mc__observe){\n    var __mc__children_0 = [];\n    var __mc__binders = {};\n    var __mc__dom_id = 0;";
  script += "\n    " + (parseTree(tree));
  script += "\n    return {\n        virtualDom: new __mc_T_El('div', {'class': 'mc-vd'}, __mc__children_0),\n        binders: __mc__binders,\n    }\n};";
  return script;
};

module.exports = function(html) {
  var domTree;
  _domId = 0;
  domTree = htmlparser.parseDOM(html);
  return domToScript(domTree);
};
