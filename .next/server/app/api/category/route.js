"use strict";
(() => {
var exports = {};
exports.id = 252;
exports.ids = [252];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 26669:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  headerHooks: () => (/* binding */ headerHooks),
  originalPathname: () => (/* binding */ originalPathname),
  requestAsyncStorage: () => (/* binding */ requestAsyncStorage),
  routeModule: () => (/* binding */ routeModule),
  serverHooks: () => (/* binding */ serverHooks),
  staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),
  staticGenerationBailout: () => (/* binding */ staticGenerationBailout)
});

// NAMESPACE OBJECT: ./src/app/api/category/route.tsx
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  GET: () => (GET)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(42394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(69692);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-kind.js
var route_kind = __webpack_require__(19513);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(89335);
// EXTERNAL MODULE: ./node_modules/node-html-parser/dist/index.js
var dist = __webpack_require__(35293);
// EXTERNAL MODULE: ./src/utility/method.tsx
var method = __webpack_require__(84237);
;// CONCATENATED MODULE: ./src/app/api/category/route.tsx



async function GET(requestAPI) {
    let success = true;
    const id = requestAPI.nextUrl.searchParams.get("sourceid");
    const sourceObj = dict_source[id] ?? null;
    if (sourceObj == null) {
        return next_response/* default */.Z.json({
            error: "source not found"
        });
    }
    const res = await fetch(sourceObj.url, {
        method: "GET",
        headers: sourceObj.headers
    }).then((res)=>res.text()).then((res)=>{
        const resArr = sourceObj.rule(res);
        return {
            pageName: sourceObj.name,
            data: resArr
        };
    });
    let resObj = {
        result: success,
        data: res
    };
    return next_response/* default */.Z.json(resObj);
}
const dict_source = {
    sto: {
        name: "思兔閱讀",
        url: "https://www.sto.cx/pcindex.aspx",
        headers: {
            "Accept": "*/*",
            "Content-Type": "text/html; charset=utf-8"
        },
        rule: (htmlString)=>{
            const root = (0,dist/* default */.ZP)(htmlString);
            const classBody = root.querySelector("#showClass");
            const arrClass = classBody?.querySelectorAll("a") ?? [];
            const resArr = arrClass.filter((item)=>item.innerText != "全部").map((item)=>{
                const href = item.getAttribute("href");
                const query = new URLSearchParams(href?.split("?")[1] ?? "");
                const name = item.innerText;
                const id = query.get("c");
                return {
                    name: (0,method/* toTW */.B)(name),
                    id
                };
            });
            return [
                {
                    name: "本月熱門",
                    id: "0"
                },
                {
                    name: "讀者推薦",
                    id: "1"
                },
                ...resArr
            ];
        }
    }
};

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fcategory%2Froute&name=app%2Fapi%2Fcategory%2Froute&pagePath=private-next-app-dir%2Fapi%2Fcategory%2Froute.tsx&appDir=%2Fhome%2Ftuo%2FProject%2F_%2Fbun_test%2Fsrc%2Fapp&appPaths=%2Fapi%2Fcategory%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

// @ts-ignore this need to be imported from next/dist to be external


// @ts-expect-error - replaced by webpack/turbopack loader

const AppRouteRouteModule = app_route_module.AppRouteRouteModule;
// We inject the nextConfigOutput here so that we can use them in the route
// module.
const nextConfigOutput = ""
const routeModule = new AppRouteRouteModule({
    definition: {
        kind: route_kind.RouteKind.APP_ROUTE,
        page: "/api/category/route",
        pathname: "/api/category",
        filename: "route",
        bundlePath: "app/api/category/route"
    },
    resolvedPagePath: "/home/tuo/Project/_/bun_test/src/app/api/category/route.tsx",
    nextConfigOutput,
    userland: route_namespaceObject
});
// Pull out the exports that we need to expose from the module. This should
// be eliminated when we've moved the other routes to the new format. These
// are used to hook into the route.
const { requestAsyncStorage , staticGenerationAsyncStorage , serverHooks , headerHooks , staticGenerationBailout  } = routeModule;
const originalPathname = "/api/category/route";


//# sourceMappingURL=app-route.js.map

/***/ }),

/***/ 84237:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   B: () => (/* binding */ toTW)
/* harmony export */ });
/* unused harmony export SendCurrentPageName */
/* harmony import */ var chinese_conv__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20253);
/* harmony import */ var chinese_conv__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(chinese_conv__WEBPACK_IMPORTED_MODULE_0__);

const SendCurrentPageName = (pageName)=>{
    const event = new CustomEvent("PageNameUpdate", {
        detail: {
            name: pageName
        }
    });
    document.dispatchEvent(event);
};
const toTW = (text)=>{
    return (0,chinese_conv__WEBPACK_IMPORTED_MODULE_0__.tify)(text ?? "");
};


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [587,501,568], () => (__webpack_exec__(26669)));
module.exports = __webpack_exports__;

})();