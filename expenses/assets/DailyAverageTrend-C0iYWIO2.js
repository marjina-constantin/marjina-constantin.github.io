import{u as D,r as d,j as y,H as h,b as F}from"./index-Nm6uBxs2.js";function T(){var p;const{data:t}=D(),[m,u]=d.useState([]),n=!!t.filtered_raw;d.useEffect(()=>{const e=setTimeout(()=>{u(t.filtered_raw||t.raw)},200);return()=>{clearTimeout(e)}},[t.raw,t.filtered_raw]);const g=new Date((p=t.raw[t.raw.length-1])==null?void 0:p.dt),l=e=>{const s=e.getTime()-g.getTime();return parseInt(String(s/(1e3*3600*24)))+1};let a=[],r=[],i=0,o=0;const f=m.slice().reverse();for(const e of f){const s=new Date(e.dt);e.type==="incomes"?o=parseFloat(String(o))+parseFloat(e.sum):i=parseFloat(String(i))+parseFloat(e.sum),r[e.dt]=[s.getTime(),parseFloat(parseFloat(String(o/l(s))).toFixed(2))],a[e.dt]=[s.getTime(),parseFloat(parseFloat(String(i/l(s))).toFixed(2))]}a=Object.values(a),r=Object.values(r),a.length>14&&!n&&(a.splice(0,14),r.splice(0,14));const c=[{name:"Daily expenses",data:a}];n||c.push({name:"Daily incomes",data:r});const x={chart:{type:"line",zoomType:"x"},boost:{useGPUTranslations:!0},title:{text:"Daily average trends"},colors:["#E91E63","#4DD0E1"],yAxis:{title:{text:"Daily average"}},xAxis:{type:"datetime",crosshair:!0},tooltip:{xDateFormat:"%e %b %Y",shared:!0,split:!0},credits:{enabled:!1},series:c};return y.jsx(h,{highcharts:F,options:x})}export{T as default};
