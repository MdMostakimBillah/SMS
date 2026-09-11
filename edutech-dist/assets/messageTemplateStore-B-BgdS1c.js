import{H as e,J as t,W as n,X as r}from"./index-BNpFvbK4.js";var i=0;function a(){return i++,`MSG-${Date.now()}-${i}`}function o(e){let t={id:a(),senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:e.studentId,recipientName:e.studentName,subject:e.subject,body:e.body,read:!0,status:`sent`,createdAt:new Date().toISOString(),isSMS:!0,phoneNumber:e.phoneNumber,templateId:e.templateId,studentId:e.studentId};return c.getState().addMessage(t),t}var s=[{id:`MSG-SEED-001`,senderId:`TEA-001`,senderName:`Rahim Uddin`,senderNameBn:`রহিম উদ্দিন`,senderRole:`teacher`,recipientId:`all`,recipientName:`All Users`,subject:`Parent-Teacher Meeting Next Friday`,body:`Dear parents and guardians,

We are scheduling a parent-teacher meeting this Friday at 3:00 PM. Please attend to discuss your child's academic progress.

Best regards,
Rahim Uddin`,read:!1,status:`delivered`,createdAt:new Date(Date.now()-36e5).toISOString()},{id:`MSG-SEED-002`,senderId:`ADM-001`,senderName:`Admin Office`,senderNameBn:`অ্যাডমিন অফিস`,senderRole:`admin`,recipientId:`teachers`,recipientName:`Teachers`,subject:`Monthly Staff Meeting — August`,body:`All teachers are requested to attend the monthly staff meeting on Monday at 10:00 AM in the conference room.

Agenda:
1. Exam schedule review
2. New curriculum updates
3. Student attendance concerns`,read:!1,status:`delivered`,createdAt:new Date(Date.now()-72e5).toISOString()},{id:`MSG-SEED-003`,senderId:`LIB-001`,senderName:`Library Department`,senderNameBn:`গ্রন্থাগার বিভাগ`,senderRole:`staff`,recipientId:`students`,recipientName:`Students`,subject:`Overdue Library Books Reminder`,body:`Dear students,

This is a reminder that you have overdue library books. Please return them at the earliest to avoid late fees.

Thank you,
Library Department`,read:!0,status:`delivered`,createdAt:new Date(Date.now()-864e5).toISOString()},{id:`MSG-SEED-004`,senderId:`FIN-001`,senderName:`Finance Department`,senderNameBn:`অর্থ বিভাগ`,senderRole:`staff`,recipientId:`parents`,recipientName:`Parents`,subject:`Fee Payment Reminder — September`,body:`Dear parents,

This is a friendly reminder that the tuition fee for September is due by the 15th. Please make the payment at your earliest convenience.

You can pay online or visit the accounts office.

Thank you,
Finance Department`,read:!1,status:`delivered`,createdAt:new Date(Date.now()-1728e5).toISOString()},{id:`MSG-SEED-005`,senderId:`PRINC-001`,senderName:`Principal`,senderNameBn:`অধ্যক্ষ`,senderRole:`admin`,recipientId:`all`,recipientName:`All Users`,subject:`Annual Sports Day Announcement`,body:`Dear all,

I am pleased to announce that our Annual Sports Day will be held on October 20th. All students are encouraged to participate.

More details will follow soon.

Warm regards,
The Principal`,read:!0,status:`delivered`,createdAt:new Date(Date.now()-6048e5).toISOString()},{id:`MSG-SEED-006`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`teachers`,recipientName:`Teachers`,subject:`Updated Exam Grading Policy`,body:`Dear teachers,

Please note that the grading policy has been updated for this semester. Refer to the attached document for the new grade boundaries.

Regards,
Admin`,read:!0,status:`delivered`,createdAt:new Date(Date.now()-2592e5).toISOString()},{id:`MSG-SEED-007`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`students`,recipientName:`Students`,subject:`Welcome Back — New Semester`,body:`Dear students,

Welcome back to a new semester! We hope you had a great break. Let's make this semester a productive and enjoyable one.

Best wishes,
Admin`,read:!0,status:`delivered`,createdAt:new Date(Date.now()-432e6).toISOString()},{id:`MSG-SEED-010`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`all`,recipientName:`All Users`,subject:`Holiday Notice — Eid Celebration`,body:`Dear all,

The institution will remain closed from April 10-15 for Eid celebrations. Classes will resume on April 16.

Happy Eid!`,read:!0,status:`sent`,createdAt:new Date(Date.now()-1296e6).toISOString()},{id:`MSG-SEED-011`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`teachers`,recipientName:`Teachers`,subject:`Result Submission Deadline`,body:`Dear teachers,

Please submit all exam results by Friday 5:00 PM. Late submissions will not be accepted.

Thank you.`,read:!0,status:`queued`,createdAt:new Date(Date.now()-18e5).toISOString()},{id:`MSG-SEED-012`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`parents`,recipientName:`Parents`,subject:`Field Trip Permission Slip`,body:`Dear parents,

A field trip to the Science Museum is scheduled for next Wednesday. Please sign and return the permission slip by Monday.

Regards,
Admin`,read:!0,status:`failed`,createdAt:new Date(Date.now()-9e5).toISOString()},{id:`MSG-SEED-013`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`students`,recipientName:`Students`,subject:`Club Registration Open`,body:`Dear students,

Club registration for the new term is now open. Visit the student affairs office to sign up for your preferred clubs.

Deadline: End of this week.`,read:!0,status:`queued`,createdAt:new Date(Date.now()-6e5).toISOString()},{id:`MSG-SEED-014`,senderId:`me`,senderName:`Admin`,senderNameBn:`Admin`,senderRole:`admin`,recipientId:`all`,recipientName:`All Users`,subject:`System Maintenance Notice`,body:`Dear all,

The school management system will undergo maintenance this Saturday from 10 PM to 2 AM. Please plan accordingly.

IT Department`,read:!0,status:`failed`,createdAt:new Date(Date.now()-3e5).toISOString()}],c=r()(e(e=>({messages:[],addMessage:t=>e(e=>({messages:[t,...e.messages]})),markRead:t=>e(e=>({messages:e.messages.map(e=>e.id===t?{...e,read:!0}:e)})),markAllRead:t=>e(e=>({messages:e.messages.map(e=>(t?e.recipientId===`all`||e.recipientId===`students`||e.recipientId===`teachers`||e.recipientId===`parents`:e.senderId===`me`)&&!e.read?{...e,read:!0}:e)})),deleteMessage:t=>e(e=>({messages:e.messages.filter(e=>e.id!==t)})),resendMessage:t=>e(e=>({messages:e.messages.map(e=>e.id===t?{...e,status:`sent`,createdAt:new Date().toISOString()}:e)}))}),{name:`edutech-messages`,storage:n(`edutech-messages`),version:1,onRehydrateStorage:()=>e=>{e&&e.messages.length===0&&(e.messages=s)}}));t(()=>{c.setState({messages:[]})});var l=[{id:`TPL-FEE-001`,type:`fee`,name:`Fee Collection`,nameBn:`ফি আদায়`,subject:`Fee Payment Confirmation`,body:`Dear {student_name},

Your fee payment of {amount} has been received for {month}. Receipt No: {receipt_no}.

Thank you.`,trigger:`fee_collect`,category:`Fee`,isDefault:!0,updatedAt:new Date().toISOString()},{id:`TPL-EXAM-001`,type:`exam`,name:`Examination`,nameBn:`পরীক্ষা`,subject:`Exam Schedule Notice`,body:`Dear {student_name},

{exam_name} is scheduled from {start_date} to {end_date}. Please prepare accordingly.

Best wishes.`,trigger:`exam_schedule`,category:`Exam`,isDefault:!0,updatedAt:new Date().toISOString()},{id:`TPL-DUE-001`,type:`due`,name:`Due Payment`,nameBn:`বকেয় পেমেন্ট`,subject:`Pending Fee Reminder`,body:`Dear {student_name},

You have an outstanding balance of {due_amount} for {month}. Please clear your due by {due_date}.

Regards.`,trigger:`due_reminder`,category:`Due`,isDefault:!0,updatedAt:new Date().toISOString()},{id:`TPL-GEN-001`,type:`general`,name:`General Message`,nameBn:`সাধারণ বার্তা`,subject:`{subject}`,body:`Dear {recipient_name},

{message}

Best regards,
{school_name}`,trigger:`manual`,category:`General`,isDefault:!0,updatedAt:new Date().toISOString()}],u=[`Fee`,`Exam`,`Due`,`General`],d=r()(e((e,t)=>({templates:l,categories:u,getTemplate:e=>t().templates.find(t=>t.type===e),getTemplatesByType:e=>t().templates.filter(t=>t.type===e),getTemplatesByTrigger:e=>t().templates.filter(t=>t.trigger===e),getTemplatesByCategory:e=>t().templates.filter(t=>t.category===e),updateTemplate:(t,n)=>e(e=>({templates:e.templates.map(e=>e.id===t?{...e,...n,updatedAt:new Date().toISOString()}:e)})),createTemplate:n=>{let r=`TPL-CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,i={...n,id:r,isDefault:!1,updatedAt:new Date().toISOString()};return e(e=>({templates:[...e.templates,i]})),n.category&&!t().categories.includes(n.category)&&e(e=>({categories:[...e.categories,n.category]})),r},deleteTemplate:t=>e(e=>({templates:e.templates.filter(e=>e.id!==t||e.isDefault)})),addCategory:t=>e(e=>({categories:e.categories.includes(t)?e.categories:[...e.categories,t]})),removeCategory:t=>e(e=>({categories:e.categories.filter(e=>e!==t),templates:e.templates.map(e=>e.category===t?{...e,category:void 0}:e)}))}),{name:`edutech-message-templates`,storage:n(`edutech-message-templates`)}));t(()=>{d.setState({templates:l,categories:u})});export{c as i,a as n,o as r,d as t};