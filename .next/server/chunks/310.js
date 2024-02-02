exports.id = 310;
exports.ids = [310];
exports.modules = {

/***/ 52353:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports =
{
  parallel      : __webpack_require__(54668),
  serial        : __webpack_require__(23339),
  serialOrdered : __webpack_require__(99869)
};


/***/ }),

/***/ 61677:
/***/ ((module) => {

// API
module.exports = abort;

/**
 * Aborts leftover active jobs
 *
 * @param {object} state - current state object
 */
function abort(state)
{
  Object.keys(state.jobs).forEach(clean.bind(state));

  // reset leftover jobs
  state.jobs = {};
}

/**
 * Cleans up leftover job by invoking abort function for the provided job id
 *
 * @this  state
 * @param {string|number} key - job id to abort
 */
function clean(key)
{
  if (typeof this.jobs[key] == 'function')
  {
    this.jobs[key]();
  }
}


/***/ }),

/***/ 92792:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var defer = __webpack_require__(56403);

// API
module.exports = async;

/**
 * Runs provided callback asynchronously
 * even if callback itself is not
 *
 * @param   {function} callback - callback to invoke
 * @returns {function} - augmented callback
 */
function async(callback)
{
  var isAsync = false;

  // check if async happened
  defer(function() { isAsync = true; });

  return function async_callback(err, result)
  {
    if (isAsync)
    {
      callback(err, result);
    }
    else
    {
      defer(function nextTick_callback()
      {
        callback(err, result);
      });
    }
  };
}


/***/ }),

/***/ 56403:
/***/ ((module) => {

module.exports = defer;

/**
 * Runs provided function on next iteration of the event loop
 *
 * @param {function} fn - function to run
 */
function defer(fn)
{
  var nextTick = typeof setImmediate == 'function'
    ? setImmediate
    : (
      typeof process == 'object' && typeof process.nextTick == 'function'
      ? process.nextTick
      : null
    );

  if (nextTick)
  {
    nextTick(fn);
  }
  else
  {
    setTimeout(fn, 0);
  }
}


/***/ }),

/***/ 98617:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var async = __webpack_require__(92792)
  , abort = __webpack_require__(61677)
  ;

// API
module.exports = iterate;

/**
 * Iterates over each job object
 *
 * @param {array|object} list - array or object (named list) to iterate over
 * @param {function} iterator - iterator to run
 * @param {object} state - current job status
 * @param {function} callback - invoked when all elements processed
 */
function iterate(list, iterator, state, callback)
{
  // store current index
  var key = state['keyedList'] ? state['keyedList'][state.index] : state.index;

  state.jobs[key] = runJob(iterator, key, list[key], function(error, output)
  {
    // don't repeat yourself
    // skip secondary callbacks
    if (!(key in state.jobs))
    {
      return;
    }

    // clean up jobs
    delete state.jobs[key];

    if (error)
    {
      // don't process rest of the results
      // stop still active jobs
      // and reset the list
      abort(state);
    }
    else
    {
      state.results[key] = output;
    }

    // return salvaged results
    callback(error, state.results);
  });
}

/**
 * Runs iterator over provided job element
 *
 * @param   {function} iterator - iterator to invoke
 * @param   {string|number} key - key/index of the element in the list of jobs
 * @param   {mixed} item - job description
 * @param   {function} callback - invoked after iterator is done with the job
 * @returns {function|mixed} - job abort function or something else
 */
function runJob(iterator, key, item, callback)
{
  var aborter;

  // allow shortcut if iterator expects only two arguments
  if (iterator.length == 2)
  {
    aborter = iterator(item, async(callback));
  }
  // otherwise go with full three arguments
  else
  {
    aborter = iterator(item, key, async(callback));
  }

  return aborter;
}


/***/ }),

/***/ 59478:
/***/ ((module) => {

// API
module.exports = state;

/**
 * Creates initial state object
 * for iteration over list
 *
 * @param   {array|object} list - list to iterate over
 * @param   {function|null} sortMethod - function to use for keys sort,
 *                                     or `null` to keep them as is
 * @returns {object} - initial state object
 */
function state(list, sortMethod)
{
  var isNamedList = !Array.isArray(list)
    , initState =
    {
      index    : 0,
      keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
      jobs     : {},
      results  : isNamedList ? {} : [],
      size     : isNamedList ? Object.keys(list).length : list.length
    }
    ;

  if (sortMethod)
  {
    // sort array keys based on it's values
    // sort object's keys just on own merit
    initState.keyedList.sort(isNamedList ? sortMethod : function(a, b)
    {
      return sortMethod(list[a], list[b]);
    });
  }

  return initState;
}


/***/ }),

/***/ 77093:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var abort = __webpack_require__(61677)
  , async = __webpack_require__(92792)
  ;

// API
module.exports = terminator;

/**
 * Terminates jobs in the attached state context
 *
 * @this  AsyncKitState#
 * @param {function} callback - final callback to invoke after termination
 */
function terminator(callback)
{
  if (!Object.keys(this.jobs).length)
  {
    return;
  }

  // fast forward iteration index
  this.index = this.size;

  // abort jobs
  abort(this);

  // send back results we have so far
  async(callback)(null, this.results);
}


/***/ }),

/***/ 54668:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var iterate    = __webpack_require__(98617)
  , initState  = __webpack_require__(59478)
  , terminator = __webpack_require__(77093)
  ;

// Public API
module.exports = parallel;

/**
 * Runs iterator over provided array elements in parallel
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function parallel(list, iterator, callback)
{
  var state = initState(list);

  while (state.index < (state['keyedList'] || list).length)
  {
    iterate(list, iterator, state, function(error, result)
    {
      if (error)
      {
        callback(error, result);
        return;
      }

      // looks like it's the last one
      if (Object.keys(state.jobs).length === 0)
      {
        callback(null, state.results);
        return;
      }
    });

    state.index++;
  }

  return terminator.bind(state, callback);
}


/***/ }),

/***/ 23339:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var serialOrdered = __webpack_require__(99869);

// Public API
module.exports = serial;

/**
 * Runs iterator over provided array elements in series
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function serial(list, iterator, callback)
{
  return serialOrdered(list, iterator, null, callback);
}


/***/ }),

/***/ 99869:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var iterate    = __webpack_require__(98617)
  , initState  = __webpack_require__(59478)
  , terminator = __webpack_require__(77093)
  ;

// Public API
module.exports = serialOrdered;
// sorting helpers
module.exports.ascending  = ascending;
module.exports.descending = descending;

/**
 * Runs iterator over provided sorted array elements in series
 *
 * @param   {array|object} list - array or object (named list) to iterate over
 * @param   {function} iterator - iterator to run
 * @param   {function} sortMethod - custom sort function
 * @param   {function} callback - invoked when all elements processed
 * @returns {function} - jobs terminator
 */
function serialOrdered(list, iterator, sortMethod, callback)
{
  var state = initState(list, sortMethod);

  iterate(list, iterator, state, function iteratorHandler(error, result)
  {
    if (error)
    {
      callback(error, result);
      return;
    }

    state.index++;

    // are we there yet?
    if (state.index < (state['keyedList'] || list).length)
    {
      iterate(list, iterator, state, iteratorHandler);
      return;
    }

    // done here
    callback(null, state.results);
  });

  return terminator.bind(state, callback);
}

/*
 * -- Sort methods
 */

/**
 * sort helper to sort array elements in ascending order
 *
 * @param   {mixed} a - an item to compare
 * @param   {mixed} b - an item to compare
 * @returns {number} - comparison result
 */
function ascending(a, b)
{
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * sort helper to sort array elements in descending order
 *
 * @param   {mixed} a - an item to compare
 * @param   {mixed} b - an item to compare
 * @returns {number} - comparison result
 */
function descending(a, b)
{
  return -1 * ascending(a, b);
}


/***/ }),

/***/ 19587:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, module, __webpack_require__(63997), __webpack_require__(5828)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(this, function (exports, module, _tongwenTongwenStJs, _tongwenTongwenTsJs) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _tongwenSt = _interopRequireDefault(_tongwenTongwenStJs);

  var _tongwenTs = _interopRequireDefault(_tongwenTongwenTsJs);

  module.exports = {
    sify: _tongwenTs['default'],
    tify: _tongwenSt['default']
  };
});

/***/ }),

/***/ 63997:
/***/ ((module) => {

/*******************************************
* 本JS檔存放位置由 WFU BLOG 提供
*
* JS檔主程式出自新同文堂：http://tongwen.openfoundry.org/
* 消息來源：http://hi.baidu.com/%CE%B5%C7%E5%D4%C2/blog/item/bf6b79d31fc49b289a5027ed.html
* 欲編輯、修改本程式，記得儲存的格式要選 unicode。
*
* WFU Blog : http://wayne-fu.blogspot.com/
*
***********************************/
/*** 此 JS 檔經過修改 (https://github.com/mollykannn/translate-big5-gbk.git) ***/

var TongWen = {};
TongWen.s_2_t = {
"\u00b7":"\u2027",
"\u2015":"\u2500",
"\u2016":"\u2225",
"\u2018":"\u300e",
"\u2019":"\u300f",
"\u201c":"\u300c",
"\u201d":"\u300d",
"\u2033":"\u301e",
"\u220f":"\u03a0",
"\u2211":"\u03a3",
"\u2227":"\ufe3f",
"\u2228":"\ufe40",
"\u2236":"\ufe30",
"\u2248":"\u2252",
"\u2264":"\u2266",
"\u2265":"\u2267",
"\u2501":"\u2500",
"\u2503":"\u2502",
"\u250f":"\u250c",
"\u2513":"\u2510",
"\u2517":"\u2514",
"\u251b":"\u2518",
"\u2523":"\u251c",
"\u252b":"\u2524",
"\u2533":"\u252c",
"\u253b":"\u2534",
"\u254b":"\u253c",
"\u3016":"\u3010",
"\u3017":"\u3011",
"\u3447":"\u3473",
"\u359e":"\u558e",
"\u360e":"\u361a",
"\u3918":"\u396e",
"\u39cf":"\u6386",
"\u39d0":"\u3a73",
"\u39df":"\u64d3",
"\u3b4e":"\u68e1",
"\u3ce0":"\u6fbe",
"\u4056":"\u779c",
"\u415f":"\u7a47",
"\u4337":"\u7d2c",
"\u43ac":"\u43b1",
"\u43dd":"\u819e",
"\u44d6":"\u85ed",
"\u464c":"\u4661",
"\u4723":"\u8a22",
"\u4729":"\u8b8c",
"\u478d":"\u477c",
"\u497a":"\u91fe",
"\u497d":"\u93fa",
"\u4982":"\u4947",
"\u4983":"\u942f",
"\u4985":"\u9425",
"\u4986":"\u9481",
"\u49b6":"\u499b",
"\u49b7":"\u499f",
"\u4c9f":"\u9ba3",
"\u4ca1":"\u9c0c",
"\u4ca2":"\u9c27",
"\u4ca3":"\u4c77",
"\u4d13":"\u9cfe",
"\u4d14":"\u9d41",
"\u4d15":"\u9d37",
"\u4d16":"\u9d84",
"\u4d17":"\u9daa",
"\u4d18":"\u9dc9",
"\u4d19":"\u9e0a",
"\u4dae":"\u9f91",
"\u4e07":"\u842c",
"\u4e0e":"\u8207",
"\u4e13":"\u5c08",
"\u4e1a":"\u696d",
"\u4e1b":"\u53e2",
"\u4e1c":"\u6771",
"\u4e1d":"\u7d72",
"\u4e22":"\u4e1f",
"\u4e24":"\u5169",
"\u4e25":"\u56b4",
"\u4e27":"\u55aa",
"\u4e2a":"\u500b",
"\u4e30":"\u8c50",
"\u4e34":"\u81e8",
"\u4e3a":"\u70ba",
"\u4e3d":"\u9e97",
"\u4e3e":"\u8209",
"\u4e48":"\u9ebc",
"\u4e49":"\u7fa9",
"\u4e4c":"\u70cf",
"\u4e50":"\u6a02",
"\u4e54":"\u55ac",
"\u4e60":"\u7fd2",
"\u4e61":"\u9109",
"\u4e66":"\u66f8",
"\u4e70":"\u8cb7",
"\u4e71":"\u4e82",
"\u4e89":"\u722d",
"\u4e8e":"\u65bc",
"\u4e8f":"\u8667",
"\u4e91":"\u96f2",
"\u4e98":"\u4e99",
"\u4e9a":"\u4e9e",
"\u4ea7":"\u7522",
"\u4ea9":"\u755d",
"\u4eb2":"\u89aa",
"\u4eb5":"\u893b",
"\u4ebf":"\u5104",
"\u4ec5":"\u50c5",
"\u4ec6":"\u50d5",
"\u4ece":"\u5f9e",
"\u4ed1":"\u4f96",
"\u4ed3":"\u5009",
"\u4eea":"\u5100",
"\u4eec":"\u5011",
"\u4ef7":"\u50f9",
"\u4f17":"\u773e",
"\u4f18":"\u512a",
"\u4f1a":"\u6703",
"\u4f1b":"\u50b4",
"\u4f1e":"\u5098",
"\u4f1f":"\u5049",
"\u4f20":"\u50b3",
"\u4f24":"\u50b7",
"\u4f25":"\u5000",
"\u4f26":"\u502b",
"\u4f27":"\u5096",
"\u4f2a":"\u507d",
"\u4f2b":"\u4f47",
"\u4f32":"\u4f60",
"\u4f53":"\u9ad4",
"\u4f63":"\u50ad",
"\u4f65":"\u50c9",
"\u4fa0":"\u4fe0",
"\u4fa3":"\u4fb6",
"\u4fa5":"\u50e5",
"\u4fa6":"\u5075",
"\u4fa7":"\u5074",
"\u4fa8":"\u50d1",
"\u4fa9":"\u5108",
"\u4faa":"\u5115",
"\u4fac":"\u5102",
"\u4fe3":"\u4fc1",
"\u4fe6":"\u5114",
"\u4fe8":"\u513c",
"\u4fe9":"\u5006",
"\u4fea":"\u5137",
"\u4fed":"\u5109",
"\u502e":"\u88f8",
"\u503a":"\u50b5",
"\u503e":"\u50be",
"\u506c":"\u50af",
"\u507b":"\u50c2",
"\u507e":"\u50e8",
"\u507f":"\u511f",
"\u50a5":"\u513b",
"\u50a7":"\u5110",
"\u50a8":"\u5132",
"\u50a9":"\u513a",
"\u513f":"\u5152",
"\u5151":"\u514c",
"\u5156":"\u5157",
"\u515a":"\u9ee8",
"\u5170":"\u862d",
"\u5173":"\u95dc",
"\u5174":"\u8208",
"\u5179":"\u8332",
"\u517b":"\u990a",
"\u517d":"\u7378",
"\u5181":"\u56c5",
"\u5185":"\u5167",
"\u5188":"\u5ca1",
"\u518c":"\u518a",
"\u5199":"\u5beb",
"\u519b":"\u8ecd",
"\u519c":"\u8fb2",
"\u51af":"\u99ae",
"\u51b2":"\u6c96",
"\u51b3":"\u6c7a",
"\u51b5":"\u6cc1",
"\u51bb":"\u51cd",
"\u51c0":"\u6de8",
"\u51c4":"\u6dd2",
"\u51c7":"\u6dde",
"\u51c9":"\u6dbc",
"\u51cf":"\u6e1b",
"\u51d1":"\u6e4a",
"\u51db":"\u51dc",
"\u51e0":"\u5e7e",
"\u51e4":"\u9cf3",
"\u51e6":"\u8655",
"\u51eb":"\u9ce7",
"\u51ed":"\u6191",
"\u51ef":"\u51f1",
"\u51fb":"\u64ca",
"\u51fc":"\u5e7d",
"\u51ff":"\u947f",
"\u520d":"\u82bb",
"\u5212":"\u5283",
"\u5218":"\u5289",
"\u5219":"\u5247",
"\u521a":"\u525b",
"\u521b":"\u5275",
"\u5220":"\u522a",
"\u522b":"\u5225",
"\u522c":"\u5257",
"\u522d":"\u5244",
"\u5239":"\u524e",
"\u523d":"\u528a",
"\u523f":"\u528c",
"\u5240":"\u5274",
"\u5242":"\u5291",
"\u5250":"\u526e",
"\u5251":"\u528d",
"\u5265":"\u525d",
"\u5267":"\u5287",
"\u5273":"\u5284",
"\u529d":"\u52f8",
"\u529e":"\u8fa6",
"\u52a1":"\u52d9",
"\u52a2":"\u52f1",
"\u52a8":"\u52d5",
"\u52b1":"\u52f5",
"\u52b2":"\u52c1",
"\u52b3":"\u52de",
"\u52bf":"\u52e2",
"\u52cb":"\u52f3",
"\u52da":"\u52e9",
"\u52db":"\u52f3",
"\u52e6":"\u527f",
"\u5300":"\u52fb",
"\u5326":"\u532d",
"\u532e":"\u5331",
"\u533a":"\u5340",
"\u533b":"\u91ab",
"\u534e":"\u83ef",
"\u534f":"\u5354",
"\u5355":"\u55ae",
"\u5356":"\u8ce3",
"\u5360":"\u4f54",
"\u5362":"\u76e7",
"\u5364":"\u9e75",
"\u5367":"\u81e5",
"\u536b":"\u885b",
"\u5374":"\u537b",
"\u537a":"\u5df9",
"\u5382":"\u5ee0",
"\u5385":"\u5ef3",
"\u5386":"\u6b77",
"\u5389":"\u53b2",
"\u538b":"\u58d3",
"\u538c":"\u53ad",
"\u538d":"\u5399",
"\u5395":"\u5ec1",
"\u5398":"\u91d0",
"\u53a2":"\u5ec2",
"\u53a3":"\u53b4",
"\u53a6":"\u5ec8",
"\u53a8":"\u5eda",
"\u53a9":"\u5ec4",
"\u53ae":"\u5edd",
"\u53bf":"\u7e23",
"\u53c1":"\u53c3",
"\u53c2":"\u53c3",
"\u53c6":"\u9749",
"\u53c7":"\u9746",
"\u53cc":"\u96d9",
"\u53d1":"\u767c",
"\u53d8":"\u8b8a",
"\u53d9":"\u6558",
"\u53e0":"\u758a",
"\u53f6":"\u8449",
"\u53f7":"\u865f",
"\u53f9":"\u5606",
"\u53fd":"\u5630",
"\u5401":"\u7c72",
"\u540e":"\u5f8c",
"\u5413":"\u5687",
"\u5415":"\u5442",
"\u5417":"\u55ce",
"\u5428":"\u5678",
"\u542c":"\u807d",
"\u542f":"\u555f",
"\u5434":"\u5433",
"\u5450":"\u5436",
"\u5452":"\u5638",
"\u5453":"\u56c8",
"\u5455":"\u5614",
"\u5456":"\u56a6",
"\u5457":"\u5504",
"\u5458":"\u54e1",
"\u5459":"\u54bc",
"\u545b":"\u55c6",
"\u545c":"\u55da",
"\u548f":"\u8a60",
"\u5499":"\u56a8",
"\u549b":"\u5680",
"\u549d":"\u565d",
"\u54cc":"\u5471",
"\u54cd":"\u97ff",
"\u54d1":"\u555e",
"\u54d2":"\u5660",
"\u54d3":"\u5635",
"\u54d4":"\u55f6",
"\u54d5":"\u5666",
"\u54d7":"\u5629",
"\u54d9":"\u5672",
"\u54dc":"\u568c",
"\u54dd":"\u5665",
"\u54df":"\u55b2",
"\u551b":"\u561c",
"\u551d":"\u55ca",
"\u5520":"\u562e",
"\u5521":"\u5562",
"\u5522":"\u55e9",
"\u5524":"\u559a",
"\u5553":"\u555f",
"\u5567":"\u5616",
"\u556c":"\u55c7",
"\u556d":"\u56c0",
"\u556e":"\u9f67",
"\u5570":"\u56c9",
"\u5578":"\u562f",
"\u55b7":"\u5674",
"\u55bd":"\u560d",
"\u55be":"\u56b3",
"\u55eb":"\u56c1",
"\u55ec":"\u5475",
"\u55f3":"\u566f",
"\u5618":"\u5653",
"\u5624":"\u56b6",
"\u5629":"\u8b41",
"\u5631":"\u56d1",
"\u565c":"\u5695",
"\u56a3":"\u56c2",
"\u56ae":"\u5411",
"\u56e2":"\u5718",
"\u56ed":"\u5712",
"\u56ef":"\u570b",
"\u56f1":"\u56ea",
"\u56f4":"\u570d",
"\u56f5":"\u5707",
"\u56fd":"\u570b",
"\u56fe":"\u5716",
"\u5706":"\u5713",
"\u5723":"\u8056",
"\u5739":"\u58d9",
"\u573a":"\u5834",
"\u5742":"\u962a",
"\u574f":"\u58de",
"\u5757":"\u584a",
"\u575a":"\u5805",
"\u575b":"\u58c7",
"\u575c":"\u58e2",
"\u575d":"\u58e9",
"\u575e":"\u5862",
"\u575f":"\u58b3",
"\u5760":"\u589c",
"\u5784":"\u58df",
"\u5785":"\u58df",
"\u5786":"\u58da",
"\u5792":"\u58d8",
"\u57a6":"\u58be",
"\u57a9":"\u580a",
"\u57ab":"\u588a",
"\u57ad":"\u57e1",
"\u57b2":"\u584f",
"\u57b4":"\u5816",
"\u57d8":"\u5852",
"\u57d9":"\u58ce",
"\u57da":"\u581d",
"\u5811":"\u5879",
"\u5815":"\u58ae",
"\u5892":"\u5891",
"\u5899":"\u7246",
"\u58ee":"\u58ef",
"\u58f0":"\u8072",
"\u58f3":"\u6bbc",
"\u58f6":"\u58fa",
"\u5904":"\u8655",
"\u5907":"\u5099",
"\u590d":"\u5fa9",
"\u591f":"\u5920",
"\u5934":"\u982d",
"\u5938":"\u8a87",
"\u5939":"\u593e",
"\u593a":"\u596a",
"\u5941":"\u5969",
"\u5942":"\u5950",
"\u594b":"\u596e",
"\u5956":"\u734e",
"\u5965":"\u5967",
"\u596c":"\u734e",
"\u5986":"\u599d",
"\u5987":"\u5a66",
"\u5988":"\u5abd",
"\u59a9":"\u5af5",
"\u59aa":"\u5ad7",
"\u59ab":"\u5aaf",
"\u59d7":"\u59cd",
"\u5a04":"\u5a41",
"\u5a05":"\u5a6d",
"\u5a06":"\u5b08",
"\u5a07":"\u5b0c",
"\u5a08":"\u5b4c",
"\u5a31":"\u5a1b",
"\u5a32":"\u5aa7",
"\u5a34":"\u5afb",
"\u5a73":"\u5aff",
"\u5a74":"\u5b30",
"\u5a75":"\u5b0b",
"\u5a76":"\u5b38",
"\u5aaa":"\u5abc",
"\u5ad2":"\u5b21",
"\u5ad4":"\u5b2a",
"\u5af1":"\u5b19",
"\u5b37":"\u5b24",
"\u5b59":"\u5b6b",
"\u5b66":"\u5b78",
"\u5b6a":"\u5b7f",
"\u5b81":"\u5be7",
"\u5b9d":"\u5bf6",
"\u5b9e":"\u5be6",
"\u5ba0":"\u5bf5",
"\u5ba1":"\u5be9",
"\u5baa":"\u61b2",
"\u5bab":"\u5bae",
"\u5bbd":"\u5bec",
"\u5bbe":"\u8cd3",
"\u5bc0":"\u91c7",
"\u5bdd":"\u5be2",
"\u5bf9":"\u5c0d",
"\u5bfb":"\u5c0b",
"\u5bfc":"\u5c0e",
"\u5bff":"\u58fd",
"\u5c06":"\u5c07",
"\u5c14":"\u723e",
"\u5c18":"\u5875",
"\u5c1c":"\u560e",
"\u5c1d":"\u5617",
"\u5c27":"\u582f",
"\u5c34":"\u5c37",
"\u5c38":"\u5c4d",
"\u5c3d":"\u76e1",
"\u5c42":"\u5c64",
"\u5c49":"\u5c5c",
"\u5c4a":"\u5c46",
"\u5c5e":"\u5c6c",
"\u5c61":"\u5c62",
"\u5c66":"\u5c68",
"\u5c7f":"\u5dbc",
"\u5c81":"\u6b72",
"\u5c82":"\u8c48",
"\u5c96":"\u5d87",
"\u5c97":"\u5d17",
"\u5c98":"\u5cf4",
"\u5c9a":"\u5d50",
"\u5c9b":"\u5cf6",
"\u5cad":"\u5dba",
"\u5cbd":"\u5d20",
"\u5cbf":"\u5dcb",
"\u5cc3":"\u5da8",
"\u5cc4":"\u5da7",
"\u5ce1":"\u5cfd",
"\u5ce3":"\u5da2",
"\u5ce4":"\u5da0",
"\u5ce5":"\u5d22",
"\u5ce6":"\u5dd2",
"\u5cef":"\u5cf0",
"\u5d02":"\u5d97",
"\u5d03":"\u5d0d",
"\u5d10":"\u5d11",
"\u5d2d":"\u5d84",
"\u5d58":"\u5db8",
"\u5d5a":"\u5d94",
"\u5d5b":"\u5d33",
"\u5d5d":"\u5d81",
"\u5dc5":"\u5dd4",
"\u5dcc":"\u5dd6",
"\u5de9":"\u978f",
"\u5def":"\u5df0",
"\u5e01":"\u5e63",
"\u5e05":"\u5e25",
"\u5e08":"\u5e2b",
"\u5e0f":"\u5e43",
"\u5e10":"\u5e33",
"\u5e18":"\u7c3e",
"\u5e1c":"\u5e5f",
"\u5e26":"\u5e36",
"\u5e27":"\u5e40",
"\u5e2e":"\u5e6b",
"\u5e31":"\u5e6c",
"\u5e3b":"\u5e58",
"\u5e3c":"\u5e57",
"\u5e42":"\u51aa",
"\u5e75":"\u958b",
"\u5e76":"\u4e26",
"\u5e77":"\u4e26",
"\u5e7f":"\u5ee3",
"\u5e84":"\u838a",
"\u5e86":"\u6176",
"\u5e90":"\u5eec",
"\u5e91":"\u5ee1",
"\u5e93":"\u5eab",
"\u5e94":"\u61c9",
"\u5e99":"\u5edf",
"\u5e9e":"\u9f90",
"\u5e9f":"\u5ee2",
"\u5ebc":"\u5ece",
"\u5eea":"\u5ee9",
"\u5f00":"\u958b",
"\u5f02":"\u7570",
"\u5f03":"\u68c4",
"\u5f11":"\u5f12",
"\u5f20":"\u5f35",
"\u5f25":"\u5f4c",
"\u5f2a":"\u5f33",
"\u5f2f":"\u5f4e",
"\u5f39":"\u5f48",
"\u5f3a":"\u5f37",
"\u5f52":"\u6b78",
"\u5f53":"\u7576",
"\u5f54":"\u5f55",
"\u5f55":"\u9304",
"\u5f5a":"\u5f59",
"\u5f66":"\u5f65",
"\u5f7b":"\u5fb9",
"\u5f84":"\u5f91",
"\u5f95":"\u5fa0",
"\u5fc6":"\u61b6",
"\u5fcf":"\u61fa",
"\u5fe7":"\u6182",
"\u5ffe":"\u613e",
"\u6000":"\u61f7",
"\u6001":"\u614b",
"\u6002":"\u616b",
"\u6003":"\u61ae",
"\u6004":"\u616a",
"\u6005":"\u60b5",
"\u6006":"\u6134",
"\u601c":"\u6190",
"\u603b":"\u7e3d",
"\u603c":"\u61df",
"\u603f":"\u61cc",
"\u604b":"\u6200",
"\u6052":"\u6046",
"\u6073":"\u61c7",
"\u6076":"\u60e1",
"\u6078":"\u615f",
"\u6079":"\u61e8",
"\u607a":"\u6137",
"\u607b":"\u60fb",
"\u607c":"\u60f1",
"\u607d":"\u60f2",
"\u60a6":"\u6085",
"\u60ab":"\u6128",
"\u60ac":"\u61f8",
"\u60ad":"\u6173",
"\u60af":"\u61ab",
"\u60ca":"\u9a5a",
"\u60e7":"\u61fc",
"\u60e8":"\u6158",
"\u60e9":"\u61f2",
"\u60eb":"\u618a",
"\u60ec":"\u611c",
"\u60ed":"\u615a",
"\u60ee":"\u619a",
"\u60ef":"\u6163",
"\u6120":"\u614d",
"\u6124":"\u61a4",
"\u6126":"\u6192",
"\u613f":"\u9858",
"\u6151":"\u61fe",
"\u61d1":"\u61e3",
"\u61d2":"\u61f6",
"\u61d4":"\u61cd",
"\u6206":"\u6207",
"\u620b":"\u6214",
"\u620f":"\u6232",
"\u6217":"\u6227",
"\u6218":"\u6230",
"\u622c":"\u6229",
"\u6237":"\u6236",
"\u6251":"\u64b2",
"\u6267":"\u57f7",
"\u6269":"\u64f4",
"\u626a":"\u636b",
"\u626b":"\u6383",
"\u626c":"\u63da",
"\u6270":"\u64fe",
"\u629a":"\u64ab",
"\u629b":"\u62cb",
"\u629f":"\u6476",
"\u62a0":"\u6473",
"\u62a1":"\u6384",
"\u62a2":"\u6436",
"\u62a4":"\u8b77",
"\u62a5":"\u5831",
"\u62c5":"\u64d4",
"\u62df":"\u64ec",
"\u62e2":"\u650f",
"\u62e3":"\u63c0",
"\u62e5":"\u64c1",
"\u62e6":"\u6514",
"\u62e7":"\u64f0",
"\u62e8":"\u64a5",
"\u62e9":"\u64c7",
"\u6302":"\u639b",
"\u631a":"\u646f",
"\u631b":"\u6523",
"\u631c":"\u6397",
"\u631d":"\u64be",
"\u631e":"\u64bb",
"\u631f":"\u633e",
"\u6320":"\u6493",
"\u6321":"\u64cb",
"\u6322":"\u649f",
"\u6323":"\u6399",
"\u6324":"\u64e0",
"\u6325":"\u63ee",
"\u6326":"\u648f",
"\u635c":"\u641c",
"\u635e":"\u6488",
"\u635f":"\u640d",
"\u6361":"\u64bf",
"\u6362":"\u63db",
"\u6363":"\u6417",
"\u636e":"\u64da",
"\u63b3":"\u64c4",
"\u63b4":"\u6451",
"\u63b7":"\u64f2",
"\u63b8":"\u64a3",
"\u63ba":"\u647b",
"\u63bc":"\u645c",
"\u63fd":"\u652c",
"\u63ff":"\u64b3",
"\u6400":"\u6519",
"\u6401":"\u64f1",
"\u6402":"\u645f",
"\u6405":"\u652a",
"\u643a":"\u651c",
"\u6444":"\u651d",
"\u6445":"\u6504",
"\u6446":"\u64fa",
"\u6447":"\u6416",
"\u6448":"\u64ef",
"\u644a":"\u6524",
"\u6484":"\u6516",
"\u6491":"\u6490",
"\u64b5":"\u6506",
"\u64b7":"\u64f7",
"\u64b8":"\u64fc",
"\u64ba":"\u651b",
"\u64c0":"\u641f",
"\u64de":"\u64fb",
"\u6512":"\u6522",
"\u654c":"\u6575",
"\u655b":"\u6582",
"\u6570":"\u6578",
"\u658b":"\u9f4b",
"\u6593":"\u6595",
"\u65a9":"\u65ac",
"\u65ad":"\u65b7",
"\u65e0":"\u7121",
"\u65e7":"\u820a",
"\u65f6":"\u6642",
"\u65f7":"\u66e0",
"\u65f8":"\u6698",
"\u6619":"\u66c7",
"\u6635":"\u66b1",
"\u663c":"\u665d",
"\u663d":"\u66e8",
"\u663e":"\u986f",
"\u664b":"\u6649",
"\u6652":"\u66ec",
"\u6653":"\u66c9",
"\u6654":"\u66c4",
"\u6655":"\u6688",
"\u6656":"\u6689",
"\u6682":"\u66ab",
"\u66a7":"\u66d6",
"\u66b8":"\u77ad",
"\u672e":"\u8853",
"\u672f":"\u8853",
"\u673a":"\u6a5f",
"\u6740":"\u6bba",
"\u6742":"\u96dc",
"\u6743":"\u6b0a",
"\u6746":"\u687f",
"\u6760":"\u69d3",
"\u6761":"\u689d",
"\u6765":"\u4f86",
"\u6768":"\u694a",
"\u6769":"\u69aa",
"\u6770":"\u5091",
"\u6781":"\u6975",
"\u6784":"\u69cb",
"\u679e":"\u6a05",
"\u67a2":"\u6a1e",
"\u67a3":"\u68d7",
"\u67a5":"\u6aea",
"\u67a7":"\u6898",
"\u67a8":"\u68d6",
"\u67aa":"\u69cd",
"\u67ab":"\u6953",
"\u67ad":"\u689f",
"\u67dc":"\u6ac3",
"\u67e0":"\u6ab8",
"\u67fd":"\u6a89",
"\u6800":"\u6894",
"\u6805":"\u67f5",
"\u6807":"\u6a19",
"\u6808":"\u68e7",
"\u6809":"\u6adb",
"\u680a":"\u6af3",
"\u680b":"\u68df",
"\u680c":"\u6ae8",
"\u680e":"\u6adf",
"\u680f":"\u6b04",
"\u6811":"\u6a39",
"\u6816":"\u68f2",
"\u6837":"\u6a23",
"\u683e":"\u6b12",
"\u6854":"\u6a58",
"\u6860":"\u690f",
"\u6861":"\u6a48",
"\u6862":"\u6968",
"\u6863":"\u6a94",
"\u6864":"\u69bf",
"\u6865":"\u6a4b",
"\u6866":"\u6a3a",
"\u6867":"\u6a9c",
"\u6868":"\u69f3",
"\u6869":"\u6a01",
"\u68a6":"\u5922",
"\u68c0":"\u6aa2",
"\u68c2":"\u6afa",
"\u6901":"\u69e8",
"\u691f":"\u6add",
"\u6920":"\u69e7",
"\u6924":"\u6b0f",
"\u692d":"\u6a62",
"\u697c":"\u6a13",
"\u6984":"\u6b16",
"\u6987":"\u6aec",
"\u6988":"\u6ada",
"\u6989":"\u6af8",
"\u6998":"\u77e9",
"\u69da":"\u6a9f",
"\u69db":"\u6abb",
"\u69df":"\u6ab3",
"\u69e0":"\u6ae7",
"\u69fc":"\u898f",
"\u6a2a":"\u6a6b",
"\u6a2f":"\u6aa3",
"\u6a31":"\u6afb",
"\u6a65":"\u6aeb",
"\u6a71":"\u6ae5",
"\u6a79":"\u6ad3",
"\u6a7c":"\u6ade",
"\u6a90":"\u7c37",
"\u6aa9":"\u6a81",
"\u6b22":"\u6b61",
"\u6b24":"\u6b5f",
"\u6b27":"\u6b50",
"\u6b4e":"\u5606",
"\u6b7c":"\u6bb2",
"\u6b81":"\u6b7f",
"\u6b87":"\u6ba4",
"\u6b8b":"\u6b98",
"\u6b92":"\u6b9e",
"\u6b93":"\u6bae",
"\u6b9a":"\u6bab",
"\u6ba1":"\u6baf",
"\u6bb4":"\u6bc6",
"\u6bc1":"\u6bc0",
"\u6bc2":"\u8f42",
"\u6bd5":"\u7562",
"\u6bd9":"\u6583",
"\u6be1":"\u6c08",
"\u6bf5":"\u6bff",
"\u6c07":"\u6c0c",
"\u6c14":"\u6c23",
"\u6c22":"\u6c2b",
"\u6c29":"\u6c2c",
"\u6c32":"\u6c33",
"\u6c3d":"\u6c46",
"\u6c47":"\u532f",
"\u6c49":"\u6f22",
"\u6c64":"\u6e6f",
"\u6c79":"\u6d36",
"\u6c9f":"\u6e9d",
"\u6ca1":"\u6c92",
"\u6ca3":"\u7043",
"\u6ca4":"\u6f1a",
"\u6ca5":"\u701d",
"\u6ca6":"\u6dea",
"\u6ca7":"\u6ec4",
"\u6ca8":"\u6e22",
"\u6ca9":"\u6e88",
"\u6caa":"\u6eec",
"\u6cb2":"\u6cb1",
"\u6cc4":"\u6d29",
"\u6cde":"\u6fd8",
"\u6cea":"\u6dda",
"\u6cf6":"\u6fa9",
"\u6cf7":"\u7027",
"\u6cf8":"\u7018",
"\u6cfa":"\u6ffc",
"\u6cfb":"\u7009",
"\u6cfc":"\u6f51",
"\u6cfd":"\u6fa4",
"\u6cfe":"\u6d87",
"\u6d01":"\u6f54",
"\u6d12":"\u7051",
"\u6d3c":"\u7aaa",
"\u6d43":"\u6d79",
"\u6d45":"\u6dfa",
"\u6d46":"\u6f3f",
"\u6d47":"\u6f86",
"\u6d48":"\u6e5e",
"\u6d49":"\u6eae",
"\u6d4a":"\u6fc1",
"\u6d4b":"\u6e2c",
"\u6d4d":"\u6fae",
"\u6d4e":"\u6fdf",
"\u6d4f":"\u700f",
"\u6d50":"\u6efb",
"\u6d51":"\u6e3e",
"\u6d52":"\u6ef8",
"\u6d53":"\u6fc3",
"\u6d54":"\u6f6f",
"\u6d55":"\u6fdc",
"\u6d5c":"\u6ff1",
"\u6d8c":"\u6e67",
"\u6d9b":"\u6fe4",
"\u6d9d":"\u6f87",
"\u6d9e":"\u6df6",
"\u6d9f":"\u6f23",
"\u6da0":"\u6f7f",
"\u6da1":"\u6e26",
"\u6da2":"\u6eb3",
"\u6da3":"\u6e19",
"\u6da4":"\u6ecc",
"\u6da6":"\u6f64",
"\u6da7":"\u6f97",
"\u6da8":"\u6f32",
"\u6da9":"\u6f80",
"\u6e0a":"\u6df5",
"\u6e0c":"\u6de5",
"\u6e0d":"\u6f2c",
"\u6e0e":"\u7006",
"\u6e10":"\u6f38",
"\u6e11":"\u6fa0",
"\u6e14":"\u6f01",
"\u6e16":"\u700b",
"\u6e17":"\u6ef2",
"\u6e29":"\u6eab",
"\u6e7e":"\u7063",
"\u6e7f":"\u6fd5",
"\u6e83":"\u6f70",
"\u6e85":"\u6ffa",
"\u6e86":"\u6f35",
"\u6e87":"\u6f0a",
"\u6ebc":"\u6fd5",
"\u6ed7":"\u6f77",
"\u6eda":"\u6efe",
"\u6ede":"\u6eef",
"\u6edf":"\u7069",
"\u6ee0":"\u7044",
"\u6ee1":"\u6eff",
"\u6ee2":"\u7005",
"\u6ee4":"\u6ffe",
"\u6ee5":"\u6feb",
"\u6ee6":"\u7064",
"\u6ee8":"\u6ff1",
"\u6ee9":"\u7058",
"\u6eea":"\u6fa6",
"\u6f46":"\u7020",
"\u6f47":"\u701f",
"\u6f4b":"\u7032",
"\u6f4d":"\u6ff0",
"\u6f5c":"\u6f5b",
"\u6f74":"\u7026",
"\u6f9c":"\u703e",
"\u6fd1":"\u7028",
"\u6fd2":"\u7015",
"\u704f":"\u705d",
"\u706d":"\u6ec5",
"\u706f":"\u71c8",
"\u7075":"\u9748",
"\u707e":"\u707d",
"\u707f":"\u71e6",
"\u7080":"\u716c",
"\u7089":"\u7210",
"\u7096":"\u71c9",
"\u709c":"\u7152",
"\u709d":"\u7197",
"\u70a4":"\u7167",
"\u70b9":"\u9ede",
"\u70bc":"\u7149",
"\u70bd":"\u71be",
"\u70c1":"\u720d",
"\u70c2":"\u721b",
"\u70c3":"\u70f4",
"\u70db":"\u71ed",
"\u70df":"\u7159",
"\u70e6":"\u7169",
"\u70e7":"\u71d2",
"\u70e8":"\u71c1",
"\u70e9":"\u71f4",
"\u70eb":"\u71d9",
"\u70ec":"\u71fc",
"\u70ed":"\u71b1",
"\u7115":"\u7165",
"\u7116":"\u71dc",
"\u7118":"\u71fe",
"\u7145":"\u935b",
"\u7231":"\u611b",
"\u7232":"\u70ba",
"\u7237":"\u723a",
"\u7240":"\u5e8a",
"\u724d":"\u7258",
"\u7266":"\u729b",
"\u7275":"\u727d",
"\u727a":"\u72a7",
"\u728a":"\u72a2",
"\u72b6":"\u72c0",
"\u72b7":"\u7377",
"\u72b8":"\u7341",
"\u72b9":"\u7336",
"\u72c8":"\u72fd",
"\u72dd":"\u736e",
"\u72de":"\u7370",
"\u72ec":"\u7368",
"\u72ed":"\u72f9",
"\u72ee":"\u7345",
"\u72ef":"\u736a",
"\u72f0":"\u7319",
"\u72f1":"\u7344",
"\u72f2":"\u733b",
"\u7303":"\u736b",
"\u730e":"\u7375",
"\u7315":"\u737c",
"\u7321":"\u7380",
"\u732a":"\u8c6c",
"\u732b":"\u8c93",
"\u732c":"\u875f",
"\u732e":"\u737b",
"\u7343":"\u5446",
"\u736d":"\u737a",
"\u7391":"\u74a3",
"\u739b":"\u746a",
"\u73ae":"\u744b",
"\u73af":"\u74b0",
"\u73b0":"\u73fe",
"\u73b1":"\u7472",
"\u73ba":"\u74bd",
"\u73c9":"\u739f",
"\u73cf":"\u73a8",
"\u73d0":"\u743a",
"\u73d1":"\u74cf",
"\u73f2":"\u743f",
"\u740e":"\u74a1",
"\u740f":"\u7489",
"\u7410":"\u7463",
"\u742f":"\u7ba1",
"\u743c":"\u74ca",
"\u7476":"\u7464",
"\u7477":"\u74a6",
"\u748e":"\u74d4",
"\u74d2":"\u74da",
"\u74ee":"\u7515",
"\u74ef":"\u750c",
"\u7523":"\u7522",
"\u7535":"\u96fb",
"\u753b":"\u756b",
"\u7545":"\u66a2",
"\u7572":"\u756c",
"\u7574":"\u7587",
"\u7596":"\u7664",
"\u7597":"\u7642",
"\u759f":"\u7627",
"\u75a0":"\u7658",
"\u75a1":"\u760d",
"\u75ac":"\u7667",
"\u75ae":"\u7621",
"\u75af":"\u760b",
"\u75b1":"\u76b0",
"\u75b4":"\u75fe",
"\u75c8":"\u7670",
"\u75c9":"\u75d9",
"\u75d2":"\u7662",
"\u75d6":"\u7602",
"\u75e8":"\u7646",
"\u75ea":"\u7613",
"\u75eb":"\u7647",
"\u75f9":"\u75fa",
"\u7605":"\u7649",
"\u7617":"\u761e",
"\u7618":"\u763b",
"\u762a":"\u765f",
"\u762b":"\u7671",
"\u763e":"\u766e",
"\u763f":"\u766d",
"\u765e":"\u7669",
"\u7661":"\u75f4",
"\u7663":"\u766c",
"\u766b":"\u7672",
"\u7691":"\u769a",
"\u76b0":"\u75b1",
"\u76b1":"\u76ba",
"\u76b2":"\u76b8",
"\u76cf":"\u76de",
"\u76d0":"\u9e7d",
"\u76d1":"\u76e3",
"\u76d6":"\u84cb",
"\u76d7":"\u76dc",
"\u76d8":"\u76e4",
"\u770d":"\u7798",
"\u770e":"\u8996",
"\u7726":"\u7725",
"\u772c":"\u77d3",
"\u7740":"\u8457",
"\u7741":"\u775c",
"\u7750":"\u775e",
"\u7751":"\u77bc",
"\u7792":"\u779e",
"\u77a9":"\u77da",
"\u77eb":"\u77ef",
"\u77f6":"\u78ef",
"\u77fe":"\u792c",
"\u77ff":"\u7926",
"\u7800":"\u78ad",
"\u7801":"\u78bc",
"\u7816":"\u78da",
"\u7817":"\u7868",
"\u781a":"\u786f",
"\u781c":"\u78b8",
"\u783a":"\u792a",
"\u783b":"\u7931",
"\u783e":"\u792b",
"\u7840":"\u790e",
"\u7855":"\u78a9",
"\u7856":"\u7864",
"\u7857":"\u78fd",
"\u7859":"\u78d1",
"\u785a":"\u7904",
"\u786e":"\u78ba",
"\u7877":"\u9e7c",
"\u788d":"\u7919",
"\u789b":"\u78e7",
"\u789c":"\u78e3",
"\u78b1":"\u9e7c",
"\u7921":"\u7934",
"\u793c":"\u79ae",
"\u794e":"\u7995",
"\u796f":"\u798e",
"\u7977":"\u79b1",
"\u7978":"\u798d",
"\u7980":"\u7a1f",
"\u7984":"\u797f",
"\u7985":"\u79aa",
"\u79b0":"\u7962",
"\u79bb":"\u96e2",
"\u79c3":"\u79bf",
"\u79c6":"\u7a08",
"\u79cd":"\u7a2e",
"\u79ef":"\u7a4d",
"\u79f0":"\u7a31",
"\u79fd":"\u7a62",
"\u7a0e":"\u7a05",
"\u7a23":"\u7a4c",
"\u7a2d":"\u79f8",
"\u7a33":"\u7a69",
"\u7a51":"\u7a61",
"\u7a77":"\u7aae",
"\u7a83":"\u7aca",
"\u7a8d":"\u7ac5",
"\u7a8e":"\u7ab5",
"\u7a91":"\u7aaf",
"\u7a9c":"\u7ac4",
"\u7a9d":"\u7aa9",
"\u7aa5":"\u7aba",
"\u7aa6":"\u7ac7",
"\u7aad":"\u7ab6",
"\u7ad6":"\u8c4e",
"\u7ade":"\u7af6",
"\u7b03":"\u7be4",
"\u7b0b":"\u7b4d",
"\u7b14":"\u7b46",
"\u7b15":"\u7b67",
"\u7b3a":"\u7b8b",
"\u7b3c":"\u7c60",
"\u7b3e":"\u7c69",
"\u7b51":"\u7bc9",
"\u7b5a":"\u7bf3",
"\u7b5b":"\u7be9",
"\u7b5d":"\u7b8f",
"\u7b79":"\u7c4c",
"\u7b7e":"\u7c3d",
"\u7b80":"\u7c21",
"\u7b93":"\u7c59",
"\u7ba6":"\u7c00",
"\u7ba7":"\u7bcb",
"\u7ba8":"\u7c5c",
"\u7ba9":"\u7c6e",
"\u7baa":"\u7c1e",
"\u7bab":"\u7c2b",
"\u7bd1":"\u7c23",
"\u7bd3":"\u7c0d",
"\u7bee":"\u7c43",
"\u7bf1":"\u7c6c",
"\u7c16":"\u7c6a",
"\u7c41":"\u7c5f",
"\u7c74":"\u7cf4",
"\u7c7b":"\u985e",
"\u7c7c":"\u79c8",
"\u7c9c":"\u7cf6",
"\u7c9d":"\u7cf2",
"\u7ca4":"\u7cb5",
"\u7caa":"\u7cde",
"\u7cae":"\u7ce7",
"\u7cc1":"\u7cdd",
"\u7cc7":"\u9931",
"\u7ccd":"\u9908",
"\u7d25":"\u7d2e",
"\u7d27":"\u7dca",
"\u7d77":"\u7e36",
"\u7dab":"\u7dda",
"\u7ea0":"\u7cfe",
"\u7ea1":"\u7d06",
"\u7ea2":"\u7d05",
"\u7ea3":"\u7d02",
"\u7ea4":"\u7e96",
"\u7ea5":"\u7d07",
"\u7ea6":"\u7d04",
"\u7ea7":"\u7d1a",
"\u7ea8":"\u7d08",
"\u7ea9":"\u7e8a",
"\u7eaa":"\u7d00",
"\u7eab":"\u7d09",
"\u7eac":"\u7def",
"\u7ead":"\u7d1c",
"\u7eae":"\u7d18",
"\u7eaf":"\u7d14",
"\u7eb0":"\u7d15",
"\u7eb1":"\u7d17",
"\u7eb2":"\u7db1",
"\u7eb3":"\u7d0d",
"\u7eb4":"\u7d1d",
"\u7eb5":"\u7e31",
"\u7eb6":"\u7db8",
"\u7eb7":"\u7d1b",
"\u7eb8":"\u7d19",
"\u7eb9":"\u7d0b",
"\u7eba":"\u7d21",
"\u7ebc":"\u7d16",
"\u7ebd":"\u7d10",
"\u7ebe":"\u7d13",
"\u7ebf":"\u7dda",
"\u7ec0":"\u7d3a",
"\u7ec1":"\u7d32",
"\u7ec2":"\u7d31",
"\u7ec3":"\u7df4",
"\u7ec4":"\u7d44",
"\u7ec5":"\u7d33",
"\u7ec6":"\u7d30",
"\u7ec7":"\u7e54",
"\u7ec8":"\u7d42",
"\u7ec9":"\u7e10",
"\u7eca":"\u7d46",
"\u7ecb":"\u7d3c",
"\u7ecc":"\u7d40",
"\u7ecd":"\u7d39",
"\u7ece":"\u7e79",
"\u7ecf":"\u7d93",
"\u7ed0":"\u7d3f",
"\u7ed1":"\u7d81",
"\u7ed2":"\u7d68",
"\u7ed3":"\u7d50",
"\u7ed4":"\u7d5d",
"\u7ed5":"\u7e5e",
"\u7ed6":"\u7d70",
"\u7ed7":"\u7d4e",
"\u7ed8":"\u7e6a",
"\u7ed9":"\u7d66",
"\u7eda":"\u7d62",
"\u7edb":"\u7d73",
"\u7edc":"\u7d61",
"\u7edd":"\u7d55",
"\u7ede":"\u7d5e",
"\u7edf":"\u7d71",
"\u7ee0":"\u7d86",
"\u7ee1":"\u7d83",
"\u7ee2":"\u7d79",
"\u7ee3":"\u7e61",
"\u7ee5":"\u7d8f",
"\u7ee6":"\u7d5b",
"\u7ee7":"\u7e7c",
"\u7ee8":"\u7d88",
"\u7ee9":"\u7e3e",
"\u7eea":"\u7dd2",
"\u7eeb":"\u7dbe",
"\u7eed":"\u7e8c",
"\u7eee":"\u7dba",
"\u7eef":"\u7dcb",
"\u7ef0":"\u7dbd",
"\u7ef1":"\u7dd4",
"\u7ef2":"\u7dc4",
"\u7ef3":"\u7e69",
"\u7ef4":"\u7dad",
"\u7ef5":"\u7dbf",
"\u7ef6":"\u7dac",
"\u7ef7":"\u7e43",
"\u7ef8":"\u7da2",
"\u7efa":"\u7db9",
"\u7efb":"\u7da3",
"\u7efc":"\u7d9c",
"\u7efd":"\u7dbb",
"\u7efe":"\u7db0",
"\u7eff":"\u7da0",
"\u7f00":"\u7db4",
"\u7f01":"\u7dc7",
"\u7f02":"\u7dd9",
"\u7f03":"\u7dd7",
"\u7f04":"\u7dd8",
"\u7f05":"\u7dec",
"\u7f06":"\u7e9c",
"\u7f07":"\u7df9",
"\u7f08":"\u7df2",
"\u7f09":"\u7ddd",
"\u7f0a":"\u7e15",
"\u7f0b":"\u7e62",
"\u7f0c":"\u7de6",
"\u7f0d":"\u7d9e",
"\u7f0e":"\u7dde",
"\u7f0f":"\u7df6",
"\u7f11":"\u7df1",
"\u7f12":"\u7e0b",
"\u7f13":"\u7de9",
"\u7f14":"\u7de0",
"\u7f15":"\u7e37",
"\u7f16":"\u7de8",
"\u7f17":"\u7de1",
"\u7f18":"\u7de3",
"\u7f19":"\u7e09",
"\u7f1a":"\u7e1b",
"\u7f1b":"\u7e1f",
"\u7f1c":"\u7e1d",
"\u7f1d":"\u7e2b",
"\u7f1e":"\u7e17",
"\u7f1f":"\u7e1e",
"\u7f20":"\u7e8f",
"\u7f21":"\u7e2d",
"\u7f22":"\u7e0a",
"\u7f23":"\u7e11",
"\u7f24":"\u7e7d",
"\u7f25":"\u7e39",
"\u7f26":"\u7e35",
"\u7f27":"\u7e32",
"\u7f28":"\u7e93",
"\u7f29":"\u7e2e",
"\u7f2a":"\u7e46",
"\u7f2b":"\u7e45",
"\u7f2c":"\u7e88",
"\u7f2d":"\u7e5a",
"\u7f2e":"\u7e55",
"\u7f2f":"\u7e52",
"\u7f30":"\u97c1",
"\u7f31":"\u7e7e",
"\u7f32":"\u7e70",
"\u7f33":"\u7e6f",
"\u7f34":"\u7e73",
"\u7f35":"\u7e98",
"\u7f42":"\u7f4c",
"\u7f4e":"\u7f48",
"\u7f51":"\u7db2",
"\u7f57":"\u7f85",
"\u7f5a":"\u7f70",
"\u7f62":"\u7f77",
"\u7f74":"\u7f86",
"\u7f81":"\u7f88",
"\u7f9f":"\u7fa5",
"\u7fa1":"\u7fa8",
"\u7fd8":"\u7ff9",
"\u7fda":"\u7fec",
"\u8022":"\u802e",
"\u8027":"\u802c",
"\u8038":"\u8073",
"\u803b":"\u6065",
"\u8042":"\u8076",
"\u804b":"\u807e",
"\u804c":"\u8077",
"\u804d":"\u8079",
"\u8054":"\u806f",
"\u8069":"\u8075",
"\u806a":"\u8070",
"\u8080":"\u807f",
"\u8083":"\u8085",
"\u80a0":"\u8178",
"\u80a4":"\u819a",
"\u80ae":"\u9aaf",
"\u80be":"\u814e",
"\u80bf":"\u816b",
"\u80c0":"\u8139",
"\u80c1":"\u8105",
"\u80c6":"\u81bd",
"\u80dc":"\u52dd",
"\u80e7":"\u6727",
"\u80e8":"\u8156",
"\u80ea":"\u81da",
"\u80eb":"\u811b",
"\u80f6":"\u81a0",
"\u8109":"\u8108",
"\u810d":"\u81be",
"\u810f":"\u9ad2",
"\u8110":"\u81cd",
"\u8111":"\u8166",
"\u8113":"\u81bf",
"\u8114":"\u81e0",
"\u811a":"\u8173",
"\u8123":"\u5507",
"\u8129":"\u4fee",
"\u8131":"\u812b",
"\u8136":"\u8161",
"\u8138":"\u81c9",
"\u814a":"\u81d8",
"\u814c":"\u9183",
"\u8158":"\u8195",
"\u816d":"\u984e",
"\u817b":"\u81a9",
"\u817c":"\u9766",
"\u817d":"\u8183",
"\u817e":"\u9a30",
"\u8191":"\u81cf",
"\u81bb":"\u7fb6",
"\u81dc":"\u81e2",
"\u8206":"\u8f3f",
"\u8223":"\u8264",
"\u8230":"\u8266",
"\u8231":"\u8259",
"\u823b":"\u826b",
"\u8270":"\u8271",
"\u8273":"\u8c54",
"\u827a":"\u85dd",
"\u8282":"\u7bc0",
"\u8288":"\u7f8b",
"\u8297":"\u858c",
"\u829c":"\u856a",
"\u82a6":"\u8606",
"\u82c1":"\u84ef",
"\u82c7":"\u8466",
"\u82c8":"\u85f6",
"\u82cb":"\u83a7",
"\u82cc":"\u8407",
"\u82cd":"\u84bc",
"\u82ce":"\u82e7",
"\u82cf":"\u8607",
"\u82f9":"\u860b",
"\u830e":"\u8396",
"\u830f":"\u8622",
"\u8311":"\u8526",
"\u8314":"\u584b",
"\u8315":"\u7162",
"\u8327":"\u7e6d",
"\u8346":"\u834a",
"\u8350":"\u85a6",
"\u835a":"\u83a2",
"\u835b":"\u8558",
"\u835c":"\u84fd",
"\u835e":"\u854e",
"\u835f":"\u8588",
"\u8360":"\u85ba",
"\u8361":"\u8569",
"\u8363":"\u69ae",
"\u8364":"\u8477",
"\u8365":"\u6ece",
"\u8366":"\u7296",
"\u8367":"\u7192",
"\u8368":"\u8541",
"\u8369":"\u85ce",
"\u836a":"\u84c0",
"\u836b":"\u852d",
"\u836c":"\u8552",
"\u836d":"\u8452",
"\u836e":"\u8464",
"\u836f":"\u85e5",
"\u8385":"\u849e",
"\u83b1":"\u840a",
"\u83b2":"\u84ee",
"\u83b3":"\u8494",
"\u83b4":"\u8435",
"\u83b6":"\u859f",
"\u83b7":"\u7372",
"\u83b8":"\u8555",
"\u83b9":"\u7469",
"\u83ba":"\u9daf",
"\u83bc":"\u84f4",
"\u841a":"\u8600",
"\u841d":"\u863f",
"\u8424":"\u87a2",
"\u8425":"\u71df",
"\u8426":"\u7e08",
"\u8427":"\u856d",
"\u8428":"\u85a9",
"\u8457":"\u8457",
"\u846f":"\u85e5",
"\u8471":"\u8525",
"\u8487":"\u8546",
"\u8489":"\u8562",
"\u848b":"\u8523",
"\u848c":"\u851e",
"\u84dd":"\u85cd",
"\u84df":"\u858a",
"\u84e0":"\u863a",
"\u84e3":"\u8577",
"\u84e5":"\u93a3",
"\u84e6":"\u9a40",
"\u8534":"\u9ebb",
"\u8537":"\u8594",
"\u8539":"\u861e",
"\u853a":"\u85fa",
"\u853c":"\u85f9",
"\u8572":"\u8604",
"\u8574":"\u860a",
"\u85ae":"\u85ea",
"\u85d3":"\u861a",
"\u8616":"\u8617",
"\u864f":"\u865c",
"\u8651":"\u616e",
"\u865a":"\u865b",
"\u866b":"\u87f2",
"\u866c":"\u866f",
"\u866e":"\u87e3",
"\u8671":"\u8768",
"\u867d":"\u96d6",
"\u867e":"\u8766",
"\u867f":"\u8806",
"\u8680":"\u8755",
"\u8681":"\u87fb",
"\u8682":"\u879e",
"\u8695":"\u8836",
"\u86ac":"\u8706",
"\u86ca":"\u8831",
"\u86ce":"\u8823",
"\u86cf":"\u87f6",
"\u86ee":"\u883b",
"\u86f0":"\u87c4",
"\u86f1":"\u86fa",
"\u86f2":"\u87ef",
"\u86f3":"\u8784",
"\u86f4":"\u8810",
"\u8715":"\u86fb",
"\u8717":"\u8778",
"\u8721":"\u881f",
"\u8747":"\u8805",
"\u8748":"\u87c8",
"\u8749":"\u87ec",
"\u874e":"\u880d",
"\u8770":"\u867a",
"\u877c":"\u87bb",
"\u877e":"\u8811",
"\u87a8":"\u87ce",
"\u87cf":"\u8828",
"\u87ee":"\u87fa",
"\u8845":"\u91c1",
"\u8846":"\u773e",
"\u8854":"\u929c",
"\u8865":"\u88dc",
"\u886c":"\u896f",
"\u886e":"\u889e",
"\u8884":"\u8956",
"\u8885":"\u88ca",
"\u889c":"\u896a",
"\u88ad":"\u8972",
"\u88c5":"\u88dd",
"\u88c6":"\u8960",
"\u88cf":"\u88e1",
"\u88e2":"\u8933",
"\u88e3":"\u895d",
"\u88e4":"\u8932",
"\u88e5":"\u8949",
"\u891b":"\u8938",
"\u8934":"\u8964",
"\u89c1":"\u898b",
"\u89c2":"\u89c0",
"\u89c3":"\u898e",
"\u89c4":"\u898f",
"\u89c5":"\u8993",
"\u89c6":"\u8996",
"\u89c7":"\u8998",
"\u89c8":"\u89bd",
"\u89c9":"\u89ba",
"\u89ca":"\u89ac",
"\u89cb":"\u89a1",
"\u89cc":"\u89bf",
"\u89ce":"\u89a6",
"\u89cf":"\u89af",
"\u89d0":"\u89b2",
"\u89d1":"\u89b7",
"\u89de":"\u89f4",
"\u89e6":"\u89f8",
"\u89ef":"\u89f6",
"\u8a3c":"\u8b49",
"\u8a89":"\u8b7d",
"\u8a8a":"\u8b04",
"\u8ba1":"\u8a08",
"\u8ba2":"\u8a02",
"\u8ba3":"\u8a03",
"\u8ba4":"\u8a8d",
"\u8ba5":"\u8b4f",
"\u8ba6":"\u8a10",
"\u8ba7":"\u8a0c",
"\u8ba8":"\u8a0e",
"\u8ba9":"\u8b93",
"\u8baa":"\u8a15",
"\u8bab":"\u8a16",
"\u8bad":"\u8a13",
"\u8bae":"\u8b70",
"\u8baf":"\u8a0a",
"\u8bb0":"\u8a18",
"\u8bb2":"\u8b1b",
"\u8bb3":"\u8af1",
"\u8bb4":"\u8b33",
"\u8bb5":"\u8a4e",
"\u8bb6":"\u8a1d",
"\u8bb7":"\u8a25",
"\u8bb8":"\u8a31",
"\u8bb9":"\u8a1b",
"\u8bba":"\u8ad6",
"\u8bbb":"\u8a29",
"\u8bbc":"\u8a1f",
"\u8bbd":"\u8af7",
"\u8bbe":"\u8a2d",
"\u8bbf":"\u8a2a",
"\u8bc0":"\u8a23",
"\u8bc1":"\u8b49",
"\u8bc2":"\u8a41",
"\u8bc3":"\u8a36",
"\u8bc4":"\u8a55",
"\u8bc5":"\u8a5b",
"\u8bc6":"\u8b58",
"\u8bc7":"\u8a57",
"\u8bc8":"\u8a50",
"\u8bc9":"\u8a34",
"\u8bca":"\u8a3a",
"\u8bcb":"\u8a46",
"\u8bcc":"\u8b05",
"\u8bcd":"\u8a5e",
"\u8bce":"\u8a58",
"\u8bcf":"\u8a54",
"\u8bd1":"\u8b6f",
"\u8bd2":"\u8a52",
"\u8bd3":"\u8a86",
"\u8bd4":"\u8a84",
"\u8bd5":"\u8a66",
"\u8bd6":"\u8a7f",
"\u8bd7":"\u8a69",
"\u8bd8":"\u8a70",
"\u8bd9":"\u8a7c",
"\u8bda":"\u8aa0",
"\u8bdb":"\u8a85",
"\u8bdc":"\u8a75",
"\u8bdd":"\u8a71",
"\u8bde":"\u8a95",
"\u8bdf":"\u8a6c",
"\u8be0":"\u8a6e",
"\u8be1":"\u8a6d",
"\u8be2":"\u8a62",
"\u8be3":"\u8a63",
"\u8be4":"\u8acd",
"\u8be5":"\u8a72",
"\u8be6":"\u8a73",
"\u8be7":"\u8a6b",
"\u8be8":"\u8ae2",
"\u8be9":"\u8a61",
"\u8beb":"\u8aa1",
"\u8bec":"\u8aa3",
"\u8bed":"\u8a9e",
"\u8bee":"\u8a9a",
"\u8bef":"\u8aa4",
"\u8bf0":"\u8aa5",
"\u8bf1":"\u8a98",
"\u8bf2":"\u8aa8",
"\u8bf3":"\u8a91",
"\u8bf4":"\u8aaa",
"\u8bf5":"\u8aa6",
"\u8bf6":"\u8a92",
"\u8bf7":"\u8acb",
"\u8bf8":"\u8af8",
"\u8bf9":"\u8acf",
"\u8bfa":"\u8afe",
"\u8bfb":"\u8b80",
"\u8bfc":"\u8ad1",
"\u8bfd":"\u8ab9",
"\u8bfe":"\u8ab2",
"\u8bff":"\u8ac9",
"\u8c00":"\u8adb",
"\u8c01":"\u8ab0",
"\u8c02":"\u8ad7",
"\u8c03":"\u8abf",
"\u8c04":"\u8ac2",
"\u8c05":"\u8ad2",
"\u8c06":"\u8ac4",
"\u8c07":"\u8ab6",
"\u8c08":"\u8ac7",
"\u8c09":"\u8b85",
"\u8c0a":"\u8abc",
"\u8c0b":"\u8b00",
"\u8c0c":"\u8af6",
"\u8c0d":"\u8adc",
"\u8c0e":"\u8b0a",
"\u8c0f":"\u8aeb",
"\u8c10":"\u8ae7",
"\u8c11":"\u8b14",
"\u8c12":"\u8b01",
"\u8c13":"\u8b02",
"\u8c14":"\u8ae4",
"\u8c15":"\u8aed",
"\u8c16":"\u8afc",
"\u8c17":"\u8b92",
"\u8c18":"\u8aee",
"\u8c19":"\u8af3",
"\u8c1a":"\u8afa",
"\u8c1b":"\u8ae6",
"\u8c1c":"\u8b0e",
"\u8c1d":"\u8ade",
"\u8c1e":"\u8add",
"\u8c1f":"\u8b28",
"\u8c20":"\u8b9c",
"\u8c21":"\u8b16",
"\u8c22":"\u8b1d",
"\u8c23":"\u8b20",
"\u8c24":"\u8b17",
"\u8c25":"\u8b1a",
"\u8c26":"\u8b19",
"\u8c27":"\u8b10",
"\u8c28":"\u8b39",
"\u8c29":"\u8b3e",
"\u8c2a":"\u8b2b",
"\u8c2b":"\u8b7e",
"\u8c2c":"\u8b2c",
"\u8c2d":"\u8b5a",
"\u8c2e":"\u8b56",
"\u8c2f":"\u8b59",
"\u8c30":"\u8b95",
"\u8c31":"\u8b5c",
"\u8c32":"\u8b4e",
"\u8c33":"\u8b9e",
"\u8c34":"\u8b74",
"\u8c35":"\u8b6b",
"\u8c36":"\u8b96",
"\u8c6e":"\u8c76",
"\u8d1c":"\u8d13",
"\u8d1d":"\u8c9d",
"\u8d1e":"\u8c9e",
"\u8d1f":"\u8ca0",
"\u8d21":"\u8ca2",
"\u8d22":"\u8ca1",
"\u8d23":"\u8cac",
"\u8d24":"\u8ce2",
"\u8d25":"\u6557",
"\u8d26":"\u8cec",
"\u8d27":"\u8ca8",
"\u8d28":"\u8cea",
"\u8d29":"\u8ca9",
"\u8d2a":"\u8caa",
"\u8d2b":"\u8ca7",
"\u8d2c":"\u8cb6",
"\u8d2d":"\u8cfc",
"\u8d2e":"\u8caf",
"\u8d2f":"\u8cab",
"\u8d30":"\u8cb3",
"\u8d31":"\u8ce4",
"\u8d32":"\u8cc1",
"\u8d33":"\u8cb0",
"\u8d34":"\u8cbc",
"\u8d35":"\u8cb4",
"\u8d36":"\u8cba",
"\u8d37":"\u8cb8",
"\u8d38":"\u8cbf",
"\u8d39":"\u8cbb",
"\u8d3a":"\u8cc0",
"\u8d3b":"\u8cbd",
"\u8d3c":"\u8cca",
"\u8d3d":"\u8d04",
"\u8d3e":"\u8cc8",
"\u8d3f":"\u8cc4",
"\u8d40":"\u8cb2",
"\u8d41":"\u8cc3",
"\u8d42":"\u8cc2",
"\u8d43":"\u8d13",
"\u8d44":"\u8cc7",
"\u8d45":"\u8cc5",
"\u8d46":"\u8d10",
"\u8d47":"\u8cd5",
"\u8d48":"\u8cd1",
"\u8d49":"\u8cda",
"\u8d4a":"\u8cd2",
"\u8d4b":"\u8ce6",
"\u8d4c":"\u8ced",
"\u8d4d":"\u9f4e",
"\u8d4e":"\u8d16",
"\u8d4f":"\u8cde",
"\u8d50":"\u8cdc",
"\u8d52":"\u8cd9",
"\u8d53":"\u8ce1",
"\u8d54":"\u8ce0",
"\u8d55":"\u8ce7",
"\u8d56":"\u8cf4",
"\u8d57":"\u8cf5",
"\u8d58":"\u8d05",
"\u8d59":"\u8cfb",
"\u8d5a":"\u8cfa",
"\u8d5b":"\u8cfd",
"\u8d5c":"\u8cfe",
"\u8d5d":"\u8d0b",
"\u8d5e":"\u8d0a",
"\u8d5f":"\u8d07",
"\u8d60":"\u8d08",
"\u8d61":"\u8d0d",
"\u8d62":"\u8d0f",
"\u8d63":"\u8d1b",
"\u8d75":"\u8d99",
"\u8d76":"\u8d95",
"\u8d8b":"\u8da8",
"\u8db1":"\u8db2",
"\u8db8":"\u8e89",
"\u8dc3":"\u8e8d",
"\u8dc4":"\u8e4c",
"\u8dde":"\u8e92",
"\u8df5":"\u8e10",
"\u8df7":"\u8e7a",
"\u8df8":"\u8e55",
"\u8df9":"\u8e9a",
"\u8dfb":"\u8e8b",
"\u8e0a":"\u8e34",
"\u8e0c":"\u8e8a",
"\u8e2a":"\u8e64",
"\u8e2c":"\u8e93",
"\u8e2f":"\u8e91",
"\u8e51":"\u8ea1",
"\u8e52":"\u8e63",
"\u8e70":"\u8e95",
"\u8e7f":"\u8ea5",
"\u8e8f":"\u8eaa",
"\u8e9c":"\u8ea6",
"\u8eaf":"\u8ec0",
"\u8eb0":"\u9ad4",
"\u8f66":"\u8eca",
"\u8f67":"\u8ecb",
"\u8f68":"\u8ecc",
"\u8f69":"\u8ed2",
"\u8f6b":"\u8ed4",
"\u8f6c":"\u8f49",
"\u8f6d":"\u8edb",
"\u8f6e":"\u8f2a",
"\u8f6f":"\u8edf",
"\u8f70":"\u8f5f",
"\u8f71":"\u8ef2",
"\u8f72":"\u8efb",
"\u8f73":"\u8f64",
"\u8f74":"\u8ef8",
"\u8f75":"\u8ef9",
"\u8f76":"\u8efc",
"\u8f77":"\u8ee4",
"\u8f78":"\u8eeb",
"\u8f79":"\u8f62",
"\u8f7a":"\u8efa",
"\u8f7b":"\u8f15",
"\u8f7c":"\u8efe",
"\u8f7d":"\u8f09",
"\u8f7e":"\u8f0a",
"\u8f7f":"\u8f4e",
"\u8f81":"\u8f07",
"\u8f82":"\u8f05",
"\u8f83":"\u8f03",
"\u8f84":"\u8f12",
"\u8f85":"\u8f14",
"\u8f86":"\u8f1b",
"\u8f87":"\u8f26",
"\u8f88":"\u8f29",
"\u8f89":"\u8f1d",
"\u8f8a":"\u8f25",
"\u8f8b":"\u8f1e",
"\u8f8d":"\u8f1f",
"\u8f8e":"\u8f1c",
"\u8f8f":"\u8f33",
"\u8f90":"\u8f3b",
"\u8f91":"\u8f2f",
"\u8f93":"\u8f38",
"\u8f94":"\u8f61",
"\u8f95":"\u8f45",
"\u8f96":"\u8f44",
"\u8f97":"\u8f3e",
"\u8f98":"\u8f46",
"\u8f99":"\u8f4d",
"\u8f9a":"\u8f54",
"\u8f9e":"\u8fad",
"\u8fa9":"\u8faf",
"\u8fab":"\u8fae",
"\u8fb9":"\u908a",
"\u8fbd":"\u907c",
"\u8fbe":"\u9054",
"\u8fc1":"\u9077",
"\u8fc7":"\u904e",
"\u8fc8":"\u9081",
"\u8fd0":"\u904b",
"\u8fd8":"\u9084",
"\u8fd9":"\u9019",
"\u8fdb":"\u9032",
"\u8fdc":"\u9060",
"\u8fdd":"\u9055",
"\u8fde":"\u9023",
"\u8fdf":"\u9072",
"\u8fe9":"\u9087",
"\u8ff3":"\u9015",
"\u8ff9":"\u8de1",
"\u9002":"\u9069",
"\u9009":"\u9078",
"\u900a":"\u905c",
"\u9012":"\u905e",
"\u9026":"\u9090",
"\u903b":"\u908f",
"\u9057":"\u907a",
"\u9065":"\u9059",
"\u9093":"\u9127",
"\u909d":"\u913a",
"\u90ac":"\u9114",
"\u90ae":"\u90f5",
"\u90b9":"\u9112",
"\u90ba":"\u9134",
"\u90bb":"\u9130",
"\u90c3":"\u5408",
"\u90c4":"\u9699",
"\u90cf":"\u90df",
"\u90d0":"\u9136",
"\u90d1":"\u912d",
"\u90d3":"\u9106",
"\u90e6":"\u9148",
"\u90e7":"\u9116",
"\u90f8":"\u9132",
"\u915d":"\u919e",
"\u9171":"\u91ac",
"\u917d":"\u91c5",
"\u917e":"\u91c3",
"\u917f":"\u91c0",
"\u9196":"\u919e",
"\u91ca":"\u91cb",
"\u91cc":"\u88e1",
"\u9208":"\u923d",
"\u9221":"\u9418",
"\u9246":"\u947d",
"\u9274":"\u9451",
"\u92ae":"\u947e",
"\u92bc":"\u5249",
"\u92fb":"\u9451",
"\u9318":"\u939a",
"\u9332":"\u9304",
"\u933e":"\u93e8",
"\u9452":"\u9451",
"\u9486":"\u91d3",
"\u9487":"\u91d4",
"\u9488":"\u91dd",
"\u9489":"\u91d8",
"\u948a":"\u91d7",
"\u948b":"\u91d9",
"\u948c":"\u91d5",
"\u948d":"\u91f7",
"\u948e":"\u91fa",
"\u948f":"\u91e7",
"\u9490":"\u91e4",
"\u9492":"\u91e9",
"\u9493":"\u91e3",
"\u9494":"\u9346",
"\u9495":"\u91f9",
"\u9496":"\u935a",
"\u9497":"\u91f5",
"\u9498":"\u9203",
"\u9499":"\u9223",
"\u949a":"\u9208",
"\u949b":"\u9226",
"\u949c":"\u9245",
"\u949d":"\u920d",
"\u949e":"\u9214",
"\u949f":"\u9418",
"\u94a0":"\u9209",
"\u94a1":"\u92c7",
"\u94a2":"\u92fc",
"\u94a3":"\u9211",
"\u94a4":"\u9210",
"\u94a5":"\u9470",
"\u94a6":"\u6b3d",
"\u94a7":"\u921e",
"\u94a8":"\u93a2",
"\u94a9":"\u9264",
"\u94aa":"\u9227",
"\u94ab":"\u9201",
"\u94ac":"\u9225",
"\u94ad":"\u9204",
"\u94ae":"\u9215",
"\u94af":"\u9200",
"\u94b0":"\u923a",
"\u94b1":"\u9322",
"\u94b2":"\u9266",
"\u94b3":"\u9257",
"\u94b4":"\u9237",
"\u94b5":"\u7f3d",
"\u94b6":"\u9233",
"\u94b7":"\u9255",
"\u94b8":"\u923d",
"\u94b9":"\u9238",
"\u94ba":"\u925e",
"\u94bb":"\u947d",
"\u94bc":"\u926c",
"\u94bd":"\u926d",
"\u94be":"\u9240",
"\u94bf":"\u923f",
"\u94c0":"\u923e",
"\u94c1":"\u9435",
"\u94c2":"\u9251",
"\u94c3":"\u9234",
"\u94c4":"\u9460",
"\u94c5":"\u925b",
"\u94c6":"\u925a",
"\u94c8":"\u9230",
"\u94c9":"\u9249",
"\u94ca":"\u9248",
"\u94cb":"\u924d",
"\u94cc":"\u922e",
"\u94cd":"\u9239",
"\u94ce":"\u9438",
"\u94cf":"\u9276",
"\u94d0":"\u92ac",
"\u94d1":"\u92a0",
"\u94d2":"\u927a",
"\u94d3":"\u92e9",
"\u94d5":"\u92aa",
"\u94d6":"\u92ee",
"\u94d7":"\u92cf",
"\u94d8":"\u92e3",
"\u94d9":"\u9403",
"\u94db":"\u943a",
"\u94dc":"\u9285",
"\u94dd":"\u92c1",
"\u94de":"\u92b1",
"\u94df":"\u92a6",
"\u94e0":"\u93a7",
"\u94e1":"\u9358",
"\u94e2":"\u9296",
"\u94e3":"\u9291",
"\u94e4":"\u92cc",
"\u94e5":"\u92a9",
"\u94e7":"\u93f5",
"\u94e8":"\u9293",
"\u94e9":"\u93a9",
"\u94ea":"\u927f",
"\u94eb":"\u929a",
"\u94ec":"\u927b",
"\u94ed":"\u9298",
"\u94ee":"\u931a",
"\u94ef":"\u92ab",
"\u94f0":"\u9278",
"\u94f1":"\u92a5",
"\u94f2":"\u93df",
"\u94f3":"\u9283",
"\u94f4":"\u940b",
"\u94f5":"\u92a8",
"\u94f6":"\u9280",
"\u94f7":"\u92a3",
"\u94f8":"\u9444",
"\u94f9":"\u9412",
"\u94fa":"\u92ea",
"\u94fc":"\u9338",
"\u94fd":"\u92f1",
"\u94fe":"\u93c8",
"\u94ff":"\u93d7",
"\u9500":"\u92b7",
"\u9501":"\u9396",
"\u9502":"\u92f0",
"\u9503":"\u92e5",
"\u9504":"\u92e4",
"\u9505":"\u934b",
"\u9506":"\u92ef",
"\u9507":"\u92e8",
"\u9508":"\u93fd",
"\u9509":"\u92bc",
"\u950a":"\u92dd",
"\u950b":"\u92d2",
"\u950c":"\u92c5",
"\u950d":"\u92f6",
"\u950e":"\u9426",
"\u950f":"\u9427",
"\u9510":"\u92b3",
"\u9511":"\u92bb",
"\u9512":"\u92c3",
"\u9513":"\u92df",
"\u9514":"\u92e6",
"\u9515":"\u9312",
"\u9516":"\u9306",
"\u9517":"\u937a",
"\u9518":"\u9369",
"\u9519":"\u932f",
"\u951a":"\u9328",
"\u951b":"\u931b",
"\u951c":"\u9321",
"\u951d":"\u9340",
"\u951e":"\u9301",
"\u951f":"\u9315",
"\u9521":"\u932b",
"\u9522":"\u932e",
"\u9523":"\u947c",
"\u9524":"\u9318",
"\u9525":"\u9310",
"\u9526":"\u9326",
"\u9527":"\u9455",
"\u9528":"\u9341",
"\u9529":"\u9308",
"\u952a":"\u9343",
"\u952b":"\u9307",
"\u952c":"\u931f",
"\u952d":"\u9320",
"\u952e":"\u9375",
"\u952f":"\u92f8",
"\u9530":"\u9333",
"\u9531":"\u9319",
"\u9532":"\u9365",
"\u9534":"\u9347",
"\u9535":"\u93d8",
"\u9536":"\u9376",
"\u9537":"\u9354",
"\u9538":"\u9364",
"\u9539":"\u936c",
"\u953a":"\u937e",
"\u953b":"\u935b",
"\u953c":"\u93aa",
"\u953e":"\u9370",
"\u953f":"\u9384",
"\u9540":"\u934d",
"\u9541":"\u9382",
"\u9542":"\u93e4",
"\u9543":"\u93a1",
"\u9544":"\u9428",
"\u9545":"\u9387",
"\u9546":"\u93cc",
"\u9547":"\u93ae",
"\u9549":"\u9398",
"\u954a":"\u9477",
"\u954b":"\u9482",
"\u954c":"\u942b",
"\u954d":"\u93b3",
"\u954e":"\u93bf",
"\u954f":"\u93a6",
"\u9550":"\u93ac",
"\u9551":"\u938a",
"\u9552":"\u93b0",
"\u9553":"\u93b5",
"\u9554":"\u944c",
"\u9555":"\u9394",
"\u9556":"\u93e2",
"\u9557":"\u93dc",
"\u9558":"\u93dd",
"\u9559":"\u93cd",
"\u955a":"\u93f0",
"\u955b":"\u93de",
"\u955c":"\u93e1",
"\u955d":"\u93d1",
"\u955e":"\u93c3",
"\u955f":"\u93c7",
"\u9561":"\u9414",
"\u9562":"\u941d",
"\u9563":"\u9410",
"\u9564":"\u93f7",
"\u9565":"\u9465",
"\u9566":"\u9413",
"\u9567":"\u946d",
"\u9568":"\u9420",
"\u9569":"\u9479",
"\u956a":"\u93f9",
"\u956b":"\u9419",
"\u956c":"\u944a",
"\u956d":"\u9433",
"\u956e":"\u9436",
"\u956f":"\u9432",
"\u9570":"\u942e",
"\u9571":"\u943f",
"\u9572":"\u9454",
"\u9573":"\u9463",
"\u9574":"\u945e",
"\u9576":"\u9472",
"\u957f":"\u9577",
"\u9591":"\u9592",
"\u95a7":"\u9b28",
"\u95e8":"\u9580",
"\u95e9":"\u9582",
"\u95ea":"\u9583",
"\u95eb":"\u9586",
"\u95ed":"\u9589",
"\u95ee":"\u554f",
"\u95ef":"\u95d6",
"\u95f0":"\u958f",
"\u95f1":"\u95c8",
"\u95f2":"\u9592",
"\u95f3":"\u958e",
"\u95f4":"\u9593",
"\u95f5":"\u9594",
"\u95f6":"\u958c",
"\u95f7":"\u60b6",
"\u95f8":"\u9598",
"\u95f9":"\u9b27",
"\u95fa":"\u95a8",
"\u95fb":"\u805e",
"\u95fc":"\u95e5",
"\u95fd":"\u95a9",
"\u95fe":"\u95ad",
"\u95ff":"\u95d3",
"\u9600":"\u95a5",
"\u9601":"\u95a3",
"\u9602":"\u95a1",
"\u9603":"\u95ab",
"\u9604":"\u9b2e",
"\u9605":"\u95b1",
"\u9606":"\u95ac",
"\u9608":"\u95be",
"\u9609":"\u95b9",
"\u960a":"\u95b6",
"\u960b":"\u9b29",
"\u960c":"\u95bf",
"\u960d":"\u95bd",
"\u960e":"\u95bb",
"\u960f":"\u95bc",
"\u9610":"\u95e1",
"\u9611":"\u95cc",
"\u9612":"\u95c3",
"\u9614":"\u95ca",
"\u9615":"\u95cb",
"\u9616":"\u95d4",
"\u9617":"\u95d0",
"\u9619":"\u95d5",
"\u961a":"\u95de",
"\u961f":"\u968a",
"\u9633":"\u967d",
"\u9634":"\u9670",
"\u9635":"\u9663",
"\u9636":"\u968e",
"\u9645":"\u969b",
"\u9646":"\u9678",
"\u9647":"\u96b4",
"\u9648":"\u9673",
"\u9649":"\u9658",
"\u9655":"\u965d",
"\u9667":"\u9689",
"\u9668":"\u9695",
"\u9669":"\u96aa",
"\u968f":"\u96a8",
"\u9690":"\u96b1",
"\u96b6":"\u96b8",
"\u96bd":"\u96cb",
"\u96be":"\u96e3",
"\u96cf":"\u96db",
"\u96e0":"\u8b8e",
"\u96f3":"\u9742",
"\u96fe":"\u9727",
"\u9701":"\u973d",
"\u9709":"\u9ef4",
"\u972d":"\u9744",
"\u9753":"\u975a",
"\u9759":"\u975c",
"\u9763":"\u9762",
"\u9765":"\u9768",
"\u9791":"\u97c3",
"\u9792":"\u6a47",
"\u97af":"\u97c9",
"\u97e6":"\u97cb",
"\u97e7":"\u97cc",
"\u97e8":"\u97cd",
"\u97e9":"\u97d3",
"\u97ea":"\u97d9",
"\u97eb":"\u97de",
"\u97ec":"\u97dc",
"\u97f5":"\u97fb",
"\u9875":"\u9801",
"\u9876":"\u9802",
"\u9877":"\u9803",
"\u9878":"\u9807",
"\u9879":"\u9805",
"\u987a":"\u9806",
"\u987b":"\u9808",
"\u987c":"\u980a",
"\u987d":"\u9811",
"\u987e":"\u9867",
"\u987f":"\u9813",
"\u9880":"\u980e",
"\u9881":"\u9812",
"\u9882":"\u980c",
"\u9883":"\u980f",
"\u9884":"\u9810",
"\u9885":"\u9871",
"\u9886":"\u9818",
"\u9887":"\u9817",
"\u9888":"\u9838",
"\u9889":"\u9821",
"\u988a":"\u9830",
"\u988b":"\u9832",
"\u988c":"\u981c",
"\u988d":"\u6f41",
"\u988f":"\u9826",
"\u9890":"\u9824",
"\u9891":"\u983b",
"\u9893":"\u9839",
"\u9894":"\u9837",
"\u9896":"\u7a4e",
"\u9897":"\u9846",
"\u9898":"\u984c",
"\u9899":"\u9852",
"\u989a":"\u984e",
"\u989b":"\u9853",
"\u989c":"\u984f",
"\u989d":"\u984d",
"\u989e":"\u9873",
"\u989f":"\u9862",
"\u98a0":"\u985b",
"\u98a1":"\u9859",
"\u98a2":"\u9865",
"\u98a4":"\u986b",
"\u98a5":"\u986c",
"\u98a6":"\u9870",
"\u98a7":"\u9874",
"\u98ce":"\u98a8",
"\u98d1":"\u98ae",
"\u98d2":"\u98af",
"\u98d3":"\u98b6",
"\u98d4":"\u98b8",
"\u98d5":"\u98bc",
"\u98d7":"\u98c0",
"\u98d8":"\u98c4",
"\u98d9":"\u98c6",
"\u98da":"\u98c8",
"\u98de":"\u98db",
"\u98e8":"\u9957",
"\u990d":"\u995c",
"\u9965":"\u98e2",
"\u9966":"\u98e5",
"\u9967":"\u9933",
"\u9968":"\u98e9",
"\u9969":"\u993c",
"\u996a":"\u98ea",
"\u996b":"\u98eb",
"\u996c":"\u98ed",
"\u996d":"\u98ef",
"\u996e":"\u98f2",
"\u996f":"\u991e",
"\u9970":"\u98fe",
"\u9971":"\u98fd",
"\u9972":"\u98fc",
"\u9973":"\u98ff",
"\u9974":"\u98f4",
"\u9975":"\u990c",
"\u9976":"\u9952",
"\u9977":"\u9909",
"\u9978":"\u9904",
"\u9979":"\u990e",
"\u997a":"\u9903",
"\u997b":"\u990f",
"\u997c":"\u9905",
"\u997d":"\u9911",
"\u997f":"\u9913",
"\u9980":"\u9918",
"\u9981":"\u9912",
"\u9983":"\u991c",
"\u9984":"\u991b",
"\u9985":"\u9921",
"\u9986":"\u9928",
"\u9987":"\u9937",
"\u9988":"\u994b",
"\u9989":"\u9936",
"\u998a":"\u993f",
"\u998b":"\u995e",
"\u998d":"\u9943",
"\u998e":"\u993a",
"\u998f":"\u993e",
"\u9990":"\u9948",
"\u9991":"\u9949",
"\u9992":"\u9945",
"\u9993":"\u994a",
"\u9994":"\u994c",
"\u9995":"\u995f",
"\u9a03":"\u5446",
"\u9a6c":"\u99ac",
"\u9a6d":"\u99ad",
"\u9a6e":"\u99b1",
"\u9a6f":"\u99b4",
"\u9a70":"\u99b3",
"\u9a71":"\u9a45",
"\u9a73":"\u99c1",
"\u9a74":"\u9a62",
"\u9a75":"\u99d4",
"\u9a76":"\u99db",
"\u9a77":"\u99df",
"\u9a78":"\u99d9",
"\u9a79":"\u99d2",
"\u9a7a":"\u9a36",
"\u9a7b":"\u99d0",
"\u9a7c":"\u99dd",
"\u9a7d":"\u99d1",
"\u9a7e":"\u99d5",
"\u9a7f":"\u9a5b",
"\u9a80":"\u99d8",
"\u9a81":"\u9a4d",
"\u9a82":"\u7f75",
"\u9a84":"\u9a55",
"\u9a85":"\u9a4a",
"\u9a86":"\u99f1",
"\u9a87":"\u99ed",
"\u9a88":"\u99e2",
"\u9a8a":"\u9a6a",
"\u9a8b":"\u9a01",
"\u9a8c":"\u9a57",
"\u9a8e":"\u99f8",
"\u9a8f":"\u99ff",
"\u9a90":"\u9a0f",
"\u9a91":"\u9a0e",
"\u9a92":"\u9a0d",
"\u9a93":"\u9a05",
"\u9a96":"\u9a42",
"\u9a97":"\u9a19",
"\u9a98":"\u9a2d",
"\u9a9a":"\u9a37",
"\u9a9b":"\u9a16",
"\u9a9c":"\u9a41",
"\u9a9d":"\u9a2e",
"\u9a9e":"\u9a2b",
"\u9a9f":"\u9a38",
"\u9aa0":"\u9a43",
"\u9aa1":"\u9a3e",
"\u9aa2":"\u9a44",
"\u9aa3":"\u9a4f",
"\u9aa4":"\u9a5f",
"\u9aa5":"\u9a65",
"\u9aa7":"\u9a64",
"\u9ac5":"\u9acf",
"\u9acb":"\u9ad6",
"\u9acc":"\u9ad5",
"\u9b13":"\u9b22",
"\u9b47":"\u9b58",
"\u9b49":"\u9b4e",
"\u9c7c":"\u9b5a",
"\u9c7d":"\u9b5b",
"\u9c7f":"\u9b77",
"\u9c81":"\u9b6f",
"\u9c82":"\u9b74",
"\u9c85":"\u9b81",
"\u9c86":"\u9b83",
"\u9c87":"\u9bf0",
"\u9c88":"\u9c78",
"\u9c8a":"\u9b93",
"\u9c8b":"\u9b92",
"\u9c8d":"\u9b91",
"\u9c8e":"\u9c5f",
"\u9c8f":"\u9b8d",
"\u9c90":"\u9b90",
"\u9c91":"\u9bad",
"\u9c92":"\u9b9a",
"\u9c94":"\u9baa",
"\u9c95":"\u9b9e",
"\u9c96":"\u9ba6",
"\u9c97":"\u9c02",
"\u9c99":"\u9c60",
"\u9c9a":"\u9c6d",
"\u9c9b":"\u9bab",
"\u9c9c":"\u9bae",
"\u9c9d":"\u9bba",
"\u9c9e":"\u9bd7",
"\u9c9f":"\u9c58",
"\u9ca0":"\u9bc1",
"\u9ca1":"\u9c7a",
"\u9ca2":"\u9c31",
"\u9ca3":"\u9c39",
"\u9ca4":"\u9bc9",
"\u9ca5":"\u9c23",
"\u9ca6":"\u9c37",
"\u9ca7":"\u9bc0",
"\u9ca8":"\u9bca",
"\u9ca9":"\u9bc7",
"\u9cab":"\u9bfd",
"\u9cad":"\u9bd6",
"\u9cae":"\u9bea",
"\u9cb0":"\u9beb",
"\u9cb1":"\u9be1",
"\u9cb2":"\u9be4",
"\u9cb3":"\u9be7",
"\u9cb4":"\u9bdd",
"\u9cb5":"\u9be2",
"\u9cb6":"\u9bf0",
"\u9cb7":"\u9bdb",
"\u9cb8":"\u9be8",
"\u9cba":"\u9bf4",
"\u9cbb":"\u9bd4",
"\u9cbc":"\u9c5d",
"\u9cbd":"\u9c08",
"\u9cbf":"\u9c68",
"\u9cc1":"\u9c1b",
"\u9cc3":"\u9c13",
"\u9cc4":"\u9c77",
"\u9cc5":"\u9c0d",
"\u9cc6":"\u9c12",
"\u9cc7":"\u9c09",
"\u9cca":"\u9bff",
"\u9ccb":"\u9c20",
"\u9ccc":"\u9c32",
"\u9ccd":"\u9c2d",
"\u9cce":"\u9c28",
"\u9ccf":"\u9c25",
"\u9cd0":"\u9c29",
"\u9cd1":"\u9c1f",
"\u9cd2":"\u9c1c",
"\u9cd3":"\u9c33",
"\u9cd4":"\u9c3e",
"\u9cd5":"\u9c48",
"\u9cd6":"\u9c49",
"\u9cd7":"\u9c3b",
"\u9cd8":"\u9c35",
"\u9cd9":"\u9c45",
"\u9cdb":"\u9c3c",
"\u9cdc":"\u9c56",
"\u9cdd":"\u9c54",
"\u9cde":"\u9c57",
"\u9cdf":"\u9c52",
"\u9ce2":"\u9c67",
"\u9ce3":"\u9c63",
"\u9d8f":"\u96de",
"\u9dc4":"\u96de",
"\u9e1f":"\u9ce5",
"\u9e20":"\u9ce9",
"\u9e21":"\u96de",
"\u9e22":"\u9cf6",
"\u9e23":"\u9cf4",
"\u9e25":"\u9dd7",
"\u9e26":"\u9d09",
"\u9e27":"\u9dac",
"\u9e28":"\u9d07",
"\u9e29":"\u9d06",
"\u9e2a":"\u9d23",
"\u9e2b":"\u9d87",
"\u9e2c":"\u9e15",
"\u9e2d":"\u9d28",
"\u9e2e":"\u9d1e",
"\u9e2f":"\u9d26",
"\u9e30":"\u9d12",
"\u9e31":"\u9d1f",
"\u9e32":"\u9d1d",
"\u9e33":"\u9d1b",
"\u9e35":"\u9d15",
"\u9e36":"\u9de5",
"\u9e37":"\u9dd9",
"\u9e38":"\u9d2f",
"\u9e39":"\u9d30",
"\u9e3a":"\u9d42",
"\u9e3b":"\u9d34",
"\u9e3c":"\u9d43",
"\u9e3d":"\u9d3f",
"\u9e3e":"\u9e1e",
"\u9e3f":"\u9d3b",
"\u9e41":"\u9d53",
"\u9e42":"\u9e1d",
"\u9e43":"\u9d51",
"\u9e44":"\u9d60",
"\u9e45":"\u9d5d",
"\u9e46":"\u9d52",
"\u9e47":"\u9df4",
"\u9e48":"\u9d5c",
"\u9e49":"\u9d61",
"\u9e4a":"\u9d72",
"\u9e4b":"\u9d93",
"\u9e4c":"\u9d6a",
"\u9e4e":"\u9d6f",
"\u9e4f":"\u9d6c",
"\u9e50":"\u9d6e",
"\u9e51":"\u9d89",
"\u9e52":"\u9d8a",
"\u9e55":"\u9d98",
"\u9e56":"\u9da1",
"\u9e57":"\u9d9a",
"\u9e58":"\u9dbb",
"\u9e59":"\u9d96",
"\u9e5a":"\u9dbf",
"\u9e5b":"\u9da5",
"\u9e5c":"\u9da9",
"\u9e5e":"\u9dc2",
"\u9e61":"\u9dba",
"\u9e63":"\u9dbc",
"\u9e64":"\u9db4",
"\u9e65":"\u9dd6",
"\u9e66":"\u9e1a",
"\u9e67":"\u9dd3",
"\u9e68":"\u9dda",
"\u9e69":"\u9def",
"\u9e6a":"\u9de6",
"\u9e6b":"\u9df2",
"\u9e6c":"\u9df8",
"\u9e6d":"\u9dfa",
"\u9e6f":"\u9e07",
"\u9e70":"\u9df9",
"\u9e71":"\u9e0c",
"\u9e73":"\u9e1b",
"\u9e7e":"\u9e7a",
"\u9ea6":"\u9ea5",
"\u9eb8":"\u9ea9",
"\u9ebd":"\u9ebc",
"\u9ec4":"\u9ec3",
"\u9ec9":"\u9ecc",
"\u9ee1":"\u9ef6",
"\u9ee9":"\u9ef7",
"\u9eea":"\u9ef2",
"\u9efe":"\u9efd",
"\u9f0b":"\u9eff",
"\u9f0d":"\u9f09",
"\u9f39":"\u9f34",
"\u9f50":"\u9f4a",
"\u9f51":"\u9f4f",
"\u9f76":"\u984e",
"\u9f7f":"\u9f52",
"\u9f80":"\u9f54",
"\u9f83":"\u9f5f",
"\u9f84":"\u9f61",
"\u9f85":"\u9f59",
"\u9f86":"\u9f60",
"\u9f87":"\u9f5c",
"\u9f88":"\u9f66",
"\u9f89":"\u9f6c",
"\u9f8a":"\u9f6a",
"\u9f8b":"\u9f72",
"\u9f8c":"\u9f77",
"\u9f99":"\u9f8d",
"\u9f9a":"\u9f94",
"\u9f9b":"\u9f95",
"\u9f9f":"\u9f9c",
"\ue5f1":"\u3000"
};

function toTrad(itxt){
	var zhmap = TongWen.s_2_t;

	itxt = itxt.replace(/[^\x00-\xFF]/g, replaceFn);

	return itxt;

	/////
	function replaceFn(s){
		return ((s in zhmap) ? zhmap[s] : s);
	}
}

module.exports = toTrad;


/***/ }),

/***/ 5828:
/***/ ((module) => {

/*******************************************
* 本JS檔存放位置由 WFU BLOG 提供
*
* JS檔主程式出自新同文堂：http://tongwen.openfoundry.org/
* 消息來源：http://hi.baidu.com/%CE%B5%C7%E5%D4%C2/blog/item/bf6b79d31fc49b289a5027ed.html
* 欲編輯、修改本程式，記得儲存的格式要選 unicode。
*
* WFU Blog : http://wayne-fu.blogspot.com/
*
***********************************/
/*** 此 JS 檔經過修改 (https://github.com/mollykannn/translate-big5-gbk.git) ***/

if (typeof(TongWen) == "undefined") var TongWen = new Object();

TongWen.t_2_s = {
"\u00af":"\u02c9",
"\u2025":"\u00a8",
"\u2027":"\u00b7",
"\u2035":"\uff40",
"\u2252":"\u2248",
"\u2266":"\u2264",
"\u2267":"\u2265",
"\u2571":"\uff0f",
"\u2572":"\uff3c",
"\u2574":"\uff3f",
"\u300c":"\u201c",
"\u300d":"\u201d",
"\u300e":"\u2018",
"\u300f":"\u2019",
"\u3473":"\u3447",
"\u361a":"\u360e",
"\u396e":"\u3918",
"\u3a73":"\u39d0",
"\u43b1":"\u43ac",
"\u4661":"\u464c",
"\u477c":"\u478d",
"\u4947":"\u4982",
"\u499b":"\u49b6",
"\u499f":"\u49b7",
"\u4c77":"\u4ca3",
"\u4e1f":"\u4e22",
"\u4e26":"\u5e76",
"\u4e3c":"\u4e95",
"\u4e7e":"\u5e72",
"\u4e82":"\u4e71",
"\u4e99":"\u4e98",
"\u4e9e":"\u4e9a",
"\u4f15":"\u592b",
"\u4f47":"\u4f2b",
"\u4f48":"\u5e03",
"\u4f54":"\u5360",
"\u4f6a":"\u5f8a",
"\u4f75":"\u5e76",
"\u4f86":"\u6765",
"\u4f96":"\u4ed1",
"\u4f9a":"\u5f87",
"\u4fb6":"\u4fa3",
"\u4fb7":"\u5c40",
"\u4fc1":"\u4fe3",
"\u4fc2":"\u7cfb",
"\u4fe0":"\u4fa0",
"\u5000":"\u4f25",
"\u5006":"\u4fe9",
"\u5009":"\u4ed3",
"\u500b":"\u4e2a",
"\u5011":"\u4eec",
"\u5016":"\u5e78",
"\u5023":"\u4eff",
"\u502b":"\u4f26",
"\u5049":"\u4f1f",
"\u506a":"\u903c",
"\u5074":"\u4fa7",
"\u5075":"\u4fa6",
"\u507a":"\u54b1",
"\u507d":"\u4f2a",
"\u5091":"\u6770",
"\u5096":"\u4f27",
"\u5098":"\u4f1e",
"\u5099":"\u5907",
"\u509a":"\u6548",
"\u50a2":"\u5bb6",
"\u50ad":"\u4f63",
"\u50af":"\u506c",
"\u50b3":"\u4f20",
"\u50b4":"\u4f1b",
"\u50b5":"\u503a",
"\u50b7":"\u4f24",
"\u50be":"\u503e",
"\u50c2":"\u507b",
"\u50c5":"\u4ec5",
"\u50c9":"\u4f65",
"\u50ca":"\u4ed9",
"\u50d1":"\u4fa8",
"\u50d5":"\u4ec6",
"\u50de":"\u4f2a",
"\u50e3":"\u50ed",
"\u50e5":"\u4fa5",
"\u50e8":"\u507e",
"\u50f1":"\u96c7",
"\u50f9":"\u4ef7",
"\u5100":"\u4eea",
"\u5102":"\u4fac",
"\u5104":"\u4ebf",
"\u5105":"\u5f53",
"\u5108":"\u4fa9",
"\u5109":"\u4fed",
"\u5110":"\u50a7",
"\u5114":"\u4fe6",
"\u5115":"\u4faa",
"\u5118":"\u5c3d",
"\u511f":"\u507f",
"\u512a":"\u4f18",
"\u5132":"\u50a8",
"\u5137":"\u4fea",
"\u5138":"\u7f57",
"\u513a":"\u50a9",
"\u513b":"\u50a5",
"\u513c":"\u4fe8",
"\u5147":"\u51f6",
"\u514c":"\u5151",
"\u5152":"\u513f",
"\u5157":"\u5156",
"\u5167":"\u5185",
"\u5169":"\u4e24",
"\u518a":"\u518c",
"\u5191":"\u80c4",
"\u51aa":"\u5e42",
"\u51c5":"\u6db8",
"\u51c8":"\u51c0",
"\u51cd":"\u51bb",
"\u51dc":"\u51db",
"\u51f1":"\u51ef",
"\u5225":"\u522b",
"\u522a":"\u5220",
"\u5244":"\u522d",
"\u5247":"\u5219",
"\u5249":"\u9509",
"\u524b":"\u514b",
"\u524e":"\u5239",
"\u5257":"\u522c",
"\u525b":"\u521a",
"\u525d":"\u5265",
"\u526e":"\u5250",
"\u5274":"\u5240",
"\u5275":"\u521b",
"\u5277":"\u94f2",
"\u5283":"\u5212",
"\u5284":"\u672d",
"\u5287":"\u5267",
"\u5289":"\u5218",
"\u528a":"\u523d",
"\u528c":"\u523f",
"\u528d":"\u5251",
"\u5291":"\u5242",
"\u52bb":"\u5321",
"\u52c1":"\u52b2",
"\u52d5":"\u52a8",
"\u52d7":"\u52d6",
"\u52d9":"\u52a1",
"\u52db":"\u52cb",
"\u52dd":"\u80dc",
"\u52de":"\u52b3",
"\u52e2":"\u52bf",
"\u52e3":"\u7ee9",
"\u52e6":"\u527f",
"\u52e9":"\u52da",
"\u52f1":"\u52a2",
"\u52f3":"\u52cb",
"\u52f5":"\u52b1",
"\u52f8":"\u529d",
"\u52fb":"\u5300",
"\u530b":"\u9676",
"\u532d":"\u5326",
"\u532f":"\u6c47",
"\u5331":"\u532e",
"\u5340":"\u533a",
"\u5344":"\u5eff",
"\u5354":"\u534f",
"\u536c":"\u6602",
"\u5379":"\u6064",
"\u537b":"\u5374",
"\u5399":"\u538d",
"\u53ad":"\u538c",
"\u53b2":"\u5389",
"\u53b4":"\u53a3",
"\u53c3":"\u53c2",
"\u53e1":"\u777f",
"\u53e2":"\u4e1b",
"\u540b":"\u5bf8",
"\u540e":"\u540e",
"\u5433":"\u5434",
"\u5436":"\u5450",
"\u5442":"\u5415",
"\u544e":"\u5c3a",
"\u54b7":"\u5555",
"\u54bc":"\u5459",
"\u54e1":"\u5458",
"\u5504":"\u5457",
"\u551d":"\u55ca",
"\u5538":"\u5ff5",
"\u554f":"\u95ee",
"\u5553":"\u542f",
"\u5557":"\u5556",
"\u555e":"\u54d1",
"\u555f":"\u542f",
"\u5562":"\u5521",
"\u5563":"\u8854",
"\u558e":"\u359e",
"\u559a":"\u5524",
"\u55aa":"\u4e27",
"\u55ab":"\u5403",
"\u55ac":"\u4e54",
"\u55ae":"\u5355",
"\u55b2":"\u54df",
"\u55c6":"\u545b",
"\u55c7":"\u556c",
"\u55ce":"\u5417",
"\u55da":"\u545c",
"\u55e9":"\u5522",
"\u55f6":"\u54d4",
"\u5606":"\u53f9",
"\u560d":"\u55bd",
"\u5614":"\u5455",
"\u5616":"\u5567",
"\u5617":"\u5c1d",
"\u561c":"\u551b",
"\u5629":"\u54d7",
"\u562e":"\u5520",
"\u562f":"\u5578",
"\u5630":"\u53fd",
"\u5635":"\u54d3",
"\u5638":"\u5452",
"\u5641":"\u6076",
"\u5653":"\u5618",
"\u565d":"\u549d",
"\u5660":"\u54d2",
"\u5665":"\u54dd",
"\u5666":"\u54d5",
"\u566f":"\u55f3",
"\u5672":"\u54d9",
"\u5674":"\u55b7",
"\u5678":"\u5428",
"\u5679":"\u5f53",
"\u5680":"\u549b",
"\u5687":"\u5413",
"\u568c":"\u54dc",
"\u5690":"\u5c1d",
"\u5695":"\u565c",
"\u5699":"\u556e",
"\u56a5":"\u54bd",
"\u56a6":"\u5456",
"\u56a8":"\u5499",
"\u56ae":"\u5411",
"\u56b3":"\u55be",
"\u56b4":"\u4e25",
"\u56b6":"\u5624",
"\u56c0":"\u556d",
"\u56c1":"\u55eb",
"\u56c2":"\u56a3",
"\u56c5":"\u5181",
"\u56c8":"\u5453",
"\u56c9":"\u5570",
"\u56cc":"\u82cf",
"\u56d1":"\u5631",
"\u56d3":"\u556e",
"\u56ea":"\u56f1",
"\u5707":"\u56f5",
"\u570b":"\u56fd",
"\u570d":"\u56f4",
"\u570f":"\u5708",
"\u5712":"\u56ed",
"\u5713":"\u5706",
"\u5716":"\u56fe",
"\u5718":"\u56e2",
"\u5775":"\u4e18",
"\u57dc":"\u91ce",
"\u57e1":"\u57ad",
"\u57f7":"\u6267",
"\u57fc":"\u5d0e",
"\u5805":"\u575a",
"\u580a":"\u57a9",
"\u5816":"\u57b4",
"\u581d":"\u57da",
"\u582f":"\u5c27",
"\u5831":"\u62a5",
"\u5834":"\u573a",
"\u584a":"\u5757",
"\u584b":"\u8314",
"\u584f":"\u57b2",
"\u5852":"\u57d8",
"\u5857":"\u6d82",
"\u585a":"\u51a2",
"\u5862":"\u575e",
"\u5864":"\u57d9",
"\u5875":"\u5c18",
"\u5879":"\u5811",
"\u588a":"\u57ab",
"\u5891":"\u5892",
"\u589c":"\u5760",
"\u58ab":"\u6a3d",
"\u58ae":"\u5815",
"\u58b3":"\u575f",
"\u58bb":"\u5899",
"\u58be":"\u57a6",
"\u58c7":"\u575b",
"\u58ce":"\u57d9",
"\u58d3":"\u538b",
"\u58d8":"\u5792",
"\u58d9":"\u5739",
"\u58da":"\u5786",
"\u58de":"\u574f",
"\u58df":"\u5784",
"\u58e2":"\u575c",
"\u58e9":"\u575d",
"\u58ef":"\u58ee",
"\u58fa":"\u58f6",
"\u58fd":"\u5bff",
"\u5920":"\u591f",
"\u5922":"\u68a6",
"\u593e":"\u5939",
"\u5950":"\u5942",
"\u5967":"\u5965",
"\u5969":"\u5941",
"\u596a":"\u593a",
"\u596e":"\u594b",
"\u599d":"\u5986",
"\u59cd":"\u59d7",
"\u59e6":"\u5978",
"\u59ea":"\u4f84",
"\u5a1b":"\u5a31",
"\u5a41":"\u5a04",
"\u5a66":"\u5987",
"\u5a6c":"\u6deb",
"\u5a6d":"\u5a05",
"\u5aa7":"\u5a32",
"\u5aae":"\u5077",
"\u5aaf":"\u59ab",
"\u5abc":"\u5aaa",
"\u5abd":"\u5988",
"\u5abf":"\u6127",
"\u5acb":"\u8885",
"\u5ad7":"\u59aa",
"\u5af5":"\u59a9",
"\u5afb":"\u5a34",
"\u5aff":"\u5a73",
"\u5b08":"\u5a06",
"\u5b0b":"\u5a75",
"\u5b0c":"\u5a07",
"\u5b19":"\u5af1",
"\u5b1d":"\u8885",
"\u5b21":"\u5ad2",
"\u5b24":"\u5b37",
"\u5b2a":"\u5ad4",
"\u5b2d":"\u5976",
"\u5b30":"\u5a74",
"\u5b38":"\u5a76",
"\u5b43":"\u5a18",
"\u5b4c":"\u5a08",
"\u5b6b":"\u5b59",
"\u5b78":"\u5b66",
"\u5b7f":"\u5b6a",
"\u5bae":"\u5bab",
"\u5bd8":"\u7f6e",
"\u5be2":"\u5bdd",
"\u5be6":"\u5b9e",
"\u5be7":"\u5b81",
"\u5be9":"\u5ba1",
"\u5beb":"\u5199",
"\u5bec":"\u5bbd",
"\u5bf5":"\u5ba0",
"\u5bf6":"\u5b9d",
"\u5c07":"\u5c06",
"\u5c08":"\u4e13",
"\u5c0b":"\u5bfb",
"\u5c0d":"\u5bf9",
"\u5c0e":"\u5bfc",
"\u5c37":"\u5c34",
"\u5c46":"\u5c4a",
"\u5c4d":"\u5c38",
"\u5c5c":"\u5c49",
"\u5c5d":"\u6249",
"\u5c62":"\u5c61",
"\u5c64":"\u5c42",
"\u5c68":"\u5c66",
"\u5c6c":"\u5c5e",
"\u5ca1":"\u5188",
"\u5cf4":"\u5c98",
"\u5cf6":"\u5c9b",
"\u5cfd":"\u5ce1",
"\u5d0d":"\u5d03",
"\u5d11":"\u6606",
"\u5d17":"\u5c97",
"\u5d19":"\u4ed1",
"\u5d20":"\u5cbd",
"\u5d22":"\u5ce5",
"\u5d33":"\u5d5b",
"\u5d50":"\u5c9a",
"\u5d52":"\u5ca9",
"\u5d81":"\u5d5d",
"\u5d84":"\u5d2d",
"\u5d87":"\u5c96",
"\u5d94":"\u5d5a",
"\u5d97":"\u5d02",
"\u5da0":"\u5ce4",
"\u5da2":"\u5ce3",
"\u5da7":"\u5cc4",
"\u5da8":"\u5cc3",
"\u5db8":"\u5d58",
"\u5dba":"\u5cad",
"\u5dbc":"\u5c7f",
"\u5dbd":"\u5cb3",
"\u5dcb":"\u5cbf",
"\u5dd2":"\u5ce6",
"\u5dd4":"\u5dc5",
"\u5dd6":"\u5ca9",
"\u5df0":"\u5def",
"\u5df9":"\u537a",
"\u5e25":"\u5e05",
"\u5e2b":"\u5e08",
"\u5e33":"\u5e10",
"\u5e36":"\u5e26",
"\u5e40":"\u5e27",
"\u5e43":"\u5e0f",
"\u5e57":"\u5e3c",
"\u5e58":"\u5e3b",
"\u5e5f":"\u5e1c",
"\u5e63":"\u5e01",
"\u5e6b":"\u5e2e",
"\u5e6c":"\u5e31",
"\u5e75":"\u5f00",
"\u5e77":"\u5e76",
"\u5e79":"\u5e72",
"\u5e7e":"\u51e0",
"\u5e82":"\u4ec4",
"\u5eab":"\u5e93",
"\u5ec1":"\u5395",
"\u5ec2":"\u53a2",
"\u5ec4":"\u53a9",
"\u5ec8":"\u53a6",
"\u5ece":"\u5ebc",
"\u5eda":"\u53a8",
"\u5edd":"\u53ae",
"\u5edf":"\u5e99",
"\u5ee0":"\u5382",
"\u5ee1":"\u5e91",
"\u5ee2":"\u5e9f",
"\u5ee3":"\u5e7f",
"\u5ee9":"\u5eea",
"\u5eec":"\u5e90",
"\u5ef1":"\u75c8",
"\u5ef3":"\u5385",
"\u5f12":"\u5f11",
"\u5f14":"\u540a",
"\u5f33":"\u5f2a",
"\u5f35":"\u5f20",
"\u5f37":"\u5f3a",
"\u5f46":"\u522b",
"\u5f48":"\u5f39",
"\u5f4c":"\u5f25",
"\u5f4e":"\u5f2f",
"\u5f59":"\u6c47",
"\u5f5a":"\u6c47",
"\u5f65":"\u5f66",
"\u5f6b":"\u96d5",
"\u5f7f":"\u4f5b",
"\u5f8c":"\u540e",
"\u5f91":"\u5f84",
"\u5f9e":"\u4ece",
"\u5fa0":"\u5f95",
"\u5fa9":"\u590d",
"\u5fac":"\u65c1",
"\u5fb5":"\u5f81",
"\u5fb9":"\u5f7b",
"\u6046":"\u6052",
"\u6065":"\u803b",
"\u6085":"\u60a6",
"\u60b5":"\u6005",
"\u60b6":"\u95f7",
"\u60bd":"\u51c4",
"\u60c7":"\u6566",
"\u60e1":"\u6076",
"\u60f1":"\u607c",
"\u60f2":"\u607d",
"\u60f7":"\u8822",
"\u60fb":"\u607b",
"\u611b":"\u7231",
"\u611c":"\u60ec",
"\u6128":"\u60ab",
"\u6134":"\u6006",
"\u6137":"\u607a",
"\u613e":"\u5ffe",
"\u6144":"\u6817",
"\u6147":"\u6bb7",
"\u614b":"\u6001",
"\u614d":"\u6120",
"\u6158":"\u60e8",
"\u615a":"\u60ed",
"\u615f":"\u6078",
"\u6163":"\u60ef",
"\u616a":"\u6004",
"\u616b":"\u6002",
"\u616e":"\u8651",
"\u6173":"\u60ad",
"\u6176":"\u5e86",
"\u617c":"\u621a",
"\u617e":"\u6b32",
"\u6182":"\u5fe7",
"\u618a":"\u60eb",
"\u6190":"\u601c",
"\u6191":"\u51ed",
"\u6192":"\u6126",
"\u619a":"\u60ee",
"\u61a4":"\u6124",
"\u61ab":"\u60af",
"\u61ae":"\u6003",
"\u61b2":"\u5baa",
"\u61b6":"\u5fc6",
"\u61c3":"\u52e4",
"\u61c7":"\u6073",
"\u61c9":"\u5e94",
"\u61cc":"\u603f",
"\u61cd":"\u61d4",
"\u61de":"\u8499",
"\u61df":"\u603c",
"\u61e3":"\u61d1",
"\u61e8":"\u6079",
"\u61f2":"\u60e9",
"\u61f6":"\u61d2",
"\u61f7":"\u6000",
"\u61f8":"\u60ac",
"\u61fa":"\u5fcf",
"\u61fc":"\u60e7",
"\u61fe":"\u6151",
"\u6200":"\u604b",
"\u6207":"\u6206",
"\u6209":"\u94ba",
"\u6214":"\u620b",
"\u6227":"\u6217",
"\u6229":"\u622c",
"\u6230":"\u6218",
"\u6232":"\u620f",
"\u6236":"\u6237",
"\u6250":"\u4ec2",
"\u625e":"\u634d",
"\u6271":"\u63d2",
"\u627a":"\u62b5",
"\u6283":"\u62da",
"\u6294":"\u62b1",
"\u62b4":"\u66f3",
"\u62cb":"\u629b",
"\u62d1":"\u94b3",
"\u630c":"\u683c",
"\u6336":"\u5c40",
"\u633e":"\u631f",
"\u6368":"\u820d",
"\u636b":"\u626a",
"\u6372":"\u5377",
"\u6383":"\u626b",
"\u6384":"\u62a1",
"\u6386":"\u39cf",
"\u6397":"\u631c",
"\u6399":"\u6323",
"\u639b":"\u6302",
"\u63a1":"\u91c7",
"\u63c0":"\u62e3",
"\u63da":"\u626c",
"\u63db":"\u6362",
"\u63ee":"\u6325",
"\u63f9":"\u80cc",
"\u6406":"\u6784",
"\u640d":"\u635f",
"\u6416":"\u6447",
"\u6417":"\u6363",
"\u641f":"\u64c0",
"\u6425":"\u6376",
"\u6428":"\u6253",
"\u642f":"\u638f",
"\u6436":"\u62a2",
"\u643e":"\u69a8",
"\u6440":"\u6342",
"\u6443":"\u625b",
"\u6451":"\u63b4",
"\u645c":"\u63bc",
"\u645f":"\u6402",
"\u646f":"\u631a",
"\u6473":"\u62a0",
"\u6476":"\u629f",
"\u647b":"\u63ba",
"\u6488":"\u635e",
"\u648f":"\u6326",
"\u6490":"\u6491",
"\u6493":"\u6320",
"\u649a":"\u62c8",
"\u649f":"\u6322",
"\u64a2":"\u63b8",
"\u64a3":"\u63b8",
"\u64a5":"\u62e8",
"\u64a6":"\u626f",
"\u64ab":"\u629a",
"\u64b2":"\u6251",
"\u64b3":"\u63ff",
"\u64bb":"\u631e",
"\u64be":"\u631d",
"\u64bf":"\u6361",
"\u64c1":"\u62e5",
"\u64c4":"\u63b3",
"\u64c7":"\u62e9",
"\u64ca":"\u51fb",
"\u64cb":"\u6321",
"\u64d3":"\u39df",
"\u64d4":"\u62c5",
"\u64da":"\u636e",
"\u64e0":"\u6324",
"\u64e1":"\u62ac",
"\u64e3":"\u6363",
"\u64ec":"\u62df",
"\u64ef":"\u6448",
"\u64f0":"\u62e7",
"\u64f1":"\u6401",
"\u64f2":"\u63b7",
"\u64f4":"\u6269",
"\u64f7":"\u64b7",
"\u64fa":"\u6446",
"\u64fb":"\u64de",
"\u64fc":"\u64b8",
"\u64fe":"\u6270",
"\u6504":"\u6445",
"\u6506":"\u64b5",
"\u650f":"\u62e2",
"\u6514":"\u62e6",
"\u6516":"\u6484",
"\u6519":"\u6400",
"\u651b":"\u64ba",
"\u651c":"\u643a",
"\u651d":"\u6444",
"\u6522":"\u6512",
"\u6523":"\u631b",
"\u6524":"\u644a",
"\u652a":"\u6405",
"\u652c":"\u63fd",
"\u6537":"\u8003",
"\u6557":"\u8d25",
"\u6558":"\u53d9",
"\u6575":"\u654c",
"\u6578":"\u6570",
"\u6582":"\u655b",
"\u6583":"\u6bd9",
"\u6595":"\u6593",
"\u65ac":"\u65a9",
"\u65b7":"\u65ad",
"\u65bc":"\u4e8e",
"\u65c2":"\u65d7",
"\u65db":"\u5e61",
"\u6607":"\u5347",
"\u6642":"\u65f6",
"\u6649":"\u664b",
"\u665d":"\u663c",
"\u665e":"\u66e6",
"\u6662":"\u6670",
"\u6673":"\u6670",
"\u667b":"\u6697",
"\u6688":"\u6655",
"\u6689":"\u6656",
"\u6698":"\u9633",
"\u66a2":"\u7545",
"\u66ab":"\u6682",
"\u66b1":"\u6635",
"\u66b8":"\u4e86",
"\u66c4":"\u6654",
"\u66c6":"\u5386",
"\u66c7":"\u6619",
"\u66c9":"\u6653",
"\u66cf":"\u5411",
"\u66d6":"\u66a7",
"\u66e0":"\u65f7",
"\u66e8":"\u663d",
"\u66ec":"\u6652",
"\u66f8":"\u4e66",
"\u6703":"\u4f1a",
"\u6722":"\u671b",
"\u6727":"\u80e7",
"\u672e":"\u672f",
"\u6747":"\u572c",
"\u6771":"\u4e1c",
"\u67b4":"\u62d0",
"\u67f5":"\u6805",
"\u67fa":"\u62d0",
"\u6812":"\u65ec",
"\u686e":"\u676f",
"\u687f":"\u6746",
"\u6894":"\u6800",
"\u6898":"\u67a7",
"\u689d":"\u6761",
"\u689f":"\u67ad",
"\u68b1":"\u6346",
"\u68c4":"\u5f03",
"\u68d6":"\u67a8",
"\u68d7":"\u67a3",
"\u68df":"\u680b",
"\u68e1":"\u3b4e",
"\u68e7":"\u6808",
"\u68f2":"\u6816",
"\u690f":"\u6860",
"\u6944":"\u533e",
"\u694a":"\u6768",
"\u6953":"\u67ab",
"\u6959":"\u8302",
"\u695c":"\u80e1",
"\u6968":"\u6862",
"\u696d":"\u4e1a",
"\u6975":"\u6781",
"\u69a6":"\u5e72",
"\u69aa":"\u6769",
"\u69ae":"\u8363",
"\u69bf":"\u6864",
"\u69c3":"\u76d8",
"\u69cb":"\u6784",
"\u69cd":"\u67aa",
"\u69d3":"\u6760",
"\u69e7":"\u6920",
"\u69e8":"\u6901",
"\u69f3":"\u6868",
"\u6a01":"\u6869",
"\u6a02":"\u4e50",
"\u6a05":"\u679e",
"\u6a11":"\u6881",
"\u6a13":"\u697c",
"\u6a19":"\u6807",
"\u6a1e":"\u67a2",
"\u6a23":"\u6837",
"\u6a38":"\u6734",
"\u6a39":"\u6811",
"\u6a3a":"\u6866",
"\u6a48":"\u6861",
"\u6a4b":"\u6865",
"\u6a5f":"\u673a",
"\u6a62":"\u692d",
"\u6a66":"\u5e62",
"\u6a6b":"\u6a2a",
"\u6a81":"\u6aa9",
"\u6a89":"\u67fd",
"\u6a94":"\u6863",
"\u6a9c":"\u6867",
"\u6a9f":"\u69da",
"\u6aa2":"\u68c0",
"\u6aa3":"\u6a2f",
"\u6aaf":"\u53f0",
"\u6ab3":"\u69df",
"\u6ab8":"\u67e0",
"\u6abb":"\u69db",
"\u6ac2":"\u68f9",
"\u6ac3":"\u67dc",
"\u6ad0":"\u7d2f",
"\u6ad3":"\u6a79",
"\u6ada":"\u6988",
"\u6adb":"\u6809",
"\u6add":"\u691f",
"\u6ade":"\u6a7c",
"\u6adf":"\u680e",
"\u6ae5":"\u6a71",
"\u6ae7":"\u69e0",
"\u6ae8":"\u680c",
"\u6aea":"\u67a5",
"\u6aeb":"\u6a65",
"\u6aec":"\u6987",
"\u6af3":"\u680a",
"\u6af8":"\u6989",
"\u6afa":"\u68c2",
"\u6afb":"\u6a31",
"\u6b04":"\u680f",
"\u6b0a":"\u6743",
"\u6b0f":"\u6924",
"\u6b12":"\u683e",
"\u6b16":"\u6984",
"\u6b1e":"\u68c2",
"\u6b38":"\u5509",
"\u6b3d":"\u94a6",
"\u6b4e":"\u53f9",
"\u6b50":"\u6b27",
"\u6b5f":"\u6b24",
"\u6b61":"\u6b22",
"\u6b72":"\u5c81",
"\u6b77":"\u5386",
"\u6b78":"\u5f52",
"\u6b7f":"\u6b81",
"\u6b80":"\u592d",
"\u6b98":"\u6b8b",
"\u6b9e":"\u6b92",
"\u6ba4":"\u6b87",
"\u6bab":"\u6b9a",
"\u6bad":"\u50f5",
"\u6bae":"\u6b93",
"\u6baf":"\u6ba1",
"\u6bb2":"\u6b7c",
"\u6bba":"\u6740",
"\u6bbc":"\u58f3",
"\u6bbd":"\u80b4",
"\u6bc0":"\u6bc1",
"\u6bc6":"\u6bb4",
"\u6bcc":"\u6bcb",
"\u6bd8":"\u6bd7",
"\u6bec":"\u7403",
"\u6bff":"\u6bf5",
"\u6c08":"\u6be1",
"\u6c0c":"\u6c07",
"\u6c23":"\u6c14",
"\u6c2b":"\u6c22",
"\u6c2c":"\u6c29",
"\u6c33":"\u6c32",
"\u6c3e":"\u6cdb",
"\u6c4d":"\u4e38",
"\u6c4e":"\u6cdb",
"\u6c59":"\u6c61",
"\u6c7a":"\u51b3",
"\u6c8d":"\u51b1",
"\u6c92":"\u6ca1",
"\u6c96":"\u51b2",
"\u6cc1":"\u51b5",
"\u6cdd":"\u6eaf",
"\u6d1f":"\u6d95",
"\u6d29":"\u6cc4",
"\u6d36":"\u6c79",
"\u6d6c":"\u91cc",
"\u6d79":"\u6d43",
"\u6d87":"\u6cfe",
"\u6dbc":"\u51c9",
"\u6dd2":"\u51c4",
"\u6dda":"\u6cea",
"\u6de5":"\u6e0c",
"\u6de8":"\u51c0",
"\u6dea":"\u6ca6",
"\u6df5":"\u6e0a",
"\u6df6":"\u6d9e",
"\u6dfa":"\u6d45",
"\u6e19":"\u6da3",
"\u6e1b":"\u51cf",
"\u6e22":"\u6ca8",
"\u6e26":"\u6da1",
"\u6e2c":"\u6d4b",
"\u6e3e":"\u6d51",
"\u6e4a":"\u51d1",
"\u6e5e":"\u6d48",
"\u6e63":"\u95f5",
"\u6e67":"\u6d8c",
"\u6e6f":"\u6c64",
"\u6e88":"\u6ca9",
"\u6e96":"\u51c6",
"\u6e9d":"\u6c9f",
"\u6eab":"\u6e29",
"\u6eae":"\u6d49",
"\u6eb3":"\u6da2",
"\u6ebc":"\u6e7f",
"\u6ec4":"\u6ca7",
"\u6ec5":"\u706d",
"\u6ecc":"\u6da4",
"\u6ece":"\u8365",
"\u6eec":"\u6caa",
"\u6eef":"\u6ede",
"\u6ef2":"\u6e17",
"\u6ef7":"\u5364",
"\u6ef8":"\u6d52",
"\u6efb":"\u6d50",
"\u6efe":"\u6eda",
"\u6eff":"\u6ee1",
"\u6f01":"\u6e14",
"\u6f0a":"\u6e87",
"\u6f1a":"\u6ca4",
"\u6f22":"\u6c49",
"\u6f23":"\u6d9f",
"\u6f2c":"\u6e0d",
"\u6f32":"\u6da8",
"\u6f35":"\u6e86",
"\u6f38":"\u6e10",
"\u6f3f":"\u6d46",
"\u6f41":"\u988d",
"\u6f51":"\u6cfc",
"\u6f54":"\u6d01",
"\u6f5b":"\u6f5c",
"\u6f5f":"\u8204",
"\u6f64":"\u6da6",
"\u6f6f":"\u6d54",
"\u6f70":"\u6e83",
"\u6f77":"\u6ed7",
"\u6f7f":"\u6da0",
"\u6f80":"\u6da9",
"\u6f82":"\u6f84",
"\u6f86":"\u6d47",
"\u6f87":"\u6d9d",
"\u6f94":"\u6d69",
"\u6f97":"\u6da7",
"\u6fa0":"\u6e11",
"\u6fa4":"\u6cfd",
"\u6fa6":"\u6eea",
"\u6fa9":"\u6cf6",
"\u6fae":"\u6d4d",
"\u6fb1":"\u6dc0",
"\u6fbe":"\u3ce0",
"\u6fc1":"\u6d4a",
"\u6fc3":"\u6d53",
"\u6fd5":"\u6e7f",
"\u6fd8":"\u6cde",
"\u6fdb":"\u8499",
"\u6fdc":"\u6d55",
"\u6fdf":"\u6d4e",
"\u6fe4":"\u6d9b",
"\u6feb":"\u6ee5",
"\u6fec":"\u6d5a",
"\u6ff0":"\u6f4d",
"\u6ff1":"\u6ee8",
"\u6ffa":"\u6e85",
"\u6ffc":"\u6cfa",
"\u6ffe":"\u6ee4",
"\u7001":"\u6f3e",
"\u7005":"\u6ee2",
"\u7006":"\u6e0e",
"\u7009":"\u6cfb",
"\u700b":"\u6c88",
"\u700f":"\u6d4f",
"\u7015":"\u6fd2",
"\u7018":"\u6cf8",
"\u701d":"\u6ca5",
"\u701f":"\u6f47",
"\u7020":"\u6f46",
"\u7026":"\u6f74",
"\u7027":"\u6cf7",
"\u7028":"\u6fd1",
"\u7030":"\u5f25",
"\u7032":"\u6f4b",
"\u703e":"\u6f9c",
"\u7043":"\u6ca3",
"\u7044":"\u6ee0",
"\u7051":"\u6d12",
"\u7055":"\u6f13",
"\u7058":"\u6ee9",
"\u705d":"\u704f",
"\u7063":"\u6e7e",
"\u7064":"\u6ee6",
"\u7069":"\u6edf",
"\u707d":"\u707e",
"\u70a4":"\u7167",
"\u70b0":"\u70ae",
"\u70ba":"\u4e3a",
"\u70cf":"\u4e4c",
"\u70f4":"\u70c3",
"\u7121":"\u65e0",
"\u7149":"\u70bc",
"\u7152":"\u709c",
"\u7156":"\u6696",
"\u7159":"\u70df",
"\u7162":"\u8315",
"\u7165":"\u7115",
"\u7169":"\u70e6",
"\u716c":"\u7080",
"\u7192":"\u8367",
"\u7197":"\u709d",
"\u71b1":"\u70ed",
"\u71be":"\u70bd",
"\u71c1":"\u70e8",
"\u71c4":"\u7130",
"\u71c8":"\u706f",
"\u71c9":"\u7096",
"\u71d0":"\u78f7",
"\u71d2":"\u70e7",
"\u71d9":"\u70eb",
"\u71dc":"\u7116",
"\u71df":"\u8425",
"\u71e6":"\u707f",
"\u71ec":"\u6bc1",
"\u71ed":"\u70db",
"\u71f4":"\u70e9",
"\u71fb":"\u718f",
"\u71fc":"\u70ec",
"\u71fe":"\u7118",
"\u71ff":"\u8000",
"\u720d":"\u70c1",
"\u7210":"\u7089",
"\u721b":"\u70c2",
"\u722d":"\u4e89",
"\u7232":"\u4e3a",
"\u723a":"\u7237",
"\u723e":"\u5c14",
"\u7246":"\u5899",
"\u7258":"\u724d",
"\u7260":"\u5b83",
"\u7274":"\u62b5",
"\u727d":"\u7275",
"\u7296":"\u8366",
"\u729b":"\u7266",
"\u72a2":"\u728a",
"\u72a7":"\u727a",
"\u72c0":"\u72b6",
"\u72da":"\u65e6",
"\u72f9":"\u72ed",
"\u72fd":"\u72c8",
"\u7319":"\u72f0",
"\u7336":"\u72b9",
"\u733b":"\u72f2",
"\u7341":"\u72b8",
"\u7343":"\u5446",
"\u7344":"\u72f1",
"\u7345":"\u72ee",
"\u734e":"\u5956",
"\u7368":"\u72ec",
"\u736a":"\u72ef",
"\u736b":"\u7303",
"\u736e":"\u72dd",
"\u7370":"\u72de",
"\u7372":"\u83b7",
"\u7375":"\u730e",
"\u7377":"\u72b7",
"\u7378":"\u517d",
"\u737a":"\u736d",
"\u737b":"\u732e",
"\u737c":"\u7315",
"\u7380":"\u7321",
"\u7385":"\u5999",
"\u7386":"\u5179",
"\u73a8":"\u73cf",
"\u73ea":"\u572d",
"\u73ee":"\u4f69",
"\u73fe":"\u73b0",
"\u7431":"\u96d5",
"\u743a":"\u73d0",
"\u743f":"\u73f2",
"\u744b":"\u73ae",
"\u7463":"\u7410",
"\u7464":"\u7476",
"\u7469":"\u83b9",
"\u746a":"\u739b",
"\u746f":"\u7405",
"\u7472":"\u73b1",
"\u7489":"\u740f",
"\u74a1":"\u740e",
"\u74a3":"\u7391",
"\u74a6":"\u7477",
"\u74b0":"\u73af",
"\u74bd":"\u73ba",
"\u74bf":"\u7487",
"\u74ca":"\u743c",
"\u74cf":"\u73d1",
"\u74d4":"\u748e",
"\u74d6":"\u9576",
"\u74da":"\u74d2",
"\u750c":"\u74ef",
"\u7515":"\u74ee",
"\u7522":"\u4ea7",
"\u7523":"\u4ea7",
"\u7526":"\u82cf",
"\u752a":"\u89d2",
"\u755d":"\u4ea9",
"\u7562":"\u6bd5",
"\u756b":"\u753b",
"\u756c":"\u7572",
"\u7570":"\u5f02",
"\u7576":"\u5f53",
"\u7587":"\u7574",
"\u758a":"\u53e0",
"\u75bf":"\u75f1",
"\u75d9":"\u75c9",
"\u75e0":"\u9178",
"\u75f2":"\u9ebb",
"\u75f3":"\u9ebb",
"\u75fa":"\u75f9",
"\u75fe":"\u75b4",
"\u7602":"\u75d6",
"\u7609":"\u6108",
"\u760b":"\u75af",
"\u760d":"\u75a1",
"\u7613":"\u75ea",
"\u761e":"\u7617",
"\u7621":"\u75ae",
"\u7627":"\u759f",
"\u763a":"\u7618",
"\u763b":"\u7618",
"\u7642":"\u7597",
"\u7646":"\u75e8",
"\u7647":"\u75eb",
"\u7649":"\u7605",
"\u7652":"\u6108",
"\u7658":"\u75a0",
"\u765f":"\u762a",
"\u7661":"\u75f4",
"\u7662":"\u75d2",
"\u7664":"\u7596",
"\u7665":"\u75c7",
"\u7667":"\u75ac",
"\u7669":"\u765e",
"\u766c":"\u7663",
"\u766d":"\u763f",
"\u766e":"\u763e",
"\u7670":"\u75c8",
"\u7671":"\u762b",
"\u7672":"\u766b",
"\u767c":"\u53d1",
"\u7681":"\u7682",
"\u769a":"\u7691",
"\u76b0":"\u75b1",
"\u76b8":"\u76b2",
"\u76ba":"\u76b1",
"\u76c3":"\u676f",
"\u76dc":"\u76d7",
"\u76de":"\u76cf",
"\u76e1":"\u5c3d",
"\u76e3":"\u76d1",
"\u76e4":"\u76d8",
"\u76e7":"\u5362",
"\u76ea":"\u8361",
"\u7725":"\u7726",
"\u773e":"\u4f17",
"\u774f":"\u56f0",
"\u775c":"\u7741",
"\u775e":"\u7750",
"\u776a":"\u777e",
"\u7787":"\u772f",
"\u7798":"\u770d",
"\u779c":"\u4056",
"\u779e":"\u7792",
"\u77bc":"\u7751",
"\u77c7":"\u8499",
"\u77d3":"\u772c",
"\u77da":"\u77a9",
"\u77ef":"\u77eb",
"\u7832":"\u70ae",
"\u7843":"\u6731",
"\u7864":"\u7856",
"\u7868":"\u7817",
"\u786f":"\u781a",
"\u7895":"\u5d0e",
"\u78a9":"\u7855",
"\u78aa":"\u7827",
"\u78ad":"\u7800",
"\u78b8":"\u781c",
"\u78ba":"\u786e",
"\u78bc":"\u7801",
"\u78d1":"\u7859",
"\u78da":"\u7816",
"\u78e3":"\u789c",
"\u78e7":"\u789b",
"\u78ef":"\u77f6",
"\u78fd":"\u7857",
"\u7904":"\u785a",
"\u790e":"\u7840",
"\u7919":"\u788d",
"\u7926":"\u77ff",
"\u792a":"\u783a",
"\u792b":"\u783e",
"\u792c":"\u77fe",
"\u7931":"\u783b",
"\u7942":"\u4ed6",
"\u7945":"\u7946",
"\u7947":"\u53ea",
"\u7950":"\u4f51",
"\u797c":"\u88f8",
"\u797f":"\u7984",
"\u798d":"\u7978",
"\u798e":"\u796f",
"\u7995":"\u794e",
"\u79a6":"\u5fa1",
"\u79aa":"\u7985",
"\u79ae":"\u793c",
"\u79b1":"\u7977",
"\u79bf":"\u79c3",
"\u79c8":"\u7c7c",
"\u79cf":"\u8017",
"\u7a05":"\u7a0e",
"\u7a08":"\u79c6",
"\u7a1c":"\u68f1",
"\u7a1f":"\u7980",
"\u7a28":"\u6241",
"\u7a2e":"\u79cd",
"\u7a31":"\u79f0",
"\u7a40":"\u8c37",
"\u7a47":"\u415f",
"\u7a4c":"\u7a23",
"\u7a4d":"\u79ef",
"\u7a4e":"\u9896",
"\u7a61":"\u7a51",
"\u7a62":"\u79fd",
"\u7a68":"\u9893",
"\u7a69":"\u7a33",
"\u7a6b":"\u83b7",
"\u7aa9":"\u7a9d",
"\u7aaa":"\u6d3c",
"\u7aae":"\u7a77",
"\u7aaf":"\u7a91",
"\u7ab5":"\u7a8e",
"\u7ab6":"\u7aad",
"\u7aba":"\u7aa5",
"\u7ac4":"\u7a9c",
"\u7ac5":"\u7a8d",
"\u7ac7":"\u7aa6",
"\u7aca":"\u7a83",
"\u7af6":"\u7ade",
"\u7b3b":"\u7b47",
"\u7b46":"\u7b14",
"\u7b4d":"\u7b0b",
"\u7b67":"\u7b15",
"\u7b74":"\u7b56",
"\u7b84":"\u7b85",
"\u7b87":"\u4e2a",
"\u7b8b":"\u7b3a",
"\u7b8f":"\u7b5d",
"\u7ba0":"\u68f0",
"\u7bc0":"\u8282",
"\u7bc4":"\u8303",
"\u7bc9":"\u7b51",
"\u7bcb":"\u7ba7",
"\u7bdb":"\u7bac",
"\u7be0":"\u7b71",
"\u7be4":"\u7b03",
"\u7be9":"\u7b5b",
"\u7bf2":"\u5f57",
"\u7bf3":"\u7b5a",
"\u7c00":"\u7ba6",
"\u7c0d":"\u7bd3",
"\u7c11":"\u84d1",
"\u7c1e":"\u7baa",
"\u7c21":"\u7b80",
"\u7c23":"\u7bd1",
"\u7c2b":"\u7bab",
"\u7c37":"\u6a90",
"\u7c3d":"\u7b7e",
"\u7c3e":"\u5e18",
"\u7c43":"\u7bee",
"\u7c4c":"\u7b79",
"\u7c50":"\u85e4",
"\u7c59":"\u7b93",
"\u7c5c":"\u7ba8",
"\u7c5f":"\u7c41",
"\u7c60":"\u7b3c",
"\u7c64":"\u7b7e",
"\u7c65":"\u9fa0",
"\u7c69":"\u7b3e",
"\u7c6a":"\u7c16",
"\u7c6c":"\u7bf1",
"\u7c6e":"\u7ba9",
"\u7c72":"\u5401",
"\u7ca7":"\u5986",
"\u7cb5":"\u7ca4",
"\u7cdd":"\u7cc1",
"\u7cde":"\u7caa",
"\u7ce7":"\u7cae",
"\u7cf0":"\u56e2",
"\u7cf2":"\u7c9d",
"\u7cf4":"\u7c74",
"\u7cf6":"\u7c9c",
"\u7cfe":"\u7ea0",
"\u7d00":"\u7eaa",
"\u7d02":"\u7ea3",
"\u7d04":"\u7ea6",
"\u7d05":"\u7ea2",
"\u7d06":"\u7ea1",
"\u7d07":"\u7ea5",
"\u7d08":"\u7ea8",
"\u7d09":"\u7eab",
"\u7d0b":"\u7eb9",
"\u7d0d":"\u7eb3",
"\u7d10":"\u7ebd",
"\u7d13":"\u7ebe",
"\u7d14":"\u7eaf",
"\u7d15":"\u7eb0",
"\u7d16":"\u7ebc",
"\u7d17":"\u7eb1",
"\u7d18":"\u7eae",
"\u7d19":"\u7eb8",
"\u7d1a":"\u7ea7",
"\u7d1b":"\u7eb7",
"\u7d1c":"\u7ead",
"\u7d1d":"\u7eb4",
"\u7d21":"\u7eba",
"\u7d2c":"\u4337",
"\u7d2e":"\u624e",
"\u7d30":"\u7ec6",
"\u7d31":"\u7ec2",
"\u7d32":"\u7ec1",
"\u7d33":"\u7ec5",
"\u7d39":"\u7ecd",
"\u7d3a":"\u7ec0",
"\u7d3c":"\u7ecb",
"\u7d3f":"\u7ed0",
"\u7d40":"\u7ecc",
"\u7d42":"\u7ec8",
"\u7d43":"\u5f26",
"\u7d44":"\u7ec4",
"\u7d46":"\u7eca",
"\u7d4e":"\u7ed7",
"\u7d50":"\u7ed3",
"\u7d55":"\u7edd",
"\u7d5b":"\u7ee6",
"\u7d5d":"\u7ed4",
"\u7d5e":"\u7ede",
"\u7d61":"\u7edc",
"\u7d62":"\u7eda",
"\u7d66":"\u7ed9",
"\u7d68":"\u7ed2",
"\u7d70":"\u7ed6",
"\u7d71":"\u7edf",
"\u7d72":"\u4e1d",
"\u7d73":"\u7edb",
"\u7d79":"\u7ee2",
"\u7d81":"\u7ed1",
"\u7d83":"\u7ee1",
"\u7d86":"\u7ee0",
"\u7d88":"\u7ee8",
"\u7d8f":"\u7ee5",
"\u7d91":"\u6346",
"\u7d93":"\u7ecf",
"\u7d9c":"\u7efc",
"\u7d9e":"\u7f0d",
"\u7da0":"\u7eff",
"\u7da2":"\u7ef8",
"\u7da3":"\u7efb",
"\u7dab":"\u7ebf",
"\u7dac":"\u7ef6",
"\u7dad":"\u7ef4",
"\u7db0":"\u7efe",
"\u7db1":"\u7eb2",
"\u7db2":"\u7f51",
"\u7db4":"\u7f00",
"\u7db5":"\u5f69",
"\u7db8":"\u7eb6",
"\u7db9":"\u7efa",
"\u7dba":"\u7eee",
"\u7dbb":"\u7efd",
"\u7dbd":"\u7ef0",
"\u7dbe":"\u7eeb",
"\u7dbf":"\u7ef5",
"\u7dc4":"\u7ef2",
"\u7dc7":"\u7f01",
"\u7dca":"\u7d27",
"\u7dcb":"\u7eef",
"\u7dd2":"\u7eea",
"\u7dd4":"\u7ef1",
"\u7dd7":"\u7f03",
"\u7dd8":"\u7f04",
"\u7dd9":"\u7f02",
"\u7dda":"\u7ebf",
"\u7ddd":"\u7f09",
"\u7dde":"\u7f0e",
"\u7de0":"\u7f14",
"\u7de1":"\u7f17",
"\u7de3":"\u7f18",
"\u7de6":"\u7f0c",
"\u7de8":"\u7f16",
"\u7de9":"\u7f13",
"\u7dec":"\u7f05",
"\u7def":"\u7eac",
"\u7df1":"\u7f11",
"\u7df2":"\u7f08",
"\u7df4":"\u7ec3",
"\u7df6":"\u7f0f",
"\u7df9":"\u7f07",
"\u7dfb":"\u81f4",
"\u7e08":"\u8426",
"\u7e09":"\u7f19",
"\u7e0a":"\u7f22",
"\u7e0b":"\u7f12",
"\u7e10":"\u7ec9",
"\u7e11":"\u7f23",
"\u7e15":"\u7f0a",
"\u7e17":"\u7f1e",
"\u7e1a":"\u7ee6",
"\u7e1b":"\u7f1a",
"\u7e1d":"\u7f1c",
"\u7e1e":"\u7f1f",
"\u7e1f":"\u7f1b",
"\u7e23":"\u53bf",
"\u7e2b":"\u7f1d",
"\u7e2d":"\u7f21",
"\u7e2e":"\u7f29",
"\u7e2f":"\u6f14",
"\u7e31":"\u7eb5",
"\u7e32":"\u7f27",
"\u7e33":"\u7f1a",
"\u7e34":"\u7ea4",
"\u7e35":"\u7f26",
"\u7e36":"\u7d77",
"\u7e37":"\u7f15",
"\u7e39":"\u7f25",
"\u7e3d":"\u603b",
"\u7e3e":"\u7ee9",
"\u7e43":"\u7ef7",
"\u7e45":"\u7f2b",
"\u7e46":"\u7f2a",
"\u7e48":"\u8941",
"\u7e52":"\u7f2f",
"\u7e54":"\u7ec7",
"\u7e55":"\u7f2e",
"\u7e59":"\u7ffb",
"\u7e5a":"\u7f2d",
"\u7e5e":"\u7ed5",
"\u7e61":"\u7ee3",
"\u7e62":"\u7f0b",
"\u7e69":"\u7ef3",
"\u7e6a":"\u7ed8",
"\u7e6b":"\u7cfb",
"\u7e6d":"\u8327",
"\u7e6f":"\u7f33",
"\u7e70":"\u7f32",
"\u7e73":"\u7f34",
"\u7e79":"\u7ece",
"\u7e7c":"\u7ee7",
"\u7e7d":"\u7f24",
"\u7e7e":"\u7f31",
"\u7e88":"\u7f2c",
"\u7e8a":"\u7ea9",
"\u7e8c":"\u7eed",
"\u7e8d":"\u7d2f",
"\u7e8f":"\u7f20",
"\u7e93":"\u7f28",
"\u7e94":"\u624d",
"\u7e96":"\u7ea4",
"\u7e98":"\u7f35",
"\u7e9c":"\u7f06",
"\u7f3d":"\u94b5",
"\u7f3e":"\u74f6",
"\u7f48":"\u575b",
"\u7f4c":"\u7f42",
"\u7f66":"\u7f58",
"\u7f70":"\u7f5a",
"\u7f75":"\u9a82",
"\u7f77":"\u7f62",
"\u7f85":"\u7f57",
"\u7f86":"\u7f74",
"\u7f88":"\u7f81",
"\u7f8b":"\u8288",
"\u7fa5":"\u7f9f",
"\u7fa8":"\u7fa1",
"\u7fa9":"\u4e49",
"\u7fb6":"\u81bb",
"\u7fd2":"\u4e60",
"\u7fec":"\u7fda",
"\u7ff9":"\u7fd8",
"\u8011":"\u7aef",
"\u8021":"\u52a9",
"\u8024":"\u85c9",
"\u802c":"\u8027",
"\u802e":"\u8022",
"\u8056":"\u5723",
"\u805e":"\u95fb",
"\u806f":"\u8054",
"\u8070":"\u806a",
"\u8072":"\u58f0",
"\u8073":"\u8038",
"\u8075":"\u8069",
"\u8076":"\u8042",
"\u8077":"\u804c",
"\u8079":"\u804d",
"\u807d":"\u542c",
"\u807e":"\u804b",
"\u8085":"\u8083",
"\u808f":"\u64cd",
"\u8090":"\u80f3",
"\u80c7":"\u80ba",
"\u80ca":"\u6710",
"\u8105":"\u80c1",
"\u8108":"\u8109",
"\u811b":"\u80eb",
"\u8123":"\u5507",
"\u8129":"\u4fee",
"\u812b":"\u8131",
"\u8139":"\u80c0",
"\u814e":"\u80be",
"\u8156":"\u80e8",
"\u8161":"\u8136",
"\u8166":"\u8111",
"\u816b":"\u80bf",
"\u8173":"\u811a",
"\u8178":"\u80a0",
"\u8183":"\u817d",
"\u8186":"\u55c9",
"\u8195":"\u8158",
"\u819a":"\u80a4",
"\u819e":"\u43dd",
"\u81a0":"\u80f6",
"\u81a9":"\u817b",
"\u81bd":"\u80c6",
"\u81be":"\u810d",
"\u81bf":"\u8113",
"\u81c9":"\u8138",
"\u81cd":"\u8110",
"\u81cf":"\u8191",
"\u81d5":"\u8198",
"\u81d8":"\u814a",
"\u81d9":"\u80ed",
"\u81da":"\u80ea",
"\u81df":"\u810f",
"\u81e0":"\u8114",
"\u81e2":"\u81dc",
"\u81e5":"\u5367",
"\u81e8":"\u4e34",
"\u81fa":"\u53f0",
"\u8207":"\u4e0e",
"\u8208":"\u5174",
"\u8209":"\u4e3e",
"\u820a":"\u65e7",
"\u820b":"\u8845",
"\u8216":"\u94fa",
"\u8259":"\u8231",
"\u8263":"\u6a79",
"\u8264":"\u8223",
"\u8266":"\u8230",
"\u826b":"\u823b",
"\u8271":"\u8270",
"\u8277":"\u8273",
"\u8278":"\u8279",
"\u82bb":"\u520d",
"\u82e7":"\u82ce",
"\u82fa":"\u8393",
"\u830d":"\u82df",
"\u8332":"\u5179",
"\u8345":"\u7b54",
"\u834a":"\u8346",
"\u8373":"\u8c46",
"\u838a":"\u5e84",
"\u8396":"\u830e",
"\u83a2":"\u835a",
"\u83a7":"\u82cb",
"\u83eb":"\u5807",
"\u83ef":"\u534e",
"\u83f4":"\u5eb5",
"\u8407":"\u82cc",
"\u840a":"\u83b1",
"\u842c":"\u4e07",
"\u8435":"\u83b4",
"\u8449":"\u53f6",
"\u8452":"\u836d",
"\u8457":"\u7740",
"\u8464":"\u836e",
"\u8466":"\u82c7",
"\u846f":"\u836f",
"\u8477":"\u8364",
"\u8490":"\u641c",
"\u8494":"\u83b3",
"\u849e":"\u8385",
"\u84bc":"\u82cd",
"\u84c0":"\u836a",
"\u84c6":"\u5e2d",
"\u84cb":"\u76d6",
"\u84ee":"\u83b2",
"\u84ef":"\u82c1",
"\u84f4":"\u83bc",
"\u84fd":"\u835c",
"\u8506":"\u83f1",
"\u8514":"\u535c",
"\u851e":"\u848c",
"\u8523":"\u848b",
"\u8525":"\u8471",
"\u8526":"\u8311",
"\u852d":"\u836b",
"\u8541":"\u8368",
"\u8546":"\u8487",
"\u854e":"\u835e",
"\u8552":"\u836c",
"\u8555":"\u83b8",
"\u8558":"\u835b",
"\u8562":"\u8489",
"\u8569":"\u8361",
"\u856a":"\u829c",
"\u856d":"\u8427",
"\u8577":"\u84e3",
"\u8588":"\u835f",
"\u858a":"\u84df",
"\u858c":"\u8297",
"\u8591":"\u59dc",
"\u8594":"\u8537",
"\u8599":"\u5243",
"\u859f":"\u83b6",
"\u85a6":"\u8350",
"\u85a9":"\u8428",
"\u85ba":"\u8360",
"\u85cd":"\u84dd",
"\u85ce":"\u8369",
"\u85dd":"\u827a",
"\u85e5":"\u836f",
"\u85ea":"\u85ae",
"\u85ed":"\u44d6",
"\u85f6":"\u82c8",
"\u85f7":"\u85af",
"\u85f9":"\u853c",
"\u85fa":"\u853a",
"\u8600":"\u841a",
"\u8604":"\u8572",
"\u8606":"\u82a6",
"\u8607":"\u82cf",
"\u860a":"\u8574",
"\u860b":"\u82f9",
"\u8617":"\u8616",
"\u861a":"\u85d3",
"\u861e":"\u8539",
"\u8622":"\u830f",
"\u862d":"\u5170",
"\u863a":"\u84e0",
"\u863f":"\u841d",
"\u8655":"\u5904",
"\u8656":"\u547c",
"\u865b":"\u865a",
"\u865c":"\u864f",
"\u865f":"\u53f7",
"\u8667":"\u4e8f",
"\u866f":"\u866c",
"\u86fa":"\u86f1",
"\u86fb":"\u8715",
"\u8706":"\u86ac",
"\u873a":"\u9713",
"\u8755":"\u8680",
"\u875f":"\u732c",
"\u8766":"\u867e",
"\u8768":"\u8671",
"\u8778":"\u8717",
"\u8784":"\u86f3",
"\u879e":"\u8682",
"\u87a2":"\u8424",
"\u87bb":"\u877c",
"\u87c4":"\u86f0",
"\u87c8":"\u8748",
"\u87ce":"\u87a8",
"\u87e3":"\u866e",
"\u87ec":"\u8749",
"\u87ef":"\u86f2",
"\u87f2":"\u866b",
"\u87f6":"\u86cf",
"\u87fa":"\u87ee",
"\u87fb":"\u8681",
"\u8805":"\u8747",
"\u8806":"\u867f",
"\u880d":"\u874e",
"\u8810":"\u86f4",
"\u8811":"\u877e",
"\u8814":"\u869d",
"\u881f":"\u8721",
"\u8823":"\u86ce",
"\u8828":"\u87cf",
"\u8831":"\u86ca",
"\u8836":"\u8695",
"\u8837":"\u883c",
"\u883b":"\u86ee",
"\u8846":"\u4f17",
"\u884a":"\u8511",
"\u8852":"\u70ab",
"\u8853":"\u672f",
"\u885a":"\u80e1",
"\u885b":"\u536b",
"\u885d":"\u51b2",
"\u8879":"\u53ea",
"\u889e":"\u886e",
"\u88aa":"\u795b",
"\u88ca":"\u8885",
"\u88cf":"\u91cc",
"\u88dc":"\u8865",
"\u88dd":"\u88c5",
"\u88e1":"\u91cc",
"\u88fd":"\u5236",
"\u8907":"\u590d",
"\u890e":"\u8896",
"\u8932":"\u88e4",
"\u8933":"\u88e2",
"\u8938":"\u891b",
"\u893b":"\u4eb5",
"\u8949":"\u88e5",
"\u8956":"\u8884",
"\u895d":"\u88e3",
"\u8960":"\u88c6",
"\u8964":"\u8934",
"\u896a":"\u889c",
"\u896c":"\u6446",
"\u896f":"\u886c",
"\u8972":"\u88ad",
"\u897e":"\u897f",
"\u8988":"\u6838",
"\u898b":"\u89c1",
"\u898e":"\u89c3",
"\u898f":"\u89c4",
"\u8993":"\u89c5",
"\u8996":"\u89c6",
"\u8998":"\u89c7",
"\u899c":"\u773a",
"\u89a1":"\u89cb",
"\u89a6":"\u89ce",
"\u89aa":"\u4eb2",
"\u89ac":"\u89ca",
"\u89af":"\u89cf",
"\u89b2":"\u89d0",
"\u89b7":"\u89d1",
"\u89ba":"\u89c9",
"\u89bd":"\u89c8",
"\u89bf":"\u89cc",
"\u89c0":"\u89c2",
"\u89d4":"\u7b4b",
"\u89dd":"\u62b5",
"\u89f4":"\u89de",
"\u89f6":"\u89ef",
"\u89f8":"\u89e6",
"\u8a02":"\u8ba2",
"\u8a03":"\u8ba3",
"\u8a08":"\u8ba1",
"\u8a0a":"\u8baf",
"\u8a0c":"\u8ba7",
"\u8a0e":"\u8ba8",
"\u8a10":"\u8ba6",
"\u8a13":"\u8bad",
"\u8a15":"\u8baa",
"\u8a16":"\u8bab",
"\u8a17":"\u6258",
"\u8a18":"\u8bb0",
"\u8a1b":"\u8bb9",
"\u8a1d":"\u8bb6",
"\u8a1f":"\u8bbc",
"\u8a22":"\u6b23",
"\u8a23":"\u8bc0",
"\u8a25":"\u8bb7",
"\u8a29":"\u8bbb",
"\u8a2a":"\u8bbf",
"\u8a2d":"\u8bbe",
"\u8a31":"\u8bb8",
"\u8a34":"\u8bc9",
"\u8a36":"\u8bc3",
"\u8a3a":"\u8bca",
"\u8a3b":"\u6ce8",
"\u8a3c":"\u8bc1",
"\u8a41":"\u8bc2",
"\u8a46":"\u8bcb",
"\u8a4e":"\u8bb5",
"\u8a50":"\u8bc8",
"\u8a52":"\u8bd2",
"\u8a54":"\u8bcf",
"\u8a55":"\u8bc4",
"\u8a57":"\u8bc7",
"\u8a58":"\u8bce",
"\u8a5b":"\u8bc5",
"\u8a5e":"\u8bcd",
"\u8a60":"\u548f",
"\u8a61":"\u8be9",
"\u8a62":"\u8be2",
"\u8a63":"\u8be3",
"\u8a66":"\u8bd5",
"\u8a69":"\u8bd7",
"\u8a6b":"\u8be7",
"\u8a6c":"\u8bdf",
"\u8a6d":"\u8be1",
"\u8a6e":"\u8be0",
"\u8a70":"\u8bd8",
"\u8a71":"\u8bdd",
"\u8a72":"\u8be5",
"\u8a73":"\u8be6",
"\u8a75":"\u8bdc",
"\u8a76":"\u916c",
"\u8a7b":"\u54af",
"\u8a7c":"\u8bd9",
"\u8a7f":"\u8bd6",
"\u8a84":"\u8bd4",
"\u8a85":"\u8bdb",
"\u8a86":"\u8bd3",
"\u8a87":"\u5938",
"\u8a8c":"\u5fd7",
"\u8a8d":"\u8ba4",
"\u8a91":"\u8bf3",
"\u8a92":"\u8bf6",
"\u8a95":"\u8bde",
"\u8a98":"\u8bf1",
"\u8a9a":"\u8bee",
"\u8a9e":"\u8bed",
"\u8aa0":"\u8bda",
"\u8aa1":"\u8beb",
"\u8aa3":"\u8bec",
"\u8aa4":"\u8bef",
"\u8aa5":"\u8bf0",
"\u8aa6":"\u8bf5",
"\u8aa8":"\u8bf2",
"\u8aaa":"\u8bf4",
"\u8aac":"\u8bf4",
"\u8ab0":"\u8c01",
"\u8ab2":"\u8bfe",
"\u8ab6":"\u8c07",
"\u8ab9":"\u8bfd",
"\u8abc":"\u8c0a",
"\u8abf":"\u8c03",
"\u8ac2":"\u8c04",
"\u8ac4":"\u8c06",
"\u8ac7":"\u8c08",
"\u8ac9":"\u8bff",
"\u8acb":"\u8bf7",
"\u8acd":"\u8be4",
"\u8acf":"\u8bf9",
"\u8ad1":"\u8bfc",
"\u8ad2":"\u8c05",
"\u8ad6":"\u8bba",
"\u8ad7":"\u8c02",
"\u8adb":"\u8c00",
"\u8adc":"\u8c0d",
"\u8add":"\u8c1e",
"\u8ade":"\u8c1d",
"\u8ae0":"\u55a7",
"\u8ae2":"\u8be8",
"\u8ae4":"\u8c14",
"\u8ae6":"\u8c1b",
"\u8ae7":"\u8c10",
"\u8aeb":"\u8c0f",
"\u8aed":"\u8c15",
"\u8aee":"\u8c18",
"\u8af1":"\u8bb3",
"\u8af3":"\u8c19",
"\u8af6":"\u8c0c",
"\u8af7":"\u8bbd",
"\u8af8":"\u8bf8",
"\u8afa":"\u8c1a",
"\u8afc":"\u8c16",
"\u8afe":"\u8bfa",
"\u8b00":"\u8c0b",
"\u8b01":"\u8c12",
"\u8b02":"\u8c13",
"\u8b04":"\u8a8a",
"\u8b05":"\u8bcc",
"\u8b0a":"\u8c0e",
"\u8b0e":"\u8c1c",
"\u8b10":"\u8c27",
"\u8b14":"\u8c11",
"\u8b16":"\u8c21",
"\u8b17":"\u8c24",
"\u8b19":"\u8c26",
"\u8b1a":"\u8c25",
"\u8b1b":"\u8bb2",
"\u8b1d":"\u8c22",
"\u8b20":"\u8c23",
"\u8b28":"\u8c1f",
"\u8b2b":"\u8c2a",
"\u8b2c":"\u8c2c",
"\u8b33":"\u8bb4",
"\u8b39":"\u8c28",
"\u8b3c":"\u547c",
"\u8b3e":"\u8c29",
"\u8b41":"\u54d7",
"\u8b46":"\u563b",
"\u8b49":"\u8bc1",
"\u8b4e":"\u8c32",
"\u8b4f":"\u8ba5",
"\u8b54":"\u64b0",
"\u8b56":"\u8c2e",
"\u8b58":"\u8bc6",
"\u8b59":"\u8c2f",
"\u8b5a":"\u8c2d",
"\u8b5c":"\u8c31",
"\u8b5f":"\u566a",
"\u8b6b":"\u8c35",
"\u8b6d":"\u6bc1",
"\u8b6f":"\u8bd1",
"\u8b70":"\u8bae",
"\u8b74":"\u8c34",
"\u8b77":"\u62a4",
"\u8b7d":"\u8a89",
"\u8b7e":"\u8c2b",
"\u8b80":"\u8bfb",
"\u8b85":"\u8c09",
"\u8b8a":"\u53d8",
"\u8b8c":"\u5bb4",
"\u8b8e":"\u96e0",
"\u8b92":"\u8c17",
"\u8b93":"\u8ba9",
"\u8b95":"\u8c30",
"\u8b96":"\u8c36",
"\u8b9a":"\u8d5e",
"\u8b9c":"\u8c20",
"\u8b9e":"\u8c33",
"\u8c3f":"\u6eaa",
"\u8c48":"\u5c82",
"\u8c4e":"\u7ad6",
"\u8c50":"\u4e30",
"\u8c54":"\u8273",
"\u8c56":"\u4e8d",
"\u8c6c":"\u732a",
"\u8c76":"\u8c6e",
"\u8c8d":"\u72f8",
"\u8c93":"\u732b",
"\u8c9d":"\u8d1d",
"\u8c9e":"\u8d1e",
"\u8ca0":"\u8d1f",
"\u8ca1":"\u8d22",
"\u8ca2":"\u8d21",
"\u8ca7":"\u8d2b",
"\u8ca8":"\u8d27",
"\u8ca9":"\u8d29",
"\u8caa":"\u8d2a",
"\u8cab":"\u8d2f",
"\u8cac":"\u8d23",
"\u8caf":"\u8d2e",
"\u8cb0":"\u8d33",
"\u8cb2":"\u8d40",
"\u8cb3":"\u8d30",
"\u8cb4":"\u8d35",
"\u8cb6":"\u8d2c",
"\u8cb7":"\u4e70",
"\u8cb8":"\u8d37",
"\u8cba":"\u8d36",
"\u8cbb":"\u8d39",
"\u8cbc":"\u8d34",
"\u8cbd":"\u8d3b",
"\u8cbf":"\u8d38",
"\u8cc0":"\u8d3a",
"\u8cc1":"\u8d32",
"\u8cc2":"\u8d42",
"\u8cc3":"\u8d41",
"\u8cc4":"\u8d3f",
"\u8cc5":"\u8d45",
"\u8cc7":"\u8d44",
"\u8cc8":"\u8d3e",
"\u8cca":"\u8d3c",
"\u8cd1":"\u8d48",
"\u8cd2":"\u8d4a",
"\u8cd3":"\u5bbe",
"\u8cd5":"\u8d47",
"\u8cd9":"\u8d52",
"\u8cda":"\u8d49",
"\u8cdc":"\u8d50",
"\u8cde":"\u8d4f",
"\u8ce0":"\u8d54",
"\u8ce1":"\u8d53",
"\u8ce2":"\u8d24",
"\u8ce3":"\u5356",
"\u8ce4":"\u8d31",
"\u8ce6":"\u8d4b",
"\u8ce7":"\u8d55",
"\u8cea":"\u8d28",
"\u8cec":"\u8d26",
"\u8ced":"\u8d4c",
"\u8cf4":"\u8d56",
"\u8cf5":"\u8d57",
"\u8cf8":"\u5269",
"\u8cfa":"\u8d5a",
"\u8cfb":"\u8d59",
"\u8cfc":"\u8d2d",
"\u8cfd":"\u8d5b",
"\u8cfe":"\u8d5c",
"\u8d04":"\u8d3d",
"\u8d05":"\u8d58",
"\u8d08":"\u8d60",
"\u8d0a":"\u8d5e",
"\u8d0b":"\u8d5d",
"\u8d0d":"\u8d61",
"\u8d0f":"\u8d62",
"\u8d10":"\u8d46",
"\u8d13":"\u8d43",
"\u8d16":"\u8d4e",
"\u8d1b":"\u8d63",
"\u8d95":"\u8d76",
"\u8d99":"\u8d75",
"\u8da8":"\u8d8b",
"\u8db2":"\u8db1",
"\u8de1":"\u8ff9",
"\u8dfc":"\u5c40",
"\u8e10":"\u8df5",
"\u8e21":"\u8737",
"\u8e2b":"\u78b0",
"\u8e30":"\u903e",
"\u8e34":"\u8e0a",
"\u8e4c":"\u8dc4",
"\u8e55":"\u8df8",
"\u8e5f":"\u8ff9",
"\u8e60":"\u8dd6",
"\u8e63":"\u8e52",
"\u8e64":"\u8e2a",
"\u8e67":"\u7cdf",
"\u8e7a":"\u8df7",
"\u8e89":"\u8db8",
"\u8e8a":"\u8e0c",
"\u8e8b":"\u8dfb",
"\u8e8d":"\u8dc3",
"\u8e91":"\u8e2f",
"\u8e92":"\u8dde",
"\u8e93":"\u8e2c",
"\u8e95":"\u8e70",
"\u8e9a":"\u8df9",
"\u8ea1":"\u8e51",
"\u8ea5":"\u8e7f",
"\u8ea6":"\u8e9c",
"\u8eaa":"\u8e8f",
"\u8ec0":"\u8eaf",
"\u8eca":"\u8f66",
"\u8ecb":"\u8f67",
"\u8ecc":"\u8f68",
"\u8ecd":"\u519b",
"\u8ed2":"\u8f69",
"\u8ed4":"\u8f6b",
"\u8edb":"\u8f6d",
"\u8edf":"\u8f6f",
"\u8ee4":"\u8f77",
"\u8eeb":"\u8f78",
"\u8ef2":"\u8f71",
"\u8ef8":"\u8f74",
"\u8ef9":"\u8f75",
"\u8efa":"\u8f7a",
"\u8efb":"\u8f72",
"\u8efc":"\u8f76",
"\u8efe":"\u8f7c",
"\u8f03":"\u8f83",
"\u8f05":"\u8f82",
"\u8f07":"\u8f81",
"\u8f09":"\u8f7d",
"\u8f0a":"\u8f7e",
"\u8f12":"\u8f84",
"\u8f13":"\u633d",
"\u8f14":"\u8f85",
"\u8f15":"\u8f7b",
"\u8f1b":"\u8f86",
"\u8f1c":"\u8f8e",
"\u8f1d":"\u8f89",
"\u8f1e":"\u8f8b",
"\u8f1f":"\u8f8d",
"\u8f25":"\u8f8a",
"\u8f26":"\u8f87",
"\u8f29":"\u8f88",
"\u8f2a":"\u8f6e",
"\u8f2f":"\u8f91",
"\u8f33":"\u8f8f",
"\u8f38":"\u8f93",
"\u8f3b":"\u8f90",
"\u8f3e":"\u8f97",
"\u8f3f":"\u8206",
"\u8f42":"\u6bc2",
"\u8f44":"\u8f96",
"\u8f45":"\u8f95",
"\u8f46":"\u8f98",
"\u8f49":"\u8f6c",
"\u8f4d":"\u8f99",
"\u8f4e":"\u8f7f",
"\u8f54":"\u8f9a",
"\u8f5f":"\u8f70",
"\u8f61":"\u8f94",
"\u8f62":"\u8f79",
"\u8f64":"\u8f73",
"\u8fa6":"\u529e",
"\u8fad":"\u8f9e",
"\u8fae":"\u8fab",
"\u8faf":"\u8fa9",
"\u8fb2":"\u519c",
"\u8fc6":"\u8fe4",
"\u8ff4":"\u56de",
"\u8ffa":"\u4e43",
"\u9015":"\u8ff3",
"\u9019":"\u8fd9",
"\u9023":"\u8fde",
"\u9031":"\u5468",
"\u9032":"\u8fdb",
"\u904a":"\u6e38",
"\u904b":"\u8fd0",
"\u904e":"\u8fc7",
"\u9054":"\u8fbe",
"\u9055":"\u8fdd",
"\u9059":"\u9065",
"\u905c":"\u900a",
"\u905e":"\u9012",
"\u9060":"\u8fdc",
"\u9069":"\u9002",
"\u9072":"\u8fdf",
"\u9077":"\u8fc1",
"\u9078":"\u9009",
"\u907a":"\u9057",
"\u907c":"\u8fbd",
"\u9081":"\u8fc8",
"\u9084":"\u8fd8",
"\u9087":"\u8fe9",
"\u908a":"\u8fb9",
"\u908f":"\u903b",
"\u9090":"\u9026",
"\u90df":"\u90cf",
"\u90f5":"\u90ae",
"\u9106":"\u90d3",
"\u9109":"\u4e61",
"\u9112":"\u90b9",
"\u9114":"\u90ac",
"\u9116":"\u90e7",
"\u9127":"\u9093",
"\u912d":"\u90d1",
"\u9130":"\u90bb",
"\u9132":"\u90f8",
"\u9134":"\u90ba",
"\u9136":"\u90d0",
"\u913a":"\u909d",
"\u9148":"\u90e6",
"\u9156":"\u9e29",
"\u9183":"\u814c",
"\u9186":"\u76cf",
"\u919c":"\u4e11",
"\u919e":"\u915d",
"\u91ab":"\u533b",
"\u91ac":"\u9171",
"\u91b1":"\u53d1",
"\u91bc":"\u5bb4",
"\u91c0":"\u917f",
"\u91c1":"\u8845",
"\u91c3":"\u917e",
"\u91c5":"\u917d",
"\u91c6":"\u91c7",
"\u91cb":"\u91ca",
"\u91d0":"\u5398",
"\u91d3":"\u9486",
"\u91d4":"\u9487",
"\u91d5":"\u948c",
"\u91d7":"\u948a",
"\u91d8":"\u9489",
"\u91d9":"\u948b",
"\u91dd":"\u9488",
"\u91e3":"\u9493",
"\u91e4":"\u9490",
"\u91e6":"\u6263",
"\u91e7":"\u948f",
"\u91e9":"\u9492",
"\u91f5":"\u9497",
"\u91f7":"\u948d",
"\u91f9":"\u9495",
"\u91fa":"\u948e",
"\u91fe":"\u497a",
"\u9200":"\u94af",
"\u9201":"\u94ab",
"\u9203":"\u9498",
"\u9204":"\u94ad",
"\u9208":"\u949a",
"\u9209":"\u94a0",
"\u920d":"\u949d",
"\u9210":"\u94a4",
"\u9211":"\u94a3",
"\u9214":"\u949e",
"\u9215":"\u94ae",
"\u921e":"\u94a7",
"\u9223":"\u9499",
"\u9225":"\u94ac",
"\u9226":"\u949b",
"\u9227":"\u94aa",
"\u922e":"\u94cc",
"\u9230":"\u94c8",
"\u9233":"\u94b6",
"\u9234":"\u94c3",
"\u9237":"\u94b4",
"\u9238":"\u94b9",
"\u9239":"\u94cd",
"\u923a":"\u94b0",
"\u923d":"\u94b8",
"\u923e":"\u94c0",
"\u923f":"\u94bf",
"\u9240":"\u94be",
"\u9245":"\u949c",
"\u9246":"\u94bb",
"\u9248":"\u94ca",
"\u9249":"\u94c9",
"\u924b":"\u5228",
"\u924d":"\u94cb",
"\u9251":"\u94c2",
"\u9255":"\u94b7",
"\u9257":"\u94b3",
"\u925a":"\u94c6",
"\u925b":"\u94c5",
"\u925e":"\u94ba",
"\u9262":"\u94b5",
"\u9264":"\u94a9",
"\u9266":"\u94b2",
"\u926c":"\u94bc",
"\u926d":"\u94bd",
"\u9276":"\u94cf",
"\u9278":"\u94f0",
"\u927a":"\u94d2",
"\u927b":"\u94ec",
"\u927f":"\u94ea",
"\u9280":"\u94f6",
"\u9283":"\u94f3",
"\u9285":"\u94dc",
"\u9291":"\u94e3",
"\u9293":"\u94e8",
"\u9296":"\u94e2",
"\u9298":"\u94ed",
"\u929a":"\u94eb",
"\u929c":"\u8854",
"\u92a0":"\u94d1",
"\u92a3":"\u94f7",
"\u92a5":"\u94f1",
"\u92a6":"\u94df",
"\u92a8":"\u94f5",
"\u92a9":"\u94e5",
"\u92aa":"\u94d5",
"\u92ab":"\u94ef",
"\u92ac":"\u94d0",
"\u92b1":"\u94de",
"\u92b2":"\u710a",
"\u92b3":"\u9510",
"\u92b7":"\u9500",
"\u92b9":"\u9508",
"\u92bb":"\u9511",
"\u92bc":"\u9509",
"\u92c1":"\u94dd",
"\u92c3":"\u9512",
"\u92c5":"\u950c",
"\u92c7":"\u94a1",
"\u92cc":"\u94e4",
"\u92cf":"\u94d7",
"\u92d2":"\u950b",
"\u92dd":"\u950a",
"\u92df":"\u9513",
"\u92e3":"\u94d8",
"\u92e4":"\u9504",
"\u92e5":"\u9503",
"\u92e6":"\u9514",
"\u92e8":"\u9507",
"\u92e9":"\u94d3",
"\u92ea":"\u94fa",
"\u92ee":"\u94d6",
"\u92ef":"\u9506",
"\u92f0":"\u9502",
"\u92f1":"\u94fd",
"\u92f6":"\u950d",
"\u92f8":"\u952f",
"\u92fb":"\u9274",
"\u92fc":"\u94a2",
"\u9301":"\u951e",
"\u9304":"\u5f55",
"\u9306":"\u9516",
"\u9307":"\u952b",
"\u9308":"\u9529",
"\u9310":"\u9525",
"\u9312":"\u9515",
"\u9315":"\u951f",
"\u9318":"\u9524",
"\u9319":"\u9531",
"\u931a":"\u94ee",
"\u931b":"\u951b",
"\u931f":"\u952c",
"\u9320":"\u952d",
"\u9322":"\u94b1",
"\u9326":"\u9526",
"\u9328":"\u951a",
"\u932b":"\u9521",
"\u932e":"\u9522",
"\u932f":"\u9519",
"\u9333":"\u9530",
"\u9336":"\u8868",
"\u9338":"\u94fc",
"\u9340":"\u951d",
"\u9341":"\u9528",
"\u9343":"\u952a",
"\u9346":"\u9494",
"\u9347":"\u9534",
"\u934a":"\u70bc",
"\u934b":"\u9505",
"\u934d":"\u9540",
"\u9354":"\u9537",
"\u9358":"\u94e1",
"\u935a":"\u9496",
"\u935b":"\u953b",
"\u9364":"\u9538",
"\u9365":"\u9532",
"\u9369":"\u9518",
"\u936c":"\u9539",
"\u9370":"\u953e",
"\u9375":"\u952e",
"\u9376":"\u9536",
"\u937a":"\u9517",
"\u937c":"\u9488",
"\u937e":"\u949f",
"\u9382":"\u9541",
"\u9384":"\u953f",
"\u9387":"\u9545",
"\u938a":"\u9551",
"\u938c":"\u9570",
"\u9394":"\u9555",
"\u9396":"\u9501",
"\u9397":"\u67aa",
"\u9398":"\u9549",
"\u939a":"\u9524",
"\u93a1":"\u9543",
"\u93a2":"\u94a8",
"\u93a3":"\u84e5",
"\u93a6":"\u954f",
"\u93a7":"\u94e0",
"\u93a9":"\u94e9",
"\u93aa":"\u953c",
"\u93ac":"\u9550",
"\u93ae":"\u9547",
"\u93b0":"\u9552",
"\u93b3":"\u954d",
"\u93b5":"\u9553",
"\u93bf":"\u954e",
"\u93c3":"\u955e",
"\u93c7":"\u955f",
"\u93c8":"\u94fe",
"\u93cc":"\u9546",
"\u93cd":"\u9559",
"\u93d1":"\u955d",
"\u93d7":"\u94ff",
"\u93d8":"\u9535",
"\u93dc":"\u9557",
"\u93dd":"\u9558",
"\u93de":"\u955b",
"\u93df":"\u94f2",
"\u93e1":"\u955c",
"\u93e2":"\u9556",
"\u93e4":"\u9542",
"\u93e8":"\u933e",
"\u93f0":"\u955a",
"\u93f5":"\u94e7",
"\u93f7":"\u9564",
"\u93f9":"\u956a",
"\u93fa":"\u497d",
"\u93fd":"\u9508",
"\u9403":"\u94d9",
"\u9409":"\u94e3",
"\u940b":"\u94f4",
"\u9410":"\u9563",
"\u9412":"\u94f9",
"\u9413":"\u9566",
"\u9414":"\u9561",
"\u9418":"\u949f",
"\u9419":"\u956b",
"\u941d":"\u9562",
"\u9420":"\u9568",
"\u9425":"\u4985",
"\u9426":"\u950e",
"\u9427":"\u950f",
"\u9428":"\u9544",
"\u942b":"\u954c",
"\u942e":"\u9570",
"\u942f":"\u4983",
"\u9432":"\u956f",
"\u9433":"\u956d",
"\u9435":"\u94c1",
"\u9436":"\u956e",
"\u9438":"\u94ce",
"\u943a":"\u94db",
"\u943f":"\u9571",
"\u9444":"\u94f8",
"\u944a":"\u956c",
"\u944c":"\u9554",
"\u9451":"\u9274",
"\u9452":"\u9274",
"\u9454":"\u9572",
"\u9455":"\u9527",
"\u945e":"\u9574",
"\u9460":"\u94c4",
"\u9463":"\u9573",
"\u9464":"\u5228",
"\u9465":"\u9565",
"\u946a":"\u7089",
"\u946d":"\u9567",
"\u9470":"\u94a5",
"\u9472":"\u9576",
"\u9475":"\u7f50",
"\u9477":"\u954a",
"\u9479":"\u9569",
"\u947c":"\u9523",
"\u947d":"\u94bb",
"\u947e":"\u92ae",
"\u947f":"\u51ff",
"\u9481":"\u4986",
"\u9482":"\u954b",
"\u9577":"\u957f",
"\u9580":"\u95e8",
"\u9582":"\u95e9",
"\u9583":"\u95ea",
"\u9586":"\u95eb",
"\u9589":"\u95ed",
"\u958b":"\u5f00",
"\u958c":"\u95f6",
"\u958e":"\u95f3",
"\u958f":"\u95f0",
"\u9591":"\u95f2",
"\u9592":"\u95f2",
"\u9593":"\u95f4",
"\u9594":"\u95f5",
"\u9598":"\u95f8",
"\u95a1":"\u9602",
"\u95a3":"\u9601",
"\u95a4":"\u5408",
"\u95a5":"\u9600",
"\u95a8":"\u95fa",
"\u95a9":"\u95fd",
"\u95ab":"\u9603",
"\u95ac":"\u9606",
"\u95ad":"\u95fe",
"\u95b1":"\u9605",
"\u95b6":"\u960a",
"\u95b9":"\u9609",
"\u95bb":"\u960e",
"\u95bc":"\u960f",
"\u95bd":"\u960d",
"\u95be":"\u9608",
"\u95bf":"\u960c",
"\u95c3":"\u9612",
"\u95c6":"\u677f",
"\u95c7":"\u6697",
"\u95c8":"\u95f1",
"\u95ca":"\u9614",
"\u95cb":"\u9615",
"\u95cc":"\u9611",
"\u95d0":"\u9617",
"\u95d3":"\u95ff",
"\u95d4":"\u9616",
"\u95d5":"\u9619",
"\u95d6":"\u95ef",
"\u95dc":"\u5173",
"\u95de":"\u961a",
"\u95e1":"\u9610",
"\u95e2":"\u8f9f",
"\u95e5":"\u95fc",
"\u9628":"\u5384",
"\u962c":"\u5751",
"\u962f":"\u5740",
"\u964f":"\u968b",
"\u9658":"\u9649",
"\u965d":"\u9655",
"\u965e":"\u5347",
"\u9663":"\u9635",
"\u9670":"\u9634",
"\u9673":"\u9648",
"\u9678":"\u9646",
"\u967d":"\u9633",
"\u9684":"\u5824",
"\u9689":"\u9667",
"\u968a":"\u961f",
"\u968e":"\u9636",
"\u9695":"\u9668",
"\u969b":"\u9645",
"\u96a4":"\u9893",
"\u96a8":"\u968f",
"\u96aa":"\u9669",
"\u96b1":"\u9690",
"\u96b4":"\u9647",
"\u96b8":"\u96b6",
"\u96bb":"\u53ea",
"\u96cb":"\u96bd",
"\u96d6":"\u867d",
"\u96d9":"\u53cc",
"\u96db":"\u96cf",
"\u96dc":"\u6742",
"\u96de":"\u9e21",
"\u96e2":"\u79bb",
"\u96e3":"\u96be",
"\u96f2":"\u4e91",
"\u96fb":"\u7535",
"\u9724":"\u6e9c",
"\u9727":"\u96fe",
"\u973d":"\u9701",
"\u9742":"\u96f3",
"\u9744":"\u972d",
"\u9746":"\u53c7",
"\u9748":"\u7075",
"\u9749":"\u53c6",
"\u975a":"\u9753",
"\u975c":"\u9759",
"\u9766":"\u817c",
"\u9768":"\u9765",
"\u978f":"\u5de9",
"\u97a6":"\u79cb",
"\u97c1":"\u7f30",
"\u97c3":"\u9791",
"\u97c6":"\u5343",
"\u97c9":"\u97af",
"\u97cb":"\u97e6",
"\u97cc":"\u97e7",
"\u97cd":"\u97e8",
"\u97d3":"\u97e9",
"\u97d9":"\u97ea",
"\u97dc":"\u97ec",
"\u97de":"\u97eb",
"\u97fb":"\u97f5",
"\u97ff":"\u54cd",
"\u9801":"\u9875",
"\u9802":"\u9876",
"\u9803":"\u9877",
"\u9805":"\u9879",
"\u9806":"\u987a",
"\u9807":"\u9878",
"\u9808":"\u987b",
"\u980a":"\u987c",
"\u980c":"\u9882",
"\u980e":"\u9880",
"\u980f":"\u9883",
"\u9810":"\u9884",
"\u9811":"\u987d",
"\u9812":"\u9881",
"\u9813":"\u987f",
"\u9817":"\u9887",
"\u9818":"\u9886",
"\u981c":"\u988c",
"\u9821":"\u9889",
"\u9824":"\u9890",
"\u9826":"\u988f",
"\u982b":"\u4fef",
"\u982d":"\u5934",
"\u9830":"\u988a",
"\u9832":"\u988b",
"\u9837":"\u9894",
"\u9838":"\u9888",
"\u9839":"\u9893",
"\u983b":"\u9891",
"\u9846":"\u9897",
"\u984c":"\u9898",
"\u984d":"\u989d",
"\u984e":"\u816d",
"\u984f":"\u989c",
"\u9852":"\u9899",
"\u9853":"\u989b",
"\u9854":"\u989c",
"\u9858":"\u613f",
"\u9859":"\u98a1",
"\u985b":"\u98a0",
"\u985e":"\u7c7b",
"\u9862":"\u989f",
"\u9865":"\u98a2",
"\u9867":"\u987e",
"\u986b":"\u98a4",
"\u986c":"\u98a5",
"\u986f":"\u663e",
"\u9870":"\u98a6",
"\u9871":"\u9885",
"\u9873":"\u989e",
"\u9874":"\u98a7",
"\u98a8":"\u98ce",
"\u98ae":"\u98d1",
"\u98af":"\u98d2",
"\u98b1":"\u53f0",
"\u98b3":"\u522e",
"\u98b6":"\u98d3",
"\u98b8":"\u98d4",
"\u98ba":"\u626c",
"\u98bc":"\u98d5",
"\u98c0":"\u98d7",
"\u98c4":"\u98d8",
"\u98c6":"\u98d9",
"\u98c8":"\u98da",
"\u98db":"\u98de",
"\u98e2":"\u9965",
"\u98e5":"\u9966",
"\u98e9":"\u9968",
"\u98ea":"\u996a",
"\u98eb":"\u996b",
"\u98ed":"\u996c",
"\u98ef":"\u996d",
"\u98f2":"\u996e",
"\u98f4":"\u9974",
"\u98fc":"\u9972",
"\u98fd":"\u9971",
"\u98fe":"\u9970",
"\u98ff":"\u9973",
"\u9903":"\u997a",
"\u9904":"\u9978",
"\u9905":"\u997c",
"\u9908":"\u7ccd",
"\u9909":"\u9977",
"\u990a":"\u517b",
"\u990c":"\u9975",
"\u990e":"\u9979",
"\u990f":"\u997b",
"\u9911":"\u997d",
"\u9912":"\u9981",
"\u9913":"\u997f",
"\u9914":"\u54fa",
"\u9918":"\u4f59",
"\u991a":"\u80b4",
"\u991b":"\u9984",
"\u991c":"\u9983",
"\u991e":"\u996f",
"\u9921":"\u9985",
"\u9928":"\u9986",
"\u992c":"\u7cca",
"\u9931":"\u7cc7",
"\u9933":"\u9967",
"\u9935":"\u5582",
"\u9936":"\u9989",
"\u9937":"\u9987",
"\u993a":"\u998e",
"\u993c":"\u9969",
"\u993d":"\u9988",
"\u993e":"\u998f",
"\u993f":"\u998a",
"\u9943":"\u998d",
"\u9945":"\u9992",
"\u9948":"\u9990",
"\u9949":"\u9991",
"\u994a":"\u9993",
"\u994b":"\u9988",
"\u994c":"\u9994",
"\u9951":"\u9965",
"\u9952":"\u9976",
"\u9957":"\u98e8",
"\u995c":"\u990d",
"\u995e":"\u998b",
"\u995f":"\u9995",
"\u99ac":"\u9a6c",
"\u99ad":"\u9a6d",
"\u99ae":"\u51af",
"\u99b1":"\u9a6e",
"\u99b3":"\u9a70",
"\u99b4":"\u9a6f",
"\u99c1":"\u9a73",
"\u99d0":"\u9a7b",
"\u99d1":"\u9a7d",
"\u99d2":"\u9a79",
"\u99d4":"\u9a75",
"\u99d5":"\u9a7e",
"\u99d8":"\u9a80",
"\u99d9":"\u9a78",
"\u99db":"\u9a76",
"\u99dd":"\u9a7c",
"\u99df":"\u9a77",
"\u99e2":"\u9a88",
"\u99ed":"\u9a87",
"\u99ee":"\u9a73",
"\u99f1":"\u9a86",
"\u99f8":"\u9a8e",
"\u99ff":"\u9a8f",
"\u9a01":"\u9a8b",
"\u9a03":"\u5446",
"\u9a05":"\u9a93",
"\u9a0d":"\u9a92",
"\u9a0e":"\u9a91",
"\u9a0f":"\u9a90",
"\u9a16":"\u9a9b",
"\u9a19":"\u9a97",
"\u9a23":"\u9b03",
"\u9a2b":"\u9a9e",
"\u9a2d":"\u9a98",
"\u9a2e":"\u9a9d",
"\u9a30":"\u817e",
"\u9a36":"\u9a7a",
"\u9a37":"\u9a9a",
"\u9a38":"\u9a9f",
"\u9a3e":"\u9aa1",
"\u9a40":"\u84e6",
"\u9a41":"\u9a9c",
"\u9a42":"\u9a96",
"\u9a43":"\u9aa0",
"\u9a44":"\u9aa2",
"\u9a45":"\u9a71",
"\u9a4a":"\u9a85",
"\u9a4d":"\u9a81",
"\u9a4f":"\u9aa3",
"\u9a55":"\u9a84",
"\u9a57":"\u9a8c",
"\u9a5a":"\u60ca",
"\u9a5b":"\u9a7f",
"\u9a5f":"\u9aa4",
"\u9a62":"\u9a74",
"\u9a64":"\u9aa7",
"\u9a65":"\u9aa5",
"\u9a6a":"\u9a8a",
"\u9aaf":"\u80ae",
"\u9acf":"\u9ac5",
"\u9ad2":"\u810f",
"\u9ad4":"\u4f53",
"\u9ad5":"\u9acc",
"\u9ad6":"\u9acb",
"\u9ae3":"\u4eff",
"\u9aee":"\u53d1",
"\u9b06":"\u677e",
"\u9b0d":"\u80e1",
"\u9b1a":"\u987b",
"\u9b22":"\u9b13",
"\u9b25":"\u6597",
"\u9b27":"\u95f9",
"\u9b28":"\u54c4",
"\u9b29":"\u960b",
"\u9b2e":"\u9604",
"\u9b31":"\u90c1",
"\u9b4e":"\u9b49",
"\u9b58":"\u9b47",
"\u9b5a":"\u9c7c",
"\u9b5b":"\u9c7d",
"\u9b68":"\u8c5a",
"\u9b6f":"\u9c81",
"\u9b74":"\u9c82",
"\u9b77":"\u9c7f",
"\u9b81":"\u9c85",
"\u9b83":"\u9c86",
"\u9b8d":"\u9c8f",
"\u9b90":"\u9c90",
"\u9b91":"\u9c8d",
"\u9b92":"\u9c8b",
"\u9b93":"\u9c8a",
"\u9b9a":"\u9c92",
"\u9b9e":"\u9c95",
"\u9ba3":"\u4c9f",
"\u9ba6":"\u9c96",
"\u9baa":"\u9c94",
"\u9bab":"\u9c9b",
"\u9bad":"\u9c91",
"\u9bae":"\u9c9c",
"\u9bba":"\u9c9d",
"\u9bc0":"\u9ca7",
"\u9bc1":"\u9ca0",
"\u9bc7":"\u9ca9",
"\u9bc9":"\u9ca4",
"\u9bca":"\u9ca8",
"\u9bd4":"\u9cbb",
"\u9bd6":"\u9cad",
"\u9bd7":"\u9c9e",
"\u9bdb":"\u9cb7",
"\u9bdd":"\u9cb4",
"\u9be1":"\u9cb1",
"\u9be2":"\u9cb5",
"\u9be4":"\u9cb2",
"\u9be7":"\u9cb3",
"\u9be8":"\u9cb8",
"\u9bea":"\u9cae",
"\u9beb":"\u9cb0",
"\u9bf0":"\u9c87",
"\u9bf4":"\u9cba",
"\u9bfd":"\u9cab",
"\u9bff":"\u9cca",
"\u9c02":"\u9c97",
"\u9c08":"\u9cbd",
"\u9c09":"\u9cc7",
"\u9c0c":"\u4ca1",
"\u9c0d":"\u9cc5",
"\u9c12":"\u9cc6",
"\u9c13":"\u9cc3",
"\u9c1b":"\u9cc1",
"\u9c1c":"\u9cd2",
"\u9c1f":"\u9cd1",
"\u9c20":"\u9ccb",
"\u9c23":"\u9ca5",
"\u9c25":"\u9ccf",
"\u9c27":"\u4ca2",
"\u9c28":"\u9cce",
"\u9c29":"\u9cd0",
"\u9c2d":"\u9ccd",
"\u9c31":"\u9ca2",
"\u9c32":"\u9ccc",
"\u9c33":"\u9cd3",
"\u9c35":"\u9cd8",
"\u9c37":"\u9ca6",
"\u9c39":"\u9ca3",
"\u9c3b":"\u9cd7",
"\u9c3c":"\u9cdb",
"\u9c3e":"\u9cd4",
"\u9c45":"\u9cd9",
"\u9c48":"\u9cd5",
"\u9c49":"\u9cd6",
"\u9c52":"\u9cdf",
"\u9c54":"\u9cdd",
"\u9c56":"\u9cdc",
"\u9c57":"\u9cde",
"\u9c58":"\u9c9f",
"\u9c5d":"\u9cbc",
"\u9c5f":"\u9c8e",
"\u9c60":"\u9c99",
"\u9c63":"\u9ce3",
"\u9c67":"\u9ce2",
"\u9c68":"\u9cbf",
"\u9c6d":"\u9c9a",
"\u9c77":"\u9cc4",
"\u9c78":"\u9c88",
"\u9c7a":"\u9ca1",
"\u9ce5":"\u9e1f",
"\u9ce7":"\u51eb",
"\u9ce9":"\u9e20",
"\u9cf3":"\u51e4",
"\u9cf4":"\u9e23",
"\u9cf6":"\u9e22",
"\u9cfe":"\u4d13",
"\u9d06":"\u9e29",
"\u9d07":"\u9e28",
"\u9d08":"\u96c1",
"\u9d09":"\u9e26",
"\u9d12":"\u9e30",
"\u9d15":"\u9e35",
"\u9d1b":"\u9e33",
"\u9d1d":"\u9e32",
"\u9d1e":"\u9e2e",
"\u9d1f":"\u9e31",
"\u9d23":"\u9e2a",
"\u9d26":"\u9e2f",
"\u9d28":"\u9e2d",
"\u9d2f":"\u9e38",
"\u9d30":"\u9e39",
"\u9d34":"\u9e3b",
"\u9d37":"\u4d15",
"\u9d3b":"\u9e3f",
"\u9d3f":"\u9e3d",
"\u9d41":"\u4d14",
"\u9d42":"\u9e3a",
"\u9d43":"\u9e3c",
"\u9d51":"\u9e43",
"\u9d52":"\u9e46",
"\u9d53":"\u9e41",
"\u9d5c":"\u9e48",
"\u9d5d":"\u9e45",
"\u9d60":"\u9e44",
"\u9d61":"\u9e49",
"\u9d6a":"\u9e4c",
"\u9d6c":"\u9e4f",
"\u9d6e":"\u9e50",
"\u9d6f":"\u9e4e",
"\u9d70":"\u96d5",
"\u9d72":"\u9e4a",
"\u9d84":"\u4d16",
"\u9d87":"\u9e2b",
"\u9d89":"\u9e51",
"\u9d8a":"\u9e52",
"\u9d8f":"\u9e21",
"\u9d93":"\u9e4b",
"\u9d96":"\u9e59",
"\u9d98":"\u9e55",
"\u9d9a":"\u9e57",
"\u9da1":"\u9e56",
"\u9da5":"\u9e5b",
"\u9da9":"\u9e5c",
"\u9daa":"\u4d17",
"\u9dac":"\u9e27",
"\u9daf":"\u83ba",
"\u9db1":"\u9a9e",
"\u9db4":"\u9e64",
"\u9dba":"\u9e61",
"\u9dbb":"\u9e58",
"\u9dbc":"\u9e63",
"\u9dbf":"\u9e5a",
"\u9dc2":"\u9e5e",
"\u9dc9":"\u4d18",
"\u9dd3":"\u9e67",
"\u9dd6":"\u9e65",
"\u9dd7":"\u9e25",
"\u9dd9":"\u9e37",
"\u9dda":"\u9e68",
"\u9de5":"\u9e36",
"\u9de6":"\u9e6a",
"\u9def":"\u9e69",
"\u9df0":"\u71d5",
"\u9df2":"\u9e6b",
"\u9df3":"\u9e47",
"\u9df4":"\u9e47",
"\u9df8":"\u9e6c",
"\u9df9":"\u9e70",
"\u9dfa":"\u9e6d",
"\u9e07":"\u9e6f",
"\u9e0a":"\u4d19",
"\u9e0c":"\u9e71",
"\u9e15":"\u9e2c",
"\u9e1a":"\u9e66",
"\u9e1b":"\u9e73",
"\u9e1d":"\u9e42",
"\u9e1e":"\u9e3e",
"\u9e75":"\u5364",
"\u9e79":"\u54b8",
"\u9e7a":"\u9e7e",
"\u9e7c":"\u7877",
"\u9e7d":"\u76d0",
"\u9e97":"\u4e3d",
"\u9ea5":"\u9ea6",
"\u9ea9":"\u9eb8",
"\u9eb5":"\u9762",
"\u9ebc":"\u4e48",
"\u9ec3":"\u9ec4",
"\u9ecc":"\u9ec9",
"\u9ede":"\u70b9",
"\u9ee8":"\u515a",
"\u9ef2":"\u9eea",
"\u9ef4":"\u9709",
"\u9ef6":"\u9ee1",
"\u9ef7":"\u9ee9",
"\u9efd":"\u9efe",
"\u9eff":"\u9f0b",
"\u9f07":"\u9ccc",
"\u9f09":"\u9f0d",
"\u9f15":"\u51ac",
"\u9f34":"\u9f39",
"\u9f4a":"\u9f50",
"\u9f4b":"\u658b",
"\u9f4e":"\u8d4d",
"\u9f4f":"\u9f51",
"\u9f52":"\u9f7f",
"\u9f54":"\u9f80",
"\u9f59":"\u9f85",
"\u9f5c":"\u9f87",
"\u9f5f":"\u9f83",
"\u9f60":"\u9f86",
"\u9f61":"\u9f84",
"\u9f63":"\u51fa",
"\u9f66":"\u9f88",
"\u9f67":"\u556e",
"\u9f6a":"\u9f8a",
"\u9f6c":"\u9f89",
"\u9f72":"\u9f8b",
"\u9f76":"\u816d",
"\u9f77":"\u9f8c",
"\u9f8d":"\u9f99",
"\u9f90":"\u5e9e",
"\u9f91":"\u4dae",
"\u9f94":"\u9f9a",
"\u9f95":"\u9f9b",
"\u9f9c":"\u9f9f",
"\ufa0c":"\u5140",
"\ufe30":"\u2236",
"\ufe31":"\uff5c",
"\ufe33":"\uff5c",
"\ufe3f":"\u2227",
"\ufe40":"\u2228",
"\ufe50":"\uff0c",
"\ufe51":"\u3001",
"\ufe52":"\uff0e",
"\ufe54":"\uff1b",
"\ufe55":"\uff1a",
"\ufe56":"\uff1f",
"\ufe57":"\uff01",
"\ufe59":"\uff08",
"\ufe5a":"\uff09",
"\ufe5b":"\uff5b",
"\ufe5c":"\uff5d",
"\ufe5d":"\uff3b",
"\ufe5e":"\uff3d",
"\ufe5f":"\uff03",
"\ufe60":"\uff06",
"\ufe61":"\uff0a",
"\ufe62":"\uff0b",
"\ufe63":"\uff0d",
"\ufe64":"\uff1c",
"\ufe65":"\uff1e",
"\ufe66":"\uff1d",
"\ufe69":"\uff04",
"\ufe6a":"\uff05",
"\ufe6b":"\uff20",
"\u300C":"\u300C",
"\u300D":"\u300D",
};

function toSimp(itxt){
	var zhmap = TongWen.t_2_s;

	itxt = itxt.replace(/[^\x00-\xFF]/g, replaceFn);

	return itxt;

	/////
	function replaceFn(s){
		return ((s in zhmap) ? zhmap[s] : s);
	}
}

module.exports = toSimp;


/***/ }),

/***/ 97143:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var util = __webpack_require__(73837);
var Stream = (__webpack_require__(12781).Stream);
var DelayedStream = __webpack_require__(23154);

module.exports = CombinedStream;
function CombinedStream() {
  this.writable = false;
  this.readable = true;
  this.dataSize = 0;
  this.maxDataSize = 2 * 1024 * 1024;
  this.pauseStreams = true;

  this._released = false;
  this._streams = [];
  this._currentStream = null;
  this._insideLoop = false;
  this._pendingNext = false;
}
util.inherits(CombinedStream, Stream);

CombinedStream.create = function(options) {
  var combinedStream = new this();

  options = options || {};
  for (var option in options) {
    combinedStream[option] = options[option];
  }

  return combinedStream;
};

CombinedStream.isStreamLike = function(stream) {
  return (typeof stream !== 'function')
    && (typeof stream !== 'string')
    && (typeof stream !== 'boolean')
    && (typeof stream !== 'number')
    && (!Buffer.isBuffer(stream));
};

CombinedStream.prototype.append = function(stream) {
  var isStreamLike = CombinedStream.isStreamLike(stream);

  if (isStreamLike) {
    if (!(stream instanceof DelayedStream)) {
      var newStream = DelayedStream.create(stream, {
        maxDataSize: Infinity,
        pauseStream: this.pauseStreams,
      });
      stream.on('data', this._checkDataSize.bind(this));
      stream = newStream;
    }

    this._handleErrors(stream);

    if (this.pauseStreams) {
      stream.pause();
    }
  }

  this._streams.push(stream);
  return this;
};

CombinedStream.prototype.pipe = function(dest, options) {
  Stream.prototype.pipe.call(this, dest, options);
  this.resume();
  return dest;
};

CombinedStream.prototype._getNext = function() {
  this._currentStream = null;

  if (this._insideLoop) {
    this._pendingNext = true;
    return; // defer call
  }

  this._insideLoop = true;
  try {
    do {
      this._pendingNext = false;
      this._realGetNext();
    } while (this._pendingNext);
  } finally {
    this._insideLoop = false;
  }
};

CombinedStream.prototype._realGetNext = function() {
  var stream = this._streams.shift();


  if (typeof stream == 'undefined') {
    this.end();
    return;
  }

  if (typeof stream !== 'function') {
    this._pipeNext(stream);
    return;
  }

  var getStream = stream;
  getStream(function(stream) {
    var isStreamLike = CombinedStream.isStreamLike(stream);
    if (isStreamLike) {
      stream.on('data', this._checkDataSize.bind(this));
      this._handleErrors(stream);
    }

    this._pipeNext(stream);
  }.bind(this));
};

CombinedStream.prototype._pipeNext = function(stream) {
  this._currentStream = stream;

  var isStreamLike = CombinedStream.isStreamLike(stream);
  if (isStreamLike) {
    stream.on('end', this._getNext.bind(this));
    stream.pipe(this, {end: false});
    return;
  }

  var value = stream;
  this.write(value);
  this._getNext();
};

CombinedStream.prototype._handleErrors = function(stream) {
  var self = this;
  stream.on('error', function(err) {
    self._emitError(err);
  });
};

CombinedStream.prototype.write = function(data) {
  this.emit('data', data);
};

CombinedStream.prototype.pause = function() {
  if (!this.pauseStreams) {
    return;
  }

  if(this.pauseStreams && this._currentStream && typeof(this._currentStream.pause) == 'function') this._currentStream.pause();
  this.emit('pause');
};

CombinedStream.prototype.resume = function() {
  if (!this._released) {
    this._released = true;
    this.writable = true;
    this._getNext();
  }

  if(this.pauseStreams && this._currentStream && typeof(this._currentStream.resume) == 'function') this._currentStream.resume();
  this.emit('resume');
};

CombinedStream.prototype.end = function() {
  this._reset();
  this.emit('end');
};

CombinedStream.prototype.destroy = function() {
  this._reset();
  this.emit('close');
};

CombinedStream.prototype._reset = function() {
  this.writable = false;
  this._streams = [];
  this._currentStream = null;
};

CombinedStream.prototype._checkDataSize = function() {
  this._updateDataSize();
  if (this.dataSize <= this.maxDataSize) {
    return;
  }

  var message =
    'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.';
  this._emitError(new Error(message));
};

CombinedStream.prototype._updateDataSize = function() {
  this.dataSize = 0;

  var self = this;
  this._streams.forEach(function(stream) {
    if (!stream.dataSize) {
      return;
    }

    self.dataSize += stream.dataSize;
  });

  if (this._currentStream && this._currentStream.dataSize) {
    this.dataSize += this._currentStream.dataSize;
  }
};

CombinedStream.prototype._emitError = function(err) {
  this._reset();
  this.emit('error', err);
};


/***/ }),

/***/ 52327:
/***/ ((module, exports, __webpack_require__) => {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(60392)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }),

/***/ 60392:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(69842);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ }),

/***/ 17783:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || false === true || process.__nwjs) {
	module.exports = __webpack_require__(52327);
} else {
	module.exports = __webpack_require__(49035);
}


/***/ }),

/***/ 49035:
/***/ ((module, exports, __webpack_require__) => {

/**
 * Module dependencies.
 */

const tty = __webpack_require__(76224);
const util = __webpack_require__(73837);

/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.destroy = util.deprecate(
	() => {},
	'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
);

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = __webpack_require__(35048);

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util.format(...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = __webpack_require__(60392)(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts)
		.split('\n')
		.map(str => str.trim())
		.join(' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util.inspect(v, this.inspectOpts);
};


/***/ }),

/***/ 23154:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stream = (__webpack_require__(12781).Stream);
var util = __webpack_require__(73837);

module.exports = DelayedStream;
function DelayedStream() {
  this.source = null;
  this.dataSize = 0;
  this.maxDataSize = 1024 * 1024;
  this.pauseStream = true;

  this._maxDataSizeExceeded = false;
  this._released = false;
  this._bufferedEvents = [];
}
util.inherits(DelayedStream, Stream);

DelayedStream.create = function(source, options) {
  var delayedStream = new this();

  options = options || {};
  for (var option in options) {
    delayedStream[option] = options[option];
  }

  delayedStream.source = source;

  var realEmit = source.emit;
  source.emit = function() {
    delayedStream._handleEmit(arguments);
    return realEmit.apply(source, arguments);
  };

  source.on('error', function() {});
  if (delayedStream.pauseStream) {
    source.pause();
  }

  return delayedStream;
};

Object.defineProperty(DelayedStream.prototype, 'readable', {
  configurable: true,
  enumerable: true,
  get: function() {
    return this.source.readable;
  }
});

DelayedStream.prototype.setEncoding = function() {
  return this.source.setEncoding.apply(this.source, arguments);
};

DelayedStream.prototype.resume = function() {
  if (!this._released) {
    this.release();
  }

  this.source.resume();
};

DelayedStream.prototype.pause = function() {
  this.source.pause();
};

DelayedStream.prototype.release = function() {
  this._released = true;

  this._bufferedEvents.forEach(function(args) {
    this.emit.apply(this, args);
  }.bind(this));
  this._bufferedEvents = [];
};

DelayedStream.prototype.pipe = function() {
  var r = Stream.prototype.pipe.apply(this, arguments);
  this.resume();
  return r;
};

DelayedStream.prototype._handleEmit = function(args) {
  if (this._released) {
    this.emit.apply(this, args);
    return;
  }

  if (args[0] === 'data') {
    this.dataSize += args[1].length;
    this._checkIfMaxDataSizeExceeded();
  }

  this._bufferedEvents.push(args);
};

DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
  if (this._maxDataSizeExceeded) {
    return;
  }

  if (this.dataSize <= this.maxDataSize) {
    return;
  }

  this._maxDataSizeExceeded = true;
  var message =
    'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.'
  this.emit('error', new Error(message));
};


/***/ }),

/***/ 10361:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var debug;

module.exports = function () {
  if (!debug) {
    try {
      /* eslint global-require: off */
      debug = __webpack_require__(17783)("follow-redirects");
    }
    catch (error) { /* */ }
    if (typeof debug !== "function") {
      debug = function () { /* */ };
    }
  }
  debug.apply(null, arguments);
};


/***/ }),

/***/ 71794:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var url = __webpack_require__(57310);
var URL = url.URL;
var http = __webpack_require__(13685);
var https = __webpack_require__(95687);
var Writable = (__webpack_require__(12781).Writable);
var assert = __webpack_require__(39491);
var debug = __webpack_require__(10361);

// Create handlers that pass events from native requests
var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
var eventHandlers = Object.create(null);
events.forEach(function (event) {
  eventHandlers[event] = function (arg1, arg2, arg3) {
    this._redirectable.emit(event, arg1, arg2, arg3);
  };
});

var InvalidUrlError = createErrorType(
  "ERR_INVALID_URL",
  "Invalid URL",
  TypeError
);
// Error types with codes
var RedirectionError = createErrorType(
  "ERR_FR_REDIRECTION_FAILURE",
  "Redirected request failed"
);
var TooManyRedirectsError = createErrorType(
  "ERR_FR_TOO_MANY_REDIRECTS",
  "Maximum number of redirects exceeded"
);
var MaxBodyLengthExceededError = createErrorType(
  "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
  "Request body larger than maxBodyLength limit"
);
var WriteAfterEndError = createErrorType(
  "ERR_STREAM_WRITE_AFTER_END",
  "write after end"
);

// istanbul ignore next
var destroy = Writable.prototype.destroy || noop;

// An HTTP(S) request that can be redirected
function RedirectableRequest(options, responseCallback) {
  // Initialize the request
  Writable.call(this);
  this._sanitizeOptions(options);
  this._options = options;
  this._ended = false;
  this._ending = false;
  this._redirectCount = 0;
  this._redirects = [];
  this._requestBodyLength = 0;
  this._requestBodyBuffers = [];

  // Attach a callback if passed
  if (responseCallback) {
    this.on("response", responseCallback);
  }

  // React to responses of native requests
  var self = this;
  this._onNativeResponse = function (response) {
    self._processResponse(response);
  };

  // Perform the first request
  this._performRequest();
}
RedirectableRequest.prototype = Object.create(Writable.prototype);

RedirectableRequest.prototype.abort = function () {
  destroyRequest(this._currentRequest);
  this._currentRequest.abort();
  this.emit("abort");
};

RedirectableRequest.prototype.destroy = function (error) {
  destroyRequest(this._currentRequest, error);
  destroy.call(this, error);
  return this;
};

// Writes buffered data to the current native request
RedirectableRequest.prototype.write = function (data, encoding, callback) {
  // Writing is not allowed if end has been called
  if (this._ending) {
    throw new WriteAfterEndError();
  }

  // Validate input and shift parameters if necessary
  if (!isString(data) && !isBuffer(data)) {
    throw new TypeError("data should be a string, Buffer or Uint8Array");
  }
  if (isFunction(encoding)) {
    callback = encoding;
    encoding = null;
  }

  // Ignore empty buffers, since writing them doesn't invoke the callback
  // https://github.com/nodejs/node/issues/22066
  if (data.length === 0) {
    if (callback) {
      callback();
    }
    return;
  }
  // Only write when we don't exceed the maximum body length
  if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
    this._requestBodyLength += data.length;
    this._requestBodyBuffers.push({ data: data, encoding: encoding });
    this._currentRequest.write(data, encoding, callback);
  }
  // Error when we exceed the maximum body length
  else {
    this.emit("error", new MaxBodyLengthExceededError());
    this.abort();
  }
};

// Ends the current native request
RedirectableRequest.prototype.end = function (data, encoding, callback) {
  // Shift parameters if necessary
  if (isFunction(data)) {
    callback = data;
    data = encoding = null;
  }
  else if (isFunction(encoding)) {
    callback = encoding;
    encoding = null;
  }

  // Write data if needed and end
  if (!data) {
    this._ended = this._ending = true;
    this._currentRequest.end(null, null, callback);
  }
  else {
    var self = this;
    var currentRequest = this._currentRequest;
    this.write(data, encoding, function () {
      self._ended = true;
      currentRequest.end(null, null, callback);
    });
    this._ending = true;
  }
};

// Sets a header value on the current native request
RedirectableRequest.prototype.setHeader = function (name, value) {
  this._options.headers[name] = value;
  this._currentRequest.setHeader(name, value);
};

// Clears a header value on the current native request
RedirectableRequest.prototype.removeHeader = function (name) {
  delete this._options.headers[name];
  this._currentRequest.removeHeader(name);
};

// Global timeout for all underlying requests
RedirectableRequest.prototype.setTimeout = function (msecs, callback) {
  var self = this;

  // Destroys the socket on timeout
  function destroyOnTimeout(socket) {
    socket.setTimeout(msecs);
    socket.removeListener("timeout", socket.destroy);
    socket.addListener("timeout", socket.destroy);
  }

  // Sets up a timer to trigger a timeout event
  function startTimer(socket) {
    if (self._timeout) {
      clearTimeout(self._timeout);
    }
    self._timeout = setTimeout(function () {
      self.emit("timeout");
      clearTimer();
    }, msecs);
    destroyOnTimeout(socket);
  }

  // Stops a timeout from triggering
  function clearTimer() {
    // Clear the timeout
    if (self._timeout) {
      clearTimeout(self._timeout);
      self._timeout = null;
    }

    // Clean up all attached listeners
    self.removeListener("abort", clearTimer);
    self.removeListener("error", clearTimer);
    self.removeListener("response", clearTimer);
    self.removeListener("close", clearTimer);
    if (callback) {
      self.removeListener("timeout", callback);
    }
    if (!self.socket) {
      self._currentRequest.removeListener("socket", startTimer);
    }
  }

  // Attach callback if passed
  if (callback) {
    this.on("timeout", callback);
  }

  // Start the timer if or when the socket is opened
  if (this.socket) {
    startTimer(this.socket);
  }
  else {
    this._currentRequest.once("socket", startTimer);
  }

  // Clean up on events
  this.on("socket", destroyOnTimeout);
  this.on("abort", clearTimer);
  this.on("error", clearTimer);
  this.on("response", clearTimer);
  this.on("close", clearTimer);

  return this;
};

// Proxy all other public ClientRequest methods
[
  "flushHeaders", "getHeader",
  "setNoDelay", "setSocketKeepAlive",
].forEach(function (method) {
  RedirectableRequest.prototype[method] = function (a, b) {
    return this._currentRequest[method](a, b);
  };
});

// Proxy all public ClientRequest properties
["aborted", "connection", "socket"].forEach(function (property) {
  Object.defineProperty(RedirectableRequest.prototype, property, {
    get: function () { return this._currentRequest[property]; },
  });
});

RedirectableRequest.prototype._sanitizeOptions = function (options) {
  // Ensure headers are always present
  if (!options.headers) {
    options.headers = {};
  }

  // Since http.request treats host as an alias of hostname,
  // but the url module interprets host as hostname plus port,
  // eliminate the host property to avoid confusion.
  if (options.host) {
    // Use hostname if set, because it has precedence
    if (!options.hostname) {
      options.hostname = options.host;
    }
    delete options.host;
  }

  // Complete the URL object when necessary
  if (!options.pathname && options.path) {
    var searchPos = options.path.indexOf("?");
    if (searchPos < 0) {
      options.pathname = options.path;
    }
    else {
      options.pathname = options.path.substring(0, searchPos);
      options.search = options.path.substring(searchPos);
    }
  }
};


// Executes the next native request (initial or redirect)
RedirectableRequest.prototype._performRequest = function () {
  // Load the native protocol
  var protocol = this._options.protocol;
  var nativeProtocol = this._options.nativeProtocols[protocol];
  if (!nativeProtocol) {
    this.emit("error", new TypeError("Unsupported protocol " + protocol));
    return;
  }

  // If specified, use the agent corresponding to the protocol
  // (HTTP and HTTPS use different types of agents)
  if (this._options.agents) {
    var scheme = protocol.slice(0, -1);
    this._options.agent = this._options.agents[scheme];
  }

  // Create the native request and set up its event handlers
  var request = this._currentRequest =
        nativeProtocol.request(this._options, this._onNativeResponse);
  request._redirectable = this;
  for (var event of events) {
    request.on(event, eventHandlers[event]);
  }

  // RFC7230§5.3.1: When making a request directly to an origin server, […]
  // a client MUST send only the absolute path […] as the request-target.
  this._currentUrl = /^\//.test(this._options.path) ?
    url.format(this._options) :
    // When making a request to a proxy, […]
    // a client MUST send the target URI in absolute-form […].
    this._options.path;

  // End a redirected request
  // (The first request must be ended explicitly with RedirectableRequest#end)
  if (this._isRedirect) {
    // Write the request entity and end
    var i = 0;
    var self = this;
    var buffers = this._requestBodyBuffers;
    (function writeNext(error) {
      // Only write if this request has not been redirected yet
      /* istanbul ignore else */
      if (request === self._currentRequest) {
        // Report any write errors
        /* istanbul ignore if */
        if (error) {
          self.emit("error", error);
        }
        // Write the next buffer if there are still left
        else if (i < buffers.length) {
          var buffer = buffers[i++];
          /* istanbul ignore else */
          if (!request.finished) {
            request.write(buffer.data, buffer.encoding, writeNext);
          }
        }
        // End the request if `end` has been called on us
        else if (self._ended) {
          request.end();
        }
      }
    }());
  }
};

// Processes a response from the current native request
RedirectableRequest.prototype._processResponse = function (response) {
  // Store the redirected response
  var statusCode = response.statusCode;
  if (this._options.trackRedirects) {
    this._redirects.push({
      url: this._currentUrl,
      headers: response.headers,
      statusCode: statusCode,
    });
  }

  // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
  // that further action needs to be taken by the user agent in order to
  // fulfill the request. If a Location header field is provided,
  // the user agent MAY automatically redirect its request to the URI
  // referenced by the Location field value,
  // even if the specific status code is not understood.

  // If the response is not a redirect; return it as-is
  var location = response.headers.location;
  if (!location || this._options.followRedirects === false ||
      statusCode < 300 || statusCode >= 400) {
    response.responseUrl = this._currentUrl;
    response.redirects = this._redirects;
    this.emit("response", response);

    // Clean up
    this._requestBodyBuffers = [];
    return;
  }

  // The response is a redirect, so abort the current request
  destroyRequest(this._currentRequest);
  // Discard the remainder of the response to avoid waiting for data
  response.destroy();

  // RFC7231§6.4: A client SHOULD detect and intervene
  // in cyclical redirections (i.e., "infinite" redirection loops).
  if (++this._redirectCount > this._options.maxRedirects) {
    this.emit("error", new TooManyRedirectsError());
    return;
  }

  // Store the request headers if applicable
  var requestHeaders;
  var beforeRedirect = this._options.beforeRedirect;
  if (beforeRedirect) {
    requestHeaders = Object.assign({
      // The Host header was set by nativeProtocol.request
      Host: response.req.getHeader("host"),
    }, this._options.headers);
  }

  // RFC7231§6.4: Automatic redirection needs to done with
  // care for methods not known to be safe, […]
  // RFC7231§6.4.2–3: For historical reasons, a user agent MAY change
  // the request method from POST to GET for the subsequent request.
  var method = this._options.method;
  if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" ||
      // RFC7231§6.4.4: The 303 (See Other) status code indicates that
      // the server is redirecting the user agent to a different resource […]
      // A user agent can perform a retrieval request targeting that URI
      // (a GET or HEAD request if using HTTP) […]
      (statusCode === 303) && !/^(?:GET|HEAD)$/.test(this._options.method)) {
    this._options.method = "GET";
    // Drop a possible entity and headers related to it
    this._requestBodyBuffers = [];
    removeMatchingHeaders(/^content-/i, this._options.headers);
  }

  // Drop the Host header, as the redirect might lead to a different host
  var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);

  // If the redirect is relative, carry over the host of the last request
  var currentUrlParts = url.parse(this._currentUrl);
  var currentHost = currentHostHeader || currentUrlParts.host;
  var currentUrl = /^\w+:/.test(location) ? this._currentUrl :
    url.format(Object.assign(currentUrlParts, { host: currentHost }));

  // Determine the URL of the redirection
  var redirectUrl;
  try {
    redirectUrl = url.resolve(currentUrl, location);
  }
  catch (cause) {
    this.emit("error", new RedirectionError({ cause: cause }));
    return;
  }

  // Create the redirected request
  debug("redirecting to", redirectUrl);
  this._isRedirect = true;
  var redirectUrlParts = url.parse(redirectUrl);
  Object.assign(this._options, redirectUrlParts);

  // Drop confidential headers when redirecting to a less secure protocol
  // or to a different domain that is not a superdomain
  if (redirectUrlParts.protocol !== currentUrlParts.protocol &&
     redirectUrlParts.protocol !== "https:" ||
     redirectUrlParts.host !== currentHost &&
     !isSubdomain(redirectUrlParts.host, currentHost)) {
    removeMatchingHeaders(/^(?:authorization|cookie)$/i, this._options.headers);
  }

  // Evaluate the beforeRedirect callback
  if (isFunction(beforeRedirect)) {
    var responseDetails = {
      headers: response.headers,
      statusCode: statusCode,
    };
    var requestDetails = {
      url: currentUrl,
      method: method,
      headers: requestHeaders,
    };
    try {
      beforeRedirect(this._options, responseDetails, requestDetails);
    }
    catch (err) {
      this.emit("error", err);
      return;
    }
    this._sanitizeOptions(this._options);
  }

  // Perform the redirected request
  try {
    this._performRequest();
  }
  catch (cause) {
    this.emit("error", new RedirectionError({ cause: cause }));
  }
};

// Wraps the key/value object of protocols with redirect functionality
function wrap(protocols) {
  // Default settings
  var exports = {
    maxRedirects: 21,
    maxBodyLength: 10 * 1024 * 1024,
  };

  // Wrap each protocol
  var nativeProtocols = {};
  Object.keys(protocols).forEach(function (scheme) {
    var protocol = scheme + ":";
    var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
    var wrappedProtocol = exports[scheme] = Object.create(nativeProtocol);

    // Executes a request, following redirects
    function request(input, options, callback) {
      // Parse parameters
      if (isString(input)) {
        var parsed;
        try {
          parsed = urlToOptions(new URL(input));
        }
        catch (err) {
          /* istanbul ignore next */
          parsed = url.parse(input);
        }
        if (!isString(parsed.protocol)) {
          throw new InvalidUrlError({ input });
        }
        input = parsed;
      }
      else if (URL && (input instanceof URL)) {
        input = urlToOptions(input);
      }
      else {
        callback = options;
        options = input;
        input = { protocol: protocol };
      }
      if (isFunction(options)) {
        callback = options;
        options = null;
      }

      // Set defaults
      options = Object.assign({
        maxRedirects: exports.maxRedirects,
        maxBodyLength: exports.maxBodyLength,
      }, input, options);
      options.nativeProtocols = nativeProtocols;
      if (!isString(options.host) && !isString(options.hostname)) {
        options.hostname = "::1";
      }

      assert.equal(options.protocol, protocol, "protocol mismatch");
      debug("options", options);
      return new RedirectableRequest(options, callback);
    }

    // Executes a GET request, following redirects
    function get(input, options, callback) {
      var wrappedRequest = wrappedProtocol.request(input, options, callback);
      wrappedRequest.end();
      return wrappedRequest;
    }

    // Expose the properties on the wrapped protocol
    Object.defineProperties(wrappedProtocol, {
      request: { value: request, configurable: true, enumerable: true, writable: true },
      get: { value: get, configurable: true, enumerable: true, writable: true },
    });
  });
  return exports;
}

/* istanbul ignore next */
function noop() { /* empty */ }

// from https://github.com/nodejs/node/blob/master/lib/internal/url.js
function urlToOptions(urlObject) {
  var options = {
    protocol: urlObject.protocol,
    hostname: urlObject.hostname.startsWith("[") ?
      /* istanbul ignore next */
      urlObject.hostname.slice(1, -1) :
      urlObject.hostname,
    hash: urlObject.hash,
    search: urlObject.search,
    pathname: urlObject.pathname,
    path: urlObject.pathname + urlObject.search,
    href: urlObject.href,
  };
  if (urlObject.port !== "") {
    options.port = Number(urlObject.port);
  }
  return options;
}

function removeMatchingHeaders(regex, headers) {
  var lastValue;
  for (var header in headers) {
    if (regex.test(header)) {
      lastValue = headers[header];
      delete headers[header];
    }
  }
  return (lastValue === null || typeof lastValue === "undefined") ?
    undefined : String(lastValue).trim();
}

function createErrorType(code, message, baseClass) {
  // Create constructor
  function CustomError(properties) {
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, properties || {});
    this.code = code;
    this.message = this.cause ? message + ": " + this.cause.message : message;
  }

  // Attach constructor and set default properties
  CustomError.prototype = new (baseClass || Error)();
  CustomError.prototype.constructor = CustomError;
  CustomError.prototype.name = "Error [" + code + "]";
  return CustomError;
}

function destroyRequest(request, error) {
  for (var event of events) {
    request.removeListener(event, eventHandlers[event]);
  }
  request.on("error", noop);
  request.destroy(error);
}

function isSubdomain(subdomain, domain) {
  assert(isString(subdomain) && isString(domain));
  var dot = subdomain.length - domain.length - 1;
  return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
}

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

function isFunction(value) {
  return typeof value === "function";
}

function isBuffer(value) {
  return typeof value === "object" && ("length" in value);
}

// Exports
module.exports = wrap({ http: http, https: https });
module.exports.wrap = wrap;


/***/ }),

/***/ 20054:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var CombinedStream = __webpack_require__(97143);
var util = __webpack_require__(73837);
var path = __webpack_require__(71017);
var http = __webpack_require__(13685);
var https = __webpack_require__(95687);
var parseUrl = (__webpack_require__(57310).parse);
var fs = __webpack_require__(57147);
var Stream = (__webpack_require__(12781).Stream);
var mime = __webpack_require__(32994);
var asynckit = __webpack_require__(52353);
var populate = __webpack_require__(13024);

// Public API
module.exports = FormData;

// make it a Stream
util.inherits(FormData, CombinedStream);

/**
 * Create readable "multipart/form-data" streams.
 * Can be used to submit forms
 * and file uploads to other web applications.
 *
 * @constructor
 * @param {Object} options - Properties to be added/overriden for FormData and CombinedStream
 */
function FormData(options) {
  if (!(this instanceof FormData)) {
    return new FormData(options);
  }

  this._overheadLength = 0;
  this._valueLength = 0;
  this._valuesToMeasure = [];

  CombinedStream.call(this);

  options = options || {};
  for (var option in options) {
    this[option] = options[option];
  }
}

FormData.LINE_BREAK = '\r\n';
FormData.DEFAULT_CONTENT_TYPE = 'application/octet-stream';

FormData.prototype.append = function(field, value, options) {

  options = options || {};

  // allow filename as single option
  if (typeof options == 'string') {
    options = {filename: options};
  }

  var append = CombinedStream.prototype.append.bind(this);

  // all that streamy business can't handle numbers
  if (typeof value == 'number') {
    value = '' + value;
  }

  // https://github.com/felixge/node-form-data/issues/38
  if (util.isArray(value)) {
    // Please convert your array into string
    // the way web server expects it
    this._error(new Error('Arrays are not supported.'));
    return;
  }

  var header = this._multiPartHeader(field, value, options);
  var footer = this._multiPartFooter();

  append(header);
  append(value);
  append(footer);

  // pass along options.knownLength
  this._trackLength(header, value, options);
};

FormData.prototype._trackLength = function(header, value, options) {
  var valueLength = 0;

  // used w/ getLengthSync(), when length is known.
  // e.g. for streaming directly from a remote server,
  // w/ a known file a size, and not wanting to wait for
  // incoming file to finish to get its size.
  if (options.knownLength != null) {
    valueLength += +options.knownLength;
  } else if (Buffer.isBuffer(value)) {
    valueLength = value.length;
  } else if (typeof value === 'string') {
    valueLength = Buffer.byteLength(value);
  }

  this._valueLength += valueLength;

  // @check why add CRLF? does this account for custom/multiple CRLFs?
  this._overheadLength +=
    Buffer.byteLength(header) +
    FormData.LINE_BREAK.length;

  // empty or either doesn't have path or not an http response or not a stream
  if (!value || ( !value.path && !(value.readable && value.hasOwnProperty('httpVersion')) && !(value instanceof Stream))) {
    return;
  }

  // no need to bother with the length
  if (!options.knownLength) {
    this._valuesToMeasure.push(value);
  }
};

FormData.prototype._lengthRetriever = function(value, callback) {

  if (value.hasOwnProperty('fd')) {

    // take read range into a account
    // `end` = Infinity –> read file till the end
    //
    // TODO: Looks like there is bug in Node fs.createReadStream
    // it doesn't respect `end` options without `start` options
    // Fix it when node fixes it.
    // https://github.com/joyent/node/issues/7819
    if (value.end != undefined && value.end != Infinity && value.start != undefined) {

      // when end specified
      // no need to calculate range
      // inclusive, starts with 0
      callback(null, value.end + 1 - (value.start ? value.start : 0));

    // not that fast snoopy
    } else {
      // still need to fetch file size from fs
      fs.stat(value.path, function(err, stat) {

        var fileSize;

        if (err) {
          callback(err);
          return;
        }

        // update final size based on the range options
        fileSize = stat.size - (value.start ? value.start : 0);
        callback(null, fileSize);
      });
    }

  // or http response
  } else if (value.hasOwnProperty('httpVersion')) {
    callback(null, +value.headers['content-length']);

  // or request stream http://github.com/mikeal/request
  } else if (value.hasOwnProperty('httpModule')) {
    // wait till response come back
    value.on('response', function(response) {
      value.pause();
      callback(null, +response.headers['content-length']);
    });
    value.resume();

  // something else
  } else {
    callback('Unknown stream');
  }
};

FormData.prototype._multiPartHeader = function(field, value, options) {
  // custom header specified (as string)?
  // it becomes responsible for boundary
  // (e.g. to handle extra CRLFs on .NET servers)
  if (typeof options.header == 'string') {
    return options.header;
  }

  var contentDisposition = this._getContentDisposition(value, options);
  var contentType = this._getContentType(value, options);

  var contents = '';
  var headers  = {
    // add custom disposition as third element or keep it two elements if not
    'Content-Disposition': ['form-data', 'name="' + field + '"'].concat(contentDisposition || []),
    // if no content type. allow it to be empty array
    'Content-Type': [].concat(contentType || [])
  };

  // allow custom headers.
  if (typeof options.header == 'object') {
    populate(headers, options.header);
  }

  var header;
  for (var prop in headers) {
    if (!headers.hasOwnProperty(prop)) continue;
    header = headers[prop];

    // skip nullish headers.
    if (header == null) {
      continue;
    }

    // convert all headers to arrays.
    if (!Array.isArray(header)) {
      header = [header];
    }

    // add non-empty headers.
    if (header.length) {
      contents += prop + ': ' + header.join('; ') + FormData.LINE_BREAK;
    }
  }

  return '--' + this.getBoundary() + FormData.LINE_BREAK + contents + FormData.LINE_BREAK;
};

FormData.prototype._getContentDisposition = function(value, options) {

  var filename
    , contentDisposition
    ;

  if (typeof options.filepath === 'string') {
    // custom filepath for relative paths
    filename = path.normalize(options.filepath).replace(/\\/g, '/');
  } else if (options.filename || value.name || value.path) {
    // custom filename take precedence
    // formidable and the browser add a name property
    // fs- and request- streams have path property
    filename = path.basename(options.filename || value.name || value.path);
  } else if (value.readable && value.hasOwnProperty('httpVersion')) {
    // or try http response
    filename = path.basename(value.client._httpMessage.path || '');
  }

  if (filename) {
    contentDisposition = 'filename="' + filename + '"';
  }

  return contentDisposition;
};

FormData.prototype._getContentType = function(value, options) {

  // use custom content-type above all
  var contentType = options.contentType;

  // or try `name` from formidable, browser
  if (!contentType && value.name) {
    contentType = mime.lookup(value.name);
  }

  // or try `path` from fs-, request- streams
  if (!contentType && value.path) {
    contentType = mime.lookup(value.path);
  }

  // or if it's http-reponse
  if (!contentType && value.readable && value.hasOwnProperty('httpVersion')) {
    contentType = value.headers['content-type'];
  }

  // or guess it from the filepath or filename
  if (!contentType && (options.filepath || options.filename)) {
    contentType = mime.lookup(options.filepath || options.filename);
  }

  // fallback to the default content type if `value` is not simple value
  if (!contentType && typeof value == 'object') {
    contentType = FormData.DEFAULT_CONTENT_TYPE;
  }

  return contentType;
};

FormData.prototype._multiPartFooter = function() {
  return function(next) {
    var footer = FormData.LINE_BREAK;

    var lastPart = (this._streams.length === 0);
    if (lastPart) {
      footer += this._lastBoundary();
    }

    next(footer);
  }.bind(this);
};

FormData.prototype._lastBoundary = function() {
  return '--' + this.getBoundary() + '--' + FormData.LINE_BREAK;
};

FormData.prototype.getHeaders = function(userHeaders) {
  var header;
  var formHeaders = {
    'content-type': 'multipart/form-data; boundary=' + this.getBoundary()
  };

  for (header in userHeaders) {
    if (userHeaders.hasOwnProperty(header)) {
      formHeaders[header.toLowerCase()] = userHeaders[header];
    }
  }

  return formHeaders;
};

FormData.prototype.setBoundary = function(boundary) {
  this._boundary = boundary;
};

FormData.prototype.getBoundary = function() {
  if (!this._boundary) {
    this._generateBoundary();
  }

  return this._boundary;
};

FormData.prototype.getBuffer = function() {
  var dataBuffer = new Buffer.alloc( 0 );
  var boundary = this.getBoundary();

  // Create the form content. Add Line breaks to the end of data.
  for (var i = 0, len = this._streams.length; i < len; i++) {
    if (typeof this._streams[i] !== 'function') {

      // Add content to the buffer.
      if(Buffer.isBuffer(this._streams[i])) {
        dataBuffer = Buffer.concat( [dataBuffer, this._streams[i]]);
      }else {
        dataBuffer = Buffer.concat( [dataBuffer, Buffer.from(this._streams[i])]);
      }

      // Add break after content.
      if (typeof this._streams[i] !== 'string' || this._streams[i].substring( 2, boundary.length + 2 ) !== boundary) {
        dataBuffer = Buffer.concat( [dataBuffer, Buffer.from(FormData.LINE_BREAK)] );
      }
    }
  }

  // Add the footer and return the Buffer object.
  return Buffer.concat( [dataBuffer, Buffer.from(this._lastBoundary())] );
};

FormData.prototype._generateBoundary = function() {
  // This generates a 50 character boundary similar to those used by Firefox.
  // They are optimized for boyer-moore parsing.
  var boundary = '--------------------------';
  for (var i = 0; i < 24; i++) {
    boundary += Math.floor(Math.random() * 10).toString(16);
  }

  this._boundary = boundary;
};

// Note: getLengthSync DOESN'T calculate streams length
// As workaround one can calculate file size manually
// and add it as knownLength option
FormData.prototype.getLengthSync = function() {
  var knownLength = this._overheadLength + this._valueLength;

  // Don't get confused, there are 3 "internal" streams for each keyval pair
  // so it basically checks if there is any value added to the form
  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }

  // https://github.com/form-data/form-data/issues/40
  if (!this.hasKnownLength()) {
    // Some async length retrievers are present
    // therefore synchronous length calculation is false.
    // Please use getLength(callback) to get proper length
    this._error(new Error('Cannot calculate proper length in synchronous way.'));
  }

  return knownLength;
};

// Public API to check if length of added values is known
// https://github.com/form-data/form-data/issues/196
// https://github.com/form-data/form-data/issues/262
FormData.prototype.hasKnownLength = function() {
  var hasKnownLength = true;

  if (this._valuesToMeasure.length) {
    hasKnownLength = false;
  }

  return hasKnownLength;
};

FormData.prototype.getLength = function(cb) {
  var knownLength = this._overheadLength + this._valueLength;

  if (this._streams.length) {
    knownLength += this._lastBoundary().length;
  }

  if (!this._valuesToMeasure.length) {
    process.nextTick(cb.bind(this, null, knownLength));
    return;
  }

  asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function(err, values) {
    if (err) {
      cb(err);
      return;
    }

    values.forEach(function(length) {
      knownLength += length;
    });

    cb(null, knownLength);
  });
};

FormData.prototype.submit = function(params, cb) {
  var request
    , options
    , defaults = {method: 'post'}
    ;

  // parse provided url if it's string
  // or treat it as options object
  if (typeof params == 'string') {

    params = parseUrl(params);
    options = populate({
      port: params.port,
      path: params.pathname,
      host: params.hostname,
      protocol: params.protocol
    }, defaults);

  // use custom params
  } else {

    options = populate(params, defaults);
    // if no port provided use default one
    if (!options.port) {
      options.port = options.protocol == 'https:' ? 443 : 80;
    }
  }

  // put that good code in getHeaders to some use
  options.headers = this.getHeaders(params.headers);

  // https if specified, fallback to http in any other case
  if (options.protocol == 'https:') {
    request = https.request(options);
  } else {
    request = http.request(options);
  }

  // get content length and fire away
  this.getLength(function(err, length) {
    if (err && err !== 'Unknown stream') {
      this._error(err);
      return;
    }

    // add content length
    if (length) {
      request.setHeader('Content-Length', length);
    }

    this.pipe(request);
    if (cb) {
      var onResponse;

      var callback = function (error, responce) {
        request.removeListener('error', callback);
        request.removeListener('response', onResponse);

        return cb.call(this, error, responce);
      };

      onResponse = callback.bind(this, null);

      request.on('error', callback);
      request.on('response', onResponse);
    }
  }.bind(this));

  return request;
};

FormData.prototype._error = function(err) {
  if (!this.error) {
    this.error = err;
    this.pause();
    this.emit('error', err);
  }
};

FormData.prototype.toString = function () {
  return '[object FormData]';
};


/***/ }),

/***/ 13024:
/***/ ((module) => {

// populates missing values
module.exports = function(dst, src) {

  Object.keys(src).forEach(function(prop)
  {
    dst[prop] = dst[prop] || src[prop];
  });

  return dst;
};


/***/ }),

/***/ 36461:
/***/ ((module) => {

"use strict";

module.exports = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};


/***/ }),

/***/ 97024:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = __webpack_require__(40572)


/***/ }),

/***/ 32994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * Module dependencies.
 * @private
 */

var db = __webpack_require__(97024)
var extname = (__webpack_require__(71017).extname)

/**
 * Module variables.
 * @private
 */

var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/
var TEXT_TYPE_REGEXP = /^text\//i

/**
 * Module exports.
 * @public
 */

exports.charset = charset
exports.charsets = { lookup: charset }
exports.contentType = contentType
exports.extension = extension
exports.extensions = Object.create(null)
exports.lookup = lookup
exports.types = Object.create(null)

// Populate the extensions/types maps
populateMaps(exports.extensions, exports.types)

/**
 * Get the default charset for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function charset (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)
  var mime = match && db[match[1].toLowerCase()]

  if (mime && mime.charset) {
    return mime.charset
  }

  // default text/* to utf-8
  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
    return 'UTF-8'
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 *
 * @param {string} str
 * @return {boolean|string}
 */

function contentType (str) {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  var mime = str.indexOf('/') === -1
    ? exports.lookup(str)
    : str

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (mime.indexOf('charset') === -1) {
    var charset = exports.charset(mime)
    if (charset) mime += '; charset=' + charset.toLowerCase()
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function extension (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)

  // get extensions
  var exts = match && exports.extensions[match[1].toLowerCase()]

  if (!exts || !exts.length) {
    return false
  }

  return exts[0]
}

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */

function lookup (path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  var extension = extname('x.' + path)
    .toLowerCase()
    .substr(1)

  if (!extension) {
    return false
  }

  return exports.types[extension] || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps (extensions, types) {
  // source preference (least -> most)
  var preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType (type) {
    var mime = db[type]
    var exts = mime.extensions

    if (!exts || !exts.length) {
      return
    }

    // mime -> extensions
    extensions[type] = exts

    // extension -> mime
    for (var i = 0; i < exts.length; i++) {
      var extension = exts[i]

      if (types[extension]) {
        var from = preference.indexOf(db[types[extension]].source)
        var to = preference.indexOf(mime.source)

        if (types[extension] !== 'application/octet-stream' &&
          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime
      types[extension] = type
    }
  })
}


/***/ }),

/***/ 69842:
/***/ ((module) => {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ 5670:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var parseUrl = (__webpack_require__(57310).parse);

var DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

var stringEndsWith = String.prototype.endsWith || function(s) {
  return s.length <= this.length &&
    this.indexOf(s, this.length - s.length) !== -1;
};

/**
 * @param {string|object} url - The URL, or the result from url.parse.
 * @return {string} The URL of the proxy that should handle the request to the
 *  given URL. If no proxy is set, this will be an empty string.
 */
function getProxyForUrl(url) {
  var parsedUrl = typeof url === 'string' ? parseUrl(url) : url || {};
  var proto = parsedUrl.protocol;
  var hostname = parsedUrl.host;
  var port = parsedUrl.port;
  if (typeof hostname !== 'string' || !hostname || typeof proto !== 'string') {
    return '';  // Don't proxy URLs without a valid scheme or host.
  }

  proto = proto.split(':', 1)[0];
  // Stripping ports in this way instead of using parsedUrl.hostname to make
  // sure that the brackets around IPv6 addresses are kept.
  hostname = hostname.replace(/:\d*$/, '');
  port = parseInt(port) || DEFAULT_PORTS[proto] || 0;
  if (!shouldProxy(hostname, port)) {
    return '';  // Don't proxy URLs that match NO_PROXY.
  }

  var proxy =
    getEnv('npm_config_' + proto + '_proxy') ||
    getEnv(proto + '_proxy') ||
    getEnv('npm_config_proxy') ||
    getEnv('all_proxy');
  if (proxy && proxy.indexOf('://') === -1) {
    // Missing scheme in proxy, default to the requested URL's scheme.
    proxy = proto + '://' + proxy;
  }
  return proxy;
}

/**
 * Determines whether a given URL should be proxied.
 *
 * @param {string} hostname - The host name of the URL.
 * @param {number} port - The effective port of the URL.
 * @returns {boolean} Whether the given URL should be proxied.
 * @private
 */
function shouldProxy(hostname, port) {
  var NO_PROXY =
    (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();
  if (!NO_PROXY) {
    return true;  // Always proxy if NO_PROXY is not set.
  }
  if (NO_PROXY === '*') {
    return false;  // Never proxy if wildcard is set.
  }

  return NO_PROXY.split(/[,\s]/).every(function(proxy) {
    if (!proxy) {
      return true;  // Skip zero-length hosts.
    }
    var parsedProxy = proxy.match(/^(.+):(\d+)$/);
    var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
    if (parsedProxyPort && parsedProxyPort !== port) {
      return true;  // Skip if ports don't match.
    }

    if (!/^[.*]/.test(parsedProxyHostname)) {
      // No wildcards, so stop proxying if there is an exact match.
      return hostname !== parsedProxyHostname;
    }

    if (parsedProxyHostname.charAt(0) === '*') {
      // Remove leading wildcard.
      parsedProxyHostname = parsedProxyHostname.slice(1);
    }
    // Stop proxying if the hostname ends with the no_proxy host.
    return !stringEndsWith.call(hostname, parsedProxyHostname);
  });
}

/**
 * Get the value for an environment variable.
 *
 * @param {string} key - The name of the environment variable.
 * @return {string} The value of the environment variable.
 * @private
 */
function getEnv(key) {
  return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
}

exports.j = getProxyForUrl;


/***/ }),

/***/ 35048:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(22037);
const hasFlag = __webpack_require__(36461);

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

module.exports = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};


/***/ }),

/***/ 41668:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var e=__webpack_require__(18038);function h(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}var k="function"===typeof Object.is?Object.is:h,l=e.useState,m=e.useEffect,n=e.useLayoutEffect,p=e.useDebugValue;function q(a,b){var d=b(),f=l({inst:{value:d,getSnapshot:b}}),c=f[0].inst,g=f[1];n(function(){c.value=d;c.getSnapshot=b;r(c)&&g({inst:c})},[a,d,b]);m(function(){r(c)&&g({inst:c});return a(function(){r(c)&&g({inst:c})})},[a]);p(d);return d}
function r(a){var b=a.getSnapshot;a=a.value;try{var d=b();return!k(a,d)}catch(f){return!0}}function t(a,b){return b()}var u="undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement?t:q;exports.useSyncExternalStore=void 0!==e.useSyncExternalStore?e.useSyncExternalStore:u;


/***/ }),

/***/ 61928:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


if (true) {
  module.exports = __webpack_require__(41668);
} else {}


/***/ }),

/***/ 75101:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  a: () => (/* binding */ useQuery)
});

// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/lib/utils.mjs
var utils = __webpack_require__(29520);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/lib/notifyManager.mjs
var notifyManager = __webpack_require__(48818);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/lib/focusManager.mjs
var focusManager = __webpack_require__(236);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/lib/subscribable.mjs
var subscribable = __webpack_require__(80834);
// EXTERNAL MODULE: ./node_modules/@tanstack/query-core/build/lib/retryer.mjs
var retryer = __webpack_require__(42306);
;// CONCATENATED MODULE: ./node_modules/@tanstack/query-core/build/lib/queryObserver.mjs






class QueryObserver extends subscribable/* Subscribable */.l {
  constructor(client, options) {
    super();
    this.client = client;
    this.options = options;
    this.trackedProps = new Set();
    this.selectError = null;
    this.bindMethods();
    this.setOptions(options);
  }

  bindMethods() {
    this.remove = this.remove.bind(this);
    this.refetch = this.refetch.bind(this);
  }

  onSubscribe() {
    if (this.listeners.size === 1) {
      this.currentQuery.addObserver(this);

      if (shouldFetchOnMount(this.currentQuery, this.options)) {
        this.executeFetch();
      }

      this.updateTimers();
    }
  }

  onUnsubscribe() {
    if (!this.hasListeners()) {
      this.destroy();
    }
  }

  shouldFetchOnReconnect() {
    return shouldFetchOn(this.currentQuery, this.options, this.options.refetchOnReconnect);
  }

  shouldFetchOnWindowFocus() {
    return shouldFetchOn(this.currentQuery, this.options, this.options.refetchOnWindowFocus);
  }

  destroy() {
    this.listeners = new Set();
    this.clearStaleTimeout();
    this.clearRefetchInterval();
    this.currentQuery.removeObserver(this);
  }

  setOptions(options, notifyOptions) {
    const prevOptions = this.options;
    const prevQuery = this.currentQuery;
    this.options = this.client.defaultQueryOptions(options);

    if (false) {}

    if (!(0,utils/* shallowEqualObjects */.VS)(prevOptions, this.options)) {
      this.client.getQueryCache().notify({
        type: 'observerOptionsUpdated',
        query: this.currentQuery,
        observer: this
      });
    }

    if (typeof this.options.enabled !== 'undefined' && typeof this.options.enabled !== 'boolean') {
      throw new Error('Expected enabled to be a boolean');
    } // Keep previous query key if the user does not supply one


    if (!this.options.queryKey) {
      this.options.queryKey = prevOptions.queryKey;
    }

    this.updateQuery();
    const mounted = this.hasListeners(); // Fetch if there are subscribers

    if (mounted && shouldFetchOptionally(this.currentQuery, prevQuery, this.options, prevOptions)) {
      this.executeFetch();
    } // Update result


    this.updateResult(notifyOptions); // Update stale interval if needed

    if (mounted && (this.currentQuery !== prevQuery || this.options.enabled !== prevOptions.enabled || this.options.staleTime !== prevOptions.staleTime)) {
      this.updateStaleTimeout();
    }

    const nextRefetchInterval = this.computeRefetchInterval(); // Update refetch interval if needed

    if (mounted && (this.currentQuery !== prevQuery || this.options.enabled !== prevOptions.enabled || nextRefetchInterval !== this.currentRefetchInterval)) {
      this.updateRefetchInterval(nextRefetchInterval);
    }
  }

  getOptimisticResult(options) {
    const query = this.client.getQueryCache().build(this.client, options);
    const result = this.createResult(query, options);

    if (shouldAssignObserverCurrentProperties(this, result, options)) {
      // this assigns the optimistic result to the current Observer
      // because if the query function changes, useQuery will be performing
      // an effect where it would fetch again.
      // When the fetch finishes, we perform a deep data cloning in order
      // to reuse objects references. This deep data clone is performed against
      // the `observer.currentResult.data` property
      // When QueryKey changes, we refresh the query and get new `optimistic`
      // result, while we leave the `observer.currentResult`, so when new data
      // arrives, it finds the old `observer.currentResult` which is related
      // to the old QueryKey. Which means that currentResult and selectData are
      // out of sync already.
      // To solve this, we move the cursor of the currentResult everytime
      // an observer reads an optimistic value.
      // When keeping the previous data, the result doesn't change until new
      // data arrives.
      this.currentResult = result;
      this.currentResultOptions = this.options;
      this.currentResultState = this.currentQuery.state;
    }

    return result;
  }

  getCurrentResult() {
    return this.currentResult;
  }

  trackResult(result) {
    const trackedResult = {};
    Object.keys(result).forEach(key => {
      Object.defineProperty(trackedResult, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          this.trackedProps.add(key);
          return result[key];
        }
      });
    });
    return trackedResult;
  }

  getCurrentQuery() {
    return this.currentQuery;
  }

  remove() {
    this.client.getQueryCache().remove(this.currentQuery);
  }

  refetch({
    refetchPage,
    ...options
  } = {}) {
    return this.fetch({ ...options,
      meta: {
        refetchPage
      }
    });
  }

  fetchOptimistic(options) {
    const defaultedOptions = this.client.defaultQueryOptions(options);
    const query = this.client.getQueryCache().build(this.client, defaultedOptions);
    query.isFetchingOptimistic = true;
    return query.fetch().then(() => this.createResult(query, defaultedOptions));
  }

  fetch(fetchOptions) {
    var _fetchOptions$cancelR;

    return this.executeFetch({ ...fetchOptions,
      cancelRefetch: (_fetchOptions$cancelR = fetchOptions.cancelRefetch) != null ? _fetchOptions$cancelR : true
    }).then(() => {
      this.updateResult();
      return this.currentResult;
    });
  }

  executeFetch(fetchOptions) {
    // Make sure we reference the latest query as the current one might have been removed
    this.updateQuery(); // Fetch

    let promise = this.currentQuery.fetch(this.options, fetchOptions);

    if (!(fetchOptions != null && fetchOptions.throwOnError)) {
      promise = promise.catch(utils/* noop */.ZT);
    }

    return promise;
  }

  updateStaleTimeout() {
    this.clearStaleTimeout();

    if (utils/* isServer */.sk || this.currentResult.isStale || !(0,utils/* isValidTimeout */.PN)(this.options.staleTime)) {
      return;
    }

    const time = (0,utils/* timeUntilStale */.Kp)(this.currentResult.dataUpdatedAt, this.options.staleTime); // The timeout is sometimes triggered 1 ms before the stale time expiration.
    // To mitigate this issue we always add 1 ms to the timeout.

    const timeout = time + 1;
    this.staleTimeoutId = setTimeout(() => {
      if (!this.currentResult.isStale) {
        this.updateResult();
      }
    }, timeout);
  }

  computeRefetchInterval() {
    var _this$options$refetch;

    return typeof this.options.refetchInterval === 'function' ? this.options.refetchInterval(this.currentResult.data, this.currentQuery) : (_this$options$refetch = this.options.refetchInterval) != null ? _this$options$refetch : false;
  }

  updateRefetchInterval(nextInterval) {
    this.clearRefetchInterval();
    this.currentRefetchInterval = nextInterval;

    if (utils/* isServer */.sk || this.options.enabled === false || !(0,utils/* isValidTimeout */.PN)(this.currentRefetchInterval) || this.currentRefetchInterval === 0) {
      return;
    }

    this.refetchIntervalId = setInterval(() => {
      if (this.options.refetchIntervalInBackground || focusManager/* focusManager */.j.isFocused()) {
        this.executeFetch();
      }
    }, this.currentRefetchInterval);
  }

  updateTimers() {
    this.updateStaleTimeout();
    this.updateRefetchInterval(this.computeRefetchInterval());
  }

  clearStaleTimeout() {
    if (this.staleTimeoutId) {
      clearTimeout(this.staleTimeoutId);
      this.staleTimeoutId = undefined;
    }
  }

  clearRefetchInterval() {
    if (this.refetchIntervalId) {
      clearInterval(this.refetchIntervalId);
      this.refetchIntervalId = undefined;
    }
  }

  createResult(query, options) {
    const prevQuery = this.currentQuery;
    const prevOptions = this.options;
    const prevResult = this.currentResult;
    const prevResultState = this.currentResultState;
    const prevResultOptions = this.currentResultOptions;
    const queryChange = query !== prevQuery;
    const queryInitialState = queryChange ? query.state : this.currentQueryInitialState;
    const prevQueryResult = queryChange ? this.currentResult : this.previousQueryResult;
    const {
      state
    } = query;
    let {
      dataUpdatedAt,
      error,
      errorUpdatedAt,
      fetchStatus,
      status
    } = state;
    let isPreviousData = false;
    let isPlaceholderData = false;
    let data; // Optimistically set result in fetching state if needed

    if (options._optimisticResults) {
      const mounted = this.hasListeners();
      const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
      const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);

      if (fetchOnMount || fetchOptionally) {
        fetchStatus = (0,retryer/* canFetch */.Kw)(query.options.networkMode) ? 'fetching' : 'paused';

        if (!dataUpdatedAt) {
          status = 'loading';
        }
      }

      if (options._optimisticResults === 'isRestoring') {
        fetchStatus = 'idle';
      }
    } // Keep previous data if needed


    if (options.keepPreviousData && !state.dataUpdatedAt && prevQueryResult != null && prevQueryResult.isSuccess && status !== 'error') {
      data = prevQueryResult.data;
      dataUpdatedAt = prevQueryResult.dataUpdatedAt;
      status = prevQueryResult.status;
      isPreviousData = true;
    } // Select data if needed
    else if (options.select && typeof state.data !== 'undefined') {
      // Memoize select result
      if (prevResult && state.data === (prevResultState == null ? void 0 : prevResultState.data) && options.select === this.selectFn) {
        data = this.selectResult;
      } else {
        try {
          this.selectFn = options.select;
          data = options.select(state.data);
          data = (0,utils/* replaceData */.oE)(prevResult == null ? void 0 : prevResult.data, data, options);
          this.selectResult = data;
          this.selectError = null;
        } catch (selectError) {
          if (false) {}

          this.selectError = selectError;
        }
      }
    } // Use query data
    else {
      data = state.data;
    } // Show placeholder data if needed


    if (typeof options.placeholderData !== 'undefined' && typeof data === 'undefined' && status === 'loading') {
      let placeholderData; // Memoize placeholder data

      if (prevResult != null && prevResult.isPlaceholderData && options.placeholderData === (prevResultOptions == null ? void 0 : prevResultOptions.placeholderData)) {
        placeholderData = prevResult.data;
      } else {
        placeholderData = typeof options.placeholderData === 'function' ? options.placeholderData() : options.placeholderData;

        if (options.select && typeof placeholderData !== 'undefined') {
          try {
            placeholderData = options.select(placeholderData);
            this.selectError = null;
          } catch (selectError) {
            if (false) {}

            this.selectError = selectError;
          }
        }
      }

      if (typeof placeholderData !== 'undefined') {
        status = 'success';
        data = (0,utils/* replaceData */.oE)(prevResult == null ? void 0 : prevResult.data, placeholderData, options);
        isPlaceholderData = true;
      }
    }

    if (this.selectError) {
      error = this.selectError;
      data = this.selectResult;
      errorUpdatedAt = Date.now();
      status = 'error';
    }

    const isFetching = fetchStatus === 'fetching';
    const isLoading = status === 'loading';
    const isError = status === 'error';
    const result = {
      status,
      fetchStatus,
      isLoading,
      isSuccess: status === 'success',
      isError,
      isInitialLoading: isLoading && isFetching,
      data,
      dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: state.fetchFailureCount,
      failureReason: state.fetchFailureReason,
      errorUpdateCount: state.errorUpdateCount,
      isFetched: state.dataUpdateCount > 0 || state.errorUpdateCount > 0,
      isFetchedAfterMount: state.dataUpdateCount > queryInitialState.dataUpdateCount || state.errorUpdateCount > queryInitialState.errorUpdateCount,
      isFetching,
      isRefetching: isFetching && !isLoading,
      isLoadingError: isError && state.dataUpdatedAt === 0,
      isPaused: fetchStatus === 'paused',
      isPlaceholderData,
      isPreviousData,
      isRefetchError: isError && state.dataUpdatedAt !== 0,
      isStale: isStale(query, options),
      refetch: this.refetch,
      remove: this.remove
    };
    return result;
  }

  updateResult(notifyOptions) {
    const prevResult = this.currentResult;
    const nextResult = this.createResult(this.currentQuery, this.options);
    this.currentResultState = this.currentQuery.state;
    this.currentResultOptions = this.options; // Only notify and update result if something has changed

    if ((0,utils/* shallowEqualObjects */.VS)(nextResult, prevResult)) {
      return;
    }

    this.currentResult = nextResult; // Determine which callbacks to trigger

    const defaultNotifyOptions = {
      cache: true
    };

    const shouldNotifyListeners = () => {
      if (!prevResult) {
        return true;
      }

      const {
        notifyOnChangeProps
      } = this.options;
      const notifyOnChangePropsValue = typeof notifyOnChangeProps === 'function' ? notifyOnChangeProps() : notifyOnChangeProps;

      if (notifyOnChangePropsValue === 'all' || !notifyOnChangePropsValue && !this.trackedProps.size) {
        return true;
      }

      const includedProps = new Set(notifyOnChangePropsValue != null ? notifyOnChangePropsValue : this.trackedProps);

      if (this.options.useErrorBoundary) {
        includedProps.add('error');
      }

      return Object.keys(this.currentResult).some(key => {
        const typedKey = key;
        const changed = this.currentResult[typedKey] !== prevResult[typedKey];
        return changed && includedProps.has(typedKey);
      });
    };

    if ((notifyOptions == null ? void 0 : notifyOptions.listeners) !== false && shouldNotifyListeners()) {
      defaultNotifyOptions.listeners = true;
    }

    this.notify({ ...defaultNotifyOptions,
      ...notifyOptions
    });
  }

  updateQuery() {
    const query = this.client.getQueryCache().build(this.client, this.options);

    if (query === this.currentQuery) {
      return;
    }

    const prevQuery = this.currentQuery;
    this.currentQuery = query;
    this.currentQueryInitialState = query.state;
    this.previousQueryResult = this.currentResult;

    if (this.hasListeners()) {
      prevQuery == null ? void 0 : prevQuery.removeObserver(this);
      query.addObserver(this);
    }
  }

  onQueryUpdate(action) {
    const notifyOptions = {};

    if (action.type === 'success') {
      notifyOptions.onSuccess = !action.manual;
    } else if (action.type === 'error' && !(0,retryer/* isCancelledError */.DV)(action.error)) {
      notifyOptions.onError = true;
    }

    this.updateResult(notifyOptions);

    if (this.hasListeners()) {
      this.updateTimers();
    }
  }

  notify(notifyOptions) {
    notifyManager/* notifyManager */.V.batch(() => {
      // First trigger the configuration callbacks
      if (notifyOptions.onSuccess) {
        var _this$options$onSucce, _this$options, _this$options$onSettl, _this$options2;

        (_this$options$onSucce = (_this$options = this.options).onSuccess) == null ? void 0 : _this$options$onSucce.call(_this$options, this.currentResult.data);
        (_this$options$onSettl = (_this$options2 = this.options).onSettled) == null ? void 0 : _this$options$onSettl.call(_this$options2, this.currentResult.data, null);
      } else if (notifyOptions.onError) {
        var _this$options$onError, _this$options3, _this$options$onSettl2, _this$options4;

        (_this$options$onError = (_this$options3 = this.options).onError) == null ? void 0 : _this$options$onError.call(_this$options3, this.currentResult.error);
        (_this$options$onSettl2 = (_this$options4 = this.options).onSettled) == null ? void 0 : _this$options$onSettl2.call(_this$options4, undefined, this.currentResult.error);
      } // Then trigger the listeners


      if (notifyOptions.listeners) {
        this.listeners.forEach(({
          listener
        }) => {
          listener(this.currentResult);
        });
      } // Then the cache listeners


      if (notifyOptions.cache) {
        this.client.getQueryCache().notify({
          query: this.currentQuery,
          type: 'observerResultsUpdated'
        });
      }
    });
  }

}

function shouldLoadOnMount(query, options) {
  return options.enabled !== false && !query.state.dataUpdatedAt && !(query.state.status === 'error' && options.retryOnMount === false);
}

function shouldFetchOnMount(query, options) {
  return shouldLoadOnMount(query, options) || query.state.dataUpdatedAt > 0 && shouldFetchOn(query, options, options.refetchOnMount);
}

function shouldFetchOn(query, options, field) {
  if (options.enabled !== false) {
    const value = typeof field === 'function' ? field(query) : field;
    return value === 'always' || value !== false && isStale(query, options);
  }

  return false;
}

function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
  return options.enabled !== false && (query !== prevQuery || prevOptions.enabled === false) && (!options.suspense || query.state.status !== 'error') && isStale(query, options);
}

function isStale(query, options) {
  return query.isStaleByTime(options.staleTime);
} // this function would decide if we will update the observer's 'current'
// properties after an optimistic reading via getOptimisticResult


function shouldAssignObserverCurrentProperties(observer, optimisticResult, options) {
  // it is important to keep this condition like this for three reasons:
  // 1. It will get removed in the v5
  // 2. it reads: don't update the properties if we want to keep the previous
  // data.
  // 3. The opposite condition (!options.keepPreviousData) would fallthrough
  // and will result in a bad decision
  if (options.keepPreviousData) {
    return false;
  } // this means we want to put some placeholder data when pending and queryKey
  // changed.


  if (options.placeholderData !== undefined) {
    // re-assign properties only if current data is placeholder data
    // which means that data did not arrive yet, so, if there is some cached data
    // we need to "prepare" to receive it
    return optimisticResult.isPlaceholderData;
  } // if the newly created result isn't what the observer is holding as current,
  // then we'll need to update the properties as well


  if (!(0,utils/* shallowEqualObjects */.VS)(observer.getCurrentResult(), optimisticResult)) {
    return true;
  } // basically, just keep previous properties if nothing changed


  return false;
}


//# sourceMappingURL=queryObserver.mjs.map

// EXTERNAL MODULE: external "next/dist/compiled/react"
var react_ = __webpack_require__(18038);
// EXTERNAL MODULE: ./node_modules/use-sync-external-store/shim/index.js
var shim = __webpack_require__(61928);
;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/useSyncExternalStore.mjs
'use client';


const useSyncExternalStore = shim.useSyncExternalStore;


//# sourceMappingURL=useSyncExternalStore.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/QueryErrorResetBoundary.mjs
'use client';


function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}

const QueryErrorResetBoundaryContext = /*#__PURE__*/react_.createContext(createValue()); // HOOK

const useQueryErrorResetBoundary = () => react_.useContext(QueryErrorResetBoundaryContext); // COMPONENT

const QueryErrorResetBoundary = ({
  children
}) => {
  const [value] = React.useState(() => createValue());
  return /*#__PURE__*/React.createElement(QueryErrorResetBoundaryContext.Provider, {
    value: value
  }, typeof children === 'function' ? children(value) : children);
};


//# sourceMappingURL=QueryErrorResetBoundary.mjs.map

// EXTERNAL MODULE: ./node_modules/@tanstack/react-query/build/lib/QueryClientProvider.mjs
var QueryClientProvider = __webpack_require__(212);
;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/isRestoring.mjs
'use client';


const IsRestoringContext = /*#__PURE__*/react_.createContext(false);
const useIsRestoring = () => react_.useContext(IsRestoringContext);
const IsRestoringProvider = IsRestoringContext.Provider;


//# sourceMappingURL=isRestoring.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/utils.mjs
function shouldThrowError(_useErrorBoundary, params) {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params);
  }

  return !!_useErrorBoundary;
}


//# sourceMappingURL=utils.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/errorBoundaryUtils.mjs
'use client';



const ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.useErrorBoundary) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
const useClearResetErrorBoundary = errorResetBoundary => {
  react_.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
const getHasError = ({
  result,
  errorResetBoundary,
  useErrorBoundary,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && shouldThrowError(useErrorBoundary, [result.error, query]);
};


//# sourceMappingURL=errorBoundaryUtils.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/suspense.mjs
const ensureStaleTime = defaultedOptions => {
  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly mounting after suspending
    if (typeof defaultedOptions.staleTime !== 'number') {
      defaultedOptions.staleTime = 1000;
    }
  }
};
const willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
const shouldSuspend = (defaultedOptions, result, isRestoring) => (defaultedOptions == null ? void 0 : defaultedOptions.suspense) && willFetch(result, isRestoring);
const fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).then(({
  data
}) => {
  defaultedOptions.onSuccess == null ? void 0 : defaultedOptions.onSuccess(data);
  defaultedOptions.onSettled == null ? void 0 : defaultedOptions.onSettled(data, null);
}).catch(error => {
  errorResetBoundary.clearReset();
  defaultedOptions.onError == null ? void 0 : defaultedOptions.onError(error);
  defaultedOptions.onSettled == null ? void 0 : defaultedOptions.onSettled(undefined, error);
});


//# sourceMappingURL=suspense.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/useBaseQuery.mjs
'use client';









function useBaseQuery(options, Observer) {
  const queryClient = (0,QueryClientProvider/* useQueryClient */.NL)({
    context: options.context
  });
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedOptions = queryClient.defaultQueryOptions(options); // Make sure results are optimistically set in fetching state before subscribing or updating options

  defaultedOptions._optimisticResults = isRestoring ? 'isRestoring' : 'optimistic'; // Include callbacks in batch renders

  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager/* notifyManager */.V.batchCalls(defaultedOptions.onError);
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager/* notifyManager */.V.batchCalls(defaultedOptions.onSuccess);
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = notifyManager/* notifyManager */.V.batchCalls(defaultedOptions.onSettled);
  }

  ensureStaleTime(defaultedOptions);
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
  useClearResetErrorBoundary(errorResetBoundary);
  const [observer] = react_.useState(() => new Observer(queryClient, defaultedOptions));
  const result = observer.getOptimisticResult(defaultedOptions);
  useSyncExternalStore(react_.useCallback(onStoreChange => {
    const unsubscribe = isRestoring ? () => undefined : observer.subscribe(notifyManager/* notifyManager */.V.batchCalls(onStoreChange)); // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.

    observer.updateResult();
    return unsubscribe;
  }, [observer, isRestoring]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  react_.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, {
      listeners: false
    });
  }, [defaultedOptions, observer]); // Handle suspense

  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  } // Handle error boundary


  if (getHasError({
    result,
    errorResetBoundary,
    useErrorBoundary: defaultedOptions.useErrorBoundary,
    query: observer.getCurrentQuery()
  })) {
    throw result.error;
  } // Handle result property usage tracking


  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}


//# sourceMappingURL=useBaseQuery.mjs.map

;// CONCATENATED MODULE: ./node_modules/@tanstack/react-query/build/lib/useQuery.mjs
'use client';



function useQuery(arg1, arg2, arg3) {
  const parsedOptions = (0,utils/* parseQueryArgs */._v)(arg1, arg2, arg3);
  return useBaseQuery(parsedOptions, QueryObserver);
}


//# sourceMappingURL=useQuery.mjs.map


/***/ }),

/***/ 93258:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Z: () => (/* binding */ lib_axios)
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/bind.js


function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/utils.js




// utils is a library of generic helper functions non-specific to axios

const {toString: utils_toString} = Object.prototype;
const {getPrototypeOf} = Object;

const kindOf = (cache => thing => {
    const str = utils_toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type
}

const typeOfTest = type => thing => typeof thing === type;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 *
 * @returns {boolean} True if value is an Array, otherwise false
 */
const {isArray} = Array;

/**
 * Determine if a value is undefined
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if the value is undefined, otherwise false
 */
const isUndefined = typeOfTest('undefined');

/**
 * Determine if a value is a Buffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
const isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  let result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a String, otherwise false
 */
const isString = typeOfTest('string');

/**
 * Determine if a value is a Function
 *
 * @param {*} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
const isFunction = typeOfTest('function');

/**
 * Determine if a value is a Number
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Number, otherwise false
 */
const isNumber = typeOfTest('number');

/**
 * Determine if a value is an Object
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an Object, otherwise false
 */
const isObject = (thing) => thing !== null && typeof thing === 'object';

/**
 * Determine if a value is a Boolean
 *
 * @param {*} thing The value to test
 * @returns {boolean} True if value is a Boolean, otherwise false
 */
const isBoolean = thing => thing === true || thing === false;

/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
const isPlainObject = (val) => {
  if (kindOf(val) !== 'object') {
    return false;
  }

  const prototype = getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}

/**
 * Determine if a value is a Date
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Date, otherwise false
 */
const isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Blob, otherwise false
 */
const isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a File, otherwise false
 */
const isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Stream
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a Stream, otherwise false
 */
const isStream = (val) => isObject(val) && isFunction(val.pipe);

/**
 * Determine if a value is a FormData
 *
 * @param {*} thing The value to test
 *
 * @returns {boolean} True if value is an FormData, otherwise false
 */
const isFormData = (thing) => {
  let kind;
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) || (
      isFunction(thing.append) && (
        (kind = kindOf(thing)) === 'formdata' ||
        // detect form-data instance
        (kind === 'object' && isFunction(thing.toString) && thing.toString() === '[object FormData]')
      )
    )
  )
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
const isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 *
 * @returns {String} The String freed of excess whitespace
 */
const trim = (str) => str.trim ?
  str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 *
 * @param {Boolean} [allOwnKeys = false]
 * @returns {any}
 */
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  let i;
  let l;

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;

    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}

function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}

const _global = (() => {
  /*eslint no-undef:0*/
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
})();

const isContextDefined = (context) => !isUndefined(context) && context !== _global;

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 *
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  const {caseless} = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  }

  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 *
 * @param {Boolean} [allOwnKeys]
 * @returns {Object} The resulting value of object a
 */
const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, {allOwnKeys});
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 *
 * @returns {string} content value without BOM
 */
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 *
 * @returns {void}
 */
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, 'super', {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 *
 * @returns {Object}
 */
const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};

  destObj = destObj || {};
  // eslint-disable-next-line no-eq-null,eqeqeq
  if (sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/**
 * Determines whether a string ends with the characters of a specified string
 *
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 *
 * @returns {boolean}
 */
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object or null if failed
 *
 * @param {*} [thing]
 *
 * @returns {?Array}
 */
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

/**
 * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
 * thing passed in is an instance of Uint8Array
 *
 * @param {TypedArray}
 *
 * @returns {Array}
 */
// eslint-disable-next-line func-names
const isTypedArray = (TypedArray => {
  // eslint-disable-next-line func-names
  return thing => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

/**
 * For each entry in the object, call the function with the key and value.
 *
 * @param {Object<any, any>} obj - The object to iterate over.
 * @param {Function} fn - The function to call for each entry.
 *
 * @returns {void}
 */
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[Symbol.iterator];

  const iterator = generator.call(obj);

  let result;

  while ((result = iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
}

/**
 * It takes a regular expression and a string, and returns an array of all the matches
 *
 * @param {string} regExp - The regular expression to match against.
 * @param {string} str - The string to search.
 *
 * @returns {Array<boolean>}
 */
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];

  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }

  return arr;
}

/* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
const isHTMLForm = kindOfTest('HTMLFormElement');

const toCamelCase = str => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
    function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }
  );
};

/* Creating a function that will check if an object has a property. */
const utils_hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

/**
 * Determine if a value is a RegExp object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a RegExp object, otherwise false
 */
const isRegExp = kindOfTest('RegExp');

const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};

  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });

  Object.defineProperties(obj, reducedDescriptors);
}

/**
 * Makes all methods read-only
 * @param {Object} obj
 */

const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    // skip restricted props in strict mode
    if (isFunction(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
      return false;
    }

    const value = obj[name];

    if (!isFunction(value)) return;

    descriptor.enumerable = false;

    if ('writable' in descriptor) {
      descriptor.writable = false;
      return;
    }

    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error('Can not rewrite read-only method \'' + name + '\'');
      };
    }
  });
}

const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};

  const define = (arr) => {
    arr.forEach(value => {
      obj[value] = true;
    });
  }

  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

  return obj;
}

const noop = () => {}

const toFiniteNumber = (value, defaultValue) => {
  value = +value;
  return Number.isFinite(value) ? value : defaultValue;
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'

const DIGIT = '0123456789';

const ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
}

const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = '';
  const {length} = alphabet;
  while (size--) {
    str += alphabet[Math.random() * length|0]
  }

  return str;
}

/**
 * If the thing is a FormData object, return true, otherwise return false.
 *
 * @param {unknown} thing - The thing to check.
 *
 * @returns {boolean}
 */
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === 'FormData' && thing[Symbol.iterator]);
}

const toJSONObject = (obj) => {
  const stack = new Array(10);

  const visit = (source, i) => {

    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }

      if(!('toJSON' in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};

        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });

        stack[i] = undefined;

        return target;
      }
    }

    return source;
  }

  return visit(obj, 0);
}

const isAsyncFn = kindOfTest('AsyncFunction');

const isThenable = (thing) =>
  thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch);

/* harmony default export */ const utils = ({
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty: utils_hasOwnProperty,
  hasOwnProp: utils_hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  ALPHABET,
  generateString,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/AxiosError.js




/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 *
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = (new Error()).stack;
  }

  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils.toJSONObject(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

const AxiosError_prototype = AxiosError.prototype;
const descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(code => {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(AxiosError_prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(AxiosError_prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  }, prop => {
    return prop !== 'isAxiosError';
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.cause = error;

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

/* harmony default export */ const core_AxiosError = (AxiosError);

// EXTERNAL MODULE: ./node_modules/form-data/lib/form_data.js
var form_data = __webpack_require__(20054);
;// CONCATENATED MODULE: ./node_modules/axios/lib/platform/node/classes/FormData.js


/* harmony default export */ const classes_FormData = (form_data);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/toFormData.js




// temporary hotfix to avoid circular references until AxiosURLSearchParams is refactored


/**
 * Determines if the given thing is a array or js object.
 *
 * @param {string} thing - The object or array to be visited.
 *
 * @returns {boolean}
 */
function isVisitable(thing) {
  return utils.isPlainObject(thing) || utils.isArray(thing);
}

/**
 * It removes the brackets from the end of a string
 *
 * @param {string} key - The key of the parameter.
 *
 * @returns {string} the key without the brackets.
 */
function removeBrackets(key) {
  return utils.endsWith(key, '[]') ? key.slice(0, -2) : key;
}

/**
 * It takes a path, a key, and a boolean, and returns a string
 *
 * @param {string} path - The path to the current key.
 * @param {string} key - The key of the current object being iterated over.
 * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
 *
 * @returns {string} The path to the current key.
 */
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    // eslint-disable-next-line no-param-reassign
    token = removeBrackets(token);
    return !dots && i ? '[' + token + ']' : token;
  }).join(dots ? '.' : '');
}

/**
 * If the array is an array and none of its elements are visitable, then it's a flat array.
 *
 * @param {Array<any>} arr - The array to check
 *
 * @returns {boolean}
 */
function isFlatArray(arr) {
  return utils.isArray(arr) && !arr.some(isVisitable);
}

const predicates = utils.toFlatObject(utils, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});

/**
 * Convert a data object to FormData
 *
 * @param {Object} obj
 * @param {?Object} [formData]
 * @param {?Object} [options]
 * @param {Function} [options.visitor]
 * @param {Boolean} [options.metaTokens = true]
 * @param {Boolean} [options.dots = false]
 * @param {?Boolean} [options.indexes = false]
 *
 * @returns {Object}
 **/

/**
 * It converts an object into a FormData object
 *
 * @param {Object<any, any>} obj - The object to convert to form data.
 * @param {string} formData - The FormData object to append to.
 * @param {Object<string, any>} options
 *
 * @returns
 */
function toFormData(obj, formData, options) {
  if (!utils.isObject(obj)) {
    throw new TypeError('target must be an object');
  }

  // eslint-disable-next-line no-param-reassign
  formData = formData || new (classes_FormData || FormData)();

  // eslint-disable-next-line no-param-reassign
  options = utils.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    // eslint-disable-next-line no-eq-null,eqeqeq
    return !utils.isUndefined(source[option]);
  });

  const metaTokens = options.metaTokens;
  // eslint-disable-next-line no-use-before-define
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
  const useBlob = _Blob && utils.isSpecCompliantForm(formData);

  if (!utils.isFunction(visitor)) {
    throw new TypeError('visitor must be a function');
  }

  function convertValue(value) {
    if (value === null) return '';

    if (utils.isDate(value)) {
      return value.toISOString();
    }

    if (!useBlob && utils.isBlob(value)) {
      throw new core_AxiosError('Blob is not supported. Use a Buffer instead.');
    }

    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  /**
   * Default visitor.
   *
   * @param {*} value
   * @param {String|Number} key
   * @param {Array<String|Number>} path
   * @this {FormData}
   *
   * @returns {boolean} return true to visit the each prop of the value recursively
   */
  function defaultVisitor(value, key, path) {
    let arr = value;

    if (value && !path && typeof value === 'object') {
      if (utils.endsWith(key, '{}')) {
        // eslint-disable-next-line no-param-reassign
        key = metaTokens ? key : key.slice(0, -2);
        // eslint-disable-next-line no-param-reassign
        value = JSON.stringify(value);
      } else if (
        (utils.isArray(value) && isFlatArray(value)) ||
        ((utils.isFileList(value) || utils.endsWith(key, '[]')) && (arr = utils.toArray(value))
        )) {
        // eslint-disable-next-line no-param-reassign
        key = removeBrackets(key);

        arr.forEach(function each(el, index) {
          !(utils.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
            convertValue(el)
          );
        });
        return false;
      }
    }

    if (isVisitable(value)) {
      return true;
    }

    formData.append(renderKey(path, key, dots), convertValue(value));

    return false;
  }

  const stack = [];

  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });

  function build(value, path) {
    if (utils.isUndefined(value)) return;

    if (stack.indexOf(value) !== -1) {
      throw Error('Circular reference detected in ' + path.join('.'));
    }

    stack.push(value);

    utils.forEach(value, function each(el, key) {
      const result = !(utils.isUndefined(el) || el === null) && visitor.call(
        formData, el, utils.isString(key) ? key.trim() : key, path, exposedHelpers
      );

      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });

    stack.pop();
  }

  if (!utils.isObject(obj)) {
    throw new TypeError('data must be an object');
  }

  build(obj);

  return formData;
}

/* harmony default export */ const helpers_toFormData = (toFormData);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/AxiosURLSearchParams.js




/**
 * It encodes a string by replacing all characters that are not in the unreserved set with
 * their percent-encoded equivalents
 *
 * @param {string} str - The string to encode.
 *
 * @returns {string} The encoded string.
 */
function encode(str) {
  const charMap = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\x00'
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}

/**
 * It takes a params object and converts it to a FormData object
 *
 * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
 * @param {Object<string, any>} options - The options object passed to the Axios constructor.
 *
 * @returns {void}
 */
function AxiosURLSearchParams(params, options) {
  this._pairs = [];

  params && helpers_toFormData(params, this, options);
}

const AxiosURLSearchParams_prototype = AxiosURLSearchParams.prototype;

AxiosURLSearchParams_prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};

AxiosURLSearchParams_prototype.toString = function toString(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode);
  } : encode;

  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + '=' + _encode(pair[1]);
  }, '').join('&');
};

/* harmony default export */ const helpers_AxiosURLSearchParams = (AxiosURLSearchParams);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/buildURL.js





/**
 * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
 * URI encoded counterparts
 *
 * @param {string} val The value to be encoded.
 *
 * @returns {string} The encoded value.
 */
function buildURL_encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @param {?object} options
 *
 * @returns {string} The formatted url
 */
function buildURL(url, params, options) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }
  
  const _encode = options && options.encode || buildURL_encode;

  const serializeFn = options && options.serialize;

  let serializedParams;

  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils.isURLSearchParams(params) ?
      params.toString() :
      new helpers_AxiosURLSearchParams(params, options).toString(_encode);
  }

  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/InterceptorManager.js




class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}

/* harmony default export */ const core_InterceptorManager = (InterceptorManager);

;// CONCATENATED MODULE: ./node_modules/axios/lib/defaults/transitional.js


/* harmony default export */ const defaults_transitional = ({
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
});

// EXTERNAL MODULE: external "url"
var external_url_ = __webpack_require__(57310);
;// CONCATENATED MODULE: ./node_modules/axios/lib/platform/node/classes/URLSearchParams.js



/* harmony default export */ const URLSearchParams = (external_url_.URLSearchParams);

;// CONCATENATED MODULE: ./node_modules/axios/lib/platform/node/index.js



/* harmony default export */ const node = ({
  isNode: true,
  classes: {
    URLSearchParams: URLSearchParams,
    FormData: classes_FormData,
    Blob: typeof Blob !== 'undefined' && Blob || null
  },
  protocols: [ 'http', 'https', 'file', 'data' ]
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/toURLEncodedForm.js






function toURLEncodedForm(data, options) {
  return helpers_toFormData(data, new node.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (node.isNode && utils.isBuffer(value)) {
        this.append(key, value.toString('base64'));
        return false;
      }

      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/formDataToJSON.js




/**
 * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
 *
 * @param {string} name - The name of the property to get.
 *
 * @returns An array of strings.
 */
function parsePropPath(name) {
  // foo[x][y][z]
  // foo.x.y.z
  // foo-x-y-z
  // foo x y z
  return utils.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
    return match[0] === '[]' ? '' : match[1] || match[0];
  });
}

/**
 * Convert an array to an object.
 *
 * @param {Array<any>} arr - The array to convert to an object.
 *
 * @returns An object with the same keys and values as the array.
 */
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}

/**
 * It takes a FormData object and returns a JavaScript object
 *
 * @param {string} formData The FormData object to convert to JSON.
 *
 * @returns {Object<string, any> | null} The converted object.
 */
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils.isArray(target) ? target.length : name;

    if (isLast) {
      if (utils.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }

      return !isNumericKey;
    }

    if (!target[name] || !utils.isObject(target[name])) {
      target[name] = [];
    }

    const result = buildPath(path, value, target[name], index);

    if (result && utils.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }

    return !isNumericKey;
  }

  if (utils.isFormData(formData) && utils.isFunction(formData.entries)) {
    const obj = {};

    utils.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });

    return obj;
  }

  return null;
}

/* harmony default export */ const helpers_formDataToJSON = (formDataToJSON);

;// CONCATENATED MODULE: ./node_modules/axios/lib/defaults/index.js










/**
 * It takes a string, tries to parse it, and if it fails, it returns the stringified version
 * of the input
 *
 * @param {any} rawValue - The value to be stringified.
 * @param {Function} parser - A function that parses a string into a JavaScript object.
 * @param {Function} encoder - A function that takes a value and returns a string.
 *
 * @returns {string} A stringified version of the rawValue.
 */
function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

const defaults = {

  transitional: defaults_transitional,

  adapter: node.isNode ? 'http' : 'xhr',

  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || '';
    const hasJSONContentType = contentType.indexOf('application/json') > -1;
    const isObjectPayload = utils.isObject(data);

    if (isObjectPayload && utils.isHTMLForm(data)) {
      data = new FormData(data);
    }

    const isFormData = utils.isFormData(data);

    if (isFormData) {
      if (!hasJSONContentType) {
        return data;
      }
      return hasJSONContentType ? JSON.stringify(helpers_formDataToJSON(data)) : data;
    }

    if (utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
      return data.toString();
    }

    let isFileList;

    if (isObjectPayload) {
      if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }

      if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
        const _FormData = this.env && this.env.FormData;

        return helpers_toFormData(
          isFileList ? {'files[]': data} : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }

    if (isObjectPayload || hasJSONContentType ) {
      headers.setContentType('application/json', false);
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    const transitional = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    const JSONRequested = this.responseType === 'json';

    if (data && utils.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
      const silentJSONParsing = transitional && transitional.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;

      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw core_AxiosError.from(e, core_AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: node.classes.FormData,
    Blob: node.classes.Blob
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': undefined
    }
  }
};

utils.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
  defaults.headers[method] = {};
});

/* harmony default export */ const lib_defaults = (defaults);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/parseHeaders.js




// RawAxiosHeaders whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
const ignoreDuplicateOf = utils.toObjectSet([
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
]);

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} rawHeaders Headers needing to be parsed
 *
 * @returns {Object} Headers parsed into an object
 */
/* harmony default export */ const parseHeaders = (rawHeaders => {
  const parsed = {};
  let key;
  let val;
  let i;

  rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
    i = line.indexOf(':');
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();

    if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
      return;
    }

    if (key === 'set-cookie') {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/AxiosHeaders.js





const $internals = Symbol('internals');

function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }

  return utils.isArray(value) ? value.map(normalizeValue) : String(value);
}

function parseTokens(str) {
  const tokens = Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;

  while ((match = tokensRE.exec(str))) {
    tokens[match[1]] = match[2];
  }

  return tokens;
}

const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
  if (utils.isFunction(filter)) {
    return filter.call(this, value, header);
  }

  if (isHeaderNameFilter) {
    value = header;
  }

  if (!utils.isString(value)) return;

  if (utils.isString(filter)) {
    return value.indexOf(filter) !== -1;
  }

  if (utils.isRegExp(filter)) {
    return filter.test(value);
  }
}

function formatHeader(header) {
  return header.trim()
    .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
      return char.toUpperCase() + str;
    });
}

function buildAccessors(obj, header) {
  const accessorName = utils.toCamelCase(' ' + header);

  ['get', 'set', 'has'].forEach(methodName => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}

class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }

  set(header, valueOrRewrite, rewrite) {
    const self = this;

    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);

      if (!lHeader) {
        throw new Error('header name must be a non-empty string');
      }

      const key = utils.findKey(self, lHeader);

      if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
        self[key || _header] = normalizeValue(_value);
      }
    }

    const setHeaders = (headers, _rewrite) =>
      utils.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

    if (utils.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite)
    } else if(utils.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }

    return this;
  }

  get(header, parser) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils.findKey(this, header);

      if (key) {
        const value = this[key];

        if (!parser) {
          return value;
        }

        if (parser === true) {
          return parseTokens(value);
        }

        if (utils.isFunction(parser)) {
          return parser.call(this, value, key);
        }

        if (utils.isRegExp(parser)) {
          return parser.exec(value);
        }

        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }

  has(header, matcher) {
    header = normalizeHeader(header);

    if (header) {
      const key = utils.findKey(this, header);

      return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }

    return false;
  }

  delete(header, matcher) {
    const self = this;
    let deleted = false;

    function deleteHeader(_header) {
      _header = normalizeHeader(_header);

      if (_header) {
        const key = utils.findKey(self, _header);

        if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
          delete self[key];

          deleted = true;
        }
      }
    }

    if (utils.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }

    return deleted;
  }

  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;

    while (i--) {
      const key = keys[i];
      if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }

    return deleted;
  }

  normalize(format) {
    const self = this;
    const headers = {};

    utils.forEach(this, (value, header) => {
      const key = utils.findKey(headers, header);

      if (key) {
        self[key] = normalizeValue(value);
        delete self[header];
        return;
      }

      const normalized = format ? formatHeader(header) : String(header).trim();

      if (normalized !== header) {
        delete self[header];
      }

      self[normalized] = normalizeValue(value);

      headers[normalized] = true;
    });

    return this;
  }

  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }

  toJSON(asStrings) {
    const obj = Object.create(null);

    utils.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils.isArray(value) ? value.join(', ') : value);
    });

    return obj;
  }

  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }

  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
  }

  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }

  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }

  static concat(first, ...targets) {
    const computed = new this(first);

    targets.forEach((target) => computed.set(target));

    return computed;
  }

  static accessor(header) {
    const internals = this[$internals] = (this[$internals] = {
      accessors: {}
    });

    const accessors = internals.accessors;
    const prototype = this.prototype;

    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);

      if (!accessors[lHeader]) {
        buildAccessors(prototype, _header);
        accessors[lHeader] = true;
      }
    }

    utils.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

    return this;
  }
}

AxiosHeaders.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

// reserved names hotfix
utils.reduceDescriptors(AxiosHeaders.prototype, ({value}, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  }
});

utils.freezeMethods(AxiosHeaders);

/* harmony default export */ const core_AxiosHeaders = (AxiosHeaders);

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/transformData.js






/**
 * Transform the data for a request or a response
 *
 * @param {Array|Function} fns A single function or Array of functions
 * @param {?Object} response The response object
 *
 * @returns {*} The resulting transformed data
 */
function transformData(fns, response) {
  const config = this || lib_defaults;
  const context = response || config;
  const headers = core_AxiosHeaders.from(context.headers);
  let data = context.data;

  utils.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
  });

  headers.normalize();

  return data;
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/cancel/isCancel.js


function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/cancel/CanceledError.js





/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 *
 * @returns {CanceledError} The created error.
 */
function CanceledError(message, config, request) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  core_AxiosError.call(this, message == null ? 'canceled' : message, core_AxiosError.ERR_CANCELED, config, request);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, core_AxiosError, {
  __CANCEL__: true
});

/* harmony default export */ const cancel_CanceledError = (CanceledError);

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/settle.js




/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 *
 * @returns {object} The response.
 */
function settle(resolve, reject, response) {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new core_AxiosError(
      'Request failed with status code ' + response.status,
      [core_AxiosError.ERR_BAD_REQUEST, core_AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/isAbsoluteURL.js


/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 *
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/combineURLs.js


/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/buildFullPath.js





/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @returns {string} The combined full path
 */
function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

// EXTERNAL MODULE: ./node_modules/proxy-from-env/index.js
var proxy_from_env = __webpack_require__(5670);
// EXTERNAL MODULE: external "http"
var external_http_ = __webpack_require__(13685);
// EXTERNAL MODULE: external "https"
var external_https_ = __webpack_require__(95687);
// EXTERNAL MODULE: external "util"
var external_util_ = __webpack_require__(73837);
// EXTERNAL MODULE: ./node_modules/follow-redirects/index.js
var follow_redirects = __webpack_require__(71794);
// EXTERNAL MODULE: external "zlib"
var external_zlib_ = __webpack_require__(59796);
;// CONCATENATED MODULE: ./node_modules/axios/lib/env/data.js
const VERSION = "1.5.0";
;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/parseProtocol.js


function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/fromDataURI.js






const DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;

/**
 * Parse data uri to a Buffer or Blob
 *
 * @param {String} uri
 * @param {?Boolean} asBlob
 * @param {?Object} options
 * @param {?Function} options.Blob
 *
 * @returns {Buffer|Blob}
 */
function fromDataURI(uri, asBlob, options) {
  const _Blob = options && options.Blob || node.classes.Blob;
  const protocol = parseProtocol(uri);

  if (asBlob === undefined && _Blob) {
    asBlob = true;
  }

  if (protocol === 'data') {
    uri = protocol.length ? uri.slice(protocol.length + 1) : uri;

    const match = DATA_URL_PATTERN.exec(uri);

    if (!match) {
      throw new core_AxiosError('Invalid URL', core_AxiosError.ERR_INVALID_URL);
    }

    const mime = match[1];
    const isBase64 = match[2];
    const body = match[3];
    const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? 'base64' : 'utf8');

    if (asBlob) {
      if (!_Blob) {
        throw new core_AxiosError('Blob is not supported', core_AxiosError.ERR_NOT_SUPPORT);
      }

      return new _Blob([buffer], {type: mime});
    }

    return buffer;
  }

  throw new core_AxiosError('Unsupported protocol ' + protocol, core_AxiosError.ERR_NOT_SUPPORT);
}

// EXTERNAL MODULE: external "stream"
var external_stream_ = __webpack_require__(12781);
;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/throttle.js


/**
 * Throttle decorator
 * @param {Function} fn
 * @param {Number} freq
 * @return {Function}
 */
function throttle(fn, freq) {
  let timestamp = 0;
  const threshold = 1000 / freq;
  let timer = null;
  return function throttled(force, args) {
    const now = Date.now();
    if (force || now - timestamp > threshold) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      timestamp = now;
      return fn.apply(null, args);
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        timestamp = Date.now();
        return fn.apply(null, args);
      }, threshold - (now - timestamp));
    }
  };
}

/* harmony default export */ const helpers_throttle = (throttle);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/speedometer.js


/**
 * Calculate data maxRate
 * @param {Number} [samplesCount= 10]
 * @param {Number} [min= 1000]
 * @returns {Function}
 */
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;

  min = min !== undefined ? min : 1000;

  return function push(chunkLength) {
    const now = Date.now();

    const startedAt = timestamps[tail];

    if (!firstSampleTS) {
      firstSampleTS = now;
    }

    bytes[head] = chunkLength;
    timestamps[head] = now;

    let i = tail;
    let bytesCount = 0;

    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }

    head = (head + 1) % samplesCount;

    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }

    if (now - firstSampleTS < min) {
      return;
    }

    const passed = startedAt && now - startedAt;

    return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
  };
}

/* harmony default export */ const helpers_speedometer = (speedometer);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/AxiosTransformStream.js







const kInternals = Symbol('internals');

class AxiosTransformStream extends external_stream_.Transform{
  constructor(options) {
    options = utils.toFlatObject(options, {
      maxRate: 0,
      chunkSize: 64 * 1024,
      minChunkSize: 100,
      timeWindow: 500,
      ticksRate: 2,
      samplesCount: 15
    }, null, (prop, source) => {
      return !utils.isUndefined(source[prop]);
    });

    super({
      readableHighWaterMark: options.chunkSize
    });

    const self = this;

    const internals = this[kInternals] = {
      length: options.length,
      timeWindow: options.timeWindow,
      ticksRate: options.ticksRate,
      chunkSize: options.chunkSize,
      maxRate: options.maxRate,
      minChunkSize: options.minChunkSize,
      bytesSeen: 0,
      isCaptured: false,
      notifiedBytesLoaded: 0,
      ts: Date.now(),
      bytes: 0,
      onReadCallback: null
    };

    const _speedometer = helpers_speedometer(internals.ticksRate * options.samplesCount, internals.timeWindow);

    this.on('newListener', event => {
      if (event === 'progress') {
        if (!internals.isCaptured) {
          internals.isCaptured = true;
        }
      }
    });

    let bytesNotified = 0;

    internals.updateProgress = helpers_throttle(function throttledHandler() {
      const totalBytes = internals.length;
      const bytesTransferred = internals.bytesSeen;
      const progressBytes = bytesTransferred - bytesNotified;
      if (!progressBytes || self.destroyed) return;

      const rate = _speedometer(progressBytes);

      bytesNotified = bytesTransferred;

      process.nextTick(() => {
        self.emit('progress', {
          'loaded': bytesTransferred,
          'total': totalBytes,
          'progress': totalBytes ? (bytesTransferred / totalBytes) : undefined,
          'bytes': progressBytes,
          'rate': rate ? rate : undefined,
          'estimated': rate && totalBytes && bytesTransferred <= totalBytes ?
            (totalBytes - bytesTransferred) / rate : undefined
        });
      });
    }, internals.ticksRate);

    const onFinish = () => {
      internals.updateProgress(true);
    };

    this.once('end', onFinish);
    this.once('error', onFinish);
  }

  _read(size) {
    const internals = this[kInternals];

    if (internals.onReadCallback) {
      internals.onReadCallback();
    }

    return super._read(size);
  }

  _transform(chunk, encoding, callback) {
    const self = this;
    const internals = this[kInternals];
    const maxRate = internals.maxRate;

    const readableHighWaterMark = this.readableHighWaterMark;

    const timeWindow = internals.timeWindow;

    const divider = 1000 / timeWindow;
    const bytesThreshold = (maxRate / divider);
    const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;

    function pushChunk(_chunk, _callback) {
      const bytes = Buffer.byteLength(_chunk);
      internals.bytesSeen += bytes;
      internals.bytes += bytes;

      if (internals.isCaptured) {
        internals.updateProgress();
      }

      if (self.push(_chunk)) {
        process.nextTick(_callback);
      } else {
        internals.onReadCallback = () => {
          internals.onReadCallback = null;
          process.nextTick(_callback);
        };
      }
    }

    const transformChunk = (_chunk, _callback) => {
      const chunkSize = Buffer.byteLength(_chunk);
      let chunkRemainder = null;
      let maxChunkSize = readableHighWaterMark;
      let bytesLeft;
      let passed = 0;

      if (maxRate) {
        const now = Date.now();

        if (!internals.ts || (passed = (now - internals.ts)) >= timeWindow) {
          internals.ts = now;
          bytesLeft = bytesThreshold - internals.bytes;
          internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
          passed = 0;
        }

        bytesLeft = bytesThreshold - internals.bytes;
      }

      if (maxRate) {
        if (bytesLeft <= 0) {
          // next time window
          return setTimeout(() => {
            _callback(null, _chunk);
          }, timeWindow - passed);
        }

        if (bytesLeft < maxChunkSize) {
          maxChunkSize = bytesLeft;
        }
      }

      if (maxChunkSize && chunkSize > maxChunkSize && (chunkSize - maxChunkSize) > minChunkSize) {
        chunkRemainder = _chunk.subarray(maxChunkSize);
        _chunk = _chunk.subarray(0, maxChunkSize);
      }

      pushChunk(_chunk, chunkRemainder ? () => {
        process.nextTick(_callback, null, chunkRemainder);
      } : _callback);
    };

    transformChunk(chunk, function transformNextChunk(err, _chunk) {
      if (err) {
        return callback(err);
      }

      if (_chunk) {
        transformChunk(_chunk, transformNextChunk);
      } else {
        callback(null);
      }
    });
  }

  setLength(length) {
    this[kInternals].length = +length;
    return this;
  }
}

/* harmony default export */ const helpers_AxiosTransformStream = (AxiosTransformStream);

// EXTERNAL MODULE: external "events"
var external_events_ = __webpack_require__(82361);
;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/readBlob.js
const {asyncIterator} = Symbol;

const readBlob = async function* (blob) {
  if (blob.stream) {
    yield* blob.stream()
  } else if (blob.arrayBuffer) {
    yield await blob.arrayBuffer()
  } else if (blob[asyncIterator]) {
    yield* blob[asyncIterator]();
  } else {
    yield blob;
  }
}

/* harmony default export */ const helpers_readBlob = (readBlob);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/formDataToStream.js





const BOUNDARY_ALPHABET = utils.ALPHABET.ALPHA_DIGIT + '-_';

const textEncoder = new external_util_.TextEncoder();

const CRLF = '\r\n';
const CRLF_BYTES = textEncoder.encode(CRLF);
const CRLF_BYTES_COUNT = 2;

class FormDataPart {
  constructor(name, value) {
    const {escapeName} = this.constructor;
    const isStringValue = utils.isString(value);

    let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${
      !isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ''
    }${CRLF}`;

    if (isStringValue) {
      value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
    } else {
      headers += `Content-Type: ${value.type || "application/octet-stream"}${CRLF}`
    }

    this.headers = textEncoder.encode(headers + CRLF);

    this.contentLength = isStringValue ? value.byteLength : value.size;

    this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;

    this.name = name;
    this.value = value;
  }

  async *encode(){
    yield this.headers;

    const {value} = this;

    if(utils.isTypedArray(value)) {
      yield value;
    } else {
      yield* helpers_readBlob(value);
    }

    yield CRLF_BYTES;
  }

  static escapeName(name) {
      return String(name).replace(/[\r\n"]/g, (match) => ({
        '\r' : '%0D',
        '\n' : '%0A',
        '"' : '%22',
      }[match]));
  }
}

const formDataToStream = (form, headersHandler, options) => {
  const {
    tag = 'form-data-boundary',
    size = 25,
    boundary = tag + '-' + utils.generateString(size, BOUNDARY_ALPHABET)
  } = options || {};

  if(!utils.isFormData(form)) {
    throw TypeError('FormData instance required');
  }

  if (boundary.length < 1 || boundary.length > 70) {
    throw Error('boundary must be 10-70 characters long')
  }

  const boundaryBytes = textEncoder.encode('--' + boundary + CRLF);
  const footerBytes = textEncoder.encode('--' + boundary + '--' + CRLF + CRLF);
  let contentLength = footerBytes.byteLength;

  const parts = Array.from(form.entries()).map(([name, value]) => {
    const part = new FormDataPart(name, value);
    contentLength += part.size;
    return part;
  });

  contentLength += boundaryBytes.byteLength * parts.length;

  contentLength = utils.toFiniteNumber(contentLength);

  const computedHeaders = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`
  }

  if (Number.isFinite(contentLength)) {
    computedHeaders['Content-Length'] = contentLength;
  }

  headersHandler && headersHandler(computedHeaders);

  return external_stream_.Readable.from((async function *() {
    for(const part of parts) {
      yield boundaryBytes;
      yield* part.encode();
    }

    yield footerBytes;
  })());
};

/* harmony default export */ const helpers_formDataToStream = (formDataToStream);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/ZlibHeaderTransformStream.js




class ZlibHeaderTransformStream extends external_stream_.Transform {
  __transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  }

  _transform(chunk, encoding, callback) {
    if (chunk.length !== 0) {
      this._transform = this.__transform;

      // Add Default Compression headers if no zlib headers are present
      if (chunk[0] !== 120) { // Hex: 78
        const header = Buffer.alloc(2);
        header[0] = 120; // Hex: 78
        header[1] = 156; // Hex: 9C 
        this.push(header, encoding);
      }
    }

    this.__transform(chunk, encoding, callback);
  }
}

/* harmony default export */ const helpers_ZlibHeaderTransformStream = (ZlibHeaderTransformStream);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/callbackify.js


const callbackify = (fn, reducer) => {
  return utils.isAsyncFn(fn) ? function (...args) {
    const cb = args.pop();
    fn.apply(this, args).then((value) => {
      try {
        reducer ? cb(null, ...reducer(value)) : cb(null, value);
      } catch (err) {
        cb(err);
      }
    }, cb);
  } : fn;
}

/* harmony default export */ const helpers_callbackify = (callbackify);

;// CONCATENATED MODULE: ./node_modules/axios/lib/adapters/http.js



























const zlibOptions = {
  flush: external_zlib_.constants.Z_SYNC_FLUSH,
  finishFlush: external_zlib_.constants.Z_SYNC_FLUSH
};

const brotliOptions = {
  flush: external_zlib_.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: external_zlib_.constants.BROTLI_OPERATION_FLUSH
}

const isBrotliSupported = utils.isFunction(external_zlib_.createBrotliDecompress);

const {http: httpFollow, https: httpsFollow} = follow_redirects;

const isHttps = /https:?/;

const supportedProtocols = node.protocols.map(protocol => {
  return protocol + ':';
});

/**
 * If the proxy or config beforeRedirects functions are defined, call them with the options
 * object.
 *
 * @param {Object<string, any>} options - The options object that was passed to the request.
 *
 * @returns {Object<string, any>}
 */
function dispatchBeforeRedirect(options) {
  if (options.beforeRedirects.proxy) {
    options.beforeRedirects.proxy(options);
  }
  if (options.beforeRedirects.config) {
    options.beforeRedirects.config(options);
  }
}

/**
 * If the proxy or config afterRedirects functions are defined, call them with the options
 *
 * @param {http.ClientRequestArgs} options
 * @param {AxiosProxyConfig} configProxy configuration from Axios options object
 * @param {string} location
 *
 * @returns {http.ClientRequestArgs}
 */
function setProxy(options, configProxy, location) {
  let proxy = configProxy;
  if (!proxy && proxy !== false) {
    const proxyUrl = (0,proxy_from_env/* getProxyForUrl */.j)(location);
    if (proxyUrl) {
      proxy = new URL(proxyUrl);
    }
  }
  if (proxy) {
    // Basic proxy authorization
    if (proxy.username) {
      proxy.auth = (proxy.username || '') + ':' + (proxy.password || '');
    }

    if (proxy.auth) {
      // Support proxy auth object form
      if (proxy.auth.username || proxy.auth.password) {
        proxy.auth = (proxy.auth.username || '') + ':' + (proxy.auth.password || '');
      }
      const base64 = Buffer
        .from(proxy.auth, 'utf8')
        .toString('base64');
      options.headers['Proxy-Authorization'] = 'Basic ' + base64;
    }

    options.headers.host = options.hostname + (options.port ? ':' + options.port : '');
    const proxyHost = proxy.hostname || proxy.host;
    options.hostname = proxyHost;
    // Replace 'host' since options is not a URL object
    options.host = proxyHost;
    options.port = proxy.port;
    options.path = location;
    if (proxy.protocol) {
      options.protocol = proxy.protocol.includes(':') ? proxy.protocol : `${proxy.protocol}:`;
    }
  }

  options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
    // Configure proxy for redirected request, passing the original config proxy to apply
    // the exact same logic as if the redirected request was performed by axios directly.
    setProxy(redirectOptions, configProxy, redirectOptions.href);
  };
}

const isHttpAdapterSupported = typeof process !== 'undefined' && utils.kindOf(process) === 'process';

// temporary hotfix

const wrapAsync = (asyncExecutor) => {
  return new Promise((resolve, reject) => {
    let onDone;
    let isDone;

    const done = (value, isRejected) => {
      if (isDone) return;
      isDone = true;
      onDone && onDone(value, isRejected);
    }

    const _resolve = (value) => {
      done(value);
      resolve(value);
    };

    const _reject = (reason) => {
      done(reason, true);
      reject(reason);
    }

    asyncExecutor(_resolve, _reject, (onDoneHandler) => (onDone = onDoneHandler)).catch(_reject);
  })
};

/*eslint consistent-return:0*/
/* harmony default export */ const http = (isHttpAdapterSupported && function httpAdapter(config) {
  return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
    let {data, lookup, family} = config;
    const {responseType, responseEncoding} = config;
    const method = config.method.toUpperCase();
    let isDone;
    let rejected = false;
    let req;

    if (lookup && utils.isAsyncFn(lookup)) {
      lookup = helpers_callbackify(lookup, (entry) => {
        if(utils.isString(entry)) {
          entry = [entry, entry.indexOf('.') < 0 ? 6 : 4]
        } else if (!utils.isArray(entry)) {
          throw new TypeError('lookup async function must return an array [ip: string, family: number]]')
        }
        return entry;
      })
    }

    // temporary internal emitter until the AxiosRequest class will be implemented
    const emitter = new external_events_();

    const onFinished = () => {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(abort);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', abort);
      }

      emitter.removeAllListeners();
    }

    onDone((value, isRejected) => {
      isDone = true;
      if (isRejected) {
        rejected = true;
        onFinished();
      }
    });

    function abort(reason) {
      emitter.emit('abort', !reason || reason.type ? new cancel_CanceledError(null, config, req) : reason);
    }

    emitter.once('abort', reject);

    if (config.cancelToken || config.signal) {
      config.cancelToken && config.cancelToken.subscribe(abort);
      if (config.signal) {
        config.signal.aborted ? abort() : config.signal.addEventListener('abort', abort);
      }
    }

    // Parse url
    const fullPath = buildFullPath(config.baseURL, config.url);
    const parsed = new URL(fullPath, 'http://localhost');
    const protocol = parsed.protocol || supportedProtocols[0];

    if (protocol === 'data:') {
      let convertedData;

      if (method !== 'GET') {
        return settle(resolve, reject, {
          status: 405,
          statusText: 'method not allowed',
          headers: {},
          config
        });
      }

      try {
        convertedData = fromDataURI(config.url, responseType === 'blob', {
          Blob: config.env && config.env.Blob
        });
      } catch (err) {
        throw core_AxiosError.from(err, core_AxiosError.ERR_BAD_REQUEST, config);
      }

      if (responseType === 'text') {
        convertedData = convertedData.toString(responseEncoding);

        if (!responseEncoding || responseEncoding === 'utf8') {
          convertedData = utils.stripBOM(convertedData);
        }
      } else if (responseType === 'stream') {
        convertedData = external_stream_.Readable.from(convertedData);
      }

      return settle(resolve, reject, {
        data: convertedData,
        status: 200,
        statusText: 'OK',
        headers: new core_AxiosHeaders(),
        config
      });
    }

    if (supportedProtocols.indexOf(protocol) === -1) {
      return reject(new core_AxiosError(
        'Unsupported protocol ' + protocol,
        core_AxiosError.ERR_BAD_REQUEST,
        config
      ));
    }

    const headers = core_AxiosHeaders.from(config.headers).normalize();

    // Set User-Agent (required by some servers)
    // See https://github.com/axios/axios/issues/69
    // User-Agent is specified; handle case where no UA header is desired
    // Only set header if it hasn't been set in config
    headers.set('User-Agent', 'axios/' + VERSION, false);

    const onDownloadProgress = config.onDownloadProgress;
    const onUploadProgress = config.onUploadProgress;
    const maxRate = config.maxRate;
    let maxUploadRate = undefined;
    let maxDownloadRate = undefined;

    // support for spec compliant FormData objects
    if (utils.isSpecCompliantForm(data)) {
      const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);

      data = helpers_formDataToStream(data, (formHeaders) => {
        headers.set(formHeaders);
      }, {
        tag: `axios-${VERSION}-boundary`,
        boundary: userBoundary && userBoundary[1] || undefined
      });
      // support for https://www.npmjs.com/package/form-data api
    } else if (utils.isFormData(data) && utils.isFunction(data.getHeaders)) {
      headers.set(data.getHeaders());

      if (!headers.hasContentLength()) {
        try {
          const knownLength = await external_util_.promisify(data.getLength).call(data);
          Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
          /*eslint no-empty:0*/
        } catch (e) {
        }
      }
    } else if (utils.isBlob(data)) {
      data.size && headers.setContentType(data.type || 'application/octet-stream');
      headers.setContentLength(data.size || 0);
      data = external_stream_.Readable.from(helpers_readBlob(data));
    } else if (data && !utils.isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (utils.isArrayBuffer(data)) {
        data = Buffer.from(new Uint8Array(data));
      } else if (utils.isString(data)) {
        data = Buffer.from(data, 'utf-8');
      } else {
        return reject(new core_AxiosError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          core_AxiosError.ERR_BAD_REQUEST,
          config
        ));
      }

      // Add Content-Length header if data exists
      headers.setContentLength(data.length, false);

      if (config.maxBodyLength > -1 && data.length > config.maxBodyLength) {
        return reject(new core_AxiosError(
          'Request body larger than maxBodyLength limit',
          core_AxiosError.ERR_BAD_REQUEST,
          config
        ));
      }
    }

    const contentLength = utils.toFiniteNumber(headers.getContentLength());

    if (utils.isArray(maxRate)) {
      maxUploadRate = maxRate[0];
      maxDownloadRate = maxRate[1];
    } else {
      maxUploadRate = maxDownloadRate = maxRate;
    }

    if (data && (onUploadProgress || maxUploadRate)) {
      if (!utils.isStream(data)) {
        data = external_stream_.Readable.from(data, {objectMode: false});
      }

      data = external_stream_.pipeline([data, new helpers_AxiosTransformStream({
        length: contentLength,
        maxRate: utils.toFiniteNumber(maxUploadRate)
      })], utils.noop);

      onUploadProgress && data.on('progress', progress => {
        onUploadProgress(Object.assign(progress, {
          upload: true
        }));
      });
    }

    // HTTP basic authentication
    let auth = undefined;
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password || '';
      auth = username + ':' + password;
    }

    if (!auth && parsed.username) {
      const urlUsername = parsed.username;
      const urlPassword = parsed.password;
      auth = urlUsername + ':' + urlPassword;
    }

    auth && headers.delete('authorization');

    let path;

    try {
      path = buildURL(
        parsed.pathname + parsed.search,
        config.params,
        config.paramsSerializer
      ).replace(/^\?/, '');
    } catch (err) {
      const customErr = new Error(err.message);
      customErr.config = config;
      customErr.url = config.url;
      customErr.exists = true;
      return reject(customErr);
    }

    headers.set(
      'Accept-Encoding',
      'gzip, compress, deflate' + (isBrotliSupported ? ', br' : ''), false
      );

    const options = {
      path,
      method: method,
      headers: headers.toJSON(),
      agents: { http: config.httpAgent, https: config.httpsAgent },
      auth,
      protocol,
      family,
      beforeRedirect: dispatchBeforeRedirect,
      beforeRedirects: {}
    };

    // cacheable-lookup integration hotfix
    !utils.isUndefined(lookup) && (options.lookup = lookup);

    if (config.socketPath) {
      options.socketPath = config.socketPath;
    } else {
      options.hostname = parsed.hostname;
      options.port = parsed.port;
      setProxy(options, config.proxy, protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path);
    }

    let transport;
    const isHttpsRequest = isHttps.test(options.protocol);
    options.agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
    if (config.transport) {
      transport = config.transport;
    } else if (config.maxRedirects === 0) {
      transport = isHttpsRequest ? external_https_ : external_http_;
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects;
      }
      if (config.beforeRedirect) {
        options.beforeRedirects.config = config.beforeRedirect;
      }
      transport = isHttpsRequest ? httpsFollow : httpFollow;
    }

    if (config.maxBodyLength > -1) {
      options.maxBodyLength = config.maxBodyLength;
    } else {
      // follow-redirects does not skip comparison, so it should always succeed for axios -1 unlimited
      options.maxBodyLength = Infinity;
    }

    if (config.insecureHTTPParser) {
      options.insecureHTTPParser = config.insecureHTTPParser;
    }

    // Create the request
    req = transport.request(options, function handleResponse(res) {
      if (req.destroyed) return;

      const streams = [res];

      const responseLength = +res.headers['content-length'];

      if (onDownloadProgress) {
        const transformStream = new helpers_AxiosTransformStream({
          length: utils.toFiniteNumber(responseLength),
          maxRate: utils.toFiniteNumber(maxDownloadRate)
        });

        onDownloadProgress && transformStream.on('progress', progress => {
          onDownloadProgress(Object.assign(progress, {
            download: true
          }));
        });

        streams.push(transformStream);
      }

      // decompress the response body transparently if required
      let responseStream = res;

      // return the last request in case of redirects
      const lastRequest = res.req || req;

      // if decompress disabled we should not decompress
      if (config.decompress !== false && res.headers['content-encoding']) {
        // if no content, but headers still say that it is encoded,
        // remove the header not confuse downstream operations
        if (method === 'HEAD' || res.statusCode === 204) {
          delete res.headers['content-encoding'];
        }

        switch (res.headers['content-encoding']) {
        /*eslint default-case:0*/
        case 'gzip':
        case 'x-gzip':
        case 'compress':
        case 'x-compress':
          // add the unzipper to the body stream processing pipeline
          streams.push(external_zlib_.createUnzip(zlibOptions));

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
        case 'deflate':
          streams.push(new helpers_ZlibHeaderTransformStream());

          // add the unzipper to the body stream processing pipeline
          streams.push(external_zlib_.createUnzip(zlibOptions));

          // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding'];
          break;
        case 'br':
          if (isBrotliSupported) {
            streams.push(external_zlib_.createBrotliDecompress(brotliOptions));
            delete res.headers['content-encoding'];
          }
        }
      }

      responseStream = streams.length > 1 ? external_stream_.pipeline(streams, utils.noop) : streams[0];

      const offListeners = external_stream_.finished(responseStream, () => {
        offListeners();
        onFinished();
      });

      const response = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: new core_AxiosHeaders(res.headers),
        config,
        request: lastRequest
      };

      if (responseType === 'stream') {
        response.data = responseStream;
        settle(resolve, reject, response);
      } else {
        const responseBuffer = [];
        let totalResponseBytes = 0;

        responseStream.on('data', function handleStreamData(chunk) {
          responseBuffer.push(chunk);
          totalResponseBytes += chunk.length;

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
            // stream.destroy() emit aborted event before calling reject() on Node.js v16
            rejected = true;
            responseStream.destroy();
            reject(new core_AxiosError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              core_AxiosError.ERR_BAD_RESPONSE, config, lastRequest));
          }
        });

        responseStream.on('aborted', function handlerStreamAborted() {
          if (rejected) {
            return;
          }

          const err = new core_AxiosError(
            'maxContentLength size of ' + config.maxContentLength + ' exceeded',
            core_AxiosError.ERR_BAD_RESPONSE,
            config,
            lastRequest
          );
          responseStream.destroy(err);
          reject(err);
        });

        responseStream.on('error', function handleStreamError(err) {
          if (req.destroyed) return;
          reject(core_AxiosError.from(err, null, config, lastRequest));
        });

        responseStream.on('end', function handleStreamEnd() {
          try {
            let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
            if (responseType !== 'arraybuffer') {
              responseData = responseData.toString(responseEncoding);
              if (!responseEncoding || responseEncoding === 'utf8') {
                responseData = utils.stripBOM(responseData);
              }
            }
            response.data = responseData;
          } catch (err) {
            reject(core_AxiosError.from(err, null, config, response.request, response));
          }
          settle(resolve, reject, response);
        });
      }

      emitter.once('abort', err => {
        if (!responseStream.destroyed) {
          responseStream.emit('error', err);
          responseStream.destroy();
        }
      });
    });

    emitter.once('abort', err => {
      reject(err);
      req.destroy(err);
    });

    // Handle errors
    req.on('error', function handleRequestError(err) {
      // @todo remove
      // if (req.aborted && err.code !== AxiosError.ERR_FR_TOO_MANY_REDIRECTS) return;
      reject(core_AxiosError.from(err, null, config, req));
    });

    // set tcp keep alive to prevent drop connection by peer
    req.on('socket', function handleRequestSocket(socket) {
      // default interval of sending ack packet is 1 minute
      socket.setKeepAlive(true, 1000 * 60);
    });

    // Handle request timeout
    if (config.timeout) {
      // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
      const timeout = parseInt(config.timeout, 10);

      if (isNaN(timeout)) {
        reject(new core_AxiosError(
          'error trying to parse `config.timeout` to int',
          core_AxiosError.ERR_BAD_OPTION_VALUE,
          config,
          req
        ));

        return;
      }

      // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
      // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
      // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
      // And then these socket which be hang up will devouring CPU little by little.
      // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
      req.setTimeout(timeout, function handleRequestTimeout() {
        if (isDone) return;
        let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
        const transitional = config.transitional || defaults_transitional;
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(new core_AxiosError(
          timeoutErrorMessage,
          transitional.clarifyTimeoutError ? core_AxiosError.ETIMEDOUT : core_AxiosError.ECONNABORTED,
          config,
          req
        ));
        abort();
      });
    }


    // Send the request
    if (utils.isStream(data)) {
      let ended = false;
      let errored = false;

      data.on('end', () => {
        ended = true;
      });

      data.once('error', err => {
        errored = true;
        req.destroy(err);
      });

      data.on('close', () => {
        if (!ended && !errored) {
          abort(new cancel_CanceledError('Request stream has been aborted', config, req));
        }
      });

      data.pipe(req);
    } else {
      req.end(data);
    }
  });
});

const __setProxy = (/* unused pure expression or super */ null && (setProxy));

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/cookies.js





/* harmony default export */ const cookies = (node.isStandardBrowserEnv ?

// Standard browser envs support document.cookie
  (function standardBrowserEnv() {
    return {
      write: function write(name, value, expires, path, domain, secure) {
        const cookie = [];
        cookie.push(name + '=' + encodeURIComponent(value));

        if (utils.isNumber(expires)) {
          cookie.push('expires=' + new Date(expires).toGMTString());
        }

        if (utils.isString(path)) {
          cookie.push('path=' + path);
        }

        if (utils.isString(domain)) {
          cookie.push('domain=' + domain);
        }

        if (secure === true) {
          cookie.push('secure');
        }

        document.cookie = cookie.join('; ');
      },

      read: function read(name) {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return (match ? decodeURIComponent(match[3]) : null);
      },

      remove: function remove(name) {
        this.write(name, '', Date.now() - 86400000);
      }
    };
  })() :

// Non standard browser env (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return {
      write: function write() {},
      read: function read() { return null; },
      remove: function remove() {}
    };
  })());

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/isURLSameOrigin.js





/* harmony default export */ const isURLSameOrigin = (node.isStandardBrowserEnv ?

// Standard browser envs have full support of the APIs needed to test
// whether the request URL is of the same origin as current location.
  (function standardBrowserEnv() {
    const msie = /(msie|trident)/i.test(navigator.userAgent);
    const urlParsingNode = document.createElement('a');
    let originURL;

    /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
    function resolveURL(url) {
      let href = url;

      if (msie) {
        // IE needs attribute set twice to normalize properties
        urlParsingNode.setAttribute('href', href);
        href = urlParsingNode.href;
      }

      urlParsingNode.setAttribute('href', href);

      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
      return {
        href: urlParsingNode.href,
        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
        host: urlParsingNode.host,
        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
        hostname: urlParsingNode.hostname,
        port: urlParsingNode.port,
        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
          urlParsingNode.pathname :
          '/' + urlParsingNode.pathname
      };
    }

    originURL = resolveURL(window.location.href);

    /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
    return function isURLSameOrigin(requestURL) {
      const parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
      return (parsed.protocol === originURL.protocol &&
          parsed.host === originURL.host);
    };
  })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return function isURLSameOrigin() {
      return true;
    };
  })());

;// CONCATENATED MODULE: ./node_modules/axios/lib/adapters/xhr.js
















function progressEventReducer(listener, isDownloadStream) {
  let bytesNotified = 0;
  const _speedometer = helpers_speedometer(50, 250);

  return e => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : undefined;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;

    bytesNotified = loaded;

    const data = {
      loaded,
      total,
      progress: total ? (loaded / total) : undefined,
      bytes: progressBytes,
      rate: rate ? rate : undefined,
      estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
      event: e
    };

    data[isDownloadStream ? 'download' : 'upload'] = true;

    listener(data);
  };
}

const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

/* harmony default export */ const xhr = (isXHRAdapterSupported && function (config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    let requestData = config.data;
    const requestHeaders = core_AxiosHeaders.from(config.headers).normalize();
    const responseType = config.responseType;
    let onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData)) {
      if (node.isStandardBrowserEnv || node.isStandardBrowserWebWorkerEnv) {
        requestHeaders.setContentType(false); // Let the browser set it
      } else {
        requestHeaders.setContentType('multipart/form-data;', false); // mobile/desktop app frameworks
      }
    }

    let request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.set('Authorization', 'Basic ' + btoa(username + ':' + password));
    }

    const fullPath = buildFullPath(config.baseURL, config.url);

    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      const responseHeaders = core_AxiosHeaders.from(
        'getAllResponseHeaders' in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
        request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new core_AxiosError('Request aborted', core_AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new core_AxiosError('Network Error', core_AxiosError.ERR_NETWORK, config, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      const transitional = config.transitional || defaults_transitional;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new core_AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? core_AxiosError.ETIMEDOUT : core_AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (node.isStandardBrowserEnv) {
      // Add xsrf header
      const xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath))
        && config.xsrfCookieName && cookies.read(config.xsrfCookieName);

      if (xsrfValue) {
        requestHeaders.set(config.xsrfHeaderName, xsrfValue);
      }
    }

    // Remove Content-Type if data is undefined
    requestData === undefined && requestHeaders.setContentType(null);

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', progressEventReducer(config.onDownloadProgress, true));
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', progressEventReducer(config.onUploadProgress));
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = cancel => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new cancel_CanceledError(null, config, request) : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    const protocol = parseProtocol(fullPath);

    if (protocol && node.protocols.indexOf(protocol) === -1) {
      reject(new core_AxiosError('Unsupported protocol ' + protocol + ':', core_AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData || null);
  });
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/adapters/adapters.js





const knownAdapters = {
  http: http,
  xhr: xhr
}

utils.forEach(knownAdapters, (fn, value) => {
  if(fn) {
    try {
      Object.defineProperty(fn, 'name', {value});
    } catch (e) {
      // eslint-disable-next-line no-empty
    }
    Object.defineProperty(fn, 'adapterName', {value});
  }
});

/* harmony default export */ const adapters = ({
  getAdapter: (adapters) => {
    adapters = utils.isArray(adapters) ? adapters : [adapters];

    const {length} = adapters;
    let nameOrAdapter;
    let adapter;

    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters[i];
      if((adapter = utils.isString(nameOrAdapter) ? knownAdapters[nameOrAdapter.toLowerCase()] : nameOrAdapter)) {
        break;
      }
    }

    if (!adapter) {
      if (adapter === false) {
        throw new core_AxiosError(
          `Adapter ${nameOrAdapter} is not supported by the environment`,
          'ERR_NOT_SUPPORT'
        );
      }

      throw new Error(
        utils.hasOwnProp(knownAdapters, nameOrAdapter) ?
          `Adapter '${nameOrAdapter}' is not available in the build` :
          `Unknown adapter '${nameOrAdapter}'`
      );
    }

    if (!utils.isFunction(adapter)) {
      throw new TypeError('adapter is not a function');
    }

    return adapter;
  },
  adapters: knownAdapters
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/dispatchRequest.js









/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new cancel_CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = core_AxiosHeaders.from(config.headers);

  // Transform request data
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || lib_defaults.adapter);

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      config.transformResponse,
      response
    );

    response.headers = core_AxiosHeaders.from(response.headers);

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          config.transformResponse,
          reason.response
        );
        reason.response.headers = core_AxiosHeaders.from(reason.response.headers);
      }
    }

    return Promise.reject(reason);
  });
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/mergeConfig.js





const headersToObject = (thing) => thing instanceof core_AxiosHeaders ? thing.toJSON() : thing;

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 *
 * @returns {Object} New object resulting from merging config2 to config1
 */
function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  const config = {};

  function getMergedValue(target, source, caseless) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge.call({caseless}, target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(a, b, caseless) {
    if (!utils.isUndefined(b)) {
      return getMergedValue(a, b, caseless);
    } else if (!utils.isUndefined(a)) {
      return getMergedValue(undefined, a, caseless);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(a, b) {
    if (!utils.isUndefined(b)) {
      return getMergedValue(undefined, b);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(a, b) {
    if (!utils.isUndefined(b)) {
      return getMergedValue(undefined, b);
    } else if (!utils.isUndefined(a)) {
      return getMergedValue(undefined, a);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(undefined, a);
    }
  }

  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b) => mergeDeepProperties(headersToObject(a), headersToObject(b), true)
  };

  utils.forEach(Object.keys(Object.assign({}, config1, config2)), function computeConfigValue(prop) {
    const merge = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge(config1[prop], config2[prop], prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/validator.js





const validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

const deprecatedWarnings = {};

/**
 * Transitional option validator
 *
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 *
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return (value, opt, opts) => {
    if (validator === false) {
      throw new core_AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        core_AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 *
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 *
 * @returns {object}
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new core_AxiosError('options must be an object', core_AxiosError.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new core_AxiosError('option ' + opt + ' must be ' + result, core_AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new core_AxiosError('Unknown option ' + opt, core_AxiosError.ERR_BAD_OPTION);
    }
  }
}

/* harmony default export */ const validator = ({
  assertOptions,
  validators
});

;// CONCATENATED MODULE: ./node_modules/axios/lib/core/Axios.js











const Axios_validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 */
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new core_InterceptorManager(),
      response: new core_InterceptorManager()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    config = mergeConfig(this.defaults, config);

    const {transitional, paramsSerializer, headers} = config;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: Axios_validators.transitional(Axios_validators.boolean),
        forcedJSONParsing: Axios_validators.transitional(Axios_validators.boolean),
        clarifyTimeoutError: Axios_validators.transitional(Axios_validators.boolean)
      }, false);
    }

    if (paramsSerializer != null) {
      if (utils.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        }
      } else {
        validator.assertOptions(paramsSerializer, {
          encode: Axios_validators.function,
          serialize: Axios_validators.function
        }, true);
      }
    }

    // Set config.method
    config.method = (config.method || this.defaults.method || 'get').toLowerCase();

    // Flatten headers
    let contextHeaders = headers && utils.merge(
      headers.common,
      headers[config.method]
    );

    headers && utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      (method) => {
        delete headers[method];
      }
    );

    config.headers = core_AxiosHeaders.concat(contextHeaders, headers);

    // filter out skipped interceptors
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), undefined];
      chain.unshift.apply(chain, requestInterceptorChain);
      chain.push.apply(chain, responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }

      return promise;
    }

    len = requestInterceptorChain.length;

    let newConfig = config;

    i = 0;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }

    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    i = 0;
    len = responseInterceptorChain.length;

    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }

    return promise;
  }

  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url,
        data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

/* harmony default export */ const core_Axios = (Axios);

;// CONCATENATED MODULE: ./node_modules/axios/lib/cancel/CancelToken.js




/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param {Function} executor The executor function.
 *
 * @returns {CancelToken}
 */
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    let resolvePromise;

    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    const token = this;

    // eslint-disable-next-line func-names
    this.promise.then(cancel => {
      if (!token._listeners) return;

      let i = token._listeners.length;

      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });

    // eslint-disable-next-line func-names
    this.promise.then = onfulfilled => {
      let _resolve;
      // eslint-disable-next-line func-names
      const promise = new Promise(resolve => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);

      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };

      return promise;
    };

    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new cancel_CanceledError(message, config, request);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }

  /**
   * Subscribe to the cancel signal
   */

  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }

    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */

  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}

/* harmony default export */ const cancel_CancelToken = (CancelToken);

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/spread.js


/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 *
 * @returns {Function}
 */
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/isAxiosError.js




/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 *
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
}

;// CONCATENATED MODULE: ./node_modules/axios/lib/helpers/HttpStatusCode.js
const HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};

Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});

/* harmony default export */ const helpers_HttpStatusCode = (HttpStatusCode);

;// CONCATENATED MODULE: ./node_modules/axios/lib/axios.js




















/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  const context = new core_Axios(defaultConfig);
  const instance = bind(core_Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, core_Axios.prototype, context, {allOwnKeys: true});

  // Copy context to instance
  utils.extend(instance, context, null, {allOwnKeys: true});

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(lib_defaults);

// Expose Axios class to allow class inheritance
axios.Axios = core_Axios;

// Expose Cancel & CancelToken
axios.CanceledError = cancel_CanceledError;
axios.CancelToken = cancel_CancelToken;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = helpers_toFormData;

// Expose AxiosError class
axios.AxiosError = core_AxiosError;

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Expose mergeConfig
axios.mergeConfig = mergeConfig;

axios.AxiosHeaders = core_AxiosHeaders;

axios.formToJSON = thing => helpers_formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

axios.getAdapter = adapters.getAdapter;

axios.HttpStatusCode = helpers_HttpStatusCode;

axios.default = axios;

// this module should only have a default export
/* harmony default export */ const lib_axios = (axios);


/***/ }),

/***/ 40572:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"application/1d-interleaved-parityfec":{"source":"iana"},"application/3gpdash-qoe-report+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/3gpp-ims+xml":{"source":"iana","compressible":true},"application/3gpphal+json":{"source":"iana","compressible":true},"application/3gpphalforms+json":{"source":"iana","compressible":true},"application/a2l":{"source":"iana"},"application/ace+cbor":{"source":"iana"},"application/activemessage":{"source":"iana"},"application/activity+json":{"source":"iana","compressible":true},"application/alto-costmap+json":{"source":"iana","compressible":true},"application/alto-costmapfilter+json":{"source":"iana","compressible":true},"application/alto-directory+json":{"source":"iana","compressible":true},"application/alto-endpointcost+json":{"source":"iana","compressible":true},"application/alto-endpointcostparams+json":{"source":"iana","compressible":true},"application/alto-endpointprop+json":{"source":"iana","compressible":true},"application/alto-endpointpropparams+json":{"source":"iana","compressible":true},"application/alto-error+json":{"source":"iana","compressible":true},"application/alto-networkmap+json":{"source":"iana","compressible":true},"application/alto-networkmapfilter+json":{"source":"iana","compressible":true},"application/alto-updatestreamcontrol+json":{"source":"iana","compressible":true},"application/alto-updatestreamparams+json":{"source":"iana","compressible":true},"application/aml":{"source":"iana"},"application/andrew-inset":{"source":"iana","extensions":["ez"]},"application/applefile":{"source":"iana"},"application/applixware":{"source":"apache","extensions":["aw"]},"application/at+jwt":{"source":"iana"},"application/atf":{"source":"iana"},"application/atfx":{"source":"iana"},"application/atom+xml":{"source":"iana","compressible":true,"extensions":["atom"]},"application/atomcat+xml":{"source":"iana","compressible":true,"extensions":["atomcat"]},"application/atomdeleted+xml":{"source":"iana","compressible":true,"extensions":["atomdeleted"]},"application/atomicmail":{"source":"iana"},"application/atomsvc+xml":{"source":"iana","compressible":true,"extensions":["atomsvc"]},"application/atsc-dwd+xml":{"source":"iana","compressible":true,"extensions":["dwd"]},"application/atsc-dynamic-event-message":{"source":"iana"},"application/atsc-held+xml":{"source":"iana","compressible":true,"extensions":["held"]},"application/atsc-rdt+json":{"source":"iana","compressible":true},"application/atsc-rsat+xml":{"source":"iana","compressible":true,"extensions":["rsat"]},"application/atxml":{"source":"iana"},"application/auth-policy+xml":{"source":"iana","compressible":true},"application/bacnet-xdd+zip":{"source":"iana","compressible":false},"application/batch-smtp":{"source":"iana"},"application/bdoc":{"compressible":false,"extensions":["bdoc"]},"application/beep+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/calendar+json":{"source":"iana","compressible":true},"application/calendar+xml":{"source":"iana","compressible":true,"extensions":["xcs"]},"application/call-completion":{"source":"iana"},"application/cals-1840":{"source":"iana"},"application/captive+json":{"source":"iana","compressible":true},"application/cbor":{"source":"iana"},"application/cbor-seq":{"source":"iana"},"application/cccex":{"source":"iana"},"application/ccmp+xml":{"source":"iana","compressible":true},"application/ccxml+xml":{"source":"iana","compressible":true,"extensions":["ccxml"]},"application/cdfx+xml":{"source":"iana","compressible":true,"extensions":["cdfx"]},"application/cdmi-capability":{"source":"iana","extensions":["cdmia"]},"application/cdmi-container":{"source":"iana","extensions":["cdmic"]},"application/cdmi-domain":{"source":"iana","extensions":["cdmid"]},"application/cdmi-object":{"source":"iana","extensions":["cdmio"]},"application/cdmi-queue":{"source":"iana","extensions":["cdmiq"]},"application/cdni":{"source":"iana"},"application/cea":{"source":"iana"},"application/cea-2018+xml":{"source":"iana","compressible":true},"application/cellml+xml":{"source":"iana","compressible":true},"application/cfw":{"source":"iana"},"application/city+json":{"source":"iana","compressible":true},"application/clr":{"source":"iana"},"application/clue+xml":{"source":"iana","compressible":true},"application/clue_info+xml":{"source":"iana","compressible":true},"application/cms":{"source":"iana"},"application/cnrp+xml":{"source":"iana","compressible":true},"application/coap-group+json":{"source":"iana","compressible":true},"application/coap-payload":{"source":"iana"},"application/commonground":{"source":"iana"},"application/conference-info+xml":{"source":"iana","compressible":true},"application/cose":{"source":"iana"},"application/cose-key":{"source":"iana"},"application/cose-key-set":{"source":"iana"},"application/cpl+xml":{"source":"iana","compressible":true,"extensions":["cpl"]},"application/csrattrs":{"source":"iana"},"application/csta+xml":{"source":"iana","compressible":true},"application/cstadata+xml":{"source":"iana","compressible":true},"application/csvm+json":{"source":"iana","compressible":true},"application/cu-seeme":{"source":"apache","extensions":["cu"]},"application/cwt":{"source":"iana"},"application/cybercash":{"source":"iana"},"application/dart":{"compressible":true},"application/dash+xml":{"source":"iana","compressible":true,"extensions":["mpd"]},"application/dash-patch+xml":{"source":"iana","compressible":true,"extensions":["mpp"]},"application/dashdelta":{"source":"iana"},"application/davmount+xml":{"source":"iana","compressible":true,"extensions":["davmount"]},"application/dca-rft":{"source":"iana"},"application/dcd":{"source":"iana"},"application/dec-dx":{"source":"iana"},"application/dialog-info+xml":{"source":"iana","compressible":true},"application/dicom":{"source":"iana"},"application/dicom+json":{"source":"iana","compressible":true},"application/dicom+xml":{"source":"iana","compressible":true},"application/dii":{"source":"iana"},"application/dit":{"source":"iana"},"application/dns":{"source":"iana"},"application/dns+json":{"source":"iana","compressible":true},"application/dns-message":{"source":"iana"},"application/docbook+xml":{"source":"apache","compressible":true,"extensions":["dbk"]},"application/dots+cbor":{"source":"iana"},"application/dskpp+xml":{"source":"iana","compressible":true},"application/dssc+der":{"source":"iana","extensions":["dssc"]},"application/dssc+xml":{"source":"iana","compressible":true,"extensions":["xdssc"]},"application/dvcs":{"source":"iana"},"application/ecmascript":{"source":"iana","compressible":true,"extensions":["es","ecma"]},"application/edi-consent":{"source":"iana"},"application/edi-x12":{"source":"iana","compressible":false},"application/edifact":{"source":"iana","compressible":false},"application/efi":{"source":"iana"},"application/elm+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/elm+xml":{"source":"iana","compressible":true},"application/emergencycalldata.cap+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/emergencycalldata.comment+xml":{"source":"iana","compressible":true},"application/emergencycalldata.control+xml":{"source":"iana","compressible":true},"application/emergencycalldata.deviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.ecall.msd":{"source":"iana"},"application/emergencycalldata.providerinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.serviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.subscriberinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.veds+xml":{"source":"iana","compressible":true},"application/emma+xml":{"source":"iana","compressible":true,"extensions":["emma"]},"application/emotionml+xml":{"source":"iana","compressible":true,"extensions":["emotionml"]},"application/encaprtp":{"source":"iana"},"application/epp+xml":{"source":"iana","compressible":true},"application/epub+zip":{"source":"iana","compressible":false,"extensions":["epub"]},"application/eshop":{"source":"iana"},"application/exi":{"source":"iana","extensions":["exi"]},"application/expect-ct-report+json":{"source":"iana","compressible":true},"application/express":{"source":"iana","extensions":["exp"]},"application/fastinfoset":{"source":"iana"},"application/fastsoap":{"source":"iana"},"application/fdt+xml":{"source":"iana","compressible":true,"extensions":["fdt"]},"application/fhir+json":{"source":"iana","charset":"UTF-8","compressible":true},"application/fhir+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/fido.trusted-apps+json":{"compressible":true},"application/fits":{"source":"iana"},"application/flexfec":{"source":"iana"},"application/font-sfnt":{"source":"iana"},"application/font-tdpfr":{"source":"iana","extensions":["pfr"]},"application/font-woff":{"source":"iana","compressible":false},"application/framework-attributes+xml":{"source":"iana","compressible":true},"application/geo+json":{"source":"iana","compressible":true,"extensions":["geojson"]},"application/geo+json-seq":{"source":"iana"},"application/geopackage+sqlite3":{"source":"iana"},"application/geoxacml+xml":{"source":"iana","compressible":true},"application/gltf-buffer":{"source":"iana"},"application/gml+xml":{"source":"iana","compressible":true,"extensions":["gml"]},"application/gpx+xml":{"source":"apache","compressible":true,"extensions":["gpx"]},"application/gxf":{"source":"apache","extensions":["gxf"]},"application/gzip":{"source":"iana","compressible":false,"extensions":["gz"]},"application/h224":{"source":"iana"},"application/held+xml":{"source":"iana","compressible":true},"application/hjson":{"extensions":["hjson"]},"application/http":{"source":"iana"},"application/hyperstudio":{"source":"iana","extensions":["stk"]},"application/ibe-key-request+xml":{"source":"iana","compressible":true},"application/ibe-pkg-reply+xml":{"source":"iana","compressible":true},"application/ibe-pp-data":{"source":"iana"},"application/iges":{"source":"iana"},"application/im-iscomposing+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/index":{"source":"iana"},"application/index.cmd":{"source":"iana"},"application/index.obj":{"source":"iana"},"application/index.response":{"source":"iana"},"application/index.vnd":{"source":"iana"},"application/inkml+xml":{"source":"iana","compressible":true,"extensions":["ink","inkml"]},"application/iotp":{"source":"iana"},"application/ipfix":{"source":"iana","extensions":["ipfix"]},"application/ipp":{"source":"iana"},"application/isup":{"source":"iana"},"application/its+xml":{"source":"iana","compressible":true,"extensions":["its"]},"application/java-archive":{"source":"apache","compressible":false,"extensions":["jar","war","ear"]},"application/java-serialized-object":{"source":"apache","compressible":false,"extensions":["ser"]},"application/java-vm":{"source":"apache","compressible":false,"extensions":["class"]},"application/javascript":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["js","mjs"]},"application/jf2feed+json":{"source":"iana","compressible":true},"application/jose":{"source":"iana"},"application/jose+json":{"source":"iana","compressible":true},"application/jrd+json":{"source":"iana","compressible":true},"application/jscalendar+json":{"source":"iana","compressible":true},"application/json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["json","map"]},"application/json-patch+json":{"source":"iana","compressible":true},"application/json-seq":{"source":"iana"},"application/json5":{"extensions":["json5"]},"application/jsonml+json":{"source":"apache","compressible":true,"extensions":["jsonml"]},"application/jwk+json":{"source":"iana","compressible":true},"application/jwk-set+json":{"source":"iana","compressible":true},"application/jwt":{"source":"iana"},"application/kpml-request+xml":{"source":"iana","compressible":true},"application/kpml-response+xml":{"source":"iana","compressible":true},"application/ld+json":{"source":"iana","compressible":true,"extensions":["jsonld"]},"application/lgr+xml":{"source":"iana","compressible":true,"extensions":["lgr"]},"application/link-format":{"source":"iana"},"application/load-control+xml":{"source":"iana","compressible":true},"application/lost+xml":{"source":"iana","compressible":true,"extensions":["lostxml"]},"application/lostsync+xml":{"source":"iana","compressible":true},"application/lpf+zip":{"source":"iana","compressible":false},"application/lxf":{"source":"iana"},"application/mac-binhex40":{"source":"iana","extensions":["hqx"]},"application/mac-compactpro":{"source":"apache","extensions":["cpt"]},"application/macwriteii":{"source":"iana"},"application/mads+xml":{"source":"iana","compressible":true,"extensions":["mads"]},"application/manifest+json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["webmanifest"]},"application/marc":{"source":"iana","extensions":["mrc"]},"application/marcxml+xml":{"source":"iana","compressible":true,"extensions":["mrcx"]},"application/mathematica":{"source":"iana","extensions":["ma","nb","mb"]},"application/mathml+xml":{"source":"iana","compressible":true,"extensions":["mathml"]},"application/mathml-content+xml":{"source":"iana","compressible":true},"application/mathml-presentation+xml":{"source":"iana","compressible":true},"application/mbms-associated-procedure-description+xml":{"source":"iana","compressible":true},"application/mbms-deregister+xml":{"source":"iana","compressible":true},"application/mbms-envelope+xml":{"source":"iana","compressible":true},"application/mbms-msk+xml":{"source":"iana","compressible":true},"application/mbms-msk-response+xml":{"source":"iana","compressible":true},"application/mbms-protection-description+xml":{"source":"iana","compressible":true},"application/mbms-reception-report+xml":{"source":"iana","compressible":true},"application/mbms-register+xml":{"source":"iana","compressible":true},"application/mbms-register-response+xml":{"source":"iana","compressible":true},"application/mbms-schedule+xml":{"source":"iana","compressible":true},"application/mbms-user-service-description+xml":{"source":"iana","compressible":true},"application/mbox":{"source":"iana","extensions":["mbox"]},"application/media-policy-dataset+xml":{"source":"iana","compressible":true,"extensions":["mpf"]},"application/media_control+xml":{"source":"iana","compressible":true},"application/mediaservercontrol+xml":{"source":"iana","compressible":true,"extensions":["mscml"]},"application/merge-patch+json":{"source":"iana","compressible":true},"application/metalink+xml":{"source":"apache","compressible":true,"extensions":["metalink"]},"application/metalink4+xml":{"source":"iana","compressible":true,"extensions":["meta4"]},"application/mets+xml":{"source":"iana","compressible":true,"extensions":["mets"]},"application/mf4":{"source":"iana"},"application/mikey":{"source":"iana"},"application/mipc":{"source":"iana"},"application/missing-blocks+cbor-seq":{"source":"iana"},"application/mmt-aei+xml":{"source":"iana","compressible":true,"extensions":["maei"]},"application/mmt-usd+xml":{"source":"iana","compressible":true,"extensions":["musd"]},"application/mods+xml":{"source":"iana","compressible":true,"extensions":["mods"]},"application/moss-keys":{"source":"iana"},"application/moss-signature":{"source":"iana"},"application/mosskey-data":{"source":"iana"},"application/mosskey-request":{"source":"iana"},"application/mp21":{"source":"iana","extensions":["m21","mp21"]},"application/mp4":{"source":"iana","extensions":["mp4s","m4p"]},"application/mpeg4-generic":{"source":"iana"},"application/mpeg4-iod":{"source":"iana"},"application/mpeg4-iod-xmt":{"source":"iana"},"application/mrb-consumer+xml":{"source":"iana","compressible":true},"application/mrb-publish+xml":{"source":"iana","compressible":true},"application/msc-ivr+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msc-mixer+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/msword":{"source":"iana","compressible":false,"extensions":["doc","dot"]},"application/mud+json":{"source":"iana","compressible":true},"application/multipart-core":{"source":"iana"},"application/mxf":{"source":"iana","extensions":["mxf"]},"application/n-quads":{"source":"iana","extensions":["nq"]},"application/n-triples":{"source":"iana","extensions":["nt"]},"application/nasdata":{"source":"iana"},"application/news-checkgroups":{"source":"iana","charset":"US-ASCII"},"application/news-groupinfo":{"source":"iana","charset":"US-ASCII"},"application/news-transmission":{"source":"iana"},"application/nlsml+xml":{"source":"iana","compressible":true},"application/node":{"source":"iana","extensions":["cjs"]},"application/nss":{"source":"iana"},"application/oauth-authz-req+jwt":{"source":"iana"},"application/oblivious-dns-message":{"source":"iana"},"application/ocsp-request":{"source":"iana"},"application/ocsp-response":{"source":"iana"},"application/octet-stream":{"source":"iana","compressible":false,"extensions":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]},"application/oda":{"source":"iana","extensions":["oda"]},"application/odm+xml":{"source":"iana","compressible":true},"application/odx":{"source":"iana"},"application/oebps-package+xml":{"source":"iana","compressible":true,"extensions":["opf"]},"application/ogg":{"source":"iana","compressible":false,"extensions":["ogx"]},"application/omdoc+xml":{"source":"apache","compressible":true,"extensions":["omdoc"]},"application/onenote":{"source":"apache","extensions":["onetoc","onetoc2","onetmp","onepkg"]},"application/opc-nodeset+xml":{"source":"iana","compressible":true},"application/oscore":{"source":"iana"},"application/oxps":{"source":"iana","extensions":["oxps"]},"application/p21":{"source":"iana"},"application/p21+zip":{"source":"iana","compressible":false},"application/p2p-overlay+xml":{"source":"iana","compressible":true,"extensions":["relo"]},"application/parityfec":{"source":"iana"},"application/passport":{"source":"iana"},"application/patch-ops-error+xml":{"source":"iana","compressible":true,"extensions":["xer"]},"application/pdf":{"source":"iana","compressible":false,"extensions":["pdf"]},"application/pdx":{"source":"iana"},"application/pem-certificate-chain":{"source":"iana"},"application/pgp-encrypted":{"source":"iana","compressible":false,"extensions":["pgp"]},"application/pgp-keys":{"source":"iana","extensions":["asc"]},"application/pgp-signature":{"source":"iana","extensions":["asc","sig"]},"application/pics-rules":{"source":"apache","extensions":["prf"]},"application/pidf+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pidf-diff+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/pkcs10":{"source":"iana","extensions":["p10"]},"application/pkcs12":{"source":"iana"},"application/pkcs7-mime":{"source":"iana","extensions":["p7m","p7c"]},"application/pkcs7-signature":{"source":"iana","extensions":["p7s"]},"application/pkcs8":{"source":"iana","extensions":["p8"]},"application/pkcs8-encrypted":{"source":"iana"},"application/pkix-attr-cert":{"source":"iana","extensions":["ac"]},"application/pkix-cert":{"source":"iana","extensions":["cer"]},"application/pkix-crl":{"source":"iana","extensions":["crl"]},"application/pkix-pkipath":{"source":"iana","extensions":["pkipath"]},"application/pkixcmp":{"source":"iana","extensions":["pki"]},"application/pls+xml":{"source":"iana","compressible":true,"extensions":["pls"]},"application/poc-settings+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/postscript":{"source":"iana","compressible":true,"extensions":["ai","eps","ps"]},"application/ppsp-tracker+json":{"source":"iana","compressible":true},"application/problem+json":{"source":"iana","compressible":true},"application/problem+xml":{"source":"iana","compressible":true},"application/provenance+xml":{"source":"iana","compressible":true,"extensions":["provx"]},"application/prs.alvestrand.titrax-sheet":{"source":"iana"},"application/prs.cww":{"source":"iana","extensions":["cww"]},"application/prs.cyn":{"source":"iana","charset":"7-BIT"},"application/prs.hpub+zip":{"source":"iana","compressible":false},"application/prs.nprend":{"source":"iana"},"application/prs.plucker":{"source":"iana"},"application/prs.rdf-xml-crypt":{"source":"iana"},"application/prs.xsf+xml":{"source":"iana","compressible":true},"application/pskc+xml":{"source":"iana","compressible":true,"extensions":["pskcxml"]},"application/pvd+json":{"source":"iana","compressible":true},"application/qsig":{"source":"iana"},"application/raml+yaml":{"compressible":true,"extensions":["raml"]},"application/raptorfec":{"source":"iana"},"application/rdap+json":{"source":"iana","compressible":true},"application/rdf+xml":{"source":"iana","compressible":true,"extensions":["rdf","owl"]},"application/reginfo+xml":{"source":"iana","compressible":true,"extensions":["rif"]},"application/relax-ng-compact-syntax":{"source":"iana","extensions":["rnc"]},"application/remote-printing":{"source":"iana"},"application/reputon+json":{"source":"iana","compressible":true},"application/resource-lists+xml":{"source":"iana","compressible":true,"extensions":["rl"]},"application/resource-lists-diff+xml":{"source":"iana","compressible":true,"extensions":["rld"]},"application/rfc+xml":{"source":"iana","compressible":true},"application/riscos":{"source":"iana"},"application/rlmi+xml":{"source":"iana","compressible":true},"application/rls-services+xml":{"source":"iana","compressible":true,"extensions":["rs"]},"application/route-apd+xml":{"source":"iana","compressible":true,"extensions":["rapd"]},"application/route-s-tsid+xml":{"source":"iana","compressible":true,"extensions":["sls"]},"application/route-usd+xml":{"source":"iana","compressible":true,"extensions":["rusd"]},"application/rpki-ghostbusters":{"source":"iana","extensions":["gbr"]},"application/rpki-manifest":{"source":"iana","extensions":["mft"]},"application/rpki-publication":{"source":"iana"},"application/rpki-roa":{"source":"iana","extensions":["roa"]},"application/rpki-updown":{"source":"iana"},"application/rsd+xml":{"source":"apache","compressible":true,"extensions":["rsd"]},"application/rss+xml":{"source":"apache","compressible":true,"extensions":["rss"]},"application/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"application/rtploopback":{"source":"iana"},"application/rtx":{"source":"iana"},"application/samlassertion+xml":{"source":"iana","compressible":true},"application/samlmetadata+xml":{"source":"iana","compressible":true},"application/sarif+json":{"source":"iana","compressible":true},"application/sarif-external-properties+json":{"source":"iana","compressible":true},"application/sbe":{"source":"iana"},"application/sbml+xml":{"source":"iana","compressible":true,"extensions":["sbml"]},"application/scaip+xml":{"source":"iana","compressible":true},"application/scim+json":{"source":"iana","compressible":true},"application/scvp-cv-request":{"source":"iana","extensions":["scq"]},"application/scvp-cv-response":{"source":"iana","extensions":["scs"]},"application/scvp-vp-request":{"source":"iana","extensions":["spq"]},"application/scvp-vp-response":{"source":"iana","extensions":["spp"]},"application/sdp":{"source":"iana","extensions":["sdp"]},"application/secevent+jwt":{"source":"iana"},"application/senml+cbor":{"source":"iana"},"application/senml+json":{"source":"iana","compressible":true},"application/senml+xml":{"source":"iana","compressible":true,"extensions":["senmlx"]},"application/senml-etch+cbor":{"source":"iana"},"application/senml-etch+json":{"source":"iana","compressible":true},"application/senml-exi":{"source":"iana"},"application/sensml+cbor":{"source":"iana"},"application/sensml+json":{"source":"iana","compressible":true},"application/sensml+xml":{"source":"iana","compressible":true,"extensions":["sensmlx"]},"application/sensml-exi":{"source":"iana"},"application/sep+xml":{"source":"iana","compressible":true},"application/sep-exi":{"source":"iana"},"application/session-info":{"source":"iana"},"application/set-payment":{"source":"iana"},"application/set-payment-initiation":{"source":"iana","extensions":["setpay"]},"application/set-registration":{"source":"iana"},"application/set-registration-initiation":{"source":"iana","extensions":["setreg"]},"application/sgml":{"source":"iana"},"application/sgml-open-catalog":{"source":"iana"},"application/shf+xml":{"source":"iana","compressible":true,"extensions":["shf"]},"application/sieve":{"source":"iana","extensions":["siv","sieve"]},"application/simple-filter+xml":{"source":"iana","compressible":true},"application/simple-message-summary":{"source":"iana"},"application/simplesymbolcontainer":{"source":"iana"},"application/sipc":{"source":"iana"},"application/slate":{"source":"iana"},"application/smil":{"source":"iana"},"application/smil+xml":{"source":"iana","compressible":true,"extensions":["smi","smil"]},"application/smpte336m":{"source":"iana"},"application/soap+fastinfoset":{"source":"iana"},"application/soap+xml":{"source":"iana","compressible":true},"application/sparql-query":{"source":"iana","extensions":["rq"]},"application/sparql-results+xml":{"source":"iana","compressible":true,"extensions":["srx"]},"application/spdx+json":{"source":"iana","compressible":true},"application/spirits-event+xml":{"source":"iana","compressible":true},"application/sql":{"source":"iana"},"application/srgs":{"source":"iana","extensions":["gram"]},"application/srgs+xml":{"source":"iana","compressible":true,"extensions":["grxml"]},"application/sru+xml":{"source":"iana","compressible":true,"extensions":["sru"]},"application/ssdl+xml":{"source":"apache","compressible":true,"extensions":["ssdl"]},"application/ssml+xml":{"source":"iana","compressible":true,"extensions":["ssml"]},"application/stix+json":{"source":"iana","compressible":true},"application/swid+xml":{"source":"iana","compressible":true,"extensions":["swidtag"]},"application/tamp-apex-update":{"source":"iana"},"application/tamp-apex-update-confirm":{"source":"iana"},"application/tamp-community-update":{"source":"iana"},"application/tamp-community-update-confirm":{"source":"iana"},"application/tamp-error":{"source":"iana"},"application/tamp-sequence-adjust":{"source":"iana"},"application/tamp-sequence-adjust-confirm":{"source":"iana"},"application/tamp-status-query":{"source":"iana"},"application/tamp-status-response":{"source":"iana"},"application/tamp-update":{"source":"iana"},"application/tamp-update-confirm":{"source":"iana"},"application/tar":{"compressible":true},"application/taxii+json":{"source":"iana","compressible":true},"application/td+json":{"source":"iana","compressible":true},"application/tei+xml":{"source":"iana","compressible":true,"extensions":["tei","teicorpus"]},"application/tetra_isi":{"source":"iana"},"application/thraud+xml":{"source":"iana","compressible":true,"extensions":["tfi"]},"application/timestamp-query":{"source":"iana"},"application/timestamp-reply":{"source":"iana"},"application/timestamped-data":{"source":"iana","extensions":["tsd"]},"application/tlsrpt+gzip":{"source":"iana"},"application/tlsrpt+json":{"source":"iana","compressible":true},"application/tnauthlist":{"source":"iana"},"application/token-introspection+jwt":{"source":"iana"},"application/toml":{"compressible":true,"extensions":["toml"]},"application/trickle-ice-sdpfrag":{"source":"iana"},"application/trig":{"source":"iana","extensions":["trig"]},"application/ttml+xml":{"source":"iana","compressible":true,"extensions":["ttml"]},"application/tve-trigger":{"source":"iana"},"application/tzif":{"source":"iana"},"application/tzif-leap":{"source":"iana"},"application/ubjson":{"compressible":false,"extensions":["ubj"]},"application/ulpfec":{"source":"iana"},"application/urc-grpsheet+xml":{"source":"iana","compressible":true},"application/urc-ressheet+xml":{"source":"iana","compressible":true,"extensions":["rsheet"]},"application/urc-targetdesc+xml":{"source":"iana","compressible":true,"extensions":["td"]},"application/urc-uisocketdesc+xml":{"source":"iana","compressible":true},"application/vcard+json":{"source":"iana","compressible":true},"application/vcard+xml":{"source":"iana","compressible":true},"application/vemmi":{"source":"iana"},"application/vividence.scriptfile":{"source":"apache"},"application/vnd.1000minds.decision-model+xml":{"source":"iana","compressible":true,"extensions":["1km"]},"application/vnd.3gpp-prose+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-prose-pc3ch+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-v2x-local-service-information":{"source":"iana"},"application/vnd.3gpp.5gnas":{"source":"iana"},"application/vnd.3gpp.access-transfer-events+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.bsf+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gmop+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gtpc":{"source":"iana"},"application/vnd.3gpp.interworking-data":{"source":"iana"},"application/vnd.3gpp.lpp":{"source":"iana"},"application/vnd.3gpp.mc-signalling-ear":{"source":"iana"},"application/vnd.3gpp.mcdata-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-payload":{"source":"iana"},"application/vnd.3gpp.mcdata-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-signalling":{"source":"iana"},"application/vnd.3gpp.mcdata-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-floor-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-signed+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-init-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-transmission-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mid-call+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ngap":{"source":"iana"},"application/vnd.3gpp.pfcp":{"source":"iana"},"application/vnd.3gpp.pic-bw-large":{"source":"iana","extensions":["plb"]},"application/vnd.3gpp.pic-bw-small":{"source":"iana","extensions":["psb"]},"application/vnd.3gpp.pic-bw-var":{"source":"iana","extensions":["pvb"]},"application/vnd.3gpp.s1ap":{"source":"iana"},"application/vnd.3gpp.sms":{"source":"iana"},"application/vnd.3gpp.sms+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-ext+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.state-and-event-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ussd+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.bcmcsinfo+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.sms":{"source":"iana"},"application/vnd.3gpp2.tcap":{"source":"iana","extensions":["tcap"]},"application/vnd.3lightssoftware.imagescal":{"source":"iana"},"application/vnd.3m.post-it-notes":{"source":"iana","extensions":["pwn"]},"application/vnd.accpac.simply.aso":{"source":"iana","extensions":["aso"]},"application/vnd.accpac.simply.imp":{"source":"iana","extensions":["imp"]},"application/vnd.acucobol":{"source":"iana","extensions":["acu"]},"application/vnd.acucorp":{"source":"iana","extensions":["atc","acutc"]},"application/vnd.adobe.air-application-installer-package+zip":{"source":"apache","compressible":false,"extensions":["air"]},"application/vnd.adobe.flash.movie":{"source":"iana"},"application/vnd.adobe.formscentral.fcdt":{"source":"iana","extensions":["fcdt"]},"application/vnd.adobe.fxp":{"source":"iana","extensions":["fxp","fxpl"]},"application/vnd.adobe.partial-upload":{"source":"iana"},"application/vnd.adobe.xdp+xml":{"source":"iana","compressible":true,"extensions":["xdp"]},"application/vnd.adobe.xfdf":{"source":"iana","extensions":["xfdf"]},"application/vnd.aether.imp":{"source":"iana"},"application/vnd.afpc.afplinedata":{"source":"iana"},"application/vnd.afpc.afplinedata-pagedef":{"source":"iana"},"application/vnd.afpc.cmoca-cmresource":{"source":"iana"},"application/vnd.afpc.foca-charset":{"source":"iana"},"application/vnd.afpc.foca-codedfont":{"source":"iana"},"application/vnd.afpc.foca-codepage":{"source":"iana"},"application/vnd.afpc.modca":{"source":"iana"},"application/vnd.afpc.modca-cmtable":{"source":"iana"},"application/vnd.afpc.modca-formdef":{"source":"iana"},"application/vnd.afpc.modca-mediummap":{"source":"iana"},"application/vnd.afpc.modca-objectcontainer":{"source":"iana"},"application/vnd.afpc.modca-overlay":{"source":"iana"},"application/vnd.afpc.modca-pagesegment":{"source":"iana"},"application/vnd.age":{"source":"iana","extensions":["age"]},"application/vnd.ah-barcode":{"source":"iana"},"application/vnd.ahead.space":{"source":"iana","extensions":["ahead"]},"application/vnd.airzip.filesecure.azf":{"source":"iana","extensions":["azf"]},"application/vnd.airzip.filesecure.azs":{"source":"iana","extensions":["azs"]},"application/vnd.amadeus+json":{"source":"iana","compressible":true},"application/vnd.amazon.ebook":{"source":"apache","extensions":["azw"]},"application/vnd.amazon.mobi8-ebook":{"source":"iana"},"application/vnd.americandynamics.acc":{"source":"iana","extensions":["acc"]},"application/vnd.amiga.ami":{"source":"iana","extensions":["ami"]},"application/vnd.amundsen.maze+xml":{"source":"iana","compressible":true},"application/vnd.android.ota":{"source":"iana"},"application/vnd.android.package-archive":{"source":"apache","compressible":false,"extensions":["apk"]},"application/vnd.anki":{"source":"iana"},"application/vnd.anser-web-certificate-issue-initiation":{"source":"iana","extensions":["cii"]},"application/vnd.anser-web-funds-transfer-initiation":{"source":"apache","extensions":["fti"]},"application/vnd.antix.game-component":{"source":"iana","extensions":["atx"]},"application/vnd.apache.arrow.file":{"source":"iana"},"application/vnd.apache.arrow.stream":{"source":"iana"},"application/vnd.apache.thrift.binary":{"source":"iana"},"application/vnd.apache.thrift.compact":{"source":"iana"},"application/vnd.apache.thrift.json":{"source":"iana"},"application/vnd.api+json":{"source":"iana","compressible":true},"application/vnd.aplextor.warrp+json":{"source":"iana","compressible":true},"application/vnd.apothekende.reservation+json":{"source":"iana","compressible":true},"application/vnd.apple.installer+xml":{"source":"iana","compressible":true,"extensions":["mpkg"]},"application/vnd.apple.keynote":{"source":"iana","extensions":["key"]},"application/vnd.apple.mpegurl":{"source":"iana","extensions":["m3u8"]},"application/vnd.apple.numbers":{"source":"iana","extensions":["numbers"]},"application/vnd.apple.pages":{"source":"iana","extensions":["pages"]},"application/vnd.apple.pkpass":{"compressible":false,"extensions":["pkpass"]},"application/vnd.arastra.swi":{"source":"iana"},"application/vnd.aristanetworks.swi":{"source":"iana","extensions":["swi"]},"application/vnd.artisan+json":{"source":"iana","compressible":true},"application/vnd.artsquare":{"source":"iana"},"application/vnd.astraea-software.iota":{"source":"iana","extensions":["iota"]},"application/vnd.audiograph":{"source":"iana","extensions":["aep"]},"application/vnd.autopackage":{"source":"iana"},"application/vnd.avalon+json":{"source":"iana","compressible":true},"application/vnd.avistar+xml":{"source":"iana","compressible":true},"application/vnd.balsamiq.bmml+xml":{"source":"iana","compressible":true,"extensions":["bmml"]},"application/vnd.balsamiq.bmpr":{"source":"iana"},"application/vnd.banana-accounting":{"source":"iana"},"application/vnd.bbf.usp.error":{"source":"iana"},"application/vnd.bbf.usp.msg":{"source":"iana"},"application/vnd.bbf.usp.msg+json":{"source":"iana","compressible":true},"application/vnd.bekitzur-stech+json":{"source":"iana","compressible":true},"application/vnd.bint.med-content":{"source":"iana"},"application/vnd.biopax.rdf+xml":{"source":"iana","compressible":true},"application/vnd.blink-idb-value-wrapper":{"source":"iana"},"application/vnd.blueice.multipass":{"source":"iana","extensions":["mpm"]},"application/vnd.bluetooth.ep.oob":{"source":"iana"},"application/vnd.bluetooth.le.oob":{"source":"iana"},"application/vnd.bmi":{"source":"iana","extensions":["bmi"]},"application/vnd.bpf":{"source":"iana"},"application/vnd.bpf3":{"source":"iana"},"application/vnd.businessobjects":{"source":"iana","extensions":["rep"]},"application/vnd.byu.uapi+json":{"source":"iana","compressible":true},"application/vnd.cab-jscript":{"source":"iana"},"application/vnd.canon-cpdl":{"source":"iana"},"application/vnd.canon-lips":{"source":"iana"},"application/vnd.capasystems-pg+json":{"source":"iana","compressible":true},"application/vnd.cendio.thinlinc.clientconf":{"source":"iana"},"application/vnd.century-systems.tcp_stream":{"source":"iana"},"application/vnd.chemdraw+xml":{"source":"iana","compressible":true,"extensions":["cdxml"]},"application/vnd.chess-pgn":{"source":"iana"},"application/vnd.chipnuts.karaoke-mmd":{"source":"iana","extensions":["mmd"]},"application/vnd.ciedi":{"source":"iana"},"application/vnd.cinderella":{"source":"iana","extensions":["cdy"]},"application/vnd.cirpack.isdn-ext":{"source":"iana"},"application/vnd.citationstyles.style+xml":{"source":"iana","compressible":true,"extensions":["csl"]},"application/vnd.claymore":{"source":"iana","extensions":["cla"]},"application/vnd.cloanto.rp9":{"source":"iana","extensions":["rp9"]},"application/vnd.clonk.c4group":{"source":"iana","extensions":["c4g","c4d","c4f","c4p","c4u"]},"application/vnd.cluetrust.cartomobile-config":{"source":"iana","extensions":["c11amc"]},"application/vnd.cluetrust.cartomobile-config-pkg":{"source":"iana","extensions":["c11amz"]},"application/vnd.coffeescript":{"source":"iana"},"application/vnd.collabio.xodocuments.document":{"source":"iana"},"application/vnd.collabio.xodocuments.document-template":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation-template":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet-template":{"source":"iana"},"application/vnd.collection+json":{"source":"iana","compressible":true},"application/vnd.collection.doc+json":{"source":"iana","compressible":true},"application/vnd.collection.next+json":{"source":"iana","compressible":true},"application/vnd.comicbook+zip":{"source":"iana","compressible":false},"application/vnd.comicbook-rar":{"source":"iana"},"application/vnd.commerce-battelle":{"source":"iana"},"application/vnd.commonspace":{"source":"iana","extensions":["csp"]},"application/vnd.contact.cmsg":{"source":"iana","extensions":["cdbcmsg"]},"application/vnd.coreos.ignition+json":{"source":"iana","compressible":true},"application/vnd.cosmocaller":{"source":"iana","extensions":["cmc"]},"application/vnd.crick.clicker":{"source":"iana","extensions":["clkx"]},"application/vnd.crick.clicker.keyboard":{"source":"iana","extensions":["clkk"]},"application/vnd.crick.clicker.palette":{"source":"iana","extensions":["clkp"]},"application/vnd.crick.clicker.template":{"source":"iana","extensions":["clkt"]},"application/vnd.crick.clicker.wordbank":{"source":"iana","extensions":["clkw"]},"application/vnd.criticaltools.wbs+xml":{"source":"iana","compressible":true,"extensions":["wbs"]},"application/vnd.cryptii.pipe+json":{"source":"iana","compressible":true},"application/vnd.crypto-shade-file":{"source":"iana"},"application/vnd.cryptomator.encrypted":{"source":"iana"},"application/vnd.cryptomator.vault":{"source":"iana"},"application/vnd.ctc-posml":{"source":"iana","extensions":["pml"]},"application/vnd.ctct.ws+xml":{"source":"iana","compressible":true},"application/vnd.cups-pdf":{"source":"iana"},"application/vnd.cups-postscript":{"source":"iana"},"application/vnd.cups-ppd":{"source":"iana","extensions":["ppd"]},"application/vnd.cups-raster":{"source":"iana"},"application/vnd.cups-raw":{"source":"iana"},"application/vnd.curl":{"source":"iana"},"application/vnd.curl.car":{"source":"apache","extensions":["car"]},"application/vnd.curl.pcurl":{"source":"apache","extensions":["pcurl"]},"application/vnd.cyan.dean.root+xml":{"source":"iana","compressible":true},"application/vnd.cybank":{"source":"iana"},"application/vnd.cyclonedx+json":{"source":"iana","compressible":true},"application/vnd.cyclonedx+xml":{"source":"iana","compressible":true},"application/vnd.d2l.coursepackage1p0+zip":{"source":"iana","compressible":false},"application/vnd.d3m-dataset":{"source":"iana"},"application/vnd.d3m-problem":{"source":"iana"},"application/vnd.dart":{"source":"iana","compressible":true,"extensions":["dart"]},"application/vnd.data-vision.rdz":{"source":"iana","extensions":["rdz"]},"application/vnd.datapackage+json":{"source":"iana","compressible":true},"application/vnd.dataresource+json":{"source":"iana","compressible":true},"application/vnd.dbf":{"source":"iana","extensions":["dbf"]},"application/vnd.debian.binary-package":{"source":"iana"},"application/vnd.dece.data":{"source":"iana","extensions":["uvf","uvvf","uvd","uvvd"]},"application/vnd.dece.ttml+xml":{"source":"iana","compressible":true,"extensions":["uvt","uvvt"]},"application/vnd.dece.unspecified":{"source":"iana","extensions":["uvx","uvvx"]},"application/vnd.dece.zip":{"source":"iana","extensions":["uvz","uvvz"]},"application/vnd.denovo.fcselayout-link":{"source":"iana","extensions":["fe_launch"]},"application/vnd.desmume.movie":{"source":"iana"},"application/vnd.dir-bi.plate-dl-nosuffix":{"source":"iana"},"application/vnd.dm.delegation+xml":{"source":"iana","compressible":true},"application/vnd.dna":{"source":"iana","extensions":["dna"]},"application/vnd.document+json":{"source":"iana","compressible":true},"application/vnd.dolby.mlp":{"source":"apache","extensions":["mlp"]},"application/vnd.dolby.mobile.1":{"source":"iana"},"application/vnd.dolby.mobile.2":{"source":"iana"},"application/vnd.doremir.scorecloud-binary-document":{"source":"iana"},"application/vnd.dpgraph":{"source":"iana","extensions":["dpg"]},"application/vnd.dreamfactory":{"source":"iana","extensions":["dfac"]},"application/vnd.drive+json":{"source":"iana","compressible":true},"application/vnd.ds-keypoint":{"source":"apache","extensions":["kpxx"]},"application/vnd.dtg.local":{"source":"iana"},"application/vnd.dtg.local.flash":{"source":"iana"},"application/vnd.dtg.local.html":{"source":"iana"},"application/vnd.dvb.ait":{"source":"iana","extensions":["ait"]},"application/vnd.dvb.dvbisl+xml":{"source":"iana","compressible":true},"application/vnd.dvb.dvbj":{"source":"iana"},"application/vnd.dvb.esgcontainer":{"source":"iana"},"application/vnd.dvb.ipdcdftnotifaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess2":{"source":"iana"},"application/vnd.dvb.ipdcesgpdd":{"source":"iana"},"application/vnd.dvb.ipdcroaming":{"source":"iana"},"application/vnd.dvb.iptv.alfec-base":{"source":"iana"},"application/vnd.dvb.iptv.alfec-enhancement":{"source":"iana"},"application/vnd.dvb.notif-aggregate-root+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-container+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-generic+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-msglist+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-request+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-response+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-init+xml":{"source":"iana","compressible":true},"application/vnd.dvb.pfr":{"source":"iana"},"application/vnd.dvb.service":{"source":"iana","extensions":["svc"]},"application/vnd.dxr":{"source":"iana"},"application/vnd.dynageo":{"source":"iana","extensions":["geo"]},"application/vnd.dzr":{"source":"iana"},"application/vnd.easykaraoke.cdgdownload":{"source":"iana"},"application/vnd.ecdis-update":{"source":"iana"},"application/vnd.ecip.rlp":{"source":"iana"},"application/vnd.eclipse.ditto+json":{"source":"iana","compressible":true},"application/vnd.ecowin.chart":{"source":"iana","extensions":["mag"]},"application/vnd.ecowin.filerequest":{"source":"iana"},"application/vnd.ecowin.fileupdate":{"source":"iana"},"application/vnd.ecowin.series":{"source":"iana"},"application/vnd.ecowin.seriesrequest":{"source":"iana"},"application/vnd.ecowin.seriesupdate":{"source":"iana"},"application/vnd.efi.img":{"source":"iana"},"application/vnd.efi.iso":{"source":"iana"},"application/vnd.emclient.accessrequest+xml":{"source":"iana","compressible":true},"application/vnd.enliven":{"source":"iana","extensions":["nml"]},"application/vnd.enphase.envoy":{"source":"iana"},"application/vnd.eprints.data+xml":{"source":"iana","compressible":true},"application/vnd.epson.esf":{"source":"iana","extensions":["esf"]},"application/vnd.epson.msf":{"source":"iana","extensions":["msf"]},"application/vnd.epson.quickanime":{"source":"iana","extensions":["qam"]},"application/vnd.epson.salt":{"source":"iana","extensions":["slt"]},"application/vnd.epson.ssf":{"source":"iana","extensions":["ssf"]},"application/vnd.ericsson.quickcall":{"source":"iana"},"application/vnd.espass-espass+zip":{"source":"iana","compressible":false},"application/vnd.eszigno3+xml":{"source":"iana","compressible":true,"extensions":["es3","et3"]},"application/vnd.etsi.aoc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.asic-e+zip":{"source":"iana","compressible":false},"application/vnd.etsi.asic-s+zip":{"source":"iana","compressible":false},"application/vnd.etsi.cug+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvcommand+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-bc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-cod+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-npvr+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvservice+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsync+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvueprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mcid+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mheg5":{"source":"iana"},"application/vnd.etsi.overload-control-policy-dataset+xml":{"source":"iana","compressible":true},"application/vnd.etsi.pstn+xml":{"source":"iana","compressible":true},"application/vnd.etsi.sci+xml":{"source":"iana","compressible":true},"application/vnd.etsi.simservs+xml":{"source":"iana","compressible":true},"application/vnd.etsi.timestamp-token":{"source":"iana"},"application/vnd.etsi.tsl+xml":{"source":"iana","compressible":true},"application/vnd.etsi.tsl.der":{"source":"iana"},"application/vnd.eu.kasparian.car+json":{"source":"iana","compressible":true},"application/vnd.eudora.data":{"source":"iana"},"application/vnd.evolv.ecig.profile":{"source":"iana"},"application/vnd.evolv.ecig.settings":{"source":"iana"},"application/vnd.evolv.ecig.theme":{"source":"iana"},"application/vnd.exstream-empower+zip":{"source":"iana","compressible":false},"application/vnd.exstream-package":{"source":"iana"},"application/vnd.ezpix-album":{"source":"iana","extensions":["ez2"]},"application/vnd.ezpix-package":{"source":"iana","extensions":["ez3"]},"application/vnd.f-secure.mobile":{"source":"iana"},"application/vnd.familysearch.gedcom+zip":{"source":"iana","compressible":false},"application/vnd.fastcopy-disk-image":{"source":"iana"},"application/vnd.fdf":{"source":"iana","extensions":["fdf"]},"application/vnd.fdsn.mseed":{"source":"iana","extensions":["mseed"]},"application/vnd.fdsn.seed":{"source":"iana","extensions":["seed","dataless"]},"application/vnd.ffsns":{"source":"iana"},"application/vnd.ficlab.flb+zip":{"source":"iana","compressible":false},"application/vnd.filmit.zfc":{"source":"iana"},"application/vnd.fints":{"source":"iana"},"application/vnd.firemonkeys.cloudcell":{"source":"iana"},"application/vnd.flographit":{"source":"iana","extensions":["gph"]},"application/vnd.fluxtime.clip":{"source":"iana","extensions":["ftc"]},"application/vnd.font-fontforge-sfd":{"source":"iana"},"application/vnd.framemaker":{"source":"iana","extensions":["fm","frame","maker","book"]},"application/vnd.frogans.fnc":{"source":"iana","extensions":["fnc"]},"application/vnd.frogans.ltf":{"source":"iana","extensions":["ltf"]},"application/vnd.fsc.weblaunch":{"source":"iana","extensions":["fsc"]},"application/vnd.fujifilm.fb.docuworks":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.binder":{"source":"iana"},"application/vnd.fujifilm.fb.docuworks.container":{"source":"iana"},"application/vnd.fujifilm.fb.jfi+xml":{"source":"iana","compressible":true},"application/vnd.fujitsu.oasys":{"source":"iana","extensions":["oas"]},"application/vnd.fujitsu.oasys2":{"source":"iana","extensions":["oa2"]},"application/vnd.fujitsu.oasys3":{"source":"iana","extensions":["oa3"]},"application/vnd.fujitsu.oasysgp":{"source":"iana","extensions":["fg5"]},"application/vnd.fujitsu.oasysprs":{"source":"iana","extensions":["bh2"]},"application/vnd.fujixerox.art-ex":{"source":"iana"},"application/vnd.fujixerox.art4":{"source":"iana"},"application/vnd.fujixerox.ddd":{"source":"iana","extensions":["ddd"]},"application/vnd.fujixerox.docuworks":{"source":"iana","extensions":["xdw"]},"application/vnd.fujixerox.docuworks.binder":{"source":"iana","extensions":["xbd"]},"application/vnd.fujixerox.docuworks.container":{"source":"iana"},"application/vnd.fujixerox.hbpl":{"source":"iana"},"application/vnd.fut-misnet":{"source":"iana"},"application/vnd.futoin+cbor":{"source":"iana"},"application/vnd.futoin+json":{"source":"iana","compressible":true},"application/vnd.fuzzysheet":{"source":"iana","extensions":["fzs"]},"application/vnd.genomatix.tuxedo":{"source":"iana","extensions":["txd"]},"application/vnd.gentics.grd+json":{"source":"iana","compressible":true},"application/vnd.geo+json":{"source":"iana","compressible":true},"application/vnd.geocube+xml":{"source":"iana","compressible":true},"application/vnd.geogebra.file":{"source":"iana","extensions":["ggb"]},"application/vnd.geogebra.slides":{"source":"iana"},"application/vnd.geogebra.tool":{"source":"iana","extensions":["ggt"]},"application/vnd.geometry-explorer":{"source":"iana","extensions":["gex","gre"]},"application/vnd.geonext":{"source":"iana","extensions":["gxt"]},"application/vnd.geoplan":{"source":"iana","extensions":["g2w"]},"application/vnd.geospace":{"source":"iana","extensions":["g3w"]},"application/vnd.gerber":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt-response":{"source":"iana"},"application/vnd.gmx":{"source":"iana","extensions":["gmx"]},"application/vnd.google-apps.document":{"compressible":false,"extensions":["gdoc"]},"application/vnd.google-apps.presentation":{"compressible":false,"extensions":["gslides"]},"application/vnd.google-apps.spreadsheet":{"compressible":false,"extensions":["gsheet"]},"application/vnd.google-earth.kml+xml":{"source":"iana","compressible":true,"extensions":["kml"]},"application/vnd.google-earth.kmz":{"source":"iana","compressible":false,"extensions":["kmz"]},"application/vnd.gov.sk.e-form+xml":{"source":"iana","compressible":true},"application/vnd.gov.sk.e-form+zip":{"source":"iana","compressible":false},"application/vnd.gov.sk.xmldatacontainer+xml":{"source":"iana","compressible":true},"application/vnd.grafeq":{"source":"iana","extensions":["gqf","gqs"]},"application/vnd.gridmp":{"source":"iana"},"application/vnd.groove-account":{"source":"iana","extensions":["gac"]},"application/vnd.groove-help":{"source":"iana","extensions":["ghf"]},"application/vnd.groove-identity-message":{"source":"iana","extensions":["gim"]},"application/vnd.groove-injector":{"source":"iana","extensions":["grv"]},"application/vnd.groove-tool-message":{"source":"iana","extensions":["gtm"]},"application/vnd.groove-tool-template":{"source":"iana","extensions":["tpl"]},"application/vnd.groove-vcard":{"source":"iana","extensions":["vcg"]},"application/vnd.hal+json":{"source":"iana","compressible":true},"application/vnd.hal+xml":{"source":"iana","compressible":true,"extensions":["hal"]},"application/vnd.handheld-entertainment+xml":{"source":"iana","compressible":true,"extensions":["zmm"]},"application/vnd.hbci":{"source":"iana","extensions":["hbci"]},"application/vnd.hc+json":{"source":"iana","compressible":true},"application/vnd.hcl-bireports":{"source":"iana"},"application/vnd.hdt":{"source":"iana"},"application/vnd.heroku+json":{"source":"iana","compressible":true},"application/vnd.hhe.lesson-player":{"source":"iana","extensions":["les"]},"application/vnd.hl7cda+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hl7v2+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.hp-hpgl":{"source":"iana","extensions":["hpgl"]},"application/vnd.hp-hpid":{"source":"iana","extensions":["hpid"]},"application/vnd.hp-hps":{"source":"iana","extensions":["hps"]},"application/vnd.hp-jlyt":{"source":"iana","extensions":["jlt"]},"application/vnd.hp-pcl":{"source":"iana","extensions":["pcl"]},"application/vnd.hp-pclxl":{"source":"iana","extensions":["pclxl"]},"application/vnd.httphone":{"source":"iana"},"application/vnd.hydrostatix.sof-data":{"source":"iana","extensions":["sfd-hdstx"]},"application/vnd.hyper+json":{"source":"iana","compressible":true},"application/vnd.hyper-item+json":{"source":"iana","compressible":true},"application/vnd.hyperdrive+json":{"source":"iana","compressible":true},"application/vnd.hzn-3d-crossword":{"source":"iana"},"application/vnd.ibm.afplinedata":{"source":"iana"},"application/vnd.ibm.electronic-media":{"source":"iana"},"application/vnd.ibm.minipay":{"source":"iana","extensions":["mpy"]},"application/vnd.ibm.modcap":{"source":"iana","extensions":["afp","listafp","list3820"]},"application/vnd.ibm.rights-management":{"source":"iana","extensions":["irm"]},"application/vnd.ibm.secure-container":{"source":"iana","extensions":["sc"]},"application/vnd.iccprofile":{"source":"iana","extensions":["icc","icm"]},"application/vnd.ieee.1905":{"source":"iana"},"application/vnd.igloader":{"source":"iana","extensions":["igl"]},"application/vnd.imagemeter.folder+zip":{"source":"iana","compressible":false},"application/vnd.imagemeter.image+zip":{"source":"iana","compressible":false},"application/vnd.immervision-ivp":{"source":"iana","extensions":["ivp"]},"application/vnd.immervision-ivu":{"source":"iana","extensions":["ivu"]},"application/vnd.ims.imsccv1p1":{"source":"iana"},"application/vnd.ims.imsccv1p2":{"source":"iana"},"application/vnd.ims.imsccv1p3":{"source":"iana"},"application/vnd.ims.lis.v2.result+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolconsumerprofile+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy.id+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings.simple+json":{"source":"iana","compressible":true},"application/vnd.informedcontrol.rms+xml":{"source":"iana","compressible":true},"application/vnd.informix-visionary":{"source":"iana"},"application/vnd.infotech.project":{"source":"iana"},"application/vnd.infotech.project+xml":{"source":"iana","compressible":true},"application/vnd.innopath.wamp.notification":{"source":"iana"},"application/vnd.insors.igm":{"source":"iana","extensions":["igm"]},"application/vnd.intercon.formnet":{"source":"iana","extensions":["xpw","xpx"]},"application/vnd.intergeo":{"source":"iana","extensions":["i2g"]},"application/vnd.intertrust.digibox":{"source":"iana"},"application/vnd.intertrust.nncp":{"source":"iana"},"application/vnd.intu.qbo":{"source":"iana","extensions":["qbo"]},"application/vnd.intu.qfx":{"source":"iana","extensions":["qfx"]},"application/vnd.iptc.g2.catalogitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.conceptitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.knowledgeitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsmessage+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.packageitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.planningitem+xml":{"source":"iana","compressible":true},"application/vnd.ipunplugged.rcprofile":{"source":"iana","extensions":["rcprofile"]},"application/vnd.irepository.package+xml":{"source":"iana","compressible":true,"extensions":["irp"]},"application/vnd.is-xpr":{"source":"iana","extensions":["xpr"]},"application/vnd.isac.fcs":{"source":"iana","extensions":["fcs"]},"application/vnd.iso11783-10+zip":{"source":"iana","compressible":false},"application/vnd.jam":{"source":"iana","extensions":["jam"]},"application/vnd.japannet-directory-service":{"source":"iana"},"application/vnd.japannet-jpnstore-wakeup":{"source":"iana"},"application/vnd.japannet-payment-wakeup":{"source":"iana"},"application/vnd.japannet-registration":{"source":"iana"},"application/vnd.japannet-registration-wakeup":{"source":"iana"},"application/vnd.japannet-setstore-wakeup":{"source":"iana"},"application/vnd.japannet-verification":{"source":"iana"},"application/vnd.japannet-verification-wakeup":{"source":"iana"},"application/vnd.jcp.javame.midlet-rms":{"source":"iana","extensions":["rms"]},"application/vnd.jisp":{"source":"iana","extensions":["jisp"]},"application/vnd.joost.joda-archive":{"source":"iana","extensions":["joda"]},"application/vnd.jsk.isdn-ngn":{"source":"iana"},"application/vnd.kahootz":{"source":"iana","extensions":["ktz","ktr"]},"application/vnd.kde.karbon":{"source":"iana","extensions":["karbon"]},"application/vnd.kde.kchart":{"source":"iana","extensions":["chrt"]},"application/vnd.kde.kformula":{"source":"iana","extensions":["kfo"]},"application/vnd.kde.kivio":{"source":"iana","extensions":["flw"]},"application/vnd.kde.kontour":{"source":"iana","extensions":["kon"]},"application/vnd.kde.kpresenter":{"source":"iana","extensions":["kpr","kpt"]},"application/vnd.kde.kspread":{"source":"iana","extensions":["ksp"]},"application/vnd.kde.kword":{"source":"iana","extensions":["kwd","kwt"]},"application/vnd.kenameaapp":{"source":"iana","extensions":["htke"]},"application/vnd.kidspiration":{"source":"iana","extensions":["kia"]},"application/vnd.kinar":{"source":"iana","extensions":["kne","knp"]},"application/vnd.koan":{"source":"iana","extensions":["skp","skd","skt","skm"]},"application/vnd.kodak-descriptor":{"source":"iana","extensions":["sse"]},"application/vnd.las":{"source":"iana"},"application/vnd.las.las+json":{"source":"iana","compressible":true},"application/vnd.las.las+xml":{"source":"iana","compressible":true,"extensions":["lasxml"]},"application/vnd.laszip":{"source":"iana"},"application/vnd.leap+json":{"source":"iana","compressible":true},"application/vnd.liberty-request+xml":{"source":"iana","compressible":true},"application/vnd.llamagraphics.life-balance.desktop":{"source":"iana","extensions":["lbd"]},"application/vnd.llamagraphics.life-balance.exchange+xml":{"source":"iana","compressible":true,"extensions":["lbe"]},"application/vnd.logipipe.circuit+zip":{"source":"iana","compressible":false},"application/vnd.loom":{"source":"iana"},"application/vnd.lotus-1-2-3":{"source":"iana","extensions":["123"]},"application/vnd.lotus-approach":{"source":"iana","extensions":["apr"]},"application/vnd.lotus-freelance":{"source":"iana","extensions":["pre"]},"application/vnd.lotus-notes":{"source":"iana","extensions":["nsf"]},"application/vnd.lotus-organizer":{"source":"iana","extensions":["org"]},"application/vnd.lotus-screencam":{"source":"iana","extensions":["scm"]},"application/vnd.lotus-wordpro":{"source":"iana","extensions":["lwp"]},"application/vnd.macports.portpkg":{"source":"iana","extensions":["portpkg"]},"application/vnd.mapbox-vector-tile":{"source":"iana","extensions":["mvt"]},"application/vnd.marlin.drm.actiontoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.conftoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.license+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.mdcf":{"source":"iana"},"application/vnd.mason+json":{"source":"iana","compressible":true},"application/vnd.maxar.archive.3tz+zip":{"source":"iana","compressible":false},"application/vnd.maxmind.maxmind-db":{"source":"iana"},"application/vnd.mcd":{"source":"iana","extensions":["mcd"]},"application/vnd.medcalcdata":{"source":"iana","extensions":["mc1"]},"application/vnd.mediastation.cdkey":{"source":"iana","extensions":["cdkey"]},"application/vnd.meridian-slingshot":{"source":"iana"},"application/vnd.mfer":{"source":"iana","extensions":["mwf"]},"application/vnd.mfmp":{"source":"iana","extensions":["mfm"]},"application/vnd.micro+json":{"source":"iana","compressible":true},"application/vnd.micrografx.flo":{"source":"iana","extensions":["flo"]},"application/vnd.micrografx.igx":{"source":"iana","extensions":["igx"]},"application/vnd.microsoft.portable-executable":{"source":"iana"},"application/vnd.microsoft.windows.thumbnail-cache":{"source":"iana"},"application/vnd.miele+json":{"source":"iana","compressible":true},"application/vnd.mif":{"source":"iana","extensions":["mif"]},"application/vnd.minisoft-hp3000-save":{"source":"iana"},"application/vnd.mitsubishi.misty-guard.trustweb":{"source":"iana"},"application/vnd.mobius.daf":{"source":"iana","extensions":["daf"]},"application/vnd.mobius.dis":{"source":"iana","extensions":["dis"]},"application/vnd.mobius.mbk":{"source":"iana","extensions":["mbk"]},"application/vnd.mobius.mqy":{"source":"iana","extensions":["mqy"]},"application/vnd.mobius.msl":{"source":"iana","extensions":["msl"]},"application/vnd.mobius.plc":{"source":"iana","extensions":["plc"]},"application/vnd.mobius.txf":{"source":"iana","extensions":["txf"]},"application/vnd.mophun.application":{"source":"iana","extensions":["mpn"]},"application/vnd.mophun.certificate":{"source":"iana","extensions":["mpc"]},"application/vnd.motorola.flexsuite":{"source":"iana"},"application/vnd.motorola.flexsuite.adsi":{"source":"iana"},"application/vnd.motorola.flexsuite.fis":{"source":"iana"},"application/vnd.motorola.flexsuite.gotap":{"source":"iana"},"application/vnd.motorola.flexsuite.kmr":{"source":"iana"},"application/vnd.motorola.flexsuite.ttc":{"source":"iana"},"application/vnd.motorola.flexsuite.wem":{"source":"iana"},"application/vnd.motorola.iprm":{"source":"iana"},"application/vnd.mozilla.xul+xml":{"source":"iana","compressible":true,"extensions":["xul"]},"application/vnd.ms-3mfdocument":{"source":"iana"},"application/vnd.ms-artgalry":{"source":"iana","extensions":["cil"]},"application/vnd.ms-asf":{"source":"iana"},"application/vnd.ms-cab-compressed":{"source":"iana","extensions":["cab"]},"application/vnd.ms-color.iccprofile":{"source":"apache"},"application/vnd.ms-excel":{"source":"iana","compressible":false,"extensions":["xls","xlm","xla","xlc","xlt","xlw"]},"application/vnd.ms-excel.addin.macroenabled.12":{"source":"iana","extensions":["xlam"]},"application/vnd.ms-excel.sheet.binary.macroenabled.12":{"source":"iana","extensions":["xlsb"]},"application/vnd.ms-excel.sheet.macroenabled.12":{"source":"iana","extensions":["xlsm"]},"application/vnd.ms-excel.template.macroenabled.12":{"source":"iana","extensions":["xltm"]},"application/vnd.ms-fontobject":{"source":"iana","compressible":true,"extensions":["eot"]},"application/vnd.ms-htmlhelp":{"source":"iana","extensions":["chm"]},"application/vnd.ms-ims":{"source":"iana","extensions":["ims"]},"application/vnd.ms-lrm":{"source":"iana","extensions":["lrm"]},"application/vnd.ms-office.activex+xml":{"source":"iana","compressible":true},"application/vnd.ms-officetheme":{"source":"iana","extensions":["thmx"]},"application/vnd.ms-opentype":{"source":"apache","compressible":true},"application/vnd.ms-outlook":{"compressible":false,"extensions":["msg"]},"application/vnd.ms-package.obfuscated-opentype":{"source":"apache"},"application/vnd.ms-pki.seccat":{"source":"apache","extensions":["cat"]},"application/vnd.ms-pki.stl":{"source":"apache","extensions":["stl"]},"application/vnd.ms-playready.initiator+xml":{"source":"iana","compressible":true},"application/vnd.ms-powerpoint":{"source":"iana","compressible":false,"extensions":["ppt","pps","pot"]},"application/vnd.ms-powerpoint.addin.macroenabled.12":{"source":"iana","extensions":["ppam"]},"application/vnd.ms-powerpoint.presentation.macroenabled.12":{"source":"iana","extensions":["pptm"]},"application/vnd.ms-powerpoint.slide.macroenabled.12":{"source":"iana","extensions":["sldm"]},"application/vnd.ms-powerpoint.slideshow.macroenabled.12":{"source":"iana","extensions":["ppsm"]},"application/vnd.ms-powerpoint.template.macroenabled.12":{"source":"iana","extensions":["potm"]},"application/vnd.ms-printdevicecapabilities+xml":{"source":"iana","compressible":true},"application/vnd.ms-printing.printticket+xml":{"source":"apache","compressible":true},"application/vnd.ms-printschematicket+xml":{"source":"iana","compressible":true},"application/vnd.ms-project":{"source":"iana","extensions":["mpp","mpt"]},"application/vnd.ms-tnef":{"source":"iana"},"application/vnd.ms-windows.devicepairing":{"source":"iana"},"application/vnd.ms-windows.nwprinting.oob":{"source":"iana"},"application/vnd.ms-windows.printerpairing":{"source":"iana"},"application/vnd.ms-windows.wsd.oob":{"source":"iana"},"application/vnd.ms-wmdrm.lic-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.lic-resp":{"source":"iana"},"application/vnd.ms-wmdrm.meter-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.meter-resp":{"source":"iana"},"application/vnd.ms-word.document.macroenabled.12":{"source":"iana","extensions":["docm"]},"application/vnd.ms-word.template.macroenabled.12":{"source":"iana","extensions":["dotm"]},"application/vnd.ms-works":{"source":"iana","extensions":["wps","wks","wcm","wdb"]},"application/vnd.ms-wpl":{"source":"iana","extensions":["wpl"]},"application/vnd.ms-xpsdocument":{"source":"iana","compressible":false,"extensions":["xps"]},"application/vnd.msa-disk-image":{"source":"iana"},"application/vnd.mseq":{"source":"iana","extensions":["mseq"]},"application/vnd.msign":{"source":"iana"},"application/vnd.multiad.creator":{"source":"iana"},"application/vnd.multiad.creator.cif":{"source":"iana"},"application/vnd.music-niff":{"source":"iana"},"application/vnd.musician":{"source":"iana","extensions":["mus"]},"application/vnd.muvee.style":{"source":"iana","extensions":["msty"]},"application/vnd.mynfc":{"source":"iana","extensions":["taglet"]},"application/vnd.nacamar.ybrid+json":{"source":"iana","compressible":true},"application/vnd.ncd.control":{"source":"iana"},"application/vnd.ncd.reference":{"source":"iana"},"application/vnd.nearst.inv+json":{"source":"iana","compressible":true},"application/vnd.nebumind.line":{"source":"iana"},"application/vnd.nervana":{"source":"iana"},"application/vnd.netfpx":{"source":"iana"},"application/vnd.neurolanguage.nlu":{"source":"iana","extensions":["nlu"]},"application/vnd.nimn":{"source":"iana"},"application/vnd.nintendo.nitro.rom":{"source":"iana"},"application/vnd.nintendo.snes.rom":{"source":"iana"},"application/vnd.nitf":{"source":"iana","extensions":["ntf","nitf"]},"application/vnd.noblenet-directory":{"source":"iana","extensions":["nnd"]},"application/vnd.noblenet-sealer":{"source":"iana","extensions":["nns"]},"application/vnd.noblenet-web":{"source":"iana","extensions":["nnw"]},"application/vnd.nokia.catalogs":{"source":"iana"},"application/vnd.nokia.conml+wbxml":{"source":"iana"},"application/vnd.nokia.conml+xml":{"source":"iana","compressible":true},"application/vnd.nokia.iptv.config+xml":{"source":"iana","compressible":true},"application/vnd.nokia.isds-radio-presets":{"source":"iana"},"application/vnd.nokia.landmark+wbxml":{"source":"iana"},"application/vnd.nokia.landmark+xml":{"source":"iana","compressible":true},"application/vnd.nokia.landmarkcollection+xml":{"source":"iana","compressible":true},"application/vnd.nokia.n-gage.ac+xml":{"source":"iana","compressible":true,"extensions":["ac"]},"application/vnd.nokia.n-gage.data":{"source":"iana","extensions":["ngdat"]},"application/vnd.nokia.n-gage.symbian.install":{"source":"iana","extensions":["n-gage"]},"application/vnd.nokia.ncd":{"source":"iana"},"application/vnd.nokia.pcd+wbxml":{"source":"iana"},"application/vnd.nokia.pcd+xml":{"source":"iana","compressible":true},"application/vnd.nokia.radio-preset":{"source":"iana","extensions":["rpst"]},"application/vnd.nokia.radio-presets":{"source":"iana","extensions":["rpss"]},"application/vnd.novadigm.edm":{"source":"iana","extensions":["edm"]},"application/vnd.novadigm.edx":{"source":"iana","extensions":["edx"]},"application/vnd.novadigm.ext":{"source":"iana","extensions":["ext"]},"application/vnd.ntt-local.content-share":{"source":"iana"},"application/vnd.ntt-local.file-transfer":{"source":"iana"},"application/vnd.ntt-local.ogw_remote-access":{"source":"iana"},"application/vnd.ntt-local.sip-ta_remote":{"source":"iana"},"application/vnd.ntt-local.sip-ta_tcp_stream":{"source":"iana"},"application/vnd.oasis.opendocument.chart":{"source":"iana","extensions":["odc"]},"application/vnd.oasis.opendocument.chart-template":{"source":"iana","extensions":["otc"]},"application/vnd.oasis.opendocument.database":{"source":"iana","extensions":["odb"]},"application/vnd.oasis.opendocument.formula":{"source":"iana","extensions":["odf"]},"application/vnd.oasis.opendocument.formula-template":{"source":"iana","extensions":["odft"]},"application/vnd.oasis.opendocument.graphics":{"source":"iana","compressible":false,"extensions":["odg"]},"application/vnd.oasis.opendocument.graphics-template":{"source":"iana","extensions":["otg"]},"application/vnd.oasis.opendocument.image":{"source":"iana","extensions":["odi"]},"application/vnd.oasis.opendocument.image-template":{"source":"iana","extensions":["oti"]},"application/vnd.oasis.opendocument.presentation":{"source":"iana","compressible":false,"extensions":["odp"]},"application/vnd.oasis.opendocument.presentation-template":{"source":"iana","extensions":["otp"]},"application/vnd.oasis.opendocument.spreadsheet":{"source":"iana","compressible":false,"extensions":["ods"]},"application/vnd.oasis.opendocument.spreadsheet-template":{"source":"iana","extensions":["ots"]},"application/vnd.oasis.opendocument.text":{"source":"iana","compressible":false,"extensions":["odt"]},"application/vnd.oasis.opendocument.text-master":{"source":"iana","extensions":["odm"]},"application/vnd.oasis.opendocument.text-template":{"source":"iana","extensions":["ott"]},"application/vnd.oasis.opendocument.text-web":{"source":"iana","extensions":["oth"]},"application/vnd.obn":{"source":"iana"},"application/vnd.ocf+cbor":{"source":"iana"},"application/vnd.oci.image.manifest.v1+json":{"source":"iana","compressible":true},"application/vnd.oftn.l10n+json":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessdownload+xml":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessstreaming+xml":{"source":"iana","compressible":true},"application/vnd.oipf.cspg-hexbinary":{"source":"iana"},"application/vnd.oipf.dae.svg+xml":{"source":"iana","compressible":true},"application/vnd.oipf.dae.xhtml+xml":{"source":"iana","compressible":true},"application/vnd.oipf.mippvcontrolmessage+xml":{"source":"iana","compressible":true},"application/vnd.oipf.pae.gem":{"source":"iana"},"application/vnd.oipf.spdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.oipf.spdlist+xml":{"source":"iana","compressible":true},"application/vnd.oipf.ueprofile+xml":{"source":"iana","compressible":true},"application/vnd.oipf.userprofile+xml":{"source":"iana","compressible":true},"application/vnd.olpc-sugar":{"source":"iana","extensions":["xo"]},"application/vnd.oma-scws-config":{"source":"iana"},"application/vnd.oma-scws-http-request":{"source":"iana"},"application/vnd.oma-scws-http-response":{"source":"iana"},"application/vnd.oma.bcast.associated-procedure-parameter+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.drm-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.imd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.ltkm":{"source":"iana"},"application/vnd.oma.bcast.notification+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.provisioningtrigger":{"source":"iana"},"application/vnd.oma.bcast.sgboot":{"source":"iana"},"application/vnd.oma.bcast.sgdd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sgdu":{"source":"iana"},"application/vnd.oma.bcast.simple-symbol-container":{"source":"iana"},"application/vnd.oma.bcast.smartcard-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sprov+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.stkm":{"source":"iana"},"application/vnd.oma.cab-address-book+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-feature-handler+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-pcc+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-subs-invite+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-user-prefs+xml":{"source":"iana","compressible":true},"application/vnd.oma.dcd":{"source":"iana"},"application/vnd.oma.dcdc":{"source":"iana"},"application/vnd.oma.dd2+xml":{"source":"iana","compressible":true,"extensions":["dd2"]},"application/vnd.oma.drm.risd+xml":{"source":"iana","compressible":true},"application/vnd.oma.group-usage-list+xml":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+cbor":{"source":"iana"},"application/vnd.oma.lwm2m+json":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+tlv":{"source":"iana"},"application/vnd.oma.pal+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.detailed-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.final-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.groups+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.invocation-descriptor+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.optimized-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.push":{"source":"iana"},"application/vnd.oma.scidm.messages+xml":{"source":"iana","compressible":true},"application/vnd.oma.xcap-directory+xml":{"source":"iana","compressible":true},"application/vnd.omads-email+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-file+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omads-folder+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.omaloc-supl-init":{"source":"iana"},"application/vnd.onepager":{"source":"iana"},"application/vnd.onepagertamp":{"source":"iana"},"application/vnd.onepagertamx":{"source":"iana"},"application/vnd.onepagertat":{"source":"iana"},"application/vnd.onepagertatp":{"source":"iana"},"application/vnd.onepagertatx":{"source":"iana"},"application/vnd.openblox.game+xml":{"source":"iana","compressible":true,"extensions":["obgx"]},"application/vnd.openblox.game-binary":{"source":"iana"},"application/vnd.openeye.oeb":{"source":"iana"},"application/vnd.openofficeorg.extension":{"source":"apache","extensions":["oxt"]},"application/vnd.openstreetmap.data+xml":{"source":"iana","compressible":true,"extensions":["osm"]},"application/vnd.opentimestamps.ots":{"source":"iana"},"application/vnd.openxmlformats-officedocument.custom-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.customxmlproperties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawing+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chart+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.extended-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presentation":{"source":"iana","compressible":false,"extensions":["pptx"]},"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slide":{"source":"iana","extensions":["sldx"]},"application/vnd.openxmlformats-officedocument.presentationml.slide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideshow":{"source":"iana","extensions":["ppsx"]},"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tags+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.template":{"source":"iana","extensions":["potx"]},"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{"source":"iana","compressible":false,"extensions":["xlsx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.template":{"source":"iana","extensions":["xltx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.theme+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.themeoverride+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.vmldrawing":{"source":"iana"},"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document":{"source":"iana","compressible":false,"extensions":["docx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.template":{"source":"iana","extensions":["dotx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.core-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.relationships+xml":{"source":"iana","compressible":true},"application/vnd.oracle.resource+json":{"source":"iana","compressible":true},"application/vnd.orange.indata":{"source":"iana"},"application/vnd.osa.netdeploy":{"source":"iana"},"application/vnd.osgeo.mapguide.package":{"source":"iana","extensions":["mgp"]},"application/vnd.osgi.bundle":{"source":"iana"},"application/vnd.osgi.dp":{"source":"iana","extensions":["dp"]},"application/vnd.osgi.subsystem":{"source":"iana","extensions":["esa"]},"application/vnd.otps.ct-kip+xml":{"source":"iana","compressible":true},"application/vnd.oxli.countgraph":{"source":"iana"},"application/vnd.pagerduty+json":{"source":"iana","compressible":true},"application/vnd.palm":{"source":"iana","extensions":["pdb","pqa","oprc"]},"application/vnd.panoply":{"source":"iana"},"application/vnd.paos.xml":{"source":"iana"},"application/vnd.patentdive":{"source":"iana"},"application/vnd.patientecommsdoc":{"source":"iana"},"application/vnd.pawaafile":{"source":"iana","extensions":["paw"]},"application/vnd.pcos":{"source":"iana"},"application/vnd.pg.format":{"source":"iana","extensions":["str"]},"application/vnd.pg.osasli":{"source":"iana","extensions":["ei6"]},"application/vnd.piaccess.application-licence":{"source":"iana"},"application/vnd.picsel":{"source":"iana","extensions":["efif"]},"application/vnd.pmi.widget":{"source":"iana","extensions":["wg"]},"application/vnd.poc.group-advertisement+xml":{"source":"iana","compressible":true},"application/vnd.pocketlearn":{"source":"iana","extensions":["plf"]},"application/vnd.powerbuilder6":{"source":"iana","extensions":["pbd"]},"application/vnd.powerbuilder6-s":{"source":"iana"},"application/vnd.powerbuilder7":{"source":"iana"},"application/vnd.powerbuilder7-s":{"source":"iana"},"application/vnd.powerbuilder75":{"source":"iana"},"application/vnd.powerbuilder75-s":{"source":"iana"},"application/vnd.preminet":{"source":"iana"},"application/vnd.previewsystems.box":{"source":"iana","extensions":["box"]},"application/vnd.proteus.magazine":{"source":"iana","extensions":["mgz"]},"application/vnd.psfs":{"source":"iana"},"application/vnd.publishare-delta-tree":{"source":"iana","extensions":["qps"]},"application/vnd.pvi.ptid1":{"source":"iana","extensions":["ptid"]},"application/vnd.pwg-multiplexed":{"source":"iana"},"application/vnd.pwg-xhtml-print+xml":{"source":"iana","compressible":true},"application/vnd.qualcomm.brew-app-res":{"source":"iana"},"application/vnd.quarantainenet":{"source":"iana"},"application/vnd.quark.quarkxpress":{"source":"iana","extensions":["qxd","qxt","qwd","qwt","qxl","qxb"]},"application/vnd.quobject-quoxdocument":{"source":"iana"},"application/vnd.radisys.moml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conn+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-stream+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-base+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-detect+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-sendrecv+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-group+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-speech+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-transform+xml":{"source":"iana","compressible":true},"application/vnd.rainstor.data":{"source":"iana"},"application/vnd.rapid":{"source":"iana"},"application/vnd.rar":{"source":"iana","extensions":["rar"]},"application/vnd.realvnc.bed":{"source":"iana","extensions":["bed"]},"application/vnd.recordare.musicxml":{"source":"iana","extensions":["mxl"]},"application/vnd.recordare.musicxml+xml":{"source":"iana","compressible":true,"extensions":["musicxml"]},"application/vnd.renlearn.rlprint":{"source":"iana"},"application/vnd.resilient.logic":{"source":"iana"},"application/vnd.restful+json":{"source":"iana","compressible":true},"application/vnd.rig.cryptonote":{"source":"iana","extensions":["cryptonote"]},"application/vnd.rim.cod":{"source":"apache","extensions":["cod"]},"application/vnd.rn-realmedia":{"source":"apache","extensions":["rm"]},"application/vnd.rn-realmedia-vbr":{"source":"apache","extensions":["rmvb"]},"application/vnd.route66.link66+xml":{"source":"iana","compressible":true,"extensions":["link66"]},"application/vnd.rs-274x":{"source":"iana"},"application/vnd.ruckus.download":{"source":"iana"},"application/vnd.s3sms":{"source":"iana"},"application/vnd.sailingtracker.track":{"source":"iana","extensions":["st"]},"application/vnd.sar":{"source":"iana"},"application/vnd.sbm.cid":{"source":"iana"},"application/vnd.sbm.mid2":{"source":"iana"},"application/vnd.scribus":{"source":"iana"},"application/vnd.sealed.3df":{"source":"iana"},"application/vnd.sealed.csf":{"source":"iana"},"application/vnd.sealed.doc":{"source":"iana"},"application/vnd.sealed.eml":{"source":"iana"},"application/vnd.sealed.mht":{"source":"iana"},"application/vnd.sealed.net":{"source":"iana"},"application/vnd.sealed.ppt":{"source":"iana"},"application/vnd.sealed.tiff":{"source":"iana"},"application/vnd.sealed.xls":{"source":"iana"},"application/vnd.sealedmedia.softseal.html":{"source":"iana"},"application/vnd.sealedmedia.softseal.pdf":{"source":"iana"},"application/vnd.seemail":{"source":"iana","extensions":["see"]},"application/vnd.seis+json":{"source":"iana","compressible":true},"application/vnd.sema":{"source":"iana","extensions":["sema"]},"application/vnd.semd":{"source":"iana","extensions":["semd"]},"application/vnd.semf":{"source":"iana","extensions":["semf"]},"application/vnd.shade-save-file":{"source":"iana"},"application/vnd.shana.informed.formdata":{"source":"iana","extensions":["ifm"]},"application/vnd.shana.informed.formtemplate":{"source":"iana","extensions":["itp"]},"application/vnd.shana.informed.interchange":{"source":"iana","extensions":["iif"]},"application/vnd.shana.informed.package":{"source":"iana","extensions":["ipk"]},"application/vnd.shootproof+json":{"source":"iana","compressible":true},"application/vnd.shopkick+json":{"source":"iana","compressible":true},"application/vnd.shp":{"source":"iana"},"application/vnd.shx":{"source":"iana"},"application/vnd.sigrok.session":{"source":"iana"},"application/vnd.simtech-mindmapper":{"source":"iana","extensions":["twd","twds"]},"application/vnd.siren+json":{"source":"iana","compressible":true},"application/vnd.smaf":{"source":"iana","extensions":["mmf"]},"application/vnd.smart.notebook":{"source":"iana"},"application/vnd.smart.teacher":{"source":"iana","extensions":["teacher"]},"application/vnd.snesdev-page-table":{"source":"iana"},"application/vnd.software602.filler.form+xml":{"source":"iana","compressible":true,"extensions":["fo"]},"application/vnd.software602.filler.form-xml-zip":{"source":"iana"},"application/vnd.solent.sdkm+xml":{"source":"iana","compressible":true,"extensions":["sdkm","sdkd"]},"application/vnd.spotfire.dxp":{"source":"iana","extensions":["dxp"]},"application/vnd.spotfire.sfs":{"source":"iana","extensions":["sfs"]},"application/vnd.sqlite3":{"source":"iana"},"application/vnd.sss-cod":{"source":"iana"},"application/vnd.sss-dtf":{"source":"iana"},"application/vnd.sss-ntf":{"source":"iana"},"application/vnd.stardivision.calc":{"source":"apache","extensions":["sdc"]},"application/vnd.stardivision.draw":{"source":"apache","extensions":["sda"]},"application/vnd.stardivision.impress":{"source":"apache","extensions":["sdd"]},"application/vnd.stardivision.math":{"source":"apache","extensions":["smf"]},"application/vnd.stardivision.writer":{"source":"apache","extensions":["sdw","vor"]},"application/vnd.stardivision.writer-global":{"source":"apache","extensions":["sgl"]},"application/vnd.stepmania.package":{"source":"iana","extensions":["smzip"]},"application/vnd.stepmania.stepchart":{"source":"iana","extensions":["sm"]},"application/vnd.street-stream":{"source":"iana"},"application/vnd.sun.wadl+xml":{"source":"iana","compressible":true,"extensions":["wadl"]},"application/vnd.sun.xml.calc":{"source":"apache","extensions":["sxc"]},"application/vnd.sun.xml.calc.template":{"source":"apache","extensions":["stc"]},"application/vnd.sun.xml.draw":{"source":"apache","extensions":["sxd"]},"application/vnd.sun.xml.draw.template":{"source":"apache","extensions":["std"]},"application/vnd.sun.xml.impress":{"source":"apache","extensions":["sxi"]},"application/vnd.sun.xml.impress.template":{"source":"apache","extensions":["sti"]},"application/vnd.sun.xml.math":{"source":"apache","extensions":["sxm"]},"application/vnd.sun.xml.writer":{"source":"apache","extensions":["sxw"]},"application/vnd.sun.xml.writer.global":{"source":"apache","extensions":["sxg"]},"application/vnd.sun.xml.writer.template":{"source":"apache","extensions":["stw"]},"application/vnd.sus-calendar":{"source":"iana","extensions":["sus","susp"]},"application/vnd.svd":{"source":"iana","extensions":["svd"]},"application/vnd.swiftview-ics":{"source":"iana"},"application/vnd.sycle+xml":{"source":"iana","compressible":true},"application/vnd.syft+json":{"source":"iana","compressible":true},"application/vnd.symbian.install":{"source":"apache","extensions":["sis","sisx"]},"application/vnd.syncml+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xsm"]},"application/vnd.syncml.dm+wbxml":{"source":"iana","charset":"UTF-8","extensions":["bdm"]},"application/vnd.syncml.dm+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["xdm"]},"application/vnd.syncml.dm.notification":{"source":"iana"},"application/vnd.syncml.dmddf+wbxml":{"source":"iana"},"application/vnd.syncml.dmddf+xml":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["ddf"]},"application/vnd.syncml.dmtnds+wbxml":{"source":"iana"},"application/vnd.syncml.dmtnds+xml":{"source":"iana","charset":"UTF-8","compressible":true},"application/vnd.syncml.ds.notification":{"source":"iana"},"application/vnd.tableschema+json":{"source":"iana","compressible":true},"application/vnd.tao.intent-module-archive":{"source":"iana","extensions":["tao"]},"application/vnd.tcpdump.pcap":{"source":"iana","extensions":["pcap","cap","dmp"]},"application/vnd.think-cell.ppttc+json":{"source":"iana","compressible":true},"application/vnd.tmd.mediaflex.api+xml":{"source":"iana","compressible":true},"application/vnd.tml":{"source":"iana"},"application/vnd.tmobile-livetv":{"source":"iana","extensions":["tmo"]},"application/vnd.tri.onesource":{"source":"iana"},"application/vnd.trid.tpt":{"source":"iana","extensions":["tpt"]},"application/vnd.triscape.mxs":{"source":"iana","extensions":["mxs"]},"application/vnd.trueapp":{"source":"iana","extensions":["tra"]},"application/vnd.truedoc":{"source":"iana"},"application/vnd.ubisoft.webplayer":{"source":"iana"},"application/vnd.ufdl":{"source":"iana","extensions":["ufd","ufdl"]},"application/vnd.uiq.theme":{"source":"iana","extensions":["utz"]},"application/vnd.umajin":{"source":"iana","extensions":["umj"]},"application/vnd.unity":{"source":"iana","extensions":["unityweb"]},"application/vnd.uoml+xml":{"source":"iana","compressible":true,"extensions":["uoml"]},"application/vnd.uplanet.alert":{"source":"iana"},"application/vnd.uplanet.alert-wbxml":{"source":"iana"},"application/vnd.uplanet.bearer-choice":{"source":"iana"},"application/vnd.uplanet.bearer-choice-wbxml":{"source":"iana"},"application/vnd.uplanet.cacheop":{"source":"iana"},"application/vnd.uplanet.cacheop-wbxml":{"source":"iana"},"application/vnd.uplanet.channel":{"source":"iana"},"application/vnd.uplanet.channel-wbxml":{"source":"iana"},"application/vnd.uplanet.list":{"source":"iana"},"application/vnd.uplanet.list-wbxml":{"source":"iana"},"application/vnd.uplanet.listcmd":{"source":"iana"},"application/vnd.uplanet.listcmd-wbxml":{"source":"iana"},"application/vnd.uplanet.signal":{"source":"iana"},"application/vnd.uri-map":{"source":"iana"},"application/vnd.valve.source.material":{"source":"iana"},"application/vnd.vcx":{"source":"iana","extensions":["vcx"]},"application/vnd.vd-study":{"source":"iana"},"application/vnd.vectorworks":{"source":"iana"},"application/vnd.vel+json":{"source":"iana","compressible":true},"application/vnd.verimatrix.vcas":{"source":"iana"},"application/vnd.veritone.aion+json":{"source":"iana","compressible":true},"application/vnd.veryant.thin":{"source":"iana"},"application/vnd.ves.encrypted":{"source":"iana"},"application/vnd.vidsoft.vidconference":{"source":"iana"},"application/vnd.visio":{"source":"iana","extensions":["vsd","vst","vss","vsw"]},"application/vnd.visionary":{"source":"iana","extensions":["vis"]},"application/vnd.vividence.scriptfile":{"source":"iana"},"application/vnd.vsf":{"source":"iana","extensions":["vsf"]},"application/vnd.wap.sic":{"source":"iana"},"application/vnd.wap.slc":{"source":"iana"},"application/vnd.wap.wbxml":{"source":"iana","charset":"UTF-8","extensions":["wbxml"]},"application/vnd.wap.wmlc":{"source":"iana","extensions":["wmlc"]},"application/vnd.wap.wmlscriptc":{"source":"iana","extensions":["wmlsc"]},"application/vnd.webturbo":{"source":"iana","extensions":["wtb"]},"application/vnd.wfa.dpp":{"source":"iana"},"application/vnd.wfa.p2p":{"source":"iana"},"application/vnd.wfa.wsc":{"source":"iana"},"application/vnd.windows.devicepairing":{"source":"iana"},"application/vnd.wmc":{"source":"iana"},"application/vnd.wmf.bootstrap":{"source":"iana"},"application/vnd.wolfram.mathematica":{"source":"iana"},"application/vnd.wolfram.mathematica.package":{"source":"iana"},"application/vnd.wolfram.player":{"source":"iana","extensions":["nbp"]},"application/vnd.wordperfect":{"source":"iana","extensions":["wpd"]},"application/vnd.wqd":{"source":"iana","extensions":["wqd"]},"application/vnd.wrq-hp3000-labelled":{"source":"iana"},"application/vnd.wt.stf":{"source":"iana","extensions":["stf"]},"application/vnd.wv.csp+wbxml":{"source":"iana"},"application/vnd.wv.csp+xml":{"source":"iana","compressible":true},"application/vnd.wv.ssp+xml":{"source":"iana","compressible":true},"application/vnd.xacml+json":{"source":"iana","compressible":true},"application/vnd.xara":{"source":"iana","extensions":["xar"]},"application/vnd.xfdl":{"source":"iana","extensions":["xfdl"]},"application/vnd.xfdl.webform":{"source":"iana"},"application/vnd.xmi+xml":{"source":"iana","compressible":true},"application/vnd.xmpie.cpkg":{"source":"iana"},"application/vnd.xmpie.dpkg":{"source":"iana"},"application/vnd.xmpie.plan":{"source":"iana"},"application/vnd.xmpie.ppkg":{"source":"iana"},"application/vnd.xmpie.xlim":{"source":"iana"},"application/vnd.yamaha.hv-dic":{"source":"iana","extensions":["hvd"]},"application/vnd.yamaha.hv-script":{"source":"iana","extensions":["hvs"]},"application/vnd.yamaha.hv-voice":{"source":"iana","extensions":["hvp"]},"application/vnd.yamaha.openscoreformat":{"source":"iana","extensions":["osf"]},"application/vnd.yamaha.openscoreformat.osfpvg+xml":{"source":"iana","compressible":true,"extensions":["osfpvg"]},"application/vnd.yamaha.remote-setup":{"source":"iana"},"application/vnd.yamaha.smaf-audio":{"source":"iana","extensions":["saf"]},"application/vnd.yamaha.smaf-phrase":{"source":"iana","extensions":["spf"]},"application/vnd.yamaha.through-ngn":{"source":"iana"},"application/vnd.yamaha.tunnel-udpencap":{"source":"iana"},"application/vnd.yaoweme":{"source":"iana"},"application/vnd.yellowriver-custom-menu":{"source":"iana","extensions":["cmp"]},"application/vnd.youtube.yt":{"source":"iana"},"application/vnd.zul":{"source":"iana","extensions":["zir","zirz"]},"application/vnd.zzazz.deck+xml":{"source":"iana","compressible":true,"extensions":["zaz"]},"application/voicexml+xml":{"source":"iana","compressible":true,"extensions":["vxml"]},"application/voucher-cms+json":{"source":"iana","compressible":true},"application/vq-rtcpxr":{"source":"iana"},"application/wasm":{"source":"iana","compressible":true,"extensions":["wasm"]},"application/watcherinfo+xml":{"source":"iana","compressible":true,"extensions":["wif"]},"application/webpush-options+json":{"source":"iana","compressible":true},"application/whoispp-query":{"source":"iana"},"application/whoispp-response":{"source":"iana"},"application/widget":{"source":"iana","extensions":["wgt"]},"application/winhlp":{"source":"apache","extensions":["hlp"]},"application/wita":{"source":"iana"},"application/wordperfect5.1":{"source":"iana"},"application/wsdl+xml":{"source":"iana","compressible":true,"extensions":["wsdl"]},"application/wspolicy+xml":{"source":"iana","compressible":true,"extensions":["wspolicy"]},"application/x-7z-compressed":{"source":"apache","compressible":false,"extensions":["7z"]},"application/x-abiword":{"source":"apache","extensions":["abw"]},"application/x-ace-compressed":{"source":"apache","extensions":["ace"]},"application/x-amf":{"source":"apache"},"application/x-apple-diskimage":{"source":"apache","extensions":["dmg"]},"application/x-arj":{"compressible":false,"extensions":["arj"]},"application/x-authorware-bin":{"source":"apache","extensions":["aab","x32","u32","vox"]},"application/x-authorware-map":{"source":"apache","extensions":["aam"]},"application/x-authorware-seg":{"source":"apache","extensions":["aas"]},"application/x-bcpio":{"source":"apache","extensions":["bcpio"]},"application/x-bdoc":{"compressible":false,"extensions":["bdoc"]},"application/x-bittorrent":{"source":"apache","extensions":["torrent"]},"application/x-blorb":{"source":"apache","extensions":["blb","blorb"]},"application/x-bzip":{"source":"apache","compressible":false,"extensions":["bz"]},"application/x-bzip2":{"source":"apache","compressible":false,"extensions":["bz2","boz"]},"application/x-cbr":{"source":"apache","extensions":["cbr","cba","cbt","cbz","cb7"]},"application/x-cdlink":{"source":"apache","extensions":["vcd"]},"application/x-cfs-compressed":{"source":"apache","extensions":["cfs"]},"application/x-chat":{"source":"apache","extensions":["chat"]},"application/x-chess-pgn":{"source":"apache","extensions":["pgn"]},"application/x-chrome-extension":{"extensions":["crx"]},"application/x-cocoa":{"source":"nginx","extensions":["cco"]},"application/x-compress":{"source":"apache"},"application/x-conference":{"source":"apache","extensions":["nsc"]},"application/x-cpio":{"source":"apache","extensions":["cpio"]},"application/x-csh":{"source":"apache","extensions":["csh"]},"application/x-deb":{"compressible":false},"application/x-debian-package":{"source":"apache","extensions":["deb","udeb"]},"application/x-dgc-compressed":{"source":"apache","extensions":["dgc"]},"application/x-director":{"source":"apache","extensions":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]},"application/x-doom":{"source":"apache","extensions":["wad"]},"application/x-dtbncx+xml":{"source":"apache","compressible":true,"extensions":["ncx"]},"application/x-dtbook+xml":{"source":"apache","compressible":true,"extensions":["dtb"]},"application/x-dtbresource+xml":{"source":"apache","compressible":true,"extensions":["res"]},"application/x-dvi":{"source":"apache","compressible":false,"extensions":["dvi"]},"application/x-envoy":{"source":"apache","extensions":["evy"]},"application/x-eva":{"source":"apache","extensions":["eva"]},"application/x-font-bdf":{"source":"apache","extensions":["bdf"]},"application/x-font-dos":{"source":"apache"},"application/x-font-framemaker":{"source":"apache"},"application/x-font-ghostscript":{"source":"apache","extensions":["gsf"]},"application/x-font-libgrx":{"source":"apache"},"application/x-font-linux-psf":{"source":"apache","extensions":["psf"]},"application/x-font-pcf":{"source":"apache","extensions":["pcf"]},"application/x-font-snf":{"source":"apache","extensions":["snf"]},"application/x-font-speedo":{"source":"apache"},"application/x-font-sunos-news":{"source":"apache"},"application/x-font-type1":{"source":"apache","extensions":["pfa","pfb","pfm","afm"]},"application/x-font-vfont":{"source":"apache"},"application/x-freearc":{"source":"apache","extensions":["arc"]},"application/x-futuresplash":{"source":"apache","extensions":["spl"]},"application/x-gca-compressed":{"source":"apache","extensions":["gca"]},"application/x-glulx":{"source":"apache","extensions":["ulx"]},"application/x-gnumeric":{"source":"apache","extensions":["gnumeric"]},"application/x-gramps-xml":{"source":"apache","extensions":["gramps"]},"application/x-gtar":{"source":"apache","extensions":["gtar"]},"application/x-gzip":{"source":"apache"},"application/x-hdf":{"source":"apache","extensions":["hdf"]},"application/x-httpd-php":{"compressible":true,"extensions":["php"]},"application/x-install-instructions":{"source":"apache","extensions":["install"]},"application/x-iso9660-image":{"source":"apache","extensions":["iso"]},"application/x-iwork-keynote-sffkey":{"extensions":["key"]},"application/x-iwork-numbers-sffnumbers":{"extensions":["numbers"]},"application/x-iwork-pages-sffpages":{"extensions":["pages"]},"application/x-java-archive-diff":{"source":"nginx","extensions":["jardiff"]},"application/x-java-jnlp-file":{"source":"apache","compressible":false,"extensions":["jnlp"]},"application/x-javascript":{"compressible":true},"application/x-keepass2":{"extensions":["kdbx"]},"application/x-latex":{"source":"apache","compressible":false,"extensions":["latex"]},"application/x-lua-bytecode":{"extensions":["luac"]},"application/x-lzh-compressed":{"source":"apache","extensions":["lzh","lha"]},"application/x-makeself":{"source":"nginx","extensions":["run"]},"application/x-mie":{"source":"apache","extensions":["mie"]},"application/x-mobipocket-ebook":{"source":"apache","extensions":["prc","mobi"]},"application/x-mpegurl":{"compressible":false},"application/x-ms-application":{"source":"apache","extensions":["application"]},"application/x-ms-shortcut":{"source":"apache","extensions":["lnk"]},"application/x-ms-wmd":{"source":"apache","extensions":["wmd"]},"application/x-ms-wmz":{"source":"apache","extensions":["wmz"]},"application/x-ms-xbap":{"source":"apache","extensions":["xbap"]},"application/x-msaccess":{"source":"apache","extensions":["mdb"]},"application/x-msbinder":{"source":"apache","extensions":["obd"]},"application/x-mscardfile":{"source":"apache","extensions":["crd"]},"application/x-msclip":{"source":"apache","extensions":["clp"]},"application/x-msdos-program":{"extensions":["exe"]},"application/x-msdownload":{"source":"apache","extensions":["exe","dll","com","bat","msi"]},"application/x-msmediaview":{"source":"apache","extensions":["mvb","m13","m14"]},"application/x-msmetafile":{"source":"apache","extensions":["wmf","wmz","emf","emz"]},"application/x-msmoney":{"source":"apache","extensions":["mny"]},"application/x-mspublisher":{"source":"apache","extensions":["pub"]},"application/x-msschedule":{"source":"apache","extensions":["scd"]},"application/x-msterminal":{"source":"apache","extensions":["trm"]},"application/x-mswrite":{"source":"apache","extensions":["wri"]},"application/x-netcdf":{"source":"apache","extensions":["nc","cdf"]},"application/x-ns-proxy-autoconfig":{"compressible":true,"extensions":["pac"]},"application/x-nzb":{"source":"apache","extensions":["nzb"]},"application/x-perl":{"source":"nginx","extensions":["pl","pm"]},"application/x-pilot":{"source":"nginx","extensions":["prc","pdb"]},"application/x-pkcs12":{"source":"apache","compressible":false,"extensions":["p12","pfx"]},"application/x-pkcs7-certificates":{"source":"apache","extensions":["p7b","spc"]},"application/x-pkcs7-certreqresp":{"source":"apache","extensions":["p7r"]},"application/x-pki-message":{"source":"iana"},"application/x-rar-compressed":{"source":"apache","compressible":false,"extensions":["rar"]},"application/x-redhat-package-manager":{"source":"nginx","extensions":["rpm"]},"application/x-research-info-systems":{"source":"apache","extensions":["ris"]},"application/x-sea":{"source":"nginx","extensions":["sea"]},"application/x-sh":{"source":"apache","compressible":true,"extensions":["sh"]},"application/x-shar":{"source":"apache","extensions":["shar"]},"application/x-shockwave-flash":{"source":"apache","compressible":false,"extensions":["swf"]},"application/x-silverlight-app":{"source":"apache","extensions":["xap"]},"application/x-sql":{"source":"apache","extensions":["sql"]},"application/x-stuffit":{"source":"apache","compressible":false,"extensions":["sit"]},"application/x-stuffitx":{"source":"apache","extensions":["sitx"]},"application/x-subrip":{"source":"apache","extensions":["srt"]},"application/x-sv4cpio":{"source":"apache","extensions":["sv4cpio"]},"application/x-sv4crc":{"source":"apache","extensions":["sv4crc"]},"application/x-t3vm-image":{"source":"apache","extensions":["t3"]},"application/x-tads":{"source":"apache","extensions":["gam"]},"application/x-tar":{"source":"apache","compressible":true,"extensions":["tar"]},"application/x-tcl":{"source":"apache","extensions":["tcl","tk"]},"application/x-tex":{"source":"apache","extensions":["tex"]},"application/x-tex-tfm":{"source":"apache","extensions":["tfm"]},"application/x-texinfo":{"source":"apache","extensions":["texinfo","texi"]},"application/x-tgif":{"source":"apache","extensions":["obj"]},"application/x-ustar":{"source":"apache","extensions":["ustar"]},"application/x-virtualbox-hdd":{"compressible":true,"extensions":["hdd"]},"application/x-virtualbox-ova":{"compressible":true,"extensions":["ova"]},"application/x-virtualbox-ovf":{"compressible":true,"extensions":["ovf"]},"application/x-virtualbox-vbox":{"compressible":true,"extensions":["vbox"]},"application/x-virtualbox-vbox-extpack":{"compressible":false,"extensions":["vbox-extpack"]},"application/x-virtualbox-vdi":{"compressible":true,"extensions":["vdi"]},"application/x-virtualbox-vhd":{"compressible":true,"extensions":["vhd"]},"application/x-virtualbox-vmdk":{"compressible":true,"extensions":["vmdk"]},"application/x-wais-source":{"source":"apache","extensions":["src"]},"application/x-web-app-manifest+json":{"compressible":true,"extensions":["webapp"]},"application/x-www-form-urlencoded":{"source":"iana","compressible":true},"application/x-x509-ca-cert":{"source":"iana","extensions":["der","crt","pem"]},"application/x-x509-ca-ra-cert":{"source":"iana"},"application/x-x509-next-ca-cert":{"source":"iana"},"application/x-xfig":{"source":"apache","extensions":["fig"]},"application/x-xliff+xml":{"source":"apache","compressible":true,"extensions":["xlf"]},"application/x-xpinstall":{"source":"apache","compressible":false,"extensions":["xpi"]},"application/x-xz":{"source":"apache","extensions":["xz"]},"application/x-zmachine":{"source":"apache","extensions":["z1","z2","z3","z4","z5","z6","z7","z8"]},"application/x400-bp":{"source":"iana"},"application/xacml+xml":{"source":"iana","compressible":true},"application/xaml+xml":{"source":"apache","compressible":true,"extensions":["xaml"]},"application/xcap-att+xml":{"source":"iana","compressible":true,"extensions":["xav"]},"application/xcap-caps+xml":{"source":"iana","compressible":true,"extensions":["xca"]},"application/xcap-diff+xml":{"source":"iana","compressible":true,"extensions":["xdf"]},"application/xcap-el+xml":{"source":"iana","compressible":true,"extensions":["xel"]},"application/xcap-error+xml":{"source":"iana","compressible":true},"application/xcap-ns+xml":{"source":"iana","compressible":true,"extensions":["xns"]},"application/xcon-conference-info+xml":{"source":"iana","compressible":true},"application/xcon-conference-info-diff+xml":{"source":"iana","compressible":true},"application/xenc+xml":{"source":"iana","compressible":true,"extensions":["xenc"]},"application/xhtml+xml":{"source":"iana","compressible":true,"extensions":["xhtml","xht"]},"application/xhtml-voice+xml":{"source":"apache","compressible":true},"application/xliff+xml":{"source":"iana","compressible":true,"extensions":["xlf"]},"application/xml":{"source":"iana","compressible":true,"extensions":["xml","xsl","xsd","rng"]},"application/xml-dtd":{"source":"iana","compressible":true,"extensions":["dtd"]},"application/xml-external-parsed-entity":{"source":"iana"},"application/xml-patch+xml":{"source":"iana","compressible":true},"application/xmpp+xml":{"source":"iana","compressible":true},"application/xop+xml":{"source":"iana","compressible":true,"extensions":["xop"]},"application/xproc+xml":{"source":"apache","compressible":true,"extensions":["xpl"]},"application/xslt+xml":{"source":"iana","compressible":true,"extensions":["xsl","xslt"]},"application/xspf+xml":{"source":"apache","compressible":true,"extensions":["xspf"]},"application/xv+xml":{"source":"iana","compressible":true,"extensions":["mxml","xhvml","xvml","xvm"]},"application/yang":{"source":"iana","extensions":["yang"]},"application/yang-data+json":{"source":"iana","compressible":true},"application/yang-data+xml":{"source":"iana","compressible":true},"application/yang-patch+json":{"source":"iana","compressible":true},"application/yang-patch+xml":{"source":"iana","compressible":true},"application/yin+xml":{"source":"iana","compressible":true,"extensions":["yin"]},"application/zip":{"source":"iana","compressible":false,"extensions":["zip"]},"application/zlib":{"source":"iana"},"application/zstd":{"source":"iana"},"audio/1d-interleaved-parityfec":{"source":"iana"},"audio/32kadpcm":{"source":"iana"},"audio/3gpp":{"source":"iana","compressible":false,"extensions":["3gpp"]},"audio/3gpp2":{"source":"iana"},"audio/aac":{"source":"iana"},"audio/ac3":{"source":"iana"},"audio/adpcm":{"source":"apache","extensions":["adp"]},"audio/amr":{"source":"iana","extensions":["amr"]},"audio/amr-wb":{"source":"iana"},"audio/amr-wb+":{"source":"iana"},"audio/aptx":{"source":"iana"},"audio/asc":{"source":"iana"},"audio/atrac-advanced-lossless":{"source":"iana"},"audio/atrac-x":{"source":"iana"},"audio/atrac3":{"source":"iana"},"audio/basic":{"source":"iana","compressible":false,"extensions":["au","snd"]},"audio/bv16":{"source":"iana"},"audio/bv32":{"source":"iana"},"audio/clearmode":{"source":"iana"},"audio/cn":{"source":"iana"},"audio/dat12":{"source":"iana"},"audio/dls":{"source":"iana"},"audio/dsr-es201108":{"source":"iana"},"audio/dsr-es202050":{"source":"iana"},"audio/dsr-es202211":{"source":"iana"},"audio/dsr-es202212":{"source":"iana"},"audio/dv":{"source":"iana"},"audio/dvi4":{"source":"iana"},"audio/eac3":{"source":"iana"},"audio/encaprtp":{"source":"iana"},"audio/evrc":{"source":"iana"},"audio/evrc-qcp":{"source":"iana"},"audio/evrc0":{"source":"iana"},"audio/evrc1":{"source":"iana"},"audio/evrcb":{"source":"iana"},"audio/evrcb0":{"source":"iana"},"audio/evrcb1":{"source":"iana"},"audio/evrcnw":{"source":"iana"},"audio/evrcnw0":{"source":"iana"},"audio/evrcnw1":{"source":"iana"},"audio/evrcwb":{"source":"iana"},"audio/evrcwb0":{"source":"iana"},"audio/evrcwb1":{"source":"iana"},"audio/evs":{"source":"iana"},"audio/flexfec":{"source":"iana"},"audio/fwdred":{"source":"iana"},"audio/g711-0":{"source":"iana"},"audio/g719":{"source":"iana"},"audio/g722":{"source":"iana"},"audio/g7221":{"source":"iana"},"audio/g723":{"source":"iana"},"audio/g726-16":{"source":"iana"},"audio/g726-24":{"source":"iana"},"audio/g726-32":{"source":"iana"},"audio/g726-40":{"source":"iana"},"audio/g728":{"source":"iana"},"audio/g729":{"source":"iana"},"audio/g7291":{"source":"iana"},"audio/g729d":{"source":"iana"},"audio/g729e":{"source":"iana"},"audio/gsm":{"source":"iana"},"audio/gsm-efr":{"source":"iana"},"audio/gsm-hr-08":{"source":"iana"},"audio/ilbc":{"source":"iana"},"audio/ip-mr_v2.5":{"source":"iana"},"audio/isac":{"source":"apache"},"audio/l16":{"source":"iana"},"audio/l20":{"source":"iana"},"audio/l24":{"source":"iana","compressible":false},"audio/l8":{"source":"iana"},"audio/lpc":{"source":"iana"},"audio/melp":{"source":"iana"},"audio/melp1200":{"source":"iana"},"audio/melp2400":{"source":"iana"},"audio/melp600":{"source":"iana"},"audio/mhas":{"source":"iana"},"audio/midi":{"source":"apache","extensions":["mid","midi","kar","rmi"]},"audio/mobile-xmf":{"source":"iana","extensions":["mxmf"]},"audio/mp3":{"compressible":false,"extensions":["mp3"]},"audio/mp4":{"source":"iana","compressible":false,"extensions":["m4a","mp4a"]},"audio/mp4a-latm":{"source":"iana"},"audio/mpa":{"source":"iana"},"audio/mpa-robust":{"source":"iana"},"audio/mpeg":{"source":"iana","compressible":false,"extensions":["mpga","mp2","mp2a","mp3","m2a","m3a"]},"audio/mpeg4-generic":{"source":"iana"},"audio/musepack":{"source":"apache"},"audio/ogg":{"source":"iana","compressible":false,"extensions":["oga","ogg","spx","opus"]},"audio/opus":{"source":"iana"},"audio/parityfec":{"source":"iana"},"audio/pcma":{"source":"iana"},"audio/pcma-wb":{"source":"iana"},"audio/pcmu":{"source":"iana"},"audio/pcmu-wb":{"source":"iana"},"audio/prs.sid":{"source":"iana"},"audio/qcelp":{"source":"iana"},"audio/raptorfec":{"source":"iana"},"audio/red":{"source":"iana"},"audio/rtp-enc-aescm128":{"source":"iana"},"audio/rtp-midi":{"source":"iana"},"audio/rtploopback":{"source":"iana"},"audio/rtx":{"source":"iana"},"audio/s3m":{"source":"apache","extensions":["s3m"]},"audio/scip":{"source":"iana"},"audio/silk":{"source":"apache","extensions":["sil"]},"audio/smv":{"source":"iana"},"audio/smv-qcp":{"source":"iana"},"audio/smv0":{"source":"iana"},"audio/sofa":{"source":"iana"},"audio/sp-midi":{"source":"iana"},"audio/speex":{"source":"iana"},"audio/t140c":{"source":"iana"},"audio/t38":{"source":"iana"},"audio/telephone-event":{"source":"iana"},"audio/tetra_acelp":{"source":"iana"},"audio/tetra_acelp_bb":{"source":"iana"},"audio/tone":{"source":"iana"},"audio/tsvcis":{"source":"iana"},"audio/uemclip":{"source":"iana"},"audio/ulpfec":{"source":"iana"},"audio/usac":{"source":"iana"},"audio/vdvi":{"source":"iana"},"audio/vmr-wb":{"source":"iana"},"audio/vnd.3gpp.iufp":{"source":"iana"},"audio/vnd.4sb":{"source":"iana"},"audio/vnd.audiokoz":{"source":"iana"},"audio/vnd.celp":{"source":"iana"},"audio/vnd.cisco.nse":{"source":"iana"},"audio/vnd.cmles.radio-events":{"source":"iana"},"audio/vnd.cns.anp1":{"source":"iana"},"audio/vnd.cns.inf1":{"source":"iana"},"audio/vnd.dece.audio":{"source":"iana","extensions":["uva","uvva"]},"audio/vnd.digital-winds":{"source":"iana","extensions":["eol"]},"audio/vnd.dlna.adts":{"source":"iana"},"audio/vnd.dolby.heaac.1":{"source":"iana"},"audio/vnd.dolby.heaac.2":{"source":"iana"},"audio/vnd.dolby.mlp":{"source":"iana"},"audio/vnd.dolby.mps":{"source":"iana"},"audio/vnd.dolby.pl2":{"source":"iana"},"audio/vnd.dolby.pl2x":{"source":"iana"},"audio/vnd.dolby.pl2z":{"source":"iana"},"audio/vnd.dolby.pulse.1":{"source":"iana"},"audio/vnd.dra":{"source":"iana","extensions":["dra"]},"audio/vnd.dts":{"source":"iana","extensions":["dts"]},"audio/vnd.dts.hd":{"source":"iana","extensions":["dtshd"]},"audio/vnd.dts.uhd":{"source":"iana"},"audio/vnd.dvb.file":{"source":"iana"},"audio/vnd.everad.plj":{"source":"iana"},"audio/vnd.hns.audio":{"source":"iana"},"audio/vnd.lucent.voice":{"source":"iana","extensions":["lvp"]},"audio/vnd.ms-playready.media.pya":{"source":"iana","extensions":["pya"]},"audio/vnd.nokia.mobile-xmf":{"source":"iana"},"audio/vnd.nortel.vbk":{"source":"iana"},"audio/vnd.nuera.ecelp4800":{"source":"iana","extensions":["ecelp4800"]},"audio/vnd.nuera.ecelp7470":{"source":"iana","extensions":["ecelp7470"]},"audio/vnd.nuera.ecelp9600":{"source":"iana","extensions":["ecelp9600"]},"audio/vnd.octel.sbc":{"source":"iana"},"audio/vnd.presonus.multitrack":{"source":"iana"},"audio/vnd.qcelp":{"source":"iana"},"audio/vnd.rhetorex.32kadpcm":{"source":"iana"},"audio/vnd.rip":{"source":"iana","extensions":["rip"]},"audio/vnd.rn-realaudio":{"compressible":false},"audio/vnd.sealedmedia.softseal.mpeg":{"source":"iana"},"audio/vnd.vmx.cvsd":{"source":"iana"},"audio/vnd.wave":{"compressible":false},"audio/vorbis":{"source":"iana","compressible":false},"audio/vorbis-config":{"source":"iana"},"audio/wav":{"compressible":false,"extensions":["wav"]},"audio/wave":{"compressible":false,"extensions":["wav"]},"audio/webm":{"source":"apache","compressible":false,"extensions":["weba"]},"audio/x-aac":{"source":"apache","compressible":false,"extensions":["aac"]},"audio/x-aiff":{"source":"apache","extensions":["aif","aiff","aifc"]},"audio/x-caf":{"source":"apache","compressible":false,"extensions":["caf"]},"audio/x-flac":{"source":"apache","extensions":["flac"]},"audio/x-m4a":{"source":"nginx","extensions":["m4a"]},"audio/x-matroska":{"source":"apache","extensions":["mka"]},"audio/x-mpegurl":{"source":"apache","extensions":["m3u"]},"audio/x-ms-wax":{"source":"apache","extensions":["wax"]},"audio/x-ms-wma":{"source":"apache","extensions":["wma"]},"audio/x-pn-realaudio":{"source":"apache","extensions":["ram","ra"]},"audio/x-pn-realaudio-plugin":{"source":"apache","extensions":["rmp"]},"audio/x-realaudio":{"source":"nginx","extensions":["ra"]},"audio/x-tta":{"source":"apache"},"audio/x-wav":{"source":"apache","extensions":["wav"]},"audio/xm":{"source":"apache","extensions":["xm"]},"chemical/x-cdx":{"source":"apache","extensions":["cdx"]},"chemical/x-cif":{"source":"apache","extensions":["cif"]},"chemical/x-cmdf":{"source":"apache","extensions":["cmdf"]},"chemical/x-cml":{"source":"apache","extensions":["cml"]},"chemical/x-csml":{"source":"apache","extensions":["csml"]},"chemical/x-pdb":{"source":"apache"},"chemical/x-xyz":{"source":"apache","extensions":["xyz"]},"font/collection":{"source":"iana","extensions":["ttc"]},"font/otf":{"source":"iana","compressible":true,"extensions":["otf"]},"font/sfnt":{"source":"iana"},"font/ttf":{"source":"iana","compressible":true,"extensions":["ttf"]},"font/woff":{"source":"iana","extensions":["woff"]},"font/woff2":{"source":"iana","extensions":["woff2"]},"image/aces":{"source":"iana","extensions":["exr"]},"image/apng":{"compressible":false,"extensions":["apng"]},"image/avci":{"source":"iana","extensions":["avci"]},"image/avcs":{"source":"iana","extensions":["avcs"]},"image/avif":{"source":"iana","compressible":false,"extensions":["avif"]},"image/bmp":{"source":"iana","compressible":true,"extensions":["bmp"]},"image/cgm":{"source":"iana","extensions":["cgm"]},"image/dicom-rle":{"source":"iana","extensions":["drle"]},"image/emf":{"source":"iana","extensions":["emf"]},"image/fits":{"source":"iana","extensions":["fits"]},"image/g3fax":{"source":"iana","extensions":["g3"]},"image/gif":{"source":"iana","compressible":false,"extensions":["gif"]},"image/heic":{"source":"iana","extensions":["heic"]},"image/heic-sequence":{"source":"iana","extensions":["heics"]},"image/heif":{"source":"iana","extensions":["heif"]},"image/heif-sequence":{"source":"iana","extensions":["heifs"]},"image/hej2k":{"source":"iana","extensions":["hej2"]},"image/hsj2":{"source":"iana","extensions":["hsj2"]},"image/ief":{"source":"iana","extensions":["ief"]},"image/jls":{"source":"iana","extensions":["jls"]},"image/jp2":{"source":"iana","compressible":false,"extensions":["jp2","jpg2"]},"image/jpeg":{"source":"iana","compressible":false,"extensions":["jpeg","jpg","jpe"]},"image/jph":{"source":"iana","extensions":["jph"]},"image/jphc":{"source":"iana","extensions":["jhc"]},"image/jpm":{"source":"iana","compressible":false,"extensions":["jpm"]},"image/jpx":{"source":"iana","compressible":false,"extensions":["jpx","jpf"]},"image/jxr":{"source":"iana","extensions":["jxr"]},"image/jxra":{"source":"iana","extensions":["jxra"]},"image/jxrs":{"source":"iana","extensions":["jxrs"]},"image/jxs":{"source":"iana","extensions":["jxs"]},"image/jxsc":{"source":"iana","extensions":["jxsc"]},"image/jxsi":{"source":"iana","extensions":["jxsi"]},"image/jxss":{"source":"iana","extensions":["jxss"]},"image/ktx":{"source":"iana","extensions":["ktx"]},"image/ktx2":{"source":"iana","extensions":["ktx2"]},"image/naplps":{"source":"iana"},"image/pjpeg":{"compressible":false},"image/png":{"source":"iana","compressible":false,"extensions":["png"]},"image/prs.btif":{"source":"iana","extensions":["btif"]},"image/prs.pti":{"source":"iana","extensions":["pti"]},"image/pwg-raster":{"source":"iana"},"image/sgi":{"source":"apache","extensions":["sgi"]},"image/svg+xml":{"source":"iana","compressible":true,"extensions":["svg","svgz"]},"image/t38":{"source":"iana","extensions":["t38"]},"image/tiff":{"source":"iana","compressible":false,"extensions":["tif","tiff"]},"image/tiff-fx":{"source":"iana","extensions":["tfx"]},"image/vnd.adobe.photoshop":{"source":"iana","compressible":true,"extensions":["psd"]},"image/vnd.airzip.accelerator.azv":{"source":"iana","extensions":["azv"]},"image/vnd.cns.inf2":{"source":"iana"},"image/vnd.dece.graphic":{"source":"iana","extensions":["uvi","uvvi","uvg","uvvg"]},"image/vnd.djvu":{"source":"iana","extensions":["djvu","djv"]},"image/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"image/vnd.dwg":{"source":"iana","extensions":["dwg"]},"image/vnd.dxf":{"source":"iana","extensions":["dxf"]},"image/vnd.fastbidsheet":{"source":"iana","extensions":["fbs"]},"image/vnd.fpx":{"source":"iana","extensions":["fpx"]},"image/vnd.fst":{"source":"iana","extensions":["fst"]},"image/vnd.fujixerox.edmics-mmr":{"source":"iana","extensions":["mmr"]},"image/vnd.fujixerox.edmics-rlc":{"source":"iana","extensions":["rlc"]},"image/vnd.globalgraphics.pgb":{"source":"iana"},"image/vnd.microsoft.icon":{"source":"iana","compressible":true,"extensions":["ico"]},"image/vnd.mix":{"source":"iana"},"image/vnd.mozilla.apng":{"source":"iana"},"image/vnd.ms-dds":{"compressible":true,"extensions":["dds"]},"image/vnd.ms-modi":{"source":"iana","extensions":["mdi"]},"image/vnd.ms-photo":{"source":"apache","extensions":["wdp"]},"image/vnd.net-fpx":{"source":"iana","extensions":["npx"]},"image/vnd.pco.b16":{"source":"iana","extensions":["b16"]},"image/vnd.radiance":{"source":"iana"},"image/vnd.sealed.png":{"source":"iana"},"image/vnd.sealedmedia.softseal.gif":{"source":"iana"},"image/vnd.sealedmedia.softseal.jpg":{"source":"iana"},"image/vnd.svf":{"source":"iana"},"image/vnd.tencent.tap":{"source":"iana","extensions":["tap"]},"image/vnd.valve.source.texture":{"source":"iana","extensions":["vtf"]},"image/vnd.wap.wbmp":{"source":"iana","extensions":["wbmp"]},"image/vnd.xiff":{"source":"iana","extensions":["xif"]},"image/vnd.zbrush.pcx":{"source":"iana","extensions":["pcx"]},"image/webp":{"source":"apache","extensions":["webp"]},"image/wmf":{"source":"iana","extensions":["wmf"]},"image/x-3ds":{"source":"apache","extensions":["3ds"]},"image/x-cmu-raster":{"source":"apache","extensions":["ras"]},"image/x-cmx":{"source":"apache","extensions":["cmx"]},"image/x-freehand":{"source":"apache","extensions":["fh","fhc","fh4","fh5","fh7"]},"image/x-icon":{"source":"apache","compressible":true,"extensions":["ico"]},"image/x-jng":{"source":"nginx","extensions":["jng"]},"image/x-mrsid-image":{"source":"apache","extensions":["sid"]},"image/x-ms-bmp":{"source":"nginx","compressible":true,"extensions":["bmp"]},"image/x-pcx":{"source":"apache","extensions":["pcx"]},"image/x-pict":{"source":"apache","extensions":["pic","pct"]},"image/x-portable-anymap":{"source":"apache","extensions":["pnm"]},"image/x-portable-bitmap":{"source":"apache","extensions":["pbm"]},"image/x-portable-graymap":{"source":"apache","extensions":["pgm"]},"image/x-portable-pixmap":{"source":"apache","extensions":["ppm"]},"image/x-rgb":{"source":"apache","extensions":["rgb"]},"image/x-tga":{"source":"apache","extensions":["tga"]},"image/x-xbitmap":{"source":"apache","extensions":["xbm"]},"image/x-xcf":{"compressible":false},"image/x-xpixmap":{"source":"apache","extensions":["xpm"]},"image/x-xwindowdump":{"source":"apache","extensions":["xwd"]},"message/cpim":{"source":"iana"},"message/delivery-status":{"source":"iana"},"message/disposition-notification":{"source":"iana","extensions":["disposition-notification"]},"message/external-body":{"source":"iana"},"message/feedback-report":{"source":"iana"},"message/global":{"source":"iana","extensions":["u8msg"]},"message/global-delivery-status":{"source":"iana","extensions":["u8dsn"]},"message/global-disposition-notification":{"source":"iana","extensions":["u8mdn"]},"message/global-headers":{"source":"iana","extensions":["u8hdr"]},"message/http":{"source":"iana","compressible":false},"message/imdn+xml":{"source":"iana","compressible":true},"message/news":{"source":"iana"},"message/partial":{"source":"iana","compressible":false},"message/rfc822":{"source":"iana","compressible":true,"extensions":["eml","mime"]},"message/s-http":{"source":"iana"},"message/sip":{"source":"iana"},"message/sipfrag":{"source":"iana"},"message/tracking-status":{"source":"iana"},"message/vnd.si.simp":{"source":"iana"},"message/vnd.wfa.wsc":{"source":"iana","extensions":["wsc"]},"model/3mf":{"source":"iana","extensions":["3mf"]},"model/e57":{"source":"iana"},"model/gltf+json":{"source":"iana","compressible":true,"extensions":["gltf"]},"model/gltf-binary":{"source":"iana","compressible":true,"extensions":["glb"]},"model/iges":{"source":"iana","compressible":false,"extensions":["igs","iges"]},"model/mesh":{"source":"iana","compressible":false,"extensions":["msh","mesh","silo"]},"model/mtl":{"source":"iana","extensions":["mtl"]},"model/obj":{"source":"iana","extensions":["obj"]},"model/step":{"source":"iana"},"model/step+xml":{"source":"iana","compressible":true,"extensions":["stpx"]},"model/step+zip":{"source":"iana","compressible":false,"extensions":["stpz"]},"model/step-xml+zip":{"source":"iana","compressible":false,"extensions":["stpxz"]},"model/stl":{"source":"iana","extensions":["stl"]},"model/vnd.collada+xml":{"source":"iana","compressible":true,"extensions":["dae"]},"model/vnd.dwf":{"source":"iana","extensions":["dwf"]},"model/vnd.flatland.3dml":{"source":"iana"},"model/vnd.gdl":{"source":"iana","extensions":["gdl"]},"model/vnd.gs-gdl":{"source":"apache"},"model/vnd.gs.gdl":{"source":"iana"},"model/vnd.gtw":{"source":"iana","extensions":["gtw"]},"model/vnd.moml+xml":{"source":"iana","compressible":true},"model/vnd.mts":{"source":"iana","extensions":["mts"]},"model/vnd.opengex":{"source":"iana","extensions":["ogex"]},"model/vnd.parasolid.transmit.binary":{"source":"iana","extensions":["x_b"]},"model/vnd.parasolid.transmit.text":{"source":"iana","extensions":["x_t"]},"model/vnd.pytha.pyox":{"source":"iana"},"model/vnd.rosette.annotated-data-model":{"source":"iana"},"model/vnd.sap.vds":{"source":"iana","extensions":["vds"]},"model/vnd.usdz+zip":{"source":"iana","compressible":false,"extensions":["usdz"]},"model/vnd.valve.source.compiled-map":{"source":"iana","extensions":["bsp"]},"model/vnd.vtu":{"source":"iana","extensions":["vtu"]},"model/vrml":{"source":"iana","compressible":false,"extensions":["wrl","vrml"]},"model/x3d+binary":{"source":"apache","compressible":false,"extensions":["x3db","x3dbz"]},"model/x3d+fastinfoset":{"source":"iana","extensions":["x3db"]},"model/x3d+vrml":{"source":"apache","compressible":false,"extensions":["x3dv","x3dvz"]},"model/x3d+xml":{"source":"iana","compressible":true,"extensions":["x3d","x3dz"]},"model/x3d-vrml":{"source":"iana","extensions":["x3dv"]},"multipart/alternative":{"source":"iana","compressible":false},"multipart/appledouble":{"source":"iana"},"multipart/byteranges":{"source":"iana"},"multipart/digest":{"source":"iana"},"multipart/encrypted":{"source":"iana","compressible":false},"multipart/form-data":{"source":"iana","compressible":false},"multipart/header-set":{"source":"iana"},"multipart/mixed":{"source":"iana"},"multipart/multilingual":{"source":"iana"},"multipart/parallel":{"source":"iana"},"multipart/related":{"source":"iana","compressible":false},"multipart/report":{"source":"iana"},"multipart/signed":{"source":"iana","compressible":false},"multipart/vnd.bint.med-plus":{"source":"iana"},"multipart/voice-message":{"source":"iana"},"multipart/x-mixed-replace":{"source":"iana"},"text/1d-interleaved-parityfec":{"source":"iana"},"text/cache-manifest":{"source":"iana","compressible":true,"extensions":["appcache","manifest"]},"text/calendar":{"source":"iana","extensions":["ics","ifb"]},"text/calender":{"compressible":true},"text/cmd":{"compressible":true},"text/coffeescript":{"extensions":["coffee","litcoffee"]},"text/cql":{"source":"iana"},"text/cql-expression":{"source":"iana"},"text/cql-identifier":{"source":"iana"},"text/css":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["css"]},"text/csv":{"source":"iana","compressible":true,"extensions":["csv"]},"text/csv-schema":{"source":"iana"},"text/directory":{"source":"iana"},"text/dns":{"source":"iana"},"text/ecmascript":{"source":"iana"},"text/encaprtp":{"source":"iana"},"text/enriched":{"source":"iana"},"text/fhirpath":{"source":"iana"},"text/flexfec":{"source":"iana"},"text/fwdred":{"source":"iana"},"text/gff3":{"source":"iana"},"text/grammar-ref-list":{"source":"iana"},"text/html":{"source":"iana","compressible":true,"extensions":["html","htm","shtml"]},"text/jade":{"extensions":["jade"]},"text/javascript":{"source":"iana","compressible":true},"text/jcr-cnd":{"source":"iana"},"text/jsx":{"compressible":true,"extensions":["jsx"]},"text/less":{"compressible":true,"extensions":["less"]},"text/markdown":{"source":"iana","compressible":true,"extensions":["markdown","md"]},"text/mathml":{"source":"nginx","extensions":["mml"]},"text/mdx":{"compressible":true,"extensions":["mdx"]},"text/mizar":{"source":"iana"},"text/n3":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["n3"]},"text/parameters":{"source":"iana","charset":"UTF-8"},"text/parityfec":{"source":"iana"},"text/plain":{"source":"iana","compressible":true,"extensions":["txt","text","conf","def","list","log","in","ini"]},"text/provenance-notation":{"source":"iana","charset":"UTF-8"},"text/prs.fallenstein.rst":{"source":"iana"},"text/prs.lines.tag":{"source":"iana","extensions":["dsc"]},"text/prs.prop.logic":{"source":"iana"},"text/raptorfec":{"source":"iana"},"text/red":{"source":"iana"},"text/rfc822-headers":{"source":"iana"},"text/richtext":{"source":"iana","compressible":true,"extensions":["rtx"]},"text/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"text/rtp-enc-aescm128":{"source":"iana"},"text/rtploopback":{"source":"iana"},"text/rtx":{"source":"iana"},"text/sgml":{"source":"iana","extensions":["sgml","sgm"]},"text/shaclc":{"source":"iana"},"text/shex":{"source":"iana","extensions":["shex"]},"text/slim":{"extensions":["slim","slm"]},"text/spdx":{"source":"iana","extensions":["spdx"]},"text/strings":{"source":"iana"},"text/stylus":{"extensions":["stylus","styl"]},"text/t140":{"source":"iana"},"text/tab-separated-values":{"source":"iana","compressible":true,"extensions":["tsv"]},"text/troff":{"source":"iana","extensions":["t","tr","roff","man","me","ms"]},"text/turtle":{"source":"iana","charset":"UTF-8","extensions":["ttl"]},"text/ulpfec":{"source":"iana"},"text/uri-list":{"source":"iana","compressible":true,"extensions":["uri","uris","urls"]},"text/vcard":{"source":"iana","compressible":true,"extensions":["vcard"]},"text/vnd.a":{"source":"iana"},"text/vnd.abc":{"source":"iana"},"text/vnd.ascii-art":{"source":"iana"},"text/vnd.curl":{"source":"iana","extensions":["curl"]},"text/vnd.curl.dcurl":{"source":"apache","extensions":["dcurl"]},"text/vnd.curl.mcurl":{"source":"apache","extensions":["mcurl"]},"text/vnd.curl.scurl":{"source":"apache","extensions":["scurl"]},"text/vnd.debian.copyright":{"source":"iana","charset":"UTF-8"},"text/vnd.dmclientscript":{"source":"iana"},"text/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"text/vnd.esmertec.theme-descriptor":{"source":"iana","charset":"UTF-8"},"text/vnd.familysearch.gedcom":{"source":"iana","extensions":["ged"]},"text/vnd.ficlab.flt":{"source":"iana"},"text/vnd.fly":{"source":"iana","extensions":["fly"]},"text/vnd.fmi.flexstor":{"source":"iana","extensions":["flx"]},"text/vnd.gml":{"source":"iana"},"text/vnd.graphviz":{"source":"iana","extensions":["gv"]},"text/vnd.hans":{"source":"iana"},"text/vnd.hgl":{"source":"iana"},"text/vnd.in3d.3dml":{"source":"iana","extensions":["3dml"]},"text/vnd.in3d.spot":{"source":"iana","extensions":["spot"]},"text/vnd.iptc.newsml":{"source":"iana"},"text/vnd.iptc.nitf":{"source":"iana"},"text/vnd.latex-z":{"source":"iana"},"text/vnd.motorola.reflex":{"source":"iana"},"text/vnd.ms-mediapackage":{"source":"iana"},"text/vnd.net2phone.commcenter.command":{"source":"iana"},"text/vnd.radisys.msml-basic-layout":{"source":"iana"},"text/vnd.senx.warpscript":{"source":"iana"},"text/vnd.si.uricatalogue":{"source":"iana"},"text/vnd.sosi":{"source":"iana"},"text/vnd.sun.j2me.app-descriptor":{"source":"iana","charset":"UTF-8","extensions":["jad"]},"text/vnd.trolltech.linguist":{"source":"iana","charset":"UTF-8"},"text/vnd.wap.si":{"source":"iana"},"text/vnd.wap.sl":{"source":"iana"},"text/vnd.wap.wml":{"source":"iana","extensions":["wml"]},"text/vnd.wap.wmlscript":{"source":"iana","extensions":["wmls"]},"text/vtt":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["vtt"]},"text/x-asm":{"source":"apache","extensions":["s","asm"]},"text/x-c":{"source":"apache","extensions":["c","cc","cxx","cpp","h","hh","dic"]},"text/x-component":{"source":"nginx","extensions":["htc"]},"text/x-fortran":{"source":"apache","extensions":["f","for","f77","f90"]},"text/x-gwt-rpc":{"compressible":true},"text/x-handlebars-template":{"extensions":["hbs"]},"text/x-java-source":{"source":"apache","extensions":["java"]},"text/x-jquery-tmpl":{"compressible":true},"text/x-lua":{"extensions":["lua"]},"text/x-markdown":{"compressible":true,"extensions":["mkd"]},"text/x-nfo":{"source":"apache","extensions":["nfo"]},"text/x-opml":{"source":"apache","extensions":["opml"]},"text/x-org":{"compressible":true,"extensions":["org"]},"text/x-pascal":{"source":"apache","extensions":["p","pas"]},"text/x-processing":{"compressible":true,"extensions":["pde"]},"text/x-sass":{"extensions":["sass"]},"text/x-scss":{"extensions":["scss"]},"text/x-setext":{"source":"apache","extensions":["etx"]},"text/x-sfv":{"source":"apache","extensions":["sfv"]},"text/x-suse-ymp":{"compressible":true,"extensions":["ymp"]},"text/x-uuencode":{"source":"apache","extensions":["uu"]},"text/x-vcalendar":{"source":"apache","extensions":["vcs"]},"text/x-vcard":{"source":"apache","extensions":["vcf"]},"text/xml":{"source":"iana","compressible":true,"extensions":["xml"]},"text/xml-external-parsed-entity":{"source":"iana"},"text/yaml":{"compressible":true,"extensions":["yaml","yml"]},"video/1d-interleaved-parityfec":{"source":"iana"},"video/3gpp":{"source":"iana","extensions":["3gp","3gpp"]},"video/3gpp-tt":{"source":"iana"},"video/3gpp2":{"source":"iana","extensions":["3g2"]},"video/av1":{"source":"iana"},"video/bmpeg":{"source":"iana"},"video/bt656":{"source":"iana"},"video/celb":{"source":"iana"},"video/dv":{"source":"iana"},"video/encaprtp":{"source":"iana"},"video/ffv1":{"source":"iana"},"video/flexfec":{"source":"iana"},"video/h261":{"source":"iana","extensions":["h261"]},"video/h263":{"source":"iana","extensions":["h263"]},"video/h263-1998":{"source":"iana"},"video/h263-2000":{"source":"iana"},"video/h264":{"source":"iana","extensions":["h264"]},"video/h264-rcdo":{"source":"iana"},"video/h264-svc":{"source":"iana"},"video/h265":{"source":"iana"},"video/iso.segment":{"source":"iana","extensions":["m4s"]},"video/jpeg":{"source":"iana","extensions":["jpgv"]},"video/jpeg2000":{"source":"iana"},"video/jpm":{"source":"apache","extensions":["jpm","jpgm"]},"video/jxsv":{"source":"iana"},"video/mj2":{"source":"iana","extensions":["mj2","mjp2"]},"video/mp1s":{"source":"iana"},"video/mp2p":{"source":"iana"},"video/mp2t":{"source":"iana","extensions":["ts"]},"video/mp4":{"source":"iana","compressible":false,"extensions":["mp4","mp4v","mpg4"]},"video/mp4v-es":{"source":"iana"},"video/mpeg":{"source":"iana","compressible":false,"extensions":["mpeg","mpg","mpe","m1v","m2v"]},"video/mpeg4-generic":{"source":"iana"},"video/mpv":{"source":"iana"},"video/nv":{"source":"iana"},"video/ogg":{"source":"iana","compressible":false,"extensions":["ogv"]},"video/parityfec":{"source":"iana"},"video/pointer":{"source":"iana"},"video/quicktime":{"source":"iana","compressible":false,"extensions":["qt","mov"]},"video/raptorfec":{"source":"iana"},"video/raw":{"source":"iana"},"video/rtp-enc-aescm128":{"source":"iana"},"video/rtploopback":{"source":"iana"},"video/rtx":{"source":"iana"},"video/scip":{"source":"iana"},"video/smpte291":{"source":"iana"},"video/smpte292m":{"source":"iana"},"video/ulpfec":{"source":"iana"},"video/vc1":{"source":"iana"},"video/vc2":{"source":"iana"},"video/vnd.cctv":{"source":"iana"},"video/vnd.dece.hd":{"source":"iana","extensions":["uvh","uvvh"]},"video/vnd.dece.mobile":{"source":"iana","extensions":["uvm","uvvm"]},"video/vnd.dece.mp4":{"source":"iana"},"video/vnd.dece.pd":{"source":"iana","extensions":["uvp","uvvp"]},"video/vnd.dece.sd":{"source":"iana","extensions":["uvs","uvvs"]},"video/vnd.dece.video":{"source":"iana","extensions":["uvv","uvvv"]},"video/vnd.directv.mpeg":{"source":"iana"},"video/vnd.directv.mpeg-tts":{"source":"iana"},"video/vnd.dlna.mpeg-tts":{"source":"iana"},"video/vnd.dvb.file":{"source":"iana","extensions":["dvb"]},"video/vnd.fvt":{"source":"iana","extensions":["fvt"]},"video/vnd.hns.video":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.ttsavc":{"source":"iana"},"video/vnd.iptvforum.ttsmpeg2":{"source":"iana"},"video/vnd.motorola.video":{"source":"iana"},"video/vnd.motorola.videop":{"source":"iana"},"video/vnd.mpegurl":{"source":"iana","extensions":["mxu","m4u"]},"video/vnd.ms-playready.media.pyv":{"source":"iana","extensions":["pyv"]},"video/vnd.nokia.interleaved-multimedia":{"source":"iana"},"video/vnd.nokia.mp4vr":{"source":"iana"},"video/vnd.nokia.videovoip":{"source":"iana"},"video/vnd.objectvideo":{"source":"iana"},"video/vnd.radgamettools.bink":{"source":"iana"},"video/vnd.radgamettools.smacker":{"source":"iana"},"video/vnd.sealed.mpeg1":{"source":"iana"},"video/vnd.sealed.mpeg4":{"source":"iana"},"video/vnd.sealed.swf":{"source":"iana"},"video/vnd.sealedmedia.softseal.mov":{"source":"iana"},"video/vnd.uvvu.mp4":{"source":"iana","extensions":["uvu","uvvu"]},"video/vnd.vivo":{"source":"iana","extensions":["viv"]},"video/vnd.youtube.yt":{"source":"iana"},"video/vp8":{"source":"iana"},"video/vp9":{"source":"iana"},"video/webm":{"source":"apache","compressible":false,"extensions":["webm"]},"video/x-f4v":{"source":"apache","extensions":["f4v"]},"video/x-fli":{"source":"apache","extensions":["fli"]},"video/x-flv":{"source":"apache","compressible":false,"extensions":["flv"]},"video/x-m4v":{"source":"apache","extensions":["m4v"]},"video/x-matroska":{"source":"apache","compressible":false,"extensions":["mkv","mk3d","mks"]},"video/x-mng":{"source":"apache","extensions":["mng"]},"video/x-ms-asf":{"source":"apache","extensions":["asf","asx"]},"video/x-ms-vob":{"source":"apache","extensions":["vob"]},"video/x-ms-wm":{"source":"apache","extensions":["wm"]},"video/x-ms-wmv":{"source":"apache","compressible":false,"extensions":["wmv"]},"video/x-ms-wmx":{"source":"apache","extensions":["wmx"]},"video/x-ms-wvx":{"source":"apache","extensions":["wvx"]},"video/x-msvideo":{"source":"apache","extensions":["avi"]},"video/x-sgi-movie":{"source":"apache","extensions":["movie"]},"video/x-smv":{"source":"apache","extensions":["smv"]},"x-conference/x-cooltalk":{"source":"apache","extensions":["ice"]},"x-shader/x-fragment":{"compressible":true},"x-shader/x-vertex":{"compressible":true}}');

/***/ })

};
;