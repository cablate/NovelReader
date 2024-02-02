exports.id = 645;
exports.ids = [645];
exports.modules = {

/***/ 24460:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 17421, 23))

/***/ }),

/***/ 78972:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 31232, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 52987, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 50831, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 56926, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 44282, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 16505, 23))

/***/ }),

/***/ 57769:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 87812));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 76314))

/***/ }),

/***/ 87812:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ QueryClientProvide)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tanstack_react_query__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(76604);
/* harmony import */ var _tanstack_react_query__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(212);
/* __next_internal_client_entry_do_not_use__ default auto */ 

function QueryClientProvide({ children }) {
    const queryClient = new _tanstack_react_query__WEBPACK_IMPORTED_MODULE_1__/* .QueryClient */ .S({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 60,
                cacheTime: 1000 * 60 * 60 + 1,
                refetchOnWindowFocus: false,
                retry: 2,
                onError: (err)=>{
                    alert(err.message);
                }
            }
        }
    });
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_tanstack_react_query__WEBPACK_IMPORTED_MODULE_2__/* .QueryClientProvider */ .aH, {
        client: queryClient,
        children: children
    });
}


/***/ }),

/***/ 76314:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Layout)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(15999);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _mui_icons_material_Restore__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(5354);
/* harmony import */ var _mui_icons_material_TravelExploreOutlined__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(43916);
/* harmony import */ var _mui_icons_material_MoreVertOutlined__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(96217);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(57114);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_navigation__WEBPACK_IMPORTED_MODULE_3__);
/* __next_internal_client_entry_do_not_use__ default auto */ 










function Layout({ children }) {
    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_3__.useRouter)();
    const pathname = (0,next_navigation__WEBPACK_IMPORTED_MODULE_3__.usePathname)();
    const [isSideBarOpen, setIsSideBarOpen] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
    const [value, setValue] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)("/recent");
    const headerRef = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
    const useStyles = (0,_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.makeStyles)((theme)=>({
            MuiPaper: {
                "& .MuiPaper-root": {
                    top: headerRef.current?.clientHeight || 0
                }
            }
        }));
    const classes = useStyles();
    const [customPageName, setCustomPageName] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)("");
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        document.addEventListener("PageNameUpdate", handleVideoUploaded);
        return ()=>{
            document.removeEventListener("PageNameUpdate", handleVideoUploaded);
        };
    }, []);
    const handleVideoUploaded = (event)=>{
        const customEvent = event;
        const { name } = customEvent.detail;
        setCustomPageName(name);
    };
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        window.location.pathname.split("/")[1] && setValue("/" + window.location.pathname.split("/")[1]);
    }, []);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-col min-h-[100dvh] max-h-[100dvh]",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.AppBar, {
                position: "static",
                style: {
                    height: "5%"
                },
                ref: headerRef,
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.Toolbar, {
                    variant: "dense",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.IconButton, {
                            edge: "start",
                            color: "inherit",
                            onClick: ()=>setIsSideBarOpen((bool)=>!bool),
                            children: [
                                value.startsWith("/recent") && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_icons_material_Restore__WEBPACK_IMPORTED_MODULE_5__/* ["default"] */ .Z, {}),
                                value.startsWith("/search") && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_icons_material_TravelExploreOutlined__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z, {})
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.Typography, {
                            component: "div",
                            style: {
                                fontSize: "18px",
                                fontWeight: "bold",
                                lineHeight: "normal"
                            },
                            children: customPageName || value === "/recent" && "最近閱讀" || value === "/search" && "常用網站"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "flex flex-1 overflow-y-auto",
                children: children
            }),
            !pathname.startsWith("/book") && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.BottomNavigation, {
                value: value,
                onChange: (event, newValue)=>{
                    if (value.startsWith(newValue)) return;
                    setValue(newValue);
                },
                showLabels: true,
                className: "font-bold",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.BottomNavigationAction, {
                        label: "最近閱讀",
                        value: "/recent",
                        icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_icons_material_Restore__WEBPACK_IMPORTED_MODULE_5__/* ["default"] */ .Z, {}),
                        onClick: ()=>{
                            setValue("/recent");
                            router.push("/recent");
                        }
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.BottomNavigationAction, {
                        label: "常用網站",
                        value: "/search",
                        icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_icons_material_TravelExploreOutlined__WEBPACK_IMPORTED_MODULE_6__/* ["default"] */ .Z, {}),
                        onClick: ()=>{
                            setValue("/search");
                            router.push("/search");
                        }
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__.BottomNavigationAction, {
                        label: "更多",
                        icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_icons_material_MoreVertOutlined__WEBPACK_IMPORTED_MODULE_7__/* ["default"] */ .Z, {}),
                        onClick: ()=>alert("more")
                    })
                ]
            })
        ]
    });
}
function SideBar() {
    return /*#__PURE__*/ _jsxs(Box, {
        sx: {
            width: "250"
        },
        children: [
            /*#__PURE__*/ _jsx(List, {
                children: [
                    "Inbox",
                    "Starred",
                    "Send email",
                    "Drafts"
                ].map((text, index)=>/*#__PURE__*/ _jsx(ListItem, {
                        children: /*#__PURE__*/ _jsxs(ListItemButton, {
                            children: [
                                /*#__PURE__*/ _jsx(ListItemIcon, {
                                    children: index % 2 === 0 ? /*#__PURE__*/ _jsx(InboxIcon, {}) : /*#__PURE__*/ _jsx(MailIcon, {})
                                }),
                                /*#__PURE__*/ _jsx(ListItemText, {
                                    primary: text
                                })
                            ]
                        })
                    }, text))
            }),
            /*#__PURE__*/ _jsx(Divider, {}),
            /*#__PURE__*/ _jsx(List, {
                children: [
                    "All mail",
                    "Trash",
                    "Spam"
                ].map((text, index)=>/*#__PURE__*/ _jsx(ListItem, {
                        style: {
                            padding: 0
                        },
                        children: /*#__PURE__*/ _jsxs(ListItemButton, {
                            style: {
                                padding: "8px 16px"
                            },
                            LinkComponent: Link,
                            href: "/123",
                            children: [
                                /*#__PURE__*/ _jsx(ListItemIcon, {
                                    children: index % 2 === 0 ? /*#__PURE__*/ _jsx(InboxIcon, {}) : /*#__PURE__*/ _jsx(MailIcon, {})
                                }),
                                /*#__PURE__*/ _jsx(ListItemText, {
                                    primary: text
                                })
                            ]
                        })
                    }, text))
            })
        ]
    });
}


/***/ }),

/***/ 47613:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ RootLayout)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./src/components/Layout/index.tsx
var Layout = __webpack_require__(83367);
// EXTERNAL MODULE: ./src/app/globals.css
var globals = __webpack_require__(5023);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./src/app/_QueryClient/index.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/home/tuo/Project/_/bun_test/src/app/_QueryClient/index.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const _QueryClient = (__default__);
// EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/react.shared-subset.js
var react_shared_subset = __webpack_require__(62947);
;// CONCATENATED MODULE: ./src/app/layout.tsx





function RootLayout({ children }) {
    const LazyLayout = /*#__PURE__*/ (0,react_shared_subset.lazy)(()=>Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 83367)));
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("head", {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("title", {
                        children: "Test"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "description",
                        content: "Easy Novel Reader"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "icon",
                        href: "/favicon.ico"
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx("body", {
                children: /*#__PURE__*/ jsx_runtime_.jsx(_QueryClient, {
                    children: /*#__PURE__*/ jsx_runtime_.jsx(Layout["default"], {
                        children: children
                    })
                })
            })
        ]
    });
}


/***/ }),

/***/ 88924:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Loading)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(94541);
/* harmony import */ var _mui_material__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_mui_material__WEBPACK_IMPORTED_MODULE_1__);


function Loading() {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_mui_material__WEBPACK_IMPORTED_MODULE_1__.CircularProgress, {
        className: "m-auto"
    });
}


/***/ }),

/***/ 83367:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $$typeof: () => (/* binding */ $$typeof),
/* harmony export */   __esModule: () => (/* binding */ __esModule),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/home/tuo/Project/_/bun_test/src/components/Layout/index.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ }),

/***/ 73881:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(80085);
/* harmony import */ var next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__);
  

  /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((props) => {
    const imageData = {"type":"image/x-icon","sizes":"16x16"}
    const imageUrl = (0,next_dist_lib_metadata_get_metadata_route__WEBPACK_IMPORTED_MODULE_0__.fillMetadataSegment)(".", props.params, "favicon.ico")

    return [{
      ...imageData,
      url: imageUrl + "",
    }]
  });

/***/ }),

/***/ 5023:
/***/ (() => {



/***/ })

};
;