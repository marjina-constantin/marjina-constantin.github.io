(this["webpackJsonpreact-expenses"]=this["webpackJsonpreact-expenses"]||[]).push([[0],{32:function(e,t,n){},33:function(e,t,n){},41:function(e,t,n){"use strict";n.r(t);var a=n(1),r=n.n(a),o=n(23),c=n.n(o),i=(n(32),n(33),n(9)),s=n(2),l=n(0),u=function(){return Object(l.jsx)("h2",{children:"Charts page"})},d=n(5),j=n(10),h=n.n(j),b=n(14),f="https://dev-expenses-api.pantheonsite.io";function p(e,t){return O.apply(this,arguments)}function O(){return(O=Object(b.a)(h.a.mark((function e(t,n){var a,r,o;return h.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)},e.prev=1,t({type:"REQUEST_LOGIN"}),e.next=5,fetch("".concat(f,"/user/login/google?_format=json"),a);case 5:return r=e.sent,e.next=8,r.json();case 8:if(!(o=e.sent).current_user){e.next=13;break}return t({type:"LOGIN_SUCCESS",payload:o}),localStorage.setItem("currentUser",JSON.stringify(o)),e.abrupt("return",o);case 13:t({type:"LOGIN_ERROR",error:o.errors[0]}),e.next=19;break;case 16:e.prev=16,e.t0=e.catch(1),t({type:"LOGIN_ERROR",error:e.t0});case 19:case"end":return e.stop()}}),e,null,[[1,16]])})))).apply(this,arguments)}function v(){return(v=Object(b.a)(h.a.mark((function e(t){return h.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t({type:"LOGOUT"}),localStorage.removeItem("currentUser"),localStorage.removeItem("token");case 3:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var g=n(3),m=localStorage.getItem("currentUser")?JSON.parse(localStorage.getItem("currentUser")):"",x={userDetails:m,token:localStorage.getItem("currentUser")?JSON.parse(localStorage.getItem("currentUser")).jwt_token:"",loading:!1,errorMessage:null,userIsLoggedIn:!!m},w={groupedData:null,totals:null,filtered:null},y=function(e,t){switch(t.type){case"REQUEST_LOGIN":return Object(g.a)(Object(g.a)({},e),{},{loading:!0});case"LOGIN_SUCCESS":return Object(g.a)(Object(g.a)({},e),{},{userDetails:t.payload,token:t.payload.jwt_token,loading:!1,userIsLoggedIn:!0});case"LOGOUT":return Object(g.a)(Object(g.a)({},e),{},{user:"",token:"",userIsLoggedIn:!1});case"LOGIN_ERROR":return Object(g.a)(Object(g.a)({},e),{},{loading:!1,errorMessage:t.error});default:throw new Error("Unhandled action type: ".concat(t.type))}},_=function(e,t){switch(t.type){case"SET_DATA":return Object(g.a)(Object(g.a)({},e),{},{groupedData:t.groupedData,totals:t.totals,raw:t.raw});case"FILTER_DATA":if(""!==t.category){var n=e.raw.filter((function(e){return e.field_category===t.category})),a={},r={};n.forEach((function(e){var t=new Date(e.field_date),n="".concat(t.toLocaleString("default",{month:"long"})," ").concat(t.getFullYear());a[n]||(a[n]=[]),r[n]||(r[n]=0),a[n].push(e),r[n]+=parseInt(e.field_amount)}));var o={groupedData:a,totals:r};return Object(g.a)(Object(g.a)({},e),{},{filtered:o})}return Object(g.a)(Object(g.a)({},e),{},{filtered:null});default:throw new Error("Unhandled action type: ".concat(t.type))}},S=r.a.createContext(),k=r.a.createContext(),C=r.a.createContext();function T(){var e=r.a.useContext(S);if(void 0===e)throw new Error("useAuthState must be used within a AuthProvider");return e}function D(){var e=r.a.useContext(C);if(void 0===e)throw new Error("useData must be used within a AuthProvider");return e}function E(){var e=r.a.useContext(k);if(void 0===e)throw new Error("useAuthDispatch must be used within a AuthProvider");return e}var N=function(e){var t=e.children,n=Object(a.useReducer)(y,x),r=Object(d.a)(n,2),o=r[0],c=r[1],i=Object(a.useReducer)(_,w),s=Object(d.a)(i,2),u=s[0],j=s[1];return Object(l.jsx)(S.Provider,{value:o,children:Object(l.jsx)(k.Provider,{value:c,children:Object(l.jsx)(C.Provider,{value:{data:u,dataDispatch:j},children:t})})})},I=function(e){return e.ok?e.json():e.statusText},A=function(e,t,n){fetch(e,t).then(I).then((function(e){return n(e)})).catch((function(e){return console.log(e)}))},L=function(e,t){var n={method:"GET",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+e})};A("https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json",n,(function(e){var n={},a={};e.forEach((function(e){var t=new Date(e.field_date),r="".concat(t.toLocaleString("default",{month:"long"})," ").concat(t.getFullYear());n[r]||(n[r]=[]),a[r]||(a[r]=0),n[r].push(e),a[r]+=parseInt(e.field_amount)})),t({type:"SET_DATA",raw:e,groupedData:n,totals:a})}))};function P(e){var t=e.show,n=e.onClose,r=e.children,o=Object(a.useRef)();return Object(a.useEffect)((function(){var e=function(e){t&&o.current&&!o.current.contains(e.target)&&n(e)};return document.addEventListener("mousedown",e),function(){document.removeEventListener("mousedown",e)}}),[t]),Object(l.jsx)(l.Fragment,{children:t?Object(l.jsx)("div",{className:"modal-window",children:Object(l.jsxs)("div",{ref:o,children:[Object(l.jsx)("a",{href:"#",onClick:n,title:"Close",className:"modal-close",children:"Close"}),r]})}):""})}var U=n(17),R=[{value:"",label:"Category"},{value:"1",label:"Clothing"},{value:"2",label:"Entertainment"},{value:"3",label:"Food"},{value:"4",label:"Gifts"},{value:"5",label:"Household Items/Supplies"},{value:"6",label:"Housing"},{value:"7",label:"Medical/Healthcare"},{value:"8",label:"Personal"},{value:"9",label:"Transportation"},{value:"10",label:"Utilities"}],G=function(e){var t=e.formType,n=e.values,r=e.onSuccess,o={field_amount:"",field_date:(new Date).toISOString().substr(0,10),field_category:"",field_description:""},c=Object(a.useState)("add"===t?o:n),i=Object(d.a)(c,2),s=i[0],u=i[1],j=T().token,h=function(e){var t=e.target.value;u(Object(g.a)(Object(g.a)({},s),{},Object(U.a)({},e.target.name,t)))};return Object(l.jsxs)("div",{children:[Object(l.jsx)("h2",{children:"add"===t?"Add transaction":"Edit transaction"}),Object(l.jsxs)("form",{className:"add-transaction",onSubmit:function(e){e.preventDefault();var a={type:"transaction",title:[s.field_date],field_amount:[s.field_amount],field_category:[s.field_category],field_date:[s.field_date],field_description:[s.field_description]},c={method:"add"===t?"POST":"PATCH",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+j}),body:JSON.stringify(a)},i="add"===t?"https://dev-expenses-api.pantheonsite.io/node?_format=json":"https://dev-expenses-api.pantheonsite.io/node/".concat(n.nid,"?_format=json");A(i,c,(function(e){e.nid?(r(),alert("Success!"),u(o)):alert("Something went wrong, please contact Constantin :)")}))},children:[Object(l.jsx)("input",{required:!0,placeholder:"Amount",type:"number",name:"field_amount",value:s.field_amount,onChange:h}),Object(l.jsx)("input",{required:!0,placeholder:"Date",type:"date",name:"field_date",value:s.field_date,onChange:h}),Object(l.jsx)("select",{required:!0,name:"field_category",value:s.field_category,onChange:h,children:R.map((function(e,t){return Object(l.jsx)("option",{value:e.value,children:e.label},t)}))}),Object(l.jsx)("textarea",{placeholder:"Description",name:"field_description",rows:"3",value:s.field_description,onChange:h}),Object(l.jsx)("input",{type:"submit",value:"add"===t?"Add transaction":"Edit transaction"})]})]})},J=n(26);function W(e){var t,n=e.month,r=e.total,o=e.items,c=e.handleEdit,i=e.setShowDeleteModal,s=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=Object(a.useState)(t),r=Object(d.a)(n,2),o=r[0],c=r[1];return{sortedItems:Object(a.useMemo)((function(){var t=Object(J.a)(e);return null!==o&&t.sort((function(e,t){return"ascending"===o.direction?e[o.key]-t[o.key]:t[o.key]-e[o.key]})),t}),[e,o]),requestSort:function(e){var t="ascending";o&&o.key===e&&"ascending"===o.direction&&(t="descending"),c({key:e,direction:t})},sortConfig:o}}(o),u=s.sortedItems,j=s.requestSort,h=s.sortConfig;return Object(l.jsxs)("div",{className:"table-wrapper",children:[Object(l.jsxs)("div",{className:"month-badge",children:[n,": ",r]}),Object(l.jsxs)("table",{className:"expenses-table",cellSpacing:"0",cellPadding:"0",children:[Object(l.jsx)("thead",{children:Object(l.jsxs)("tr",{children:[Object(l.jsx)("th",{children:"Date"}),Object(l.jsx)("th",{onClick:function(){return j("field_amount")},className:"sortable ".concat((t="field_amount",h&&h.key===t?h.direction:"")),children:"Amount"}),Object(l.jsx)("th",{children:"Category"}),Object(l.jsx)("th",{children:"Description"}),Object(l.jsx)("th",{}),Object(l.jsx)("th",{})]})}),Object(l.jsx)("tbody",{children:u.map((function(e,t){return Object(l.jsxs)("tr",{children:[Object(l.jsx)("td",{children:e.field_date}),Object(l.jsx)("td",{children:e.field_amount}),Object(l.jsx)("td",{children:e.field_category_name}),Object(l.jsx)("td",{children:e.field_description}),Object(l.jsx)("td",{children:Object(l.jsx)("button",{"data-values":JSON.stringify({nid:e.nid,field_date:e.field_date,field_amount:e.field_amount,field_category:e.field_category,field_description:e.field_description}),onClick:c,className:"btn-outline",children:"Edit"})}),Object(l.jsx)("td",{children:Object(l.jsx)("button",{"data-nid":e.nid,onClick:function(e){return i(e.currentTarget.getAttribute("data-nid"))},className:"btn-outline",children:"Delete"})})]},e.nid)}))})]})]})}function F(){var e=D().dataDispatch;return Object(l.jsx)("div",{className:"filters",children:Object(l.jsx)("select",{name:"category",onChange:function(t){var n=t.target.value;e({type:"FILTER_DATA",category:n})},children:R.map((function(e,t){return Object(l.jsx)("option",{value:e.value,children:e.label},t)}))})})}var M=function(){var e,t=T(),n=t.userDetails,r=t.token,o=Object(a.useState)(!1),c=Object(d.a)(o,2),i=c[0],s=c[1],u=Object(a.useState)(!1),j=Object(d.a)(u,2),h=j[0],b=j[1],f=D(),p=f.data,O=f.dataDispatch,v=null===p.groupedData;Object(a.useEffect)((function(){v&&L(r,O)}),[p]);var g=Object(a.useState)({}),m=Object(d.a)(g,2),x=m[0],w=m[1],y=function(e){var t=JSON.parse(e.currentTarget.getAttribute("data-values"));w(t),b(!0)},_=function(e,t){!function(e,t,n){var a={method:"DELETE",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+t})};fetch("https://dev-expenses-api.pantheonsite.io/node/".concat(e,"?_format=json"),a).then((function(e){n(e)}))}(e,t,(function(e){e.ok?alert("Transaction was successfully deleted."):alert("Something went wrong."),s(!1),L(t,O)}))},S=p.filtered||p;return Object(l.jsxs)("div",{children:[Object(l.jsxs)(P,{show:i,onClose:function(e){e.preventDefault(),s(!1)},children:[Object(l.jsx)("h3",{children:"Are you sure you want to delete the transaction?"}),Object(l.jsx)("button",{onClick:function(){return _(i,r)},className:"button logout",children:"Yes, remove the transaction"})]}),Object(l.jsx)(P,{show:h,onClose:function(e){e.preventDefault(),b(!1)},children:Object(l.jsx)(G,{formType:"edit",values:x,onSuccess:function(){b(!1),L(r,O)}})}),Object(l.jsx)("h2",{children:"Expenses"}),Object(l.jsxs)("h4",{children:["Hi, ",null===n||void 0===n||null===(e=n.current_user)||void 0===e?void 0:e.name,"!"]}),Object(l.jsx)(F,{}),v?"":Object(l.jsx)("div",{children:Object.keys(S.groupedData).map((function(e,t){return Object(l.jsx)(W,{total:S.totals[e],month:e,items:S.groupedData[e],handleEdit:y,setShowDeleteModal:s},t)}))})]})},H=n(24),B=n.n(H),q=[{path:"/test/build",component:function(){var e=E(),t=Object(s.g)(),n=T(),a=n.loading,r=n.errorMessage;n.userIsLoggedIn&&t.push("/test/home");var o=function(){var n=Object(b.a)(h.a.mark((function n(a){var r;return h.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return r={access_token:a.accessToken},n.prev=1,n.next=4,p(e,r);case 4:if(n.sent.current_user){n.next=7;break}return n.abrupt("return");case 7:t.push("/test/home"),n.next=13;break;case 10:n.prev=10,n.t0=n.catch(1),console.log(n.t0);case 13:case"end":return n.stop()}}),n,null,[[1,10]])})));return function(e){return n.apply(this,arguments)}}();return Object(l.jsxs)("div",{children:[Object(l.jsx)("h4",{children:"Please login using Google in order to access app functionality."}),r?Object(l.jsxs)("p",{children:["We have some errors: ",r]}):null,Object(l.jsx)(B.a,{clientId:"954790461001-2p4vab8hud9u6mj4n6hb6iio4uaiofe5.apps.googleusercontent.com",buttonText:"Login",render:function(e){return Object(l.jsx)("button",{onClick:e.onClick,className:"button logout",disabled:a,children:"Log in"})},onSuccess:o,onFailure:function(e){console.log(e)},cookiePolicy:"single_host_origin",disabled:a})]})},isPrivate:!1},{path:"/test/charts",component:u,isPrivate:!0},{path:"/test/home",component:M,isPrivate:!0},{path:"/test/logout",component:function(){var e=E(),t=Object(s.g)();return Object(l.jsxs)("div",{children:[Object(l.jsx)("h3",{children:"Do you want to logout?"}),Object(l.jsx)("button",{className:"button logout",onClick:function(n){n.preventDefault(),function(e){v.apply(this,arguments)}(e),t.push("/test/build")},children:"Logout"})]})},isPrivate:!0},{path:"/test/add-transaction",component:function(){var e=T().token,t=D().dataDispatch;return Object(l.jsx)(G,{formType:"add",onSuccess:function(){L(e,t)}})},isPrivate:!0}],Y=n(15);function z(){var e=T().userIsLoggedIn,t=Object(a.useState)("closed"),n=Object(d.a)(t,2),r=n[0],o=n[1],c=Object(a.useState)(null),s=Object(d.a)(c,2),u=s[0],j=s[1],h=Object(a.useState)(null),b=Object(d.a)(h,2),f=b[0],p=b[1];return Object(l.jsx)("div",{className:"navbar ".concat(r),onTouchStart:function(e){return function(e){var t=e.touches[0];j(t.clientX),p(t.clientY)}(e)},onTouchMove:function(e){return function(e){if(u&&f){var t=e.touches[0].clientX,n=e.touches[0].clientY,a=u-t,r=f-n;Math.abs(a)<Math.abs(r)&&o(r>0?"open":"closed"),j(null),p(null)}}(e)},children:Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)(i.b,{activeClassName:"selected",className:"not-selected",to:"/test/home",exact:!0,children:Object(l.jsx)(Y.b,{})})}),Object(l.jsx)("li",{children:Object(l.jsx)(i.b,{to:"/test/charts",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(l.jsx)(Y.a,{})})}),Object(l.jsx)("li",{children:Object(l.jsx)(i.b,{to:"/test/add-transaction",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(l.jsx)(Y.c,{})})}),e?Object(l.jsx)("li",{children:Object(l.jsx)(i.b,{to:"/test/logout",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(l.jsx)(Y.d,{})})}):""]})})}var Q=n(27),X=function(e){var t=e.component,n=e.path,a=e.isPrivate,r=Object(Q.a)(e,["component","path","isPrivate"]),o=T();return Object(l.jsx)(s.b,Object(g.a)({path:n,render:function(e){return a&&!Boolean(o.token)?Object(l.jsx)(s.a,{to:{pathname:"/test/build"}}):Object(l.jsx)(t,Object(g.a)({},e))}},r))};var $=function(){return Object(l.jsx)(N,{children:Object(l.jsxs)(i.a,{children:[Object(l.jsx)(z,{}),Object(l.jsx)(s.d,{children:q.map((function(e){return Object(l.jsx)(X,{exact:!0,path:e.path,component:e.component,isPrivate:e.isPrivate},e.path)}))})]})})},K=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function V(e,t){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var n=e.installing;null!=n&&(n.onstatechange=function(){"installed"===n.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),t&&t.onUpdate&&t.onUpdate(e)):(console.log("Content is cached for offline use."),t&&t.onSuccess&&t.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}var Z=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,42)).then((function(t){var n=t.getCLS,a=t.getFID,r=t.getFCP,o=t.getLCP,c=t.getTTFB;n(e),a(e),r(e),o(e),c(e)}))};c.a.render(Object(l.jsx)(r.a.StrictMode,{children:Object(l.jsx)($,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/test/build",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var t="".concat("/test/build","/service-worker.js");K?(!function(e,t){fetch(e,{headers:{"Service-Worker":"script"}}).then((function(n){var a=n.headers.get("content-type");404===n.status||null!=a&&-1===a.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):V(e,t)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(t,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):V(t,e)}))}}({onUpdate:function(e){window.location.reload()}}),Z()}},[[41,1,2]]]);
//# sourceMappingURL=main.24cbcd72.chunk.js.map