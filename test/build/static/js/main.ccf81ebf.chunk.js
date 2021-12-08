(this["webpackJsonpreact-expenses"]=this["webpackJsonpreact-expenses"]||[]).push([[0],{36:function(e,t,n){},37:function(e,t,n){},45:function(e,t,n){"use strict";n.r(t);var a=n(1),r=n.n(a),o=n(26),c=n.n(o),s=(n(36),n(37),n(9)),i=n(2),l=n(18),u=n(10),d=n.n(u),j=n(22),h=n.n(j),b=n(27),p=n.n(b),f=n(11),v=n.n(f),O=n(16),g="https://dev-expenses-api.pantheonsite.io";function m(e,t){return x.apply(this,arguments)}function x(){return(x=Object(O.a)(v.a.mark((function e(t,n){var a,r,o;return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return a={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)},e.prev=1,t({type:"REQUEST_LOGIN"}),e.next=5,fetch("".concat(g,"/user/login/google?_format=json"),a);case 5:return r=e.sent,e.next=8,r.json();case 8:if(!(o=e.sent).current_user){e.next=13;break}return t({type:"LOGIN_SUCCESS",payload:o}),localStorage.setItem("currentUser",JSON.stringify(o)),e.abrupt("return",o);case 13:t({type:"LOGIN_ERROR",error:o.errors[0]}),e.next=19;break;case 16:e.prev=16,e.t0=e.catch(1),t({type:"LOGIN_ERROR",error:e.t0});case 19:case"end":return e.stop()}}),e,null,[[1,16]])})))).apply(this,arguments)}function y(){return(y=Object(O.a)(v.a.mark((function e(t,n){return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t({type:"LOGOUT"}),n({type:"REMOVE_DATA"}),localStorage.removeItem("currentUser"),localStorage.removeItem("token");case 4:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var w=n(5),S=n(3),k=localStorage.getItem("currentUser")?JSON.parse(localStorage.getItem("currentUser")):"",D={userDetails:k,token:localStorage.getItem("currentUser")?JSON.parse(localStorage.getItem("currentUser")).jwt_token:"",loading:!1,errorMessage:null,userIsLoggedIn:!!k},_={groupedData:null,totals:null,filtered:null,raw:[]},C=function(e,t){switch(t.type){case"REQUEST_LOGIN":return Object(S.a)(Object(S.a)({},e),{},{loading:!0});case"LOGIN_SUCCESS":return Object(S.a)(Object(S.a)({},e),{},{userDetails:t.payload,token:t.payload.jwt_token,loading:!1,userIsLoggedIn:!0});case"LOGOUT":return Object(S.a)(Object(S.a)({},e),{},{user:"",token:"",userIsLoggedIn:!1});case"LOGIN_ERROR":return Object(S.a)(Object(S.a)({},e),{},{loading:!1,errorMessage:t.error});default:throw new Error("Unhandled action type: ".concat(t.type))}},T=function(e,t){switch(t.type){case"SET_DATA":return Object(S.a)(Object(S.a)({},e),{},{groupedData:t.groupedData,totals:t.totals,raw:t.raw});case"FILTER_DATA":if(""!==t.category){var n=e.raw.filter((function(e){return e.cat===t.category})),a={},r={};n.forEach((function(e){var t=new Date(e.dt),n="".concat(t.toLocaleString("default",{month:"long"})," ").concat(t.getFullYear());a[n]||(a[n]=[]),r[n]||(r[n]=0),a[n].push(e),r[n]+=parseInt(e.sum)}));var o={groupedData:a,totals:r};return Object(S.a)(Object(S.a)({},e),{},{filtered:o,category:t.category})}return Object(S.a)(Object(S.a)({},e),{},{filtered:null,category:""});case"REMOVE_DATA":return _;default:throw new Error("Unhandled action type: ".concat(t.type))}},E=n(0),N=r.a.createContext(),A=r.a.createContext(),I=r.a.createContext();function L(){var e=r.a.useContext(N);if(void 0===e)throw new Error("useAuthState must be used within a AuthProvider");return e}function P(){var e=r.a.useContext(I);if(void 0===e)throw new Error("useData must be used within a AuthProvider");return e}function R(){var e=r.a.useContext(A);if(void 0===e)throw new Error("useAuthDispatch must be used within a AuthProvider");return e}var U=function(e){var t=e.children,n=Object(a.useReducer)(C,D),r=Object(w.a)(n,2),o=r[0],c=r[1],s=Object(a.useReducer)(T,_),i=Object(w.a)(s,2),l=i[0],u=i[1];return Object(E.jsx)(N.Provider,{value:o,children:Object(E.jsx)(A.Provider,{value:c,children:Object(E.jsx)(I.Provider,{value:{data:l,dataDispatch:u},children:t})})})},F=function(e){return e.ok?e.json():e.statusText},M=function(e,t,n){fetch(e,t).then(F).then((function(e){return n(e)})).catch((function(e){return console.log(e)}))},W=function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,a={method:"GET",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+e})};M("https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json",a,(function(e){var a={},r={};e.forEach((function(e){var t=new Date(e.dt),n="".concat(t.toLocaleString("default",{month:"long"})," ").concat(t.getFullYear());a[n]||(a[n]=[]),r[n]||(r[n]=0),a[n].push(e),r[n]+=parseInt(e.sum)})),t({type:"SET_DATA",raw:e,groupedData:a,totals:r}),n&&t({type:"FILTER_DATA",category:n})}))},G=[{value:"",label:"Category"},{value:"1",label:"Clothing"},{value:"2",label:"Entertainment"},{value:"3",label:"Food"},{value:"4",label:"Gifts"},{value:"5",label:"Household Items/Supplies"},{value:"6",label:"Housing"},{value:"7",label:"Medical/Healthcare"},{value:"8",label:"Personal"},{value:"9",label:"Transportation"},{value:"10",label:"Utilities"}];function J(){var e=P(),t=e.data,n=e.dataDispatch;return Object(E.jsx)("div",{className:"filters",children:Object(E.jsx)("select",{name:"category",onChange:function(e){var t=e.target.value;n({type:"FILTER_DATA",category:t})},children:G.map((function(e,n){return Object(E.jsx)("option",{selected:t.category===e.value,value:e.value,children:e.label},n)}))})})}p()(d.a),d.a.theme={chart:{backgroundColor:"#282a36"},tooltip:{style:{fontSize:"15px"}}},d.a.setOptions(d.a.theme);var B=function(){var e=P(),t=e.data,n=e.dataDispatch,r=null===t.groupedData,o=L().token;Object(a.useEffect)((function(){r&&W(o,n)}),[t]);var c,s=t.filtered||t,i={chart:{type:"column"},title:{text:"Monthly Totals"},xAxis:{categories:s.totals?Object.keys(s.totals).reverse():[]},yAxis:{min:0,title:{text:"MDL"},stackLabels:{style:{color:"#FFFFFF",fontWeight:"bold"},enabled:!0,verticalAlign:"top"}},plotOptions:{column:{pointPadding:.2,borderWidth:0,stacking:"normal",groupPadding:0},series:{colorByPoint:!0}},series:[{name:t.category?G.find((function(e){return e.value===t.category})).label:"Monthly totals",data:s.totals?Object.values(s.totals).reverse():[]}]},u=(new Date).setDate((new Date).getDate()-30),j=(new Date).setDate((new Date).getDate()-60),b=(new Date).setDate((new Date).getDate()+1),p={},f=0,v=Object(l.a)(t.raw);try{var O=function(){var e=c.value,t=new Date(e.dt);if(t<j)return"break";if(t<b&&(f+=parseInt(e.sum),t>u)){var n=G.find((function(t){return t.value===e.cat})).label;p[n]||(p[n]={name:n,y:0}),p[n].y+=parseInt(e.sum)}};for(v.s();!(c=v.n()).done;){if("break"===O())break}}catch(m){v.e(m)}finally{v.f()}var g={chart:{type:"pie"},title:{text:"Last 30 days spendings"},plotOptions:{pie:{borderWidth:0}},series:[{name:"MDL",colorByPoint:!0,data:Object.values(p)}]};return Object(E.jsxs)("div",{children:[Object(E.jsx)("h2",{children:"Charts page"}),Object(E.jsx)(J,{}),!r&&Object(E.jsxs)("div",{className:"charts-page",children:[Object(E.jsx)(h.a,{highcharts:d.a,options:i}),Object(E.jsx)("hr",{}),Object(E.jsx)(h.a,{highcharts:d.a,options:g}),Object(E.jsx)("hr",{}),Object(E.jsxs)("div",{className:"average-spending",children:["Average spending for the last 60 days: ",parseInt(f/60)," mdl / day"]})]})]})};function H(e){var t=e.show,n=e.onClose,r=e.children,o=Object(a.useRef)();return Object(a.useEffect)((function(){var e=function(e){t&&o.current&&!o.current.contains(e.target)&&n(e)};return document.addEventListener("mousedown",e),function(){document.removeEventListener("mousedown",e)}}),[t]),Object(E.jsx)(E.Fragment,{children:t?Object(E.jsx)("div",{className:"modal-window",children:Object(E.jsxs)("div",{ref:o,children:[Object(E.jsx)("a",{href:"#",onClick:n,title:"Close",className:"modal-close",children:"Close"}),r]})}):""})}var q,Y=n(19),z=function(e){var t=e.formType,n=e.values,r=e.onSuccess,o={field_amount:"",field_date:(new Date).toISOString().substr(0,10),field_category:"",field_description:""},c=Object(a.useState)("add"===t?o:n),s=Object(w.a)(c,2),i=s[0],l=s[1],u=L().token,d=function(e){var t=e.target.value;l(Object(S.a)(Object(S.a)({},i),{},Object(Y.a)({},e.target.name,t)))};return Object(E.jsxs)("div",{children:[Object(E.jsx)("h2",{children:"add"===t?"Add transaction":"Edit transaction"}),Object(E.jsxs)("form",{className:"add-transaction",onSubmit:function(e){e.preventDefault();var a={type:"transaction",title:[i.field_date],field_amount:[i.field_amount],field_category:[i.field_category],field_date:[i.field_date],field_description:[i.field_description]},c={method:"add"===t?"POST":"PATCH",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+u}),body:JSON.stringify(a)},s="add"===t?"https://dev-expenses-api.pantheonsite.io/node?_format=json":"https://dev-expenses-api.pantheonsite.io/node/".concat(n.nid,"?_format=json");M(s,c,(function(e){e.nid?(r(),alert("Success!"),l(o)):alert("Something went wrong, please contact Constantin :)")}))},children:[Object(E.jsx)("input",{required:!0,placeholder:"Amount",type:"number",name:"field_amount",value:i.field_amount,onChange:d}),Object(E.jsx)("input",{required:!0,placeholder:"Date",type:"date",name:"field_date",value:i.field_date,onChange:d}),Object(E.jsx)("select",{required:!0,name:"field_category",value:i.field_category,onChange:d,children:G.map((function(e,t){return Object(E.jsx)("option",{value:e.value,children:e.label},t)}))}),Object(E.jsx)("textarea",{placeholder:"Description",name:"field_description",rows:"3",value:i.field_description,onChange:d}),Object(E.jsx)("input",{type:"submit",value:"add"===t?"Add transaction":"Edit transaction"})]})]})},Q=n(30),V={},X=Object(l.a)(G);try{for(X.s();!(q=X.n()).done;){var $=q.value;V[$.value]=$.label}}catch(de){X.e(de)}finally{X.f()}function K(e){var t,n=e.month,r=e.total,o=e.items,c=e.handleEdit,s=e.setShowDeleteModal,i=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=Object(a.useState)(t),r=Object(w.a)(n,2),o=r[0],c=r[1];return{sortedItems:Object(a.useMemo)((function(){var t=Object(Q.a)(e);return null!==o&&t.sort((function(e,t){return"ascending"===o.direction?e[o.key]-t[o.key]:t[o.key]-e[o.key]})),t}),[e,o]),requestSort:function(e){var t="ascending";o&&o.key===e&&"ascending"===o.direction&&(t="descending"),c({key:e,direction:t})},sortConfig:o}}(o),l=i.sortedItems,u=i.requestSort,d=i.sortConfig;return Object(E.jsxs)("div",{className:"table-wrapper",children:[Object(E.jsxs)("div",{className:"month-badge",children:[n,": ",r]}),Object(E.jsxs)("table",{className:"expenses-table",cellSpacing:"0",cellPadding:"0",children:[Object(E.jsx)("thead",{children:Object(E.jsxs)("tr",{children:[Object(E.jsx)("th",{children:"Date"}),Object(E.jsx)("th",{onClick:function(){return u("sum")},className:"sortable ".concat((t="sum",d&&d.key===t?d.direction:"")),children:"Amount"}),Object(E.jsx)("th",{children:"Category"}),Object(E.jsx)("th",{children:"Description"}),Object(E.jsx)("th",{}),Object(E.jsx)("th",{})]})}),Object(E.jsx)("tbody",{children:l.map((function(e,t){return Object(E.jsxs)("tr",{children:[Object(E.jsx)("td",{children:e.dt}),Object(E.jsx)("td",{children:e.sum}),Object(E.jsx)("td",{children:V[e.cat]}),Object(E.jsx)("td",{children:e.dsc}),Object(E.jsx)("td",{children:Object(E.jsx)("button",{"data-values":JSON.stringify({nid:e.id,field_date:e.dt,field_amount:e.sum,field_category:e.cat,field_description:e.dsc}),onClick:c,className:"btn-outline",children:"Edit"})}),Object(E.jsx)("td",{children:Object(E.jsx)("button",{"data-nid":e.id,onClick:function(e){return s(e.currentTarget.getAttribute("data-nid"))},className:"btn-outline",children:"Delete"})})]},e.id)}))})]})]})}var Z=function(){var e,t=L(),n=t.userDetails,r=t.token,o=Object(a.useState)(!1),c=Object(w.a)(o,2),s=c[0],i=c[1],l=Object(a.useState)(!1),u=Object(w.a)(l,2),d=u[0],j=u[1],h=P(),b=h.data,p=h.dataDispatch,f=null===b.groupedData;Object(a.useEffect)((function(){f&&W(r,p)}),[b]);var v=Object(a.useState)({}),O=Object(w.a)(v,2),g=O[0],m=O[1],x=function(e){var t=JSON.parse(e.currentTarget.getAttribute("data-values"));m(t),j(!0)},y=function(e,t){!function(e,t,n){var a={method:"DELETE",headers:new Headers({Accept:"application/json","Content-Type":"application/json","JWT-Authorization":"Bearer "+t})};fetch("https://dev-expenses-api.pantheonsite.io/node/".concat(e,"?_format=json"),a).then((function(e){n(e)}))}(e,t,(function(e){e.ok?alert("Transaction was successfully deleted."):alert("Something went wrong."),i(!1),W(t,p,b.category)}))},S=b.filtered||b,k=Object(a.useState)(2),D=Object(w.a)(k,2),_=D[0],C=D[1];return Object(E.jsxs)("div",{children:[Object(E.jsxs)(H,{show:s,onClose:function(e){e.preventDefault(),i(!1)},children:[Object(E.jsx)("h3",{children:"Are you sure you want to delete the transaction?"}),Object(E.jsx)("button",{onClick:function(){return y(s,r)},className:"button logout",children:"Yes, remove the transaction"})]}),Object(E.jsx)(H,{show:d,onClose:function(e){e.preventDefault(),j(!1)},children:Object(E.jsx)(z,{formType:"edit",values:g,onSuccess:function(){j(!1),W(r,p,b.category)}})}),Object(E.jsx)("h2",{children:"Expenses"}),Object(E.jsxs)("h4",{children:["Hi, ",null===n||void 0===n||null===(e=n.current_user)||void 0===e?void 0:e.name,"!"]}),Object(E.jsx)(J,{}),f?"":Object(E.jsxs)("div",{children:[Object.keys(S.groupedData).map((function(e,t){return t<_?Object(E.jsx)(K,{total:S.totals[e],month:e,items:S.groupedData[e],handleEdit:x,setShowDeleteModal:i},t):""})),Object.keys(S.groupedData).length>_?Object(E.jsx)("div",{className:"load-more",children:Object(E.jsx)("button",{onClick:function(){return C(_+1)},className:"btn-outline",children:"Load more"})}):""]})]})},ee=n(28),te=n.n(ee),ne=[{path:"/test/build",component:function(){var e=R(),t=Object(i.g)(),n=L(),a=n.loading,r=n.errorMessage;n.userIsLoggedIn&&t.push("/test/home");var o=function(){var n=Object(O.a)(v.a.mark((function n(a){var r;return v.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return r={access_token:a.accessToken},n.prev=1,n.next=4,m(e,r);case 4:if(n.sent.current_user){n.next=7;break}return n.abrupt("return");case 7:t.push("/test/home"),n.next=13;break;case 10:n.prev=10,n.t0=n.catch(1),console.log(n.t0);case 13:case"end":return n.stop()}}),n,null,[[1,10]])})));return function(e){return n.apply(this,arguments)}}();return Object(E.jsxs)("div",{children:[Object(E.jsx)("h4",{children:"Please login using Google in order to access app functionality."}),r?Object(E.jsxs)("p",{children:["We have some errors: ",r]}):null,Object(E.jsx)(te.a,{clientId:"954790461001-2p4vab8hud9u6mj4n6hb6iio4uaiofe5.apps.googleusercontent.com",buttonText:"Login",render:function(e){return Object(E.jsx)("button",{onClick:e.onClick,className:"button logout",disabled:a,children:"Log in"})},onSuccess:o,onFailure:function(e){console.log(e)},cookiePolicy:"single_host_origin",disabled:a})]})},isPrivate:!1},{path:"/test/charts",component:B,isPrivate:!0},{path:"/test/home",component:Z,isPrivate:!0},{path:"/test/logout",component:function(){var e=R(),t=P().dataDispatch,n=Object(i.g)();return Object(E.jsxs)("div",{children:[Object(E.jsx)("h3",{children:"Do you want to logout?"}),Object(E.jsx)("button",{className:"button logout",onClick:function(a){a.preventDefault(),function(e,t){y.apply(this,arguments)}(e,t),n.push("/test/build")},children:"Logout"})]})},isPrivate:!0},{path:"/test/add-transaction",component:function(){var e=L().token,t=P().dataDispatch;return Object(E.jsx)(z,{formType:"add",onSuccess:function(){W(e,t)}})},isPrivate:!0}],ae=n(17);function re(){var e=L().userIsLoggedIn,t=Object(a.useState)("closed"),n=Object(w.a)(t,2),r=n[0],o=n[1],c=Object(a.useState)(null),i=Object(w.a)(c,2),l=i[0],u=i[1],d=Object(a.useState)(null),j=Object(w.a)(d,2),h=j[0],b=j[1];return Object(E.jsx)("div",{className:"navbar ".concat(r),onTouchStart:function(e){return function(e){var t=e.touches[0];u(t.clientX),b(t.clientY)}(e)},onTouchMove:function(e){return function(e){if(l&&h){var t=e.touches[0].clientX,n=e.touches[0].clientY,a=l-t,r=h-n;Math.abs(a)<Math.abs(r)&&o(r>0?"open":"closed"),u(null),b(null)}}(e)},children:Object(E.jsxs)("ul",{children:[Object(E.jsx)("li",{children:Object(E.jsx)(s.b,{activeClassName:"selected",className:"not-selected",to:"/test/home",exact:!0,children:Object(E.jsx)(ae.b,{})})}),Object(E.jsx)("li",{children:Object(E.jsx)(s.b,{to:"/test/charts",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(E.jsx)(ae.a,{})})}),Object(E.jsx)("li",{children:Object(E.jsx)(s.b,{to:"/test/add-transaction",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(E.jsx)(ae.c,{})})}),e?Object(E.jsx)("li",{children:Object(E.jsx)(s.b,{to:"/test/logout",activeClassName:"selected",className:"not-selected",exact:!0,children:Object(E.jsx)(ae.d,{})})}):""]})})}var oe=n(31),ce=function(e){var t=e.component,n=e.path,a=e.isPrivate,r=Object(oe.a)(e,["component","path","isPrivate"]),o=L();return Object(E.jsx)(i.b,Object(S.a)({path:n,render:function(e){return a&&!Boolean(o.token)?Object(E.jsx)(i.a,{to:{pathname:"/test/build"}}):Object(E.jsx)(t,Object(S.a)({},e))}},r))};var se=function(){return Object(E.jsx)(U,{children:Object(E.jsxs)(s.a,{children:[Object(E.jsx)(re,{}),Object(E.jsx)(i.d,{children:ne.map((function(e){return Object(E.jsx)(ce,{exact:!0,path:e.path,component:e.component,isPrivate:e.isPrivate},e.path)}))})]})})},ie=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function le(e,t){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var n=e.installing;null!=n&&(n.onstatechange=function(){"installed"===n.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),t&&t.onUpdate&&t.onUpdate(e)):(console.log("Content is cached for offline use."),t&&t.onSuccess&&t.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}var ue=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,46)).then((function(t){var n=t.getCLS,a=t.getFID,r=t.getFCP,o=t.getLCP,c=t.getTTFB;n(e),a(e),r(e),o(e),c(e)}))};c.a.render(Object(E.jsx)(r.a.StrictMode,{children:Object(E.jsx)(se,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/test/build",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var t="".concat("/test/build","/service-worker.js");ie?(!function(e,t){fetch(e,{headers:{"Service-Worker":"script"}}).then((function(n){var a=n.headers.get("content-type");404===n.status||null!=a&&-1===a.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):le(e,t)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(t,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):le(t,e)}))}}({onUpdate:function(e){window.location.reload()}}),ue()}},[[45,1,2]]]);
//# sourceMappingURL=main.ccf81ebf.chunk.js.map