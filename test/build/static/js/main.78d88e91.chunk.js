(this["webpackJsonpreact-expenses"]=this["webpackJsonpreact-expenses"]||[]).push([[0],{22:function(e,n,t){},23:function(e,n,t){},30:function(e,n,t){"use strict";t.r(n);var o=t(0),c=t.n(o),i=t(15),r=t.n(i),a=(t(22),t(23),t(9)),s=t(1),l=t(2),u=function(){return Object(l.jsx)("div",{children:"About page"})},d=t(17),h=[{path:"/test/build",component:function(){var e=Object(o.useState)(!0),n=Object(d.a)(e,2),t=(n[0],n[1]);return Object(o.useEffect)((function(){setTimeout((function(){return t(!1)}),2e3)}),[]),Object(l.jsx)("div",{children:"Brand new homepage"})}},{path:"/test/about",component:u}];function f(){return Object(l.jsx)("div",{className:"navbar",children:Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)(a.b,{activeClassName:"selected",className:"not-selected",to:"/test/build",exact:!0,children:"Home"})}),Object(l.jsx)("li",{children:Object(l.jsx)(a.b,{to:"/test/about",activeClassName:"selected",className:"not-selected",exact:!0,children:"About"})})]})})}var b=function(){return Object(l.jsxs)(a.a,{children:[Object(l.jsx)(f,{}),Object(l.jsx)(s.c,{children:h.map((function(e){return Object(l.jsx)(s.a,{exact:!0,path:e.path,component:e.component},e.path)}))})]})},j=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function p(e,n){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var t=e.installing;null!=t&&(t.onstatechange=function(){"installed"===t.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),n&&n.onUpdate&&n.onUpdate(e)):(console.log("Content is cached for offline use."),n&&n.onSuccess&&n.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}var v=function(e){e&&e instanceof Function&&t.e(3).then(t.bind(null,31)).then((function(n){var t=n.getCLS,o=n.getFID,c=n.getFCP,i=n.getLCP,r=n.getTTFB;t(e),o(e),c(e),i(e),r(e)}))};r.a.render(Object(l.jsx)(c.a.StrictMode,{children:Object(l.jsx)(b,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/test/build",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var n="".concat("/test/build","/service-worker.js");j?(!function(e,n){fetch(e,{headers:{"Service-Worker":"script"}}).then((function(t){var o=t.headers.get("content-type");404===t.status||null!=o&&-1===o.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):p(e,n)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(n,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):p(n,e)}))}}({onUpdate:function(e){window.location.reload()}}),v()}},[[30,1,2]]]);
//# sourceMappingURL=main.78d88e91.chunk.js.map