import type { StudentAdmission } from './types'

export function generateA4HTML(s: StudentAdmission, isBn = false): string {
  const statusColor = s.status === 'approved' ? '#10b981' : s.status === 'rejected' ? '#ef4444' : '#f59e0b'
  const statusText = s.status === 'approved' ? 'APPROVED' : s.status === 'rejected' ? 'REJECTED' : 'PENDING'
  const statusBn = s.status === 'approved' ? 'অনুমোদিত' : s.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'অপেক্ষমান'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admission Form - ${s.id}</title>
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
  .status-stamp { position: absolute; top: 40mm; right: 20mm; width: 70px; height: 70px; border-radius: 50%; border: 3px solid ${statusColor}; display: flex; align-items: center; justify-content: center; text-align: center; opacity: 0.3; transform: rotate(-30deg); }
  .status-text { font-size: 10px; font-weight: 900; color: ${statusColor}; line-height: 1.2; }
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
    <div class="status-text">${isBn ? statusBn : statusText}</div>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <div class="logo-box">ET</div>
      <div class="school-info">
        <h1>EduTech School Management</h1>
        <p>Sunrise Academy, Dhaka, Bangladesh</p>
        <p>Phone: +880-2-1234567 | Email: info@sunrise.edu.bd</p>
      </div>
    </div>
    <div class="photo-box">
      ${s.photo ? `<img src="${s.photo}" alt="Photo" />` : '<span style="font-size:10px;color:#999;text-align:center">No Photo</span>'}
    </div>
  </div>

  <!-- Title -->
  <div class="form-title">ADMISSION APPLICATION FORM / ভর্তি আবেদনপত্র</div>

  <!-- ID Row -->
  <div class="id-row">
    <div>
      <div class="id-label">${isBn ? 'ছাত্র আইডি' : 'Student ID'}</div>
      <div class="id-value">${s.id}</div>
    </div>
    <div>
      <div class="id-label">${isBn ? 'আবেদনের তারিখ' : 'Application Date'}</div>
      <div class="id-value" style="font-size:13px">${s.admissionDate}</div>
    </div>
    <div>
      <div class="id-label">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}</div>
      <div class="id-value" style="font-size:13px">${s.academicYear}</div>
    </div>
    <div>
      <div class="id-label">${isBn ? 'অবস্থা' : 'Status'}</div>
      <div class="id-value" style="font-size:13px;color:${statusColor}">${isBn ? statusBn : statusText}</div>
    </div>
  </div>

  <!-- Personal -->
  <div class="section">
    <div class="section-title">${isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}</div>
    <div class="fields-grid">
      <div class="field"><div class="field-label">${isBn ? 'নাম (ইংরেজি)' : 'Name (English)'}</div><div class="field-value">${s.nameEn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</div><div class="field-value">${s.nameBn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</div><div class="field-value">${s.dob || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'লিঙ্গ' : 'Gender'}</div><div class="field-value">${s.gender || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</div><div class="field-value">${s.bloodGroup || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'ধর্ম' : 'Religion'}</div><div class="field-value">${s.religion || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'মোবাইল' : 'Mobile'}</div><div class="field-value">${s.phone || '—'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${s.email || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</div><div class="field-value">${s.presentAddress || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</div><div class="field-value">${s.permanentAddress || '—'}</div></div>
    </div>
  </div>

  <!-- Academic -->
  <div class="section">
    <div class="section-title">${isBn ? 'একাডেমিক তথ্য' : 'Academic Information'}</div>
    <div class="fields-grid-3">
      <div class="field"><div class="field-label">${isBn ? 'শ্রেণি' : 'Class'}</div><div class="field-value">${s.class ? `Class ${s.class}` : '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'সেকশন' : 'Section'}</div><div class="field-value">${s.section || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'রোল' : 'Roll'}</div><div class="field-value">${s.roll || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'আগের স্কুল' : 'Previous School'}</div><div class="field-value">${s.previousSchool || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'জাতীয়তা' : 'Nationality'}</div><div class="field-value">${s.nationality || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'জেলা' : 'District'}</div><div class="field-value">${s.district || '—'}</div></div>
    </div>
  </div>

  <!-- Family -->
  <div class="section">
    <div class="section-title">${isBn ? 'পারিবারিক তথ্য' : 'Family Information'}</div>
    <div class="fields-grid">
      <div class="field"><div class="field-label">${isBn ? 'পিতার নাম (ইং)' : "Father's Name (EN)"}</div><div class="field-value">${s.fatherNameEn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'পিতার নাম (বাং)' : "Father's Name (BN)"}</div><div class="field-value">${s.fatherNameBn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'পিতার পেশা' : "Father's Occupation"}</div><div class="field-value">${s.fatherOccupation || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'পিতার মোবাইল' : "Father's Mobile"}</div><div class="field-value">${s.fatherPhone || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'মাতার নাম (ইং)' : "Mother's Name (EN)"}</div><div class="field-value">${s.motherNameEn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'মাতার নাম (বাং)' : "Mother's Name (BN)"}</div><div class="field-value">${s.motherNameBn || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'মাতার পেশা' : "Mother's Occupation"}</div><div class="field-value">${s.motherOccupation || '—'}</div></div>
      <div class="field"><div class="field-label">${isBn ? 'মাতার মোবাইল' : "Mother's Mobile"}</div><div class="field-value">${s.motherPhone || '—'}</div></div>
    </div>
  </div>

  ${s.status === 'pending' ? `
  <div class="note-box">
    ⚠️ ${isBn ? 'এই আবেদনটি অনুমোদনের অপেক্ষায় আছে। অনুগ্রহ করে এই কপিটি প্রতিষ্ঠানে জমা দিন।' : 'This application is pending approval. Please bring this copy to the school.'}
  </div>` : ''}

  <!-- Footer / Signatures -->
  <div class="footer">
    <div class="sign-line">
      <div class="line"></div>
      <div class="sign-label">${isBn ? 'আবেদনকারীর স্বাক্ষর' : 'Applicant Signature'}</div>
    </div>
    <div style="text-align:center;font-size:10px;color:#888">
      <div>${isBn ? 'মুদ্রণের তারিখ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div>
      <div style="font-size:9px;margin-top:2px">EduTech School Management System</div>
    </div>
    <div class="sign-line">
      <div class="line"></div>
      <div class="sign-label">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : 'Principal Signature'}</div>
    </div>
  </div>

</div>
</body>
</html>`
}
