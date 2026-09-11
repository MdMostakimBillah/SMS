import{t as e}from"./GenericPDFOptionsModal-BtcZp_is.js";import{Z as t,on as n,un as r}from"./index-D8THeXcy.js";import{t as i}from"./sanitize-DAvRSczl.js";import{r as a,t as o}from"./pdfBranding-CERZ0Rp6.js";function s(e,t=!1,n,r,a){let o=e.status===`approved`?`#10b981`:e.status===`rejected`?`#ef4444`:`#f59e0b`,s=e.status===`approved`?`APPROVED`:e.status===`rejected`?`REJECTED`:`PENDING`,c=e.status===`approved`?`অনুমোদিত`:e.status===`rejected`?`প্রত্যাখ্যাত`:`অপেক্ষমান`,l=a||`EduTech`;return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admission Form - ${i(e.id)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: white; color: #1a1a1a; font-size: 12px; }
  .page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #6366f1; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-box { width: 50px; height: 50px; background: #6366f1; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 700; }
  .school-info h1 { font-size: 18px; font-weight: 700; color: #6366f1; }
  .school-info p { font-size: 11px; color: #666; }
  .photo-box { width: 80px; height: 95px; border: 1.5px solid #ddd; display: flex; align-items: center; justify-content: center; background: #f9f9f9; overflow: hidden; border-radius: 6px; }
  .photo-box img { width: 100%; height: 100%; object-fit: cover; }
  .form-title { text-align: center; font-size: 14px; font-weight: 700; color: white; background: #6366f1; padding: 8px; margin-bottom: 14px; border-radius: 6px; letter-spacing: 1px; }
  .id-row { display: flex; align-items: center; justify-content: space-between; background: #eef2ff; padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #c7d2fe; }
  .id-label { font-size: 11px; color: #666; }
  .id-value { font-size: 16px; font-weight: 700; color: #6366f1; letter-spacing: 1px; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e0e7ff; padding-bottom: 4px; margin-bottom: 8px; }
  .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
  .fields-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; }
  .field { border-bottom: 0.5px solid #ddd; padding-bottom: 3px; }
  .field-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
  .field-value { font-size: 11px; font-weight: 500; color: #1a1a1a; min-height: 14px; }
  .status-stamp { position: absolute; top: 40mm; right: 20mm; width: 70px; height: 70px; border-radius: 50%; border: 3px solid ${o}; display: flex; align-items: center; justify-content: center; text-align: center; opacity: 0.3; transform: rotate(-30deg); }
  .status-text { font-size: 10px; font-weight: 900; color: ${o}; line-height: 1.2; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; }
  .sign-line { text-align: center; }
  .sign-line .line { width: 140px; height: 1px; background: #333; margin: 20px auto 4px; }
  .sign-label { font-size: 10px; color: #555; }
  .note-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px 10px; margin-top: 10px; font-size: 10px; color: #92400e; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">

  <!-- Status stamp -->
  <div class="status-stamp">
    <div class="status-text">${i(t?c:s)}</div>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-box">ET</div>
      <div class="school-info">
        <h1>${i(l)}</h1>
        <p>Sunrise Academy, Dhaka, Bangladesh</p>
        <p>Phone: +880-2-1234567 | Email: info@sunrise.edu.bd</p>
      </div>
    </div>
    <div class="photo-box">
      ${e.photo?`<img src="${e.photo}" alt="Photo" />`:`<span style="font-size:10px;color:#999;text-align:center">No Photo</span>`}
    </div>
  </div>

  <!-- Title -->
  <div class="form-title">ADMISSION APPLICATION FORM / ভর্তি আবেদনপত্র</div>

  <!-- ID Row -->
  <div class="id-row">
    <div>
      <div class="id-label">${t?`ছাত্র আইডি`:`Student ID`}</div>
      <div class="id-value">${i(e.id)}</div>
    </div>
    <div>
      <div class="id-label">${t?`আবেদনের তারিখ`:`Application Date`}</div>
      <div class="id-value" style="font-size:13px">${i(e.admissionDate)}</div>
    </div>
    <div>
      <div class="id-label">${t?`শিক্ষাবর্ষ`:`Academic Year`}</div>
      <div class="id-value" style="font-size:13px">${i(e.academicYear)}</div>
    </div>
    <div>
      <div class="id-label">${t?`অবস্থা`:`Status`}</div>
      <div class="id-value" style="font-size:13px;color:${o}">${i(t?c:s)}</div>
    </div>
  </div>

  <!-- Personal -->
  <div class="section">
    <div class="section-title">${t?`ব্যক্তিগত তথ্য`:`Personal Information`}</div>
    <div class="fields-grid">
      <div class="field"><div class="field-label">${t?`নাম (ইংরেজি)`:`Name (English)`}</div><div class="field-value">${i(e.nameEn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`নাম (বাংলা)`:`Name (Bengali)`}</div><div class="field-value">${i(e.nameBn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`জন্ম তারিখ`:`Date of Birth`}</div><div class="field-value">${i(e.dob||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`লিঙ্গ`:`Gender`}</div><div class="field-value">${i(e.gender||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`রক্তের গ্রুপ`:`Blood Group`}</div><div class="field-value">${i(e.bloodGroup||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`ধর্ম`:`Religion`}</div><div class="field-value">${i(e.religion||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`মোবাইল`:`Mobile`}</div><div class="field-value">${i(e.phone||`—`)}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${i(e.email||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`বর্তমান ঠিকানা`:`Present Address`}</div><div class="field-value">${i(e.presentAddress||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`স্থায়ী ঠিকানা`:`Permanent Address`}</div><div class="field-value">${i(e.permanentAddress||`—`)}</div></div>
    </div>
  </div>

  <!-- Academic -->
  <div class="section">
    <div class="section-title">${t?`একাডেমিক তথ্য`:`Academic Information`}</div>
    <div class="fields-grid-3">
      <div class="field"><div class="field-label">${t?`শ্রেণি`:`Class`}</div><div class="field-value">${e.class?i(`Class ${e.class}`):`—`}</div></div>
      <div class="field"><div class="field-label">${t?`সেকশন`:`Section`}</div><div class="field-value">${i(e.section||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`রোল`:`Roll`}</div><div class="field-value">${i(e.roll||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`শ্রেণি শিক্ষক`:`Class Teacher`}</div><div class="field-value">${i(r||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`আগের স্কুল`:`Previous School`}</div><div class="field-value">${i(e.previousSchool||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`জাতীয়তা`:`Nationality`}</div><div class="field-value">${i(e.nationality||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`জেলা`:`District`}</div><div class="field-value">${i(e.district||`—`)}</div></div>
    </div>
  </div>

  <!-- Family -->
  <div class="section">
    <div class="section-title">${t?`পারিবারিক তথ্য`:`Family Information`}</div>
    <div class="fields-grid">
      <div class="field"><div class="field-label">${t?`পিতার নাম (ইং)`:`Father's Name (EN)`}</div><div class="field-value">${i(e.fatherNameEn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`পিতার নাম (বাং)`:`Father's Name (BN)`}</div><div class="field-value">${i(e.fatherNameBn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`পিতার পেশা`:`Father's Occupation`}</div><div class="field-value">${i(e.fatherOccupation||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`পিতার মোবাইল`:`Father's Mobile`}</div><div class="field-value">${i(e.fatherPhone||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`মাতার নাম (ইং)`:`Mother's Name (EN)`}</div><div class="field-value">${i(e.motherNameEn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`মাতার নাম (বাং)`:`Mother's Name (BN)`}</div><div class="field-value">${i(e.motherNameBn||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`মাতার পেশা`:`Mother's Occupation`}</div><div class="field-value">${i(e.motherOccupation||`—`)}</div></div>
      <div class="field"><div class="field-label">${t?`মাতার মোবাইল`:`Mother's Mobile`}</div><div class="field-value">${i(e.motherPhone||`—`)}</div></div>
    </div>
  </div>

  ${e.status===`pending`?`
  <div class="note-box">
    ⚠️ ${t?`এই আবেদনটি অনুমোদনের অপেক্ষায় আছে। অনুগ্রহ করে এই কপিটি প্রতিষ্ঠানে জমা দিন।`:`This application is pending approval. Please bring this copy to the school.`}
  </div>`:``}

  <!-- Footer / Signatures -->
  <div class="footer">
    <div class="sign-line">
      <div class="line"></div>
      <div class="sign-label">${t?`আবেদনকারীর স্বাক্ষর`:`Applicant Signature`}</div>
    </div>
    <div style="text-align:center;font-size:10px;color:#888">
      <div>${t?`মুদ্রণের তারিখ:`:`Printed:`} ${new Date().toLocaleDateString()}</div>
      <div style="font-size:7px;margin-top:2px;color:#999">Powered by EduTech</div>
    </div>
    <div class="sign-line">
      <div class="line"></div>
      <div class="sign-label">${t?`অধ্যক্ষের স্বাক্ষর`:`Principal Signature`}</div>
    </div>
  </div>

</div>
</body>
</html>`}var c=r(n(),1),l=[{key:`serial`,label:`#`,labelBn:`ক্রম`,default:!0},{key:`id`,label:`Student ID`,labelBn:`ছাত্র আইডি`,default:!0},{key:`nameEn`,label:`Name (EN)`,labelBn:`নাম (ইং)`,default:!0},{key:`nameBn`,label:`Name (BN)`,labelBn:`নাম (বাং)`,default:!0},{key:`class`,label:`Class`,labelBn:`শ্রেণি`,default:!0},{key:`section`,label:`Section`,labelBn:`সেকশন`,default:!1},{key:`roll`,label:`Roll`,labelBn:`রোল`,default:!1},{key:`teacherId`,label:`Class Teacher`,labelBn:`শ্রেণি শিক্ষক`,default:!1},{key:`gender`,label:`Gender`,labelBn:`লিঙ্গ`,default:!0},{key:`dob`,label:`Date of Birth`,labelBn:`জন্ম তারিখ`,default:!1},{key:`bloodGroup`,label:`Blood Group`,labelBn:`রক্তের গ্রুপ`,default:!1},{key:`religion`,label:`Religion`,labelBn:`ধর্ম`,default:!1},{key:`phone`,label:`Mobile`,labelBn:`মোবাইল`,default:!0},{key:`email`,label:`Email`,labelBn:`ইমেইল`,default:!1},{key:`district`,label:`District`,labelBn:`জেলা`,default:!1},{key:`fatherNameEn`,label:`Father's Name`,labelBn:`পিতার নাম`,default:!1},{key:`fatherPhone`,label:`Father's Mobile`,labelBn:`পিতার মোবাইল`,default:!1},{key:`motherNameEn`,label:`Mother's Name`,labelBn:`মাতার নাম`,default:!1},{key:`admissionDate`,label:`Admission Date`,labelBn:`ভর্তির তারিখ`,default:!0},{key:`status`,label:`Status`,labelBn:`অবস্থা`,default:!0}];function u(e,t,n,r){return t===`serial`?String(n+1):t===`class`?e.class?i(`Class ${e.class}`):`—`:t===`gender`?i((e.gender||``).split(` / `)[0]||`—`):t===`religion`?i((e.religion||``).split(` / `)[0]||`—`):t===`teacherId`?!e.teacherId||!r?`—`:i(r.find(t=>t.id===e.teacherId)?.nameEn||`—`):i(t===`status`?{pending:`Pending`,approved:`Approved`,rejected:`Rejected`}[e.status]||e.status:String(e[t]||`—`))}var d=e=>e===`approved`?`#10b981`:e===`rejected`?`#ef4444`:`#f59e0b`;function f(e,t){let n=t.isBn??!1,r=t.title||(n?`ছাত্র তালিকা`:`Student List`),s=t.selectedCols||[],c=t.emptyRows||0,f=t.emptyColumns||[],p=t.orientation||`landscape`,m=o(),h=t.institutionName||m.schoolName,g={pending:`অপেক্ষমান`,approved:`অনুমোদিত`,rejected:`প্রত্যাখ্যাত`},_=l.filter(e=>s.includes(e.key)),v=_.length+f.length,y=p===`landscape`?v>12?`7.5px`:v>9?`9px`:`0.625rem`:v>8?`7.5px`:v>6?`9px`:`0.625rem`,b=_.map(e=>`<th>${i(n?e.labelBn:e.label)}</th>`).join(``),x=f.map(e=>`<th>${i(e||(n?`(ফাঁকা)`:`(Empty)`))}</th>`).join(``),S=e.map((e,r)=>{let a=_.map(a=>a.key===`status`?`<td><b style="color:${d(e.status)}">${n?i(g[e.status]||e.status):u(e,a.key,r,t.teachers)}</b></td>`:a.key===`id`?`<td><span style="font-family:monospace;font-size:8px;color:${m.brandColor}">${i(e.id)}</span></td>`:a.key===`nameEn`&&n?`<td>${i(e.nameBn||e.nameEn)}</td>`:`<td>${u(e,a.key,r,t.teachers)}</td>`).join(``),o=f.map(()=>`<td></td>`).join(``);return`<tr class="${r%2==1?`alt`:``}">${a}${o}</tr>`}).join(``),C=Array.from({length:c},(t,n)=>`<tr class="er">${`<td style="color:#bbb;font-size:8px">${e.length+n+1}</td>`}${Array(v-1).fill(`<td></td>`).join(``)}</tr>`).join(``),w=((e,t)=>{let n=parseInt(e.replace(`#`,``),16),r=Math.max(0,(n>>16)-t),i=Math.max(0,(n>>8&255)-t),a=Math.max(0,(n&255)-t);return`#`+(r<<16|i<<8|a).toString(16).padStart(6,`0`)})(m.brandColor,30);return`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student List — ${i(h)}</title>
<style>
  @page { size: A4 ${p}; margin: 5mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${y}; color:#1a1a1a; background:#fff; }
  .hdr  { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${m.brandColor}; margin-bottom:7px; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl  { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  table { border-collapse:collapse; table-layout:auto; width:100%; }
  th { background:${m.brandColor}; color:#fff; padding:5px 8px; text-align:center; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid ${w}; white-space:nowrap; }
  td { padding:4px 8px; border:0.5px solid #e5e7eb; vertical-align:middle; text-align:center; white-space:nowrap; }
  tr.alt td { background:#f9fafb; }
  tr.er td  { background:#fafafa; height:20px; }
  .ftr { margin-top:10px; padding-top:7px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8px; color:#888; }
  @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:10px">
    ${a(m)}
    <div>
      <div style="font-size:13px;font-weight:700;color:${m.brandColor}">${i(h)}</div>
      ${m.address?`<div style="font-size:8px;color:#888">${i(m.address)}</div>`:``}
    </div>
  </div>
  <div class="meta">
    <div>${n?`মুদ্রণ:`:`Printed:`} ${new Date().toLocaleDateString()}</div>
    <div>${n?`মোট:`:`Total:`} ${e.length} ${n?`জন`:`students`}</div>
    ${f.length?`<div>${n?`ফাঁকা কলাম:`:`Empty cols:`} ${f.length}</div>`:``}
    ${c?`<div>${n?`ফাঁকা সারি:`:`Empty rows:`} ${c}</div>`:``}
    <div>A4 · ${p}</div>
  </div>
</div>
<div class="ttl">${i(r)} — ${n?`শিক্ষাবর্ষ ২০২৫–২৬`:`Academic Year 2025–26`}</div>
<table>
  <thead><tr>${b}${x}</tr></thead>
  <tbody>${S}${C}</tbody>
</table>
<div class="ftr">
  <span style="font-size:7px;color:#999">Powered by EduTech</span>
  <div style="display:flex;gap:50px">
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${n?`প্রধান শিক্ষক`:`Principal`}</div>
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${n?`অফিস সিল`:`Office Seal`}</div>
  </div>
</div>
</body>
</html>`}var p=t(),m=c.memo(function({count:t,isBn:n,students:r,teachers:i,onClose:a,onDownload:o}){return(0,p.jsx)(e,{columns:l,defaultTitle:`Student List`,defaultTitleBn:`ছাত্র তালিকা`,recordLabel:`students`,recordLabelBn:`জন`,count:t,isBn:n,previewRenderer:(0,c.useCallback)(e=>f(r,{...e,teachers:i}),[r,i]),onClose:a,onDownload:e=>o({title:e.title,selectedCols:e.selectedCols,emptyRows:e.emptyRows,emptyColumns:e.emptyColumns,orientation:e.orientation,isBn:e.isBn,teachers:i})})});export{f as n,s as r,m as t};