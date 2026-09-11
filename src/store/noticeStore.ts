import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type NoticeTarget = 'all' | 'students' | 'teachers' | 'parents'
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notice {
  id: string
  title: string
  titleBn: string
  content: string
  contentBn: string
  author: string
  authorBn: string
  target: NoticeTarget
  priority: NoticePriority
  category: string
  pinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt: string
  storage?: string
}

let counter = 0
export function noticeId(): string {
  counter++
  return `NOTICE-${Date.now()}-${counter}`
}

const DEFAULT_CATEGORIES = ['General', 'Academic', 'Events', 'Emergency', 'Holiday']

const SEED_NOTICES: Notice[] = [
  {
    id: 'NOTICE-SEED-001',
    title: 'Annual Sports Day 2026',
    titleBn: 'বার্ষিক ক্রীড়া দিবস ২০২৬',
    content: `<h2>Annual Sports Day — October 20, 2026</h2>
<p>We are excited to announce our <strong>Annual Sports Day</strong> for the academic year 2026. This year's event promises to be bigger and better than ever before!</p>
<blockquote>All students must participate in at least one event. Registration forms are available at the sports office.</blockquote>
<h3>Event Schedule</h3>
<table>
  <tr><th>Time</th><th>Event</th><th>Venue</th></tr>
  <tr><td>8:00 AM</td><td>Opening Ceremony</td><td>Main Ground</td></tr>
  <tr><td>9:00 AM</td><td>100m Sprint (Junior)</td><td>Track A</td></tr>
  <tr><td>10:00 AM</td><td>Relay Race (Senior)</td><td>Track B</td></tr>
  <tr><td>11:30 AM</td><td>Football Semi-Final</td><td>Football Field</td></tr>
  <tr><td>1:00 PM</td><td>Cheerleading Competition</td><td>Main Ground</td></tr>
  <tr><td>3:00 PM</td><td>Prize Giving Ceremony</td><td>Auditorium</td></tr>
</table>
<h3>House Teams</h3>
<ul>
  <li><strong>Red House</strong> — Captain: Ahmed Hassan (Class 10)</li>
  <li><strong>Blue House</strong> — Captain: Fatima Khan (Class 10)</li>
  <li><strong>Green House</strong> — Captain: Rahman Ali (Class 9)</li>
  <li><strong>Yellow House</strong> — Captain: Sabrina Yusuf (Class 9)</li>
</ul>
<p>Parents are cordially invited to attend and cheer for their children. <em>Lunch will be provided for all participants.</em></p>`,
    contentBn: `<h2>বার্ষিক ক্রীড়া দিবস ২০২৬</h2>
<p>আমরা ২০২৬ শিক্ষাবর্ষের জন্য আমাদের <strong>বার্ষিক ক্রীড়া দিবস</strong> ঘোষণা করতে উত্সাহিত। এই বছরের অনুষ্ঠান আগের চেয়ে আরও বড় ও উন্নত হবে!</p>
<blockquote>সকল শিক্ষার্থীকে অন্তত একটি ইভেন্টে অংশ নিতে হবে। নিবন্ধন ফরম ক্রীড়া অফিসে পাওয়া যাচ্ছে।</blockquote>
<h3>অনুষ্ঠানের সময়সূচি</h3>
<table>
  <tr><th>সময়</th><th>ইভেন্ট</th><th>স্থান</th></tr>
  <tr><td>সকাল ৮:০০</td><td>উদ্বোধনী অনুষ্ঠান</td><td>প্রধান মাঠ</td></tr>
  <tr><td>সকাল ৯:০০</td><td>১০০ মিটার দৌড় (জুনিয়র)</td><td>ট্র্যাক এ</td></tr>
  <tr><td>সকাল ১০:০০</td><td>রিলে রেস (সিনিয়র)</td><td>ট্র্যাক বি</td></tr>
  <tr><td>সকাল ১১:৩০</td><td>ফুটবল সেমি-ফাইনাল</td><td>ফুটবল মাঠ</td></tr>
  <tr><td>দুপুর ১:০০</td><td>চিয়ারলিডিং প্রতিযোগিতা</td><td>প্রধান মাঠ</td></tr>
  <tr><td>বিকাল ৩:০০</td><td>পুরস্কার বিতরণ</td><td>অডিটোরিয়াম</td></tr>
</table>
<p>অভিভাবকদের আমন্ত্রণ জানানো হচ্ছে। <em>সকল অংশগ্রহণকারীদের জন্য দুপুরের খাবার দেওয়া হবে।</em></p>`,
    author: 'Principal',
    authorBn: 'অধ্যক্ষ',
    target: 'all',
    priority: 'high',
    category: 'Events',
    pinned: true,
    isActive: true,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    expiresAt: '2026-10-25',
  },
  {
    id: 'NOTICE-SEED-002',
    title: 'Mid-Term Examination Schedule — September 2026',
    titleBn: 'মধ্যবর্তী পরীক্ষার সময়সূচি — সেপ্টেম্বর ২০২৬',
    content: `<h2>Mid-Term Examination Schedule</h2>
<p>The mid-term examination for all classes will commence from <strong>September 15, 2026</strong>. Students are advised to prepare well and follow the schedule strictly.</p>
<h3>Examination Rules</h3>
<ol>
  <li>Students must bring their <strong>admit cards</strong> to every examination.</li>
  <li>Mobile phones are <strong>strictly prohibited</strong> inside the examination hall.</li>
  <li>Students arriving <strong>15 minutes after</strong> the start time will not be allowed to sit for the exam.</li>
  <li>Any form of <strong>malpractice</strong> will result in immediate disqualification.</li>
</ol>
<h3>Class 9 — Science Group</h3>
<table>
  <tr><th>Date</th><th>Subject</th><th>Time</th><th>Marks</th></tr>
  <tr><td>Sep 15</td><td>Physics</td><td>9:00 AM — 12:00 PM</td><td>100</td></tr>
  <tr><td>Sep 17</td><td>Chemistry</td><td>9:00 AM — 12:00 PM</td><td>100</td></tr>
  <tr><td>Sep 19</td><td>Mathematics</td><td>9:00 AM — 12:00 PM</td><td>100</td></tr>
  <tr><td>Sep 22</td><td>Biology</td><td>9:00 AM — 11:00 AM</td><td>75</td></tr>
  <tr><td>Sep 24</td><td>English</td><td>9:00 AM — 11:30 AM</td><td>100</td></tr>
  <tr><td>Sep 26</td><td>Bangla</td><td>9:00 AM — 12:00 PM</td><td>100</td></tr>
</table>
<blockquote><strong>Note:</strong> The detailed schedule for all groups (Commerce, Humanities) is available on the school dashboard. Students must check their respective class pages.</blockquote>
<p>Results will be published within <strong>two weeks</strong> after the last examination date.</p>`,
    contentBn: `<h2>মধ্যবর্তী পরীক্ষার সময়সূচি</h2>
<p>সকল শ্রেণির মধ্যবর্তী পরীক্ষা <strong>১৫ সেপ্টেম্বর, ২০২৬</strong> থেকে শুরু হবে। শিক্ষার্থীদের ভালোভাবে প্রস্তুত নেওয়া এবং সময়সূচি কঠোরভাবে মেনে চলার অনুরোধ করা হচ্ছে।</p>
<h3>পরীক্ষার নিয়মাবলী</h3>
<ol>
  <li>প্রতিটি পরীক্ষায় শিক্ষার্থীদের <strong>প্রবেশপত্র</strong> সাথে আনতে হবে।</li>
  <li>পরীক্ষা হলে <strong>মোবাইল ফোন সম্পূর্ণ নিষিদ্ধ</strong>।</li>
  <li>শুরুর <strong>১৫ মিনিট পরে</strong> আসলে পরীক্ষায় বসার অনুমতি দেওয়া হবে না।</li>
  <li>যেকোনো ধরনের <strong>অনৈতিকতা</strong> তাৎক্ষণিক বাতিলের কারণ হবে।</li>
</ol>
<p>ফলাফল শেষ পরীক্ষার <strong>দুই সপ্তাহের</strong> মধ্যে প্রকাশ করা হবে।</p>`,
    author: 'Academic Coordinator',
    authorBn: 'একাডেমিক সমন্বয়কারী',
    target: 'students',
    priority: 'high',
    category: 'Academic',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    expiresAt: '2026-09-30',
  },
  {
    id: 'NOTICE-SEED-003',
    title: 'Parent-Teacher Meeting — September 26',
    titleBn: 'অভিভাবক-শিক্ষক সাক্ষাৎ — ২৬ সেপ্টেম্বর',
    content: `<h2>Parent-Teacher Meeting</h2>
<p>A <strong>Parent-Teacher Meeting</strong> is scheduled for <strong>Saturday, September 26, 2026</strong> at 3:00 PM in the school auditorium.</p>
<h3>Agenda</h3>
<ul>
  <li>Discussion on mid-term examination results</li>
  <li>Student behavioral progress report</li>
  <li>Upcoming school events and activities</li>
  <li>Fee payment schedule for the next quarter</li>
</ul>
<blockquote>Parents are requested to bring their children's <strong>report cards</strong> and <strong>fee receipts</strong> for reference during the meeting.</blockquote>
<p>For any queries, please contact the class teacher or the academic office.</p>`,
    contentBn: `<h2>অভিভাবক-শিক্ষক সাক্ষাৎ</h2>
<p><strong>শনিবার, ২৬ সেপ্টেম্বর, ২০২৬</strong> বিকাল ৩টায় স্কুল অডিটোরিয়ামে একটি <strong>অভিভাবক-শিক্ষক সাক্ষাৎ</strong> অনুষ্ঠিত হবে।</p>
<h3>আলোচ্য বিষয়</h3>
<ul>
  <li>মধ্যবর্তী পরীক্ষার ফলাফল আলোচনা</li>
  <li>শিক্ষার্থীদের আচরণগত অগ্রগতি প্রতিবেদন</li>
  <li>আসন্ন স্কুল অনুষ্ঠান ও কার্যক্রম</li>
  <li>পরবর্তী ত্রৈমাসিকের ফি পরিশোধ সময়সূচি</li>
</ul>
<p>যেকোনো প্রশ্নের জন্য শ্রেণি শিক্ষক বা একাডেমিক অফিসের সাথে যোগাযোগ করুন।</p>`,
    author: 'Vice Principal',
    authorBn: 'উপাধ্যক্ষ',
    target: 'parents',
    priority: 'medium',
    category: 'Events',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-004',
    title: 'Staff Training — Digital Attendance System',
    titleBn: 'কর্মচারী প্রশিক্ষণ — ডিজিটাল উপস্থিতি সিস্টেম',
    content: `<h2>Digital Attendance System — Training Workshop</h2>
<p>A <strong>mandatory training workshop</strong> on the new digital attendance system will be held on <strong>Saturday at 2:00 PM</strong> in the Computer Lab.</p>
<h3>What You'll Learn</h3>
<ul>
  <li>How to mark attendance using the new system</li>
  <li>Generating attendance reports</li>
  <li>Handling absent/leave requests</li>
  <li>Troubleshooting common issues</li>
</ul>
<h3>Requirements</h3>
<ol>
  <li>Bring your <strong>laptop</strong> (school laptops available if needed)</li>
  <li>Install the <strong>EduTech Staff App</strong> before the session</li>
  <li>Have your <strong>login credentials</strong> ready</li>
</ol>
<blockquote>All teachers <strong>must attend</strong>. This is not optional. The new system goes live on October 1st.</blockquote>`,
    contentBn: `<h2>ডিজিটাল উপস্থিতি সিস্টেম — প্রশিক্ষণ কর্মশালা</h2>
<p>নতুন ডিজিটাল উপস্থিতি সিস্টেমে একটি <strong>বাধ্যতামূলক প্রশিক্ষণ কর্মশালা</strong> শনিবার বিকাল ২টায় কম্পিউটার ল্যাবে অনুষ্ঠিত হবে।</p>
<h3>যা শিখবেন</h3>
<ul>
  <li>নতুন সিস্টেমে কীভাবে উপস্থিতি নিতে হয়</li>
  <li>উপস্থিতি রিপোর্ট তৈরি করা</li>
  <li>অনুপস্থিত/ছুটির অনুরোধ পরিচালনা</li>
  <li>সাধারণ সমস্যা সমাধান</li>
</ul>
<p>সকল শিক্ষকদের <strong>উপস্থিত হতে হবে</strong>। এটি ঐচ্ছিক নয়। নতুন সিস্টেম ১ অক্টোবর থেকে চালু হবে।</p>`,
    author: 'Admin',
    authorBn: 'অ্যাডমিন',
    target: 'teachers',
    priority: 'medium',
    category: 'General',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-005',
    title: 'Extended Library Hours During Exam Period',
    titleBn: 'পরীক্ষার সময়ে গ্রন্থাগারের সময় বৃদ্ধি',
    content: `<h2>Extended Library Hours</h2>
<p>The school library will remain open until <strong>6:00 PM</strong> during the exam preparation period <strong>(September 1 — 20)</strong>.</p>
<h3>New Hours</h3>
<table>
  <tr><th>Day</th><th>Regular Hours</th><th>Extended Hours</th></tr>
  <tr><td>Sunday — Thursday</td><td>8:00 AM — 4:00 PM</td><td>8:00 AM — 6:00 PM</td></tr>
  <tr><td>Friday</td><td>Closed</td><td>10:00 AM — 2:00 PM</td></tr>
  <tr><td>Saturday</td><td>9:00 AM — 1:00 PM</td><td>9:00 AM — 4:00 PM</td></tr>
</table>
<p>Students are encouraged to make full use of the extended hours for exam preparation. The <strong>reference section</strong> and <strong>digital resources</strong> are also available during extended hours.</p>
<blockquote>Please maintain silence and keep the library clean. Food and drinks are not allowed inside.</blockquote>`,
    contentBn: `<h2>গ্রন্থাগারের সময় বৃদ্ধি</h2>
<p>পরীক্ষার প্রস্তুতি সময়কালে <strong>(১-২০ সেপ্টেম্বর)</strong> স্কুল গ্রন্থাগার বিকাল <strong>৬টা</strong> পর্যন্ত খোলা থাকবে।</p>
<p>পড়াশোনার জন্য এই বর্ধিত সময় ব্যবহার করার জন্য শিক্ষার্থীদের উৎসাহিত করা হচ্ছে।</p>
<p>যেকোনো প্রশ্নের জন্য গ্রন্থপালের সাথে যোগাযোগ করুন।</p>`,
    author: 'Librarian',
    authorBn: 'গ্রন্থপাল',
    target: 'students',
    priority: 'low',
    category: 'Academic',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    expiresAt: '2026-09-20',
  },
  {
    id: 'NOTICE-SEED-006',
    title: 'URGENT: Water Supply Disruption — September 12',
    titleBn: 'জরুরি: জলের সরবরাহ বিঘ্ন — ১২ সেপ্টেম্বর',
    content: `<h2>⚠️ Water Supply Disruption Notice</h2>
<p>Due to emergency maintenance work on the main water pipeline, there will be a <strong>complete disruption of water supply</strong> on <strong>Saturday, September 12, 2026</strong> from 6:00 AM to 6:00 PM.</p>
<h3>Impact</h3>
<ul>
  <li>All <strong>drinking water stations</strong> will be affected</li>
  <li><strong>Toilet facilities</strong> on the ground floor will be limited</li>
  <li>The <strong>canteen</strong> will operate with bottled water only</li>
</ul>
<h3>Precautions</h3>
<ol>
  <li>Students are advised to <strong>bring water bottles</strong> from home</li>
  <li>The school will provide <strong>emergency water supply</strong> in the main hall</li>
  <li>Parent-teacher meetings scheduled for this day will proceed as planned</li>
</ol>
<blockquote>We apologize for the inconvenience. The maintenance team is working to restore normal supply as quickly as possible.</blockquote>`,
    contentBn: `<h2>⚠️ জলের সরবরাহ বিঘ্নের বিজ্ঞপ্তি</h2>
<p>মূল জলপাইপলাইনের জরুরি রক্ষণাবেক্ষণের কাজের কারণে <strong>১২ সেপ্টেম্বর, ২০২৬</strong> শনিবার সকাল ৬টা থেকে বিকাল ৬টা পর্যন্ত <strong>জলের সরবরাহ সম্পূর্ণ বিঘ্নিত</strong> হবে।</p>
<h3>প্রভাব</h3>
<ul>
  <li>সকল <strong>পানীয় জলের স্টেশন</strong> প্রভাবিত হবে</li>
  <li>ভূতলের <strong>পয়ঃপ্রণালী</strong> সীমিত থাকবে</li>
  <li><strong>ক্যান্টিন</strong> শুধুমাত্র বোতলজল দিয়ে চলবে</li>
</ul>
<p>অসুবিধার জন্য আমরা দুঃখিত। রক্ষণাবেক্ষণ দল দ্রুত স্বাভাবিক সরবরাহ ফিরিয়ে আনতে কাজ করছে।</p>`,
    author: 'Admin',
    authorBn: 'অ্যাডমিন',
    target: 'all',
    priority: 'urgent',
    category: 'Emergency',
    pinned: true,
    isActive: true,
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: '2026-09-13',
  },
  {
    id: 'NOTICE-SEED-007',
    title: 'Independence Day Celebration — March 26',
    titleBn: 'স্বাধীনতা দিবস উদযাপন — ২৬ মার্চ',
    content: `<h2>Independence Day Celebration</h2>
<p>The school will celebrate <strong>Independence Day</strong> on <strong>March 26, 2027</strong> with a special program.</p>
<h3>Program Highlights</h3>
<ul>
  <li>Flag hoisting ceremony at 7:00 AM</li>
  <li>Cultural performance by students</li>
  <li>Debate competition on "The Role of Youth in National Development"</li>
  <li>Art exhibition featuring patriotic themes</li>
</ul>
<p>All students are requested to wear <strong>national dress</strong> or <strong>white and green</strong> attire on this day.</p>
<blockquote>This is a national holiday. The school will be closed on March 27, 2027 (Friday) as well.</blockquote>`,
    contentBn: `<h2>স্বাধীনতা দিবস উদযাপন</h2>
<p>স্কুল <strong>২৬ মার্চ, ২০২৭</strong> তারিখে একটি বিশেষ অনুষ্ঠানের মাধ্যমে <strong>স্বাধীনতা দিবস</strong> উদযাপন করবে।</p>
<h3>অনুষ্ঠানের বৈশিষ্ট্য</h3>
<ul>
  <li>সকাল ৭টায় পতাকা উত্তোলন অনুষ্ঠান</li>
  <li>শিক্ষার্থীদের সাংস্কৃতিক অনুষ্ঠান</li>
  <li>"জাতীয় উন্নয়নে তরুণদের ভূমিকা" বিষয়ে বিতর্ক প্রতিযোগিতা</li>
  <li>জাতীয় প্রেরণামূলক থিমে চিত্রকলা প্রদর্শনী</li>
</ul>
<p>সকল শিক্ষার্থীদের এই দিনে <strong>জাতীয় পোশাক</strong> বা <strong>সাদা ও সবুজ</strong> পোশাক পরার অনুরোধ করা হচ্ছে।</p>
<p>এটি একটি জাতীয় ছুটির দিন। ২৭ মার্চ, ২০২৭ (শুক্রবার) স্কুল বন্ধ থাকবে।</p>`,
    author: 'Cultural Secretary',
    authorBn: 'সাংস্কৃতিক সম্পাদক',
    target: 'all',
    priority: 'medium',
    category: 'Holiday',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 864000000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-008',
    title: 'New Coding Club — Registration Open',
    titleBn: 'নতুন কোডিং ক্লাব — নিবন্ধন খোলা',
    content: `<h2>Join the EduTech Coding Club!</h2>
<p>We're launching a brand new <strong>Coding Club</strong> for students interested in computer science and programming. No prior experience required!</p>
<h3>What We'll Cover</h3>
<ul>
  <li><strong>Python Fundamentals</strong> — Variables, loops, functions</li>
  <li><strong>Web Development</strong> — HTML, CSS, JavaScript basics</li>
  <li><strong>App Development</strong> — Building simple mobile apps</li>
  <li><strong>AI & Machine Learning</strong> — Introduction to concepts</li>
</ul>
<h3>Details</h3>
<table>
  <tr><th>Info</th><th>Details</th></tr>
  <tr><td>Day</td><td>Every Wednesday</td></tr>
  <tr><td>Time</td><td>3:30 PM — 5:00 PM</td></tr>
  <tr><td>Room</td><td>Computer Lab 2</td></tr>
  <tr><td>Coach</td><td>Mr. Tanvir Ahmed</td></tr>
  <tr><td>Capacity</td><td>30 students (first come, first served)</td></tr>
</table>
<blockquote>Registration closes on <strong>September 20, 2026</strong>. Hurry — spots fill up fast!</blockquote>`,
    contentBn: `<h2>এডুটেক কোডিং ক্লাবে যোগ দিন!</h2>
<p>কম্পিউটার বিজ্ঞান ও প্রোগ্রামিংয়ে আগ্রহী শিক্ষার্থীদের জন্য আমরা একটি সম্পূর্ণ নতুন <strong>কোডিং ক্লাব</strong> চালু করছি। আগের অভিজ্ঞতার প্রয়োজন নেই!</p>
<h3>যা শেখানো হবে</h3>
<ul>
  <li><strong>পাইথন মৌলিক</strong> — ভেরিয়েবল, লুপ, ফাংশন</li>
  <li><strong>ওয়েব ডেভেলপমেন্ট</strong> — HTML, CSS, JavaScript</li>
  <li><strong>অ্যাপ ডেভেলপমেন্ট</strong> — সাধারণ মোবাইল অ্যাপ তৈরি</li>
  <li><strong>AI ও মেশিন লার্নিং</strong> — ধারণার ভূমিকা</li>
</ul>
<p>নিবন্ধন <strong>২০ সেপ্টেম্বর, ২০২৬</strong> এর মধ্যে বন্ধ হবে। তাড়া করুন!</p>`,
    author: 'IT Department',
    authorBn: 'আইটি বিভাগ',
    target: 'students',
    priority: 'medium',
    category: 'General',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 1296000000).toISOString(),
    expiresAt: '2026-09-20',
  },
]

interface NoticeState {
  notices: Notice[]
  categories: string[]
  addNotice: (n: Notice) => void
  updateNotice: (id: string, data: Partial<Notice>) => void
  deleteNotice: (id: string) => void
  togglePin: (id: string) => void
  toggleActive: (id: string) => void
  addCategory: (name: string) => void
  removeCategory: (name: string) => void
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      notices: [],
      categories: DEFAULT_CATEGORIES,

      addNotice: (n) => set((state) => ({ notices: [n, ...state.notices] })),
      updateNotice: (id, data) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, ...data } : n)) })),
      deleteNotice: (id) =>
        set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
      togglePin: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),
      toggleActive: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n)) })),

      addCategory: (name) =>
        set((state) => ({
          categories: state.categories.includes(name) ? state.categories : [...state.categories, name],
        })),
      removeCategory: (name) =>
        set((state) => ({
          categories: state.categories.filter((c) => c !== name),
          notices: state.notices.map((n) => (n.category === name ? { ...n, category: 'General' } : n)),
        })),
    }),
    {
      name: 'edutech-notices',
      storage: createNamespacedStorage('edutech-notices'),
      version: 4,
      migrate: (state: any, version: number) => {
        if (version < 2) {
          const updated = (state.notices || []).map((n: Notice) => ({
            ...n,
            category: n.category || 'General',
          }))
          return { ...state, notices: updated, categories: state.categories || DEFAULT_CATEGORIES }
        }
        return state
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.notices.length === 0) {
          state.notices = SEED_NOTICES
        }
      },
    }
  )
)

registerStoreReset(() => {
  useNoticeStore.setState({ notices: [], categories: DEFAULT_CATEGORIES })
})
