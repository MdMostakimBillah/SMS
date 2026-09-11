import{Qt as e,un as t}from"./index-BNpFvbK4.js";import{a as n,t as r}from"./sanitize-BDIw0C5e.js";import{t as i}from"./browser-gttdbOGN.js";var a=e(`scan-line`,[[`path`,{d:`M3 7V5a2 2 0 0 1 2-2h2`,key:`aa7l1z`}],[`path`,{d:`M17 3h2a2 2 0 0 1 2 2v2`,key:`4qcy5o`}],[`path`,{d:`M21 17v2a2 2 0 0 1-2 2h-2`,key:`6vwrx8`}],[`path`,{d:`M7 21H5a2 2 0 0 1-2-2v-2`,key:`ioqczr`}],[`path`,{d:`M7 12h10`,key:`b7w52i`}]]),o=t(i(),1),s=e=>{let t=[`০`,`১`,`২`,`৩`,`৪`,`৫`,`৬`,`৭`,`৮`,`৯`];return String(e).split(``).map(e=>t[parseInt(e)]||e).join(``)};function c(e,t,n){let r=``;for(let i=0;i<10;i++){let a=``;for(let r=0;r<t;r++)a+=`<td style="width:${n+4}px;height:${n+4}px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:${n}px;height:${n}px;border:1.5px solid ${e};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${n>14?8:7}px;font-weight:700;color:${e};background:white;">${s(i)}</div></td>`;r+=`<tr>${a}</tr>`}return`<table style="border-collapse:separate;border-spacing:1px;"><tbody>${r}</tbody></table>`}function l(e,t,n=16){let r=``;return t.forEach((i,a)=>{r+=`<td style="width:${n+4}px;height:${n+4}px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:${n}px;height:${n}px;border:1.5px solid ${e};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${n>18?9:7}px;font-weight:700;color:${e};background:white;">${i}</div></td>`,(a+1)%2==0&&a<t.length-1&&(r+=`</tr><tr>`)}),`<table style="border-collapse:separate;border-spacing:2px;"><tbody><tr>${r}</tr></tbody></table>`}function u(e){let t=`ABCDEFGHIJKLMNOPQRSTUVWXYZ`.split(``),n=``;return t.forEach((t,r)=>{n+=`<td style="width:18px;height:18px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:15px;height:15px;border:1.5px solid ${e};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:6px;font-weight:700;color:${e};background:white;">${t}</div></td>`,(r+1)%13==0&&r<25&&(n+=`</tr><tr>`)}),`<table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${n}</tr></tbody></table>`}function d(e,t,n,i,a){let o=Math.ceil(t/i),s=``;for(let c=0;c<Math.min(o,4);c++){let o=c*i+1,l=Math.min((c+1)*i,t),u=``;for(let t=o;t<=l;t++){let i=``;n.forEach(t=>{i+=`<td style="width:20px;height:20px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:16px;height:16px;border:1.5px solid ${e};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:${e};background:white;">${r(t)}</div></td>`}),u+=`<tr>
        <td style="padding:2px 3px;font-size:9px;font-weight:700;color:#111827;text-align:center;border:1px solid ${e}33;width:22px;">${t}</td>
        <td style="padding:1px;"><table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${i}</tr></tbody></table></td>
      </tr>`}s+=`<div style="flex:1;min-width:100px;border:1.5px solid ${e};border-radius:4px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${e};color:white;">
          <th style="padding:3px;font-size:8px;border:1px solid ${e};width:22px;">${a?`প্রশ্ন`:`Q`}</th>
          <th style="padding:3px;font-size:8px;border:1px solid ${e};">${a?`উত্তর`:`Ans`}</th>
        </tr></thead>
        <tbody>${u}</tbody>
      </table>
    </div>`}return s}function f(e,t,n){let r=Math.min(t,20),i=``;for(let t=1;t<=r;t++)i+=`<td style="padding:2px;border:1px solid ${e}33;text-align:center;font-size:7px;font-weight:700;color:#111827;width:24px;">${t}</td>`;let a=``;for(let t=0;t<r;t++)a+=`<td style="padding:2px;border:1px solid ${e}33;text-align:center;"><div style="width:12px;height:12px;border:1.5px solid ${e};border-radius:50%;display:inline-block;"></div></td>`;return`<table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:${e}11;">
      <th style="padding:2px;border:1px solid ${e}33;font-size:7px;width:24px;">${n?`প্রশ্ন`:`Q`}</th>
      ${i}
    </tr></thead>
    <tbody><tr>
      <td style="padding:2px;border:1px solid ${e}33;font-size:7px;font-weight:700;color:#111827;">${n?`নম্বর`:`Mark`}</td>
      ${a}
    </tr></tbody>
  </table>`}function p(e){let t=``;for(let n=0;n<40;n++){let r=n%3==0?2:1;t+=`<div style="width:${r}px;height:24px;background:${n%5==0?`#000`:e};"></div>`}return`<div style="display:flex;align-items:flex-end;gap:0.5px;">${t}</div>`}function m(e,t,n){switch(e){case`bn`:return[`ক`,`খ`,`গ`,`ঘ`,`ঙ`];case`numbers`:return[`0`,`1`,`2`,`3`,`4`,`5`];case`custom`:return t.split(`,`).map(e=>e.trim()).filter(Boolean).slice(0,8);default:return n?[`ক`,`খ`,`গ`,`ঘ`]:[`A`,`B`,`C`,`D`]}}function h(e){switch(e){case`Legal`:return`size:legal;margin:5mm 5mm;`;case`Letter`:return`size:letter;margin:5mm 5mm;`;default:return`size:A4;margin:5mm 5mm;`}}async function g(e,t=!0,n=1){let i=e.themeColor||`#6366f1`,a=m(e.marksEntryStyle,e.customMarksValues,t),s=t?e.institutionNameBn:e.institutionName,g=e.institutionAddress||``,_=`${e.serialNumber}-${String(n).padStart(4,`0`)}`,v=`SEC-${_}-${Date.now().toString(36).toUpperCase()}`,y=`VER-${Math.random().toString(36).substring(2,8).toUpperCase()}`,b=``,x=``;if(e.showQRCode){let t=JSON.stringify({sn:_,cls:e.className,exam:e.examName,sub:e.subjectName,fmt:e.sheetFormat,sec:v,ver:y}),n=JSON.stringify({sn:_,session:e.sessionName,role:`EXAMINER`,sec:v});try{b=await o.toDataURL(t,{width:80,margin:1})}catch{b=``}try{x=await o.toDataURL(n,{width:60,margin:1})}catch{x=``}}let S=b?`<img src="${b}" style="width:65px;height:65px;" />`:e.showQRCode?`<div style="width:65px;height:65px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`:``,C=x?`<img src="${x}" style="width:50px;height:50px;" />`:e.showQRCode?`<div style="width:50px;height:50px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`:``,w=[];e.showStudentName&&w.push(`<span style="flex:2;">${t?`শিক্ষার্থীর নাম`:`Student Name`}: __________________________________________</span>`),e.showRollNo&&w.push(`<span style="flex:1;">${t?`রোল`:`Roll`}: ______________</span>`),e.showDate&&w.push(`<span>${t?`তারিখ`:`Date`}: ______________</span>`);let T=w.join(``),E=[],D=(e,t)=>`<div style="border:1.5px solid ${i};border-radius:4px;padding:4px;"><div style="text-align:center;font-size:7px;font-weight:800;color:${i};margin-bottom:3px;border-bottom:1px solid ${i}33;padding-bottom:2px;">${e}</div>${t}</div>`;e.showRollNo&&E.push(D(t?`রোল নম্বর`:`Roll Number`,c(i,5,14))),e.showStudentId&&E.push(D(t?`শিক্ষার্থী আইডি`:`Student ID`,c(i,10,14))),e.showRegistrationNo&&E.push(D(t?`রেজিস্ট্রেশন`:`Reg. No`,c(i,10,14))),e.showTeacherCode&&E.push(D(t?`শিক্ষক কোড`:`Teacher Code`,c(i,6,14))),e.showInvigilatorCode&&E.push(D(t?`পরিদর্শক কোড`:`Invigilator Code`,c(i,6,14))),e.showSetCode&&E.push(D(t?`সেট কোড`:`Set Code`,l(i,[`A`,`B`,`C`,`D`],20))),e.showSubjectCode&&E.push(D(t?`বিষয় কোড`:`Subject Code`,u(i))),e.showAdditionalPaper&&E.push(D(`${t?`অতিরিক্ত`:`Extra`}<br/>${t?`উত্তর পত্র`:`Papers`}`,c(i,2,12))),e.showRoomNumber&&E.push(D(t?`কক্ষ নং`:`Room No`,c(i,3,12))),e.showSeatNumber&&E.push(D(t?`আসন নং`:`Seat No`,c(i,3,12)));let O=[];e.showQRCode&&S&&O.push(S),e.showStudentPhoto&&O.push(`<div style="width:55px;height:65px;border:1.5px solid ${i};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">${t?`ছবি`:`Photo`}</div>`),e.showStudentSignature&&O.push(`<div style="font-size:7px;color:#6b7280;text-align:center;">${t?`শিক্ষার্থীর স্বাক্ষর`:`Student Sign`}</div>`),O.length>0&&E.push(`<div style="border:1.5px solid ${i};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:3px;">${O.join(``)}</div>`);let k=[];e.showAdditionalPaper&&k.push(D(`${t?`অতিরিক্ত`:`Extra`}<br/>${t?`উত্তর পত্র`:`Papers`}`,c(i,2,12))),e.showQRCode&&C&&k.push(`<div style="border:1.5px solid ${i};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;">${C}<div style="font-size:7px;color:#6b7280;font-weight:600;">SN</div></div>`);let A=[];e.showExaminerSignature&&A.push(`<div style="flex:1;border:1.5px solid ${i};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:3px;">${t?`পরীক্ষক`:`Examiner`}</div><div style="font-size:6px;color:#6b7280;">(${t?`স্বাক্ষর`:`Sign`})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`),e.showHeadExaminerSignature&&A.push(`<div style="flex:1;border:1.5px solid ${i};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:3px;">${t?`প্রধান পরীক্ষক`:`Head Examiner`}</div><div style="font-size:6px;color:#6b7280;">(${t?`স্বাক্ষর`:`Sign`})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`),e.showVerificationSignature&&A.push(`<div style="flex:1;border:1.5px solid ${i};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:3px;">${t?`নিশ্চিতকারী`:`Verifier`}</div><div style="font-size:6px;color:#6b7280;">(${t?`স্বাক্ষর`:`Sign`})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`),A.length>0&&k.push(`<div style="display:flex;gap:3px;">${A.join(``)}</div>`),e.showExaminerRemarks&&k.push(`<div style="border:1.5px solid ${i};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:4px;">${t?`পরীক্ষকের মন্তব্য`:`Examiner's Remarks`}</div><div style="border:1px dashed ${i}55;border-radius:2px;height:40px;"></div></div>`);let j=[];e.showCheckedBy&&j.push(`<div style="flex:1;border:1.5px solid ${i};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:4px;">${t?`যাচাইকারী`:`Checked By`}</div><div style="font-size:6px;color:#6b7280;">(${t?`নাম ও স্বাক্ষর`:`Name & Sign`})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div></div>`),e.showVerifiedBy&&j.push(`<div style="flex:1;border:1.5px solid ${i};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${i};margin-bottom:4px;">${t?`প্রত্যায়নকারী`:`Verified By`}</div><div style="font-size:6px;color:#6b7280;">(${t?`নাম ও স্বাক্ষর`:`Name & Sign`})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div></div>`);let M=[];e.showTotalMarks&&M.push(`<div style="border:1.5px solid ${i};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${i};font-size:7px;">${t?`মোট নম্বর`:`Total`}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`),e.showPracticalMarks&&M.push(`<div style="border:1.5px solid ${i};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${i};font-size:7px;">${t?`প্র্যাকটিক্যাল`:`Practical`}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`),e.showVivaMarks&&M.push(`<div style="border:1.5px solid ${i};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${i};font-size:7px;">${t?`ভিভা`:`Viva`}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`),e.showPresentAbsent&&(M.push(`<div style="border:1.5px solid ${i};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${i};font-size:7px;">${t?`উপস্থিত`:`Present`}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`),M.push(`<div style="border:1.5px solid ${i};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${i};font-size:7px;">${t?`অনুপস্থিত`:`Absent`}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`));let N=e.showInstructions?`<div style="margin-top:6px;padding:6px 10px;border:1px dashed ${i}55;border-radius:4px;font-size:7px;color:#6b7280;">
      <div style="font-weight:700;color:${i};margin-bottom:4px;text-align:center;font-size:8px;">${t?`শিক্ষার্থীদের জন্য নির্দেশনা`:`Instructions for Students`}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;">
        <div>1. ${t?`কালো বা নীল বলপয়েন্ট কলম ব্যবহার করুন`:`Use black/blue ballpoint pen`}</div>
        <div>3. ${t?`করেকশন ফ্লুইড বা ইরেজার ব্যবহার করবেন না`:`No correction fluid/eraser`}</div>
        <div>2. ${t?`বৃত্ত সম্পূর্ণ ভর্তি করুন`:`Fill circles completely`}</div>
        <div>4. ${t?`শিট মোড়াবেন না বা ক্ষতিগ্রস্ত করবেন না`:`Do not fold or damage`}</div>
      </div>
    </div>`:``;return`<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  @page{${h(e.paperSize||`A4`)}}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2937;font-size:8px;background:white;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:white;}}
  .no-print{margin:10px auto;text-align:center;}
  @media print{.no-print{display:none!important;}}
</style></head><body>

<div class="no-print">
  <button onclick="window.print()" style="padding:10px 28px;font-size:14px;background:${i};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
    ${t?`🖨️ প্রিন্ট / PDF ডাউনলোড`:`🖨️ Print / Download PDF`}
  </button>
</div>

<div style="border:2px solid ${i};padding:10px;position:relative;max-width:210mm;margin:0 auto;">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:6px;padding-bottom:5px;border-bottom:2px solid ${i};">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:4px;">
      <div style="width:60px;height:60px;border-radius:50%;border:2px solid ${i};display:flex;align-items:center;justify-content:center;font-size:7px;color:${i};font-weight:700;overflow:hidden;">${e.logo?`<img src="${e.logo}" style="width:100%;height:100%;object-fit:cover;" />`:r(s.charAt(0))}</div>
      <div>
        <h1 style="font-size:18px;font-weight:800;color:${i};margin-bottom:1px;">${r(s)}</h1>
        <div style="font-size:9px;color:#6b7280;">${r(g)}</div>
      </div>
      ${e.showBarcode?`<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">${p(i)}<div style="font-size:6px;color:#9ca3af;">${r(_)}</div></div>`:``}
    </div>
    <div style="font-size:10px;color:#374151;margin-bottom:2px;">${r(e.sessionName)}</div>
    ${e.showClass?`<div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:2px;">${r(t?e.classNameBn:e.className)}</div>`:``}
    ${e.showGroup&&e.groupName?`<div style="font-size:10px;color:#374151;margin-bottom:1px;">${r(t?e.groupNameBn:e.groupName)}</div>`:``}
    ${e.showSection&&e.sectionName?`<div style="font-size:10px;color:#374151;margin-bottom:1px;">${t?`শাখা`:`Section`}: ${r(e.sectionName)}</div>`:``}
    ${e.showExamName?`<div style="font-size:12px;font-weight:700;color:${i};margin-bottom:3px;">${r(t?e.examNameBn:e.examName)}</div>`:``}
    ${e.showSubjectName?`<div style="font-size:10px;color:#374151;margin-bottom:2px;">${r(t?e.subjectNameBn:e.subjectName)}</div>`:``}
    <div style="font-size:7px;color:#6b7280;">${t?`অবশ্যই কালো বা নীল পয়েন্ট কলম দিয়ে বৃত্ত ভর্তি করতে হবে`:`Fill bubbles with black or blue pen`}</div>
  </div>

  <!-- SERIAL + SECURITY + VERIFICATION -->
  ${e.showSerialNumber?`<div style="position:absolute;top:10px;right:14px;text-align:right;"><div style="font-size:11px;font-weight:800;color:${i};">#${r(_)}</div></div>`:``}
  ${e.showSecurityCode?`<div style="position:absolute;top:24px;right:14px;text-align:right;"><div style="font-size:6px;color:#9ca3af;">SEC: ${r(v)}</div></div>`:``}
  ${e.showVerificationCode?`<div style="position:absolute;top:36px;right:14px;text-align:right;"><div style="font-size:6px;color:#9ca3af;">VER: ${r(y)}</div></div>`:``}

  <!-- STUDENT PART -->
  <div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${i};margin-bottom:4px;border-bottom:1px solid ${i}33;padding-bottom:2px;">
      ${t?`শিক্ষার্থীর অংশ`:`Student Part`}
    </div>
    ${T?`<div style="display:flex;gap:5px;flex-wrap:wrap;padding:4px 6px;border:1.5px solid ${i};border-radius:4px;font-size:8px;color:#374151;margin-bottom:5px;">${T}</div>`:``}
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      ${E.join(``)}
    </div>
  </div>

  <!-- EXAMINER'S PART -->
  ${e.showExaminerSection?`<div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${i};margin-bottom:4px;border-bottom:1px solid ${i}33;padding-bottom:2px;">
      ${t?`পরীক্ষকের অংশ`:`Examiner's Part`}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      <div style="flex:1;display:flex;gap:3px;flex-wrap:wrap;">
        ${d(i,e.totalQuestions,a,10,t)}
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;min-width:80px;">
        ${k.join(``)}
      </div>
    </div>
  </div>`:``}

  <!-- BOTTOM: RESULT TABLE + SUMMARY -->
  <div style="display:flex;gap:5px;padding:4px;border:1.5px solid ${i};border-radius:4px;margin-bottom:4px;">
    <div style="flex:1;">${f(i,e.totalQuestions,t)}</div>
    ${M.length>0?`<div style="width:90px;display:flex;flex-direction:column;gap:3px;font-size:7px;color:#6b7280;">${M.join(``)}</div>`:``}
  </div>

  <!-- VERIFICATION -->
  ${j.length>0?`<div style="display:flex;gap:5px;margin-bottom:4px;">${j.join(``)}</div>`:``}

  <!-- INSTRUCTIONS -->
  ${N}

  <!-- FOOTER -->
  <div style="text-align:center;margin-top:5px;padding-top:3px;border-top:1.5px solid ${i};font-size:7px;color:#9ca3af;">
    ${r(s)} &bull; OMR Sheet &bull; ${t?`ফরম্যাট`:`Format`}: ${e.sheetFormat} &bull; ${r(_)}
  </div>

</div>
</body></html>`}function _(e,t=!0,r=1){g(e,t,r).then(e=>{n(e,600)})}async function v(e,t,n){let r=``;for(let i=1;i<=n;i++){let n=await g(e,t,i);r+=n.replace(`</body></html>`,``)+`<div style="page-break-after:always;"></div>`}return r+=`</body></html>`,r}export{a as i,_ as n,v as r,g as t};