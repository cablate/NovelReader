(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[655],{39329:function(e,t,n){"use strict";var a=n(26314);t.Z=void 0;var o=a(n(80984)),r=n(57437),c=(0,o.default)((0,r.jsx)("path",{d:"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"}),"ContentCopy");t.Z=c},47754:function(e,t,n){"use strict";var a=n(26314);t.Z=void 0;var o=a(n(80984)),r=n(57437),c=(0,o.default)((0,r.jsx)("path",{d:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"}),"DeleteForever");t.Z=c},4276:function(e,t,n){"use strict";var a=n(26314);t.Z=void 0;var o=a(n(80984)),r=n(57437),c=(0,o.default)((0,r.jsx)("path",{d:"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"}),"MoreVertOutlined");t.Z=c},42758:function(e,t,n){Promise.resolve().then(n.bind(n,8611))},8611:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return j}});var a=n(57437),o=n(58533),r=n(20940),c=n(49050),l=n(62501),s=n(24813),i=n(4276),d=n(24033),p=n(2265),x=n(64011),u=n.n(x);let f=(e,t)=>{e.currentTarget;let n=e.target,a=null;do{if(null!=n&&null!=n.getAttribute(t)){a=n;break}n=n.parentElement}while(n&&n.parentElement);return a};var h=e=>{let t=(0,p.useRef)(null),[n,o]=(0,p.useState)(!1),[r,c]=(0,p.useState)("translate(0px, 0px) translate(0px, 0px)"),l=e.placement||"bottom-right",s=e.appendTo||"portal",i=()=>{o(!0),x()},d=()=>{o(!1),e.onClose&&e.onClose()},x=()=>{if(!t.current)return;let e=t.current.firstChild,n=e.offsetWidth,a=e.offsetHeight,o=0,r=0;"portal"==s&&(o=e.getBoundingClientRect().y+window.pageYOffset,r=e.getBoundingClientRect().left+window.pageXOffset);let i=o+"px",d=r+"px",p="0px",x="0px";switch(l){case"top":p="-100%",x="calc(".concat(n/2,"px - 50%)");break;case"top-left":p="-100%";break;case"top-right":p="-100%",x="calc(-100% + ".concat(n,"px)");break;case"bottom":p=a+"px",x="calc(".concat(n/2,"px - 50%)");break;case"bottom-left":p=a+"px";break;case"bottom-right":p=a+"px",x="calc(-100% + ".concat(n,"px)");break;case"left-top":x="-100%";break;case"left":x="-100%",p="calc(-50% + ".concat(a/2,"px)");break;case"left-bottom":x="-100%",p="calc(-100% + ".concat(a,"px)");break;case"right-top":x=n+"px";break;case"right":x=n+"px",p="calc(-50% + ".concat(a/2,"px)");break;case"right-bottom":x=n+"px",p="calc(-100% + ".concat(a,"px)")}c("translate(".concat(d,", ").concat(i,") translate(").concat(x,", ").concat(p,")"))},h=()=>{x()},m=n=>{if(!0===e.hover)return;let a=f(n,"data-dropdown");a!==t.current&&d()};(0,p.useEffect)(()=>{if(!0!==e.hover&&!1!=n)return document.addEventListener("click",m),window.addEventListener("resize",h),()=>{document.removeEventListener("click",m),window.removeEventListener("resize",h)}},[n]);let v=t=>{!0===e.hover&&(t?i():d())},g={};if(e.width){if("inherit"===e.width&&t.current){let e=t.current.firstChild,n=e.offsetWidth;g.width="".concat(n,"px")}else"auto"===e.width?g.width="auto":g.width="".concat(e.width,"px")}e.height&&(g.height="".concat(e.height,"px"));let w={};return"button"==s&&(w.position="relative"),(0,a.jsxs)("span",{ref:t,"data-dropdown":"dropdown","data-expanded":n,onClick:e=>{e.preventDefault(),e.stopPropagation(),e.currentTarget===t.current&&(n?d():i())},onMouseEnter:()=>v(!0),onMouseLeave:()=>v(!1),className:e.className,style:w,children:[e.children,n&&"button"==s&&(0,a.jsx)("div",{className:u().dropdown,style:{transform:r},children:(0,a.jsx)("div",{className:u()["dropdown-container"],style:g,children:e.menu})})]})},m=n(47754),v=n(39329),g=n(70740);function w(e){let{data:t,handleDelete:n}=e,o=(0,d.useRouter)(),[r,c]=(0,p.useState)(!1),[s,x]=(0,p.useState)(void 0),u=async(e,t)=>{if("sto"===e)return await navigator.clipboard.writeText("https://www.sto.cx/book-".concat(t,"-1.html"))};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{className:"flex flex-row items-start w-full px-[12px] py-[8px] border-b-2 border-gray-300 cursor-pointer",onClick:()=>o.push("/book/".concat(t.sourceId,"/").concat(t.bookId,"?page=").concat(t.page)),children:[(0,a.jsxs)("div",{className:"flex flex-col flex-1 justify-start ml-[8px]",children:[(0,a.jsx)("div",{className:"text-[12px] text-gray-500 mb-[8px]",children:t.sourceId}),(0,a.jsx)("div",{className:"text-[16px] font-bold text-black",children:t.name})]}),(0,a.jsxs)("div",{className:"flex flex-col justify-end items-end",children:[(0,a.jsx)("div",{className:"text-[12px] text-blue-500",children:t.date}),(0,a.jsx)(h,{placement:"bottom-right",appendTo:"button",menu:(0,a.jsxs)("ul",{children:[(0,a.jsxs)("li",{onClick:e=>{e.preventDefault(),c(!0)},children:[(0,a.jsx)(m.Z,{}),"刪除"]}),(0,a.jsxs)("li",{onClick:e=>{e.preventDefault(),u(t.sourceId,t.bookId)},children:[(0,a.jsx)(v.Z,{}),"複製本書連結"]})]}),children:(0,a.jsx)(l.Z,{children:(0,a.jsx)(i.Z,{})})})]})]}),(0,a.jsx)(b,{sourceId:t.sourceId,onClose:()=>{c(!1)},selectedId:s,open:r,handleDelete:()=>n(t.sourceId,t.bookId)})]})}function b(e){let{sourceId:t,onClose:n,selectedId:i,open:d,handleDelete:p}=e,x=()=>{n()},u=(0,s.Z)(()=>({MuiPaper:{"& .MuiPaper-root":{width:"100%",height:"auto",overflow:"hidden",display:"flex"}}})),f=u();return(0,a.jsxs)(o.Z,{onClose:()=>x(),open:d,className:f.MuiPaper,children:[(0,a.jsxs)(r.Z,{className:"flex flex-row items-center justify-between px-[12px] py-[8px] font-bold",children:[(0,a.jsx)("div",{className:"font-bold",children:"刪除"}),(0,a.jsx)(l.Z,{onClick:e=>{e.stopPropagation(),x()},children:(0,a.jsx)(g.Z,{})})]}),(0,a.jsxs)("div",{className:"p-[12px] flex flex-col w-full items-center justify-between overflow-y-auto overflow-x-hidden",children:[(0,a.jsx)("div",{className:"p-[6px]",children:"是否確認刪除？"}),(0,a.jsx)("div",{className:"mt-[8px] flex flex-row w-full justify-end",children:(0,a.jsx)(c.Z,{color:"primary",className:"!px-[12px] !bg-[#42A5F5] !rounded-[5px]",variant:"contained",onClick:e=>{e.stopPropagation(),p(),x()},children:"刪除"})})]})]})}function j(){let[e,t]=(0,p.useState)([]);(0,p.useEffect)(()=>{let e=localStorage.getItem("recent"),n=e?JSON.parse(e):{},a=[];for(let e in n){let t={sourceId:e.split("-")[0],bookId:e.split("-")[1],page:n[e].page,date:n[e].date,name:n[e].name,percentage:n[e].percentage};a.push(t)}t(a)},[]);let n=(n,a)=>{let o=e.filter(e=>e.sourceId!=n||e.bookId!=a);t(o);let r={};o.forEach(e=>{r["".concat(e.sourceId,"-").concat(e.bookId)]={page:e.page,date:e.date,name:e.name,percentage:e.percentage}}),localStorage.setItem("recent",JSON.stringify(r))};return(0,a.jsxs)(a.Fragment,{children:[0===e.length&&(0,a.jsx)("div",{className:"m-auto text-gray-500",children:"目前沒有資料"}),e.length>0&&(0,a.jsx)("div",{className:"flex flex-col items-center w-full",children:e.map((e,t)=>(0,a.jsx)(w,{data:e,handleDelete:n},e.name+t))})]})}},64011:function(e){e.exports={dropdown:"Dropdown_dropdown__WAgpA","dropdown-container":"Dropdown_dropdown-container__AcKYI"}}},function(e){e.O(0,[547,719,714,879,170,50,620,971,596,744],function(){return e(e.s=42758)}),_N_E=e.O()}]);