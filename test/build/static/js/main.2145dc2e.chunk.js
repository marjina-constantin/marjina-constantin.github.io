(this["webpackJsonpreact-expenses"]=this["webpackJsonpreact-expenses"]||[]).push([[0],{21:function(e,n,t){},22:function(e,n,t){},29:function(e,n,t){"use strict";t.r(n);var o=t(0),c=t.n(o),i=t(15),r=t.n(i),a=(t(21),t(22),t(9)),s=t(1),l=t(2),d=[{path:"/test/build",component:function(){return Object(l.jsx)("div",{children:"Home page updated...312321312"})}},{path:"/test/about",component:function(){return Object(l.jsx)("div",{children:"About page"})}}];function u(){return Object(l.jsx)("div",{className:"navbar",children:Object(l.jsxs)("ul",{children:[Object(l.jsx)("li",{children:Object(l.jsx)(a.b,{activeClassName:"selected",className:"not-selected",to:"/test/build",exact:!0,children:"Home"})}),Object(l.jsx)("li",{children:Object(l.jsx)(a.b,{to:"/test/about",activeClassName:"selected",className:"not-selected",exact:!0,children:"About"})})]})})}var h=function(){return Object(l.jsxs)(a.a,{children:[Object(l.jsx)(u,{}),Object(l.jsx)(s.c,{children:d.map((function(e){return Object(l.jsx)(s.a,{exact:!0,path:e.path,component:e.component},e.path)}))})]})},f=Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));function b(e,n){navigator.serviceWorker.register(e).then((function(e){e.onupdatefound=function(){var t=e.installing;null!=t&&(t.onstatechange=function(){"installed"===t.state&&(navigator.serviceWorker.controller?(console.log("New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA."),n&&n.onUpdate&&n.onUpdate(e)):(console.log("Content is cached for offline use."),n&&n.onSuccess&&n.onSuccess(e)))})}})).catch((function(e){console.error("Error during service worker registration:",e)}))}var p=function(e){e&&e instanceof Function&&t.e(3).then(t.bind(null,30)).then((function(n){var t=n.getCLS,o=n.getFID,c=n.getFCP,i=n.getLCP,r=n.getTTFB;t(e),o(e),c(e),i(e),r(e)}))};r.a.render(Object(l.jsx)(c.a.StrictMode,{children:Object(l.jsx)(h,{})}),document.getElementById("root")),function(e){if("serviceWorker"in navigator){if(new URL("/test/build",window.location.href).origin!==window.location.origin)return;window.addEventListener("load",(function(){var n="".concat("/test/build","/service-worker.js");f?(!function(e,n){fetch(e,{headers:{"Service-Worker":"script"}}).then((function(t){var o=t.headers.get("content-type");404===t.status||null!=o&&-1===o.indexOf("javascript")?navigator.serviceWorker.ready.then((function(e){e.unregister().then((function(){window.location.reload()}))})):b(e,n)})).catch((function(){console.log("No internet connection found. App is running in offline mode.")}))}(n,e),navigator.serviceWorker.ready.then((function(){console.log("This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA")}))):b(n,e)}))}}({onUpdate:function(e){caches.keys().then((function(e){console.log(11111,e)}))}}),p()}},[[29,1,2]]]);
//# sourceMappingURL=main.2145dc2e.chunk.js.map