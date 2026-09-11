import{B as e}from"./index-BNpFvbK4.js";function t(){let{institution:t}=e.getState();return t.lightColors?.brand||`#6366f1`}function n(e,t,n){let r=`
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; color-adjust: exact; padding: 10mm; }
      html, body { margin: 0 !important; }
    }
  `;return`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${e}</title><style>${n?`${n}\n${r}`:`
    @page { size: A4 portrait; margin: 0; }
    @page :first { margin-top: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; font-size: 12px; padding: 10mm; }
  \n${r}`}</style></head><body>${t}</body></html>`}function r(e,t){let n=document.createElement(`iframe`);n.style.cssText=`position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;opacity:0;pointer-events:none`,document.body.appendChild(n);try{let r=n.contentDocument;if(!r){n.remove();return}r.open(),r.write(e),r.close(),setTimeout(()=>{try{n.contentWindow?.print()}catch{}setTimeout(()=>n.remove(),2e3)},t)}catch{n.remove()}}function i(e,t,i){r(n(e,t,i?.css),i?.delay||600)}function a(e,t){r(e,t||600)}function o(e,t){let n=new Blob([t],{type:`text/html;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,i.style.cssText=`position:fixed;left:-9999px;top:-9999px;opacity:0`,document.body.appendChild(i),requestAnimationFrame(()=>{i.click(),setTimeout(()=>{document.body.removeChild(i),URL.revokeObjectURL(r)},200)})}var s={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#x27;`,"/":`&#x2F;`,"`":`&#96;`},c=/[&<>"'`/]/g;function l(e){return e.replace(c,e=>s[e]||e)}export{a,i,o as n,t as r,l as t};