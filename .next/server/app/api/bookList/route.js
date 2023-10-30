"use strict";
(() => {
var exports = {};
exports.id = 820;
exports.ids = [820];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 70654:
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

// NAMESPACE OBJECT: ./src/app/api/bookList/route.tsx
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
;// CONCATENATED MODULE: ./src/app/api/bookList/route.tsx



async function GET(requestAPI) {
    let success = true;
    const sourceid = requestAPI.nextUrl.searchParams.get("sourceid");
    const categoryid = requestAPI.nextUrl.searchParams.get("categoryid");
    const page = requestAPI.nextUrl.searchParams.get("page");
    const sourceObj = dict_source[sourceid] ?? null;
    if (sourceObj == null) {
        return next_response/* default */.Z.json({
            error: "source not found"
        });
    }
    let url = sourceObj.url(categoryid, page);
    // 特規 - 思兔閱讀
    if (sourceid === "sto" && (categoryid === "0" || categoryid === "1")) {
        url = sourceObj.ex_url();
    }
    const res = await fetch(url, {
        method: "GET",
        headers: sourceObj.headers
    }).then((res)=>res.text()).then((res)=>{
        let result = {
            pageName: "",
            data: []
        };
        if (sourceid === "sto" && (categoryid === "0" || categoryid === "1")) {
            result = sourceObj.ex_rule(res, Number(categoryid));
        } else {
            result = sourceObj.rule(res);
        }
        return {
            pageName: result.pageName,
            data: result.data
        };
    });
    let resObj = {
        result: success,
        data: res
    };
    return next_response/* default */.Z.json(resObj);
}
const dict_source = {
    "sto": {
        "name": "思兔閱讀",
        "url": (id, page)=>{
            return `https://www.sto.cx/sbn.aspx?c=${id}&page=${page}`;
        },
        "ex_url": ()=>{
            return "https://www.sto.cx/pcindex.aspx";
        },
        "headers": {
            "Accept": "*/*",
            "Content-Type": "text/html; charset=utf-8"
        },
        "rule": (htmlString)=>{
            const root = (0,dist/* default */.ZP)(htmlString);
            const category = root.querySelector("#showClass")?.querySelector(".sx")?.innerText;
            const arrClass = root.querySelectorAll(".slistbody");
            const resArr = arrClass.map((item)=>{
                const a = item.querySelector("a:not(:has(img))")?.innerText;
                const href = item.querySelector("a:not(:has(img))")?.getAttribute("href");
                const name = a;
                const regex = /\/book-(\d+)-\d+\.html/;
                const match = href.match(regex);
                if (match) {
                    const id = match[1];
                    return {
                        name: (0,method/* toTW */.B)(name),
                        id
                    };
                } else {
                    return {
                        name: (0,method/* toTW */.B)(name),
                        id: null
                    };
                }
            });
            return {
                pageName: category,
                data: resArr
            };
        },
        "ex_rule": (htmlString, index)=>{
            const root = (0,dist/* default */.ZP)(htmlString);
            const category = root.querySelectorAll(".lrit")[index]?.innerText;
            const arrBooks = root.querySelectorAll(".itjlist")[index]?.querySelectorAll("div");
            const resArr = arrBooks?.map((item)=>{
                const name = item.innerText;
                const href = item.querySelector("a")?.getAttribute("href");
                const regex = /\/book-(\d+)-\d+\.html/;
                const match = href.match(regex);
                if (match) {
                    const id = match[1];
                    return {
                        name: (0,method/* toTW */.B)(name),
                        id
                    };
                } else {
                    return {
                        name: (0,method/* toTW */.B)(name),
                        id: null
                    };
                }
            });
            return {
                pageName: category,
                data: resArr
            };
        }
    }
};

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2FbookList%2Froute&name=app%2Fapi%2FbookList%2Froute&pagePath=private-next-app-dir%2Fapi%2FbookList%2Froute.tsx&appDir=%2Fhome%2Ftuo%2FProject%2F_%2Fbun_test%2Fsrc%2Fapp&appPaths=%2Fapi%2FbookList%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

// @ts-ignore this need to be imported from next/dist to be external


// @ts-expect-error - replaced by webpack/turbopack loader

const AppRouteRouteModule = app_route_module.AppRouteRouteModule;
// We inject the nextConfigOutput here so that we can use them in the route
// module.
const nextConfigOutput = ""
const routeModule = new AppRouteRouteModule({
    definition: {
        kind: route_kind.RouteKind.APP_ROUTE,
        page: "/api/bookList/route",
        pathname: "/api/bookList",
        filename: "route",
        bundlePath: "app/api/bookList/route"
    },
    resolvedPagePath: "/home/tuo/Project/_/bun_test/src/app/api/bookList/route.tsx",
    nextConfigOutput,
    userland: route_namespaceObject
});
// Pull out the exports that we need to expose from the module. This should
// be eliminated when we've moved the other routes to the new format. These
// are used to hook into the route.
const { requestAsyncStorage , staticGenerationAsyncStorage , serverHooks , headerHooks , staticGenerationBailout  } = routeModule;
const originalPathname = "/api/bookList/route";


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
var __webpack_exports__ = __webpack_require__.X(0, [587,501,568], () => (__webpack_exec__(70654)));
module.exports = __webpack_exports__;

})();