import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Network,
  Cloud,
  UserCheck,
  Usb,
  Copy,
  Check,
  Laptop,
  CheckCircle2,
} from 'lucide-react'

interface DeviceConnectionGuideModalProps {
  isBn: boolean
  onClose: () => void
}

export function DeviceConnectionGuideModal({ isBn, onClose }: DeviceConnectionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'lan' | 'cloud' | 'enroll' | 'usb'>('lan')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://edutech.app'
  const pushUrl = `${serverOrigin}/api/attendance/push`
  const schoolSlug = typeof window !== 'undefined'
    ? (sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug') || 'SCH-2026')
    : 'SCH-2026'

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(id)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED18] border border-[#7C3AED30] flex items-center justify-center text-[#7C3AED]">
              <Network size={16} />
            </div>
            <div>
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'বায়োমেট্রিক ও পাঞ্চ মেশিন কানেকশন গাইড' : 'Biometric & Punch Device Connection Guide'}
              </h3>
              <p className="text-[0.625rem] text-[var(--text-muted)]">
                {isBn
                  ? 'ZKTeco, Hikvision, Realtime ও যেকোনো পাঞ্চ মেশিন কানেক্ট ও ব্যবহার করার পূর্ণাঙ্গ নির্দেশিকা'
                  : 'Complete instructions to connect and sync ZKTeco, Hikvision, Realtime & other attendance machines'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-lg mb-4 text-[0.6875rem] font-medium overflow-x-auto">
          {[
            { id: 'lan' as const, label: isBn ? '১. লোকাল নেটওয়ার্ক (LAN/WiFi)' : '1. Local LAN / Wi-Fi', icon: Laptop },
            { id: 'cloud' as const, label: isBn ? '২. ক্লাউড পুশ (ADMS / WDMS)' : '2. Cloud Push (ADMS)', icon: Cloud },
            { id: 'enroll' as const, label: isBn ? '৩. শিক্ষার্থী ও স্টাফ নিবন্ধন' : '3. Member Registration', icon: UserCheck },
            { id: 'usb' as const, label: isBn ? '৪. ইউএসবি অফলাইন মোড' : '4. USB Offline Sync', icon: Usb },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer border-none transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#7C3AED] text-white font-semibold shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LAN / Local Network */}
        {activeTab === 'lan' && (
          <div className="space-y-3.5 text-[0.75rem] text-[var(--text-secondary)]">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <Network size={14} className="text-[#7C3AED]" />
                {isBn ? 'কেবলের মাধ্যমে লোকাল নেটওয়ার্কে কানেক্ট করার নিয়ম' : 'Connecting via Local Ethernet (RJ45) or Wi-Fi'}
              </h4>
              <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
                {isBn
                  ? 'প্রতিষ্ঠান এর রাউটার বা সুইচে ইথারনেট কেবলের মাধ্যমে মেশিনটি যুক্ত করুন, অথবা মেশিনের ওয়াইফাই মেনু থেকে প্রতিষ্ঠানের ওয়াইফাই এর সাথে যুক্ত করুন।'
                  : 'Connect an RJ45 Ethernet cable from your router/switch to the machine, or connect the machine directly to your institution Wi-Fi.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">১</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'মেশিনে স্ট্যাটিক IP অ্যাড্রেস সেট করুন' : 'Assign a Static IP on the Machine'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'মেশিনের কীবোর্ডে Menu প্রেস করে Comm. (Communication) ➜ Network ➜ Ethernet-এ যান। DHCP বন্ধ (Off) করুন এবং নিচের মতো একটি IP বসান:'
                      : 'Press Menu on the machine ➜ Comm. (Communication) ➜ Network ➜ Ethernet. Turn DHCP OFF and set a dedicated IP:'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-[0.6875rem]">
                    <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div className="text-[0.5625rem] text-[var(--text-muted)] font-sans">IP Address</div>
                      <div className="font-bold text-[var(--text-primary)]">192.168.1.201</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div className="text-[0.5625rem] text-[var(--text-muted)] font-sans">Subnet Mask</div>
                      <div className="font-bold text-[var(--text-primary)]">255.255.255.0</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div className="text-[0.5625rem] text-[var(--text-muted)] font-sans">Gateway</div>
                      <div className="font-bold text-[var(--text-primary)]">192.168.1.1</div>
                    </div>
                    <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div className="text-[0.5625rem] text-[var(--text-muted)] font-sans">Port</div>
                      <div className="font-bold text-[var(--text-primary)]">4370 (ZKTeco)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">২</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'সফ্টওয়্যারে ডিভাইসটি যোগ করুন' : 'Add Device in Software'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'উপরের "ডিভাইস যোগ" (Add Device) বাটনে ক্লিক করে মেশিনের নাম, মডেল, ও উপরে সেট করা IP টি দিন। এরপর "সংযোগ পরীক্ষা ও সিঙ্ক" (Refresh আইকন) ক্লিক করুন।'
                      : 'Click "Add Device" above, input the device name, model, and the IP set above. Then click the "Test Connection & Sync" icon in the table.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Cloud Push / ADMS */}
        {activeTab === 'cloud' && (
          <div className="space-y-3.5 text-[0.75rem] text-[var(--text-secondary)]">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <Cloud size={14} className="text-[#7C3AED]" />
                {isBn ? 'ক্লাউড পুশ (ADMS / WDMS) মোড — কোনো রিয়েল আইপি ছাড়াই অটো সিঙ্ক' : 'Cloud Push (ADMS / WDMS) Mode — Real-time automatic sync'}
              </h4>
              <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
                {isBn
                  ? 'মেশিন যদি ইন্টারনেটের সাথে যুক্ত থাকে, তাহলে পাঞ্চ করার সাথে সাথে সরাসরি এই ওয়েব সফটওয়্যারে হাজিরা রেকর্ড হয়ে যাবে। আপনার রাউটারে কোনো পোর্ট ফরোয়ার্ডিং বা স্ট্যাটিক রিয়েল আইপির প্রয়োজন নেই!'
                  : 'When the device is connected to internet, punches are pushed instantly to this web application. No router port forwarding or public static IP is required!'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">১</span>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'মেশিনে Cloud Server / ADMS অন করুন' : 'Enable Cloud Server / ADMS on Machine'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'মেশিনে Menu ➜ Comm. ➜ Cloud Server Setting / ADMS-এ যান। "Enable Cloud Server" অন (ON) করুন।'
                      : 'Go to Menu ➜ Comm. ➜ Cloud Server Setting / ADMS. Turn "Enable Cloud Server" ON.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">২</span>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'সার্ভার অ্যাড্রেস ও পুশ ওয়েবহুক বসান' : 'Enter Server Address & Push URL'}
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">Server Push Webhook URL</div>
                        <div className="font-mono text-[0.6875rem] font-bold text-[#7C3AED]">{pushUrl}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(pushUrl, 'url')}
                        className="px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.625rem] flex items-center gap-1 cursor-pointer hover:bg-[var(--border)]"
                      >
                        {copiedField === 'url' ? <Check size={11} className="text-[var(--green)]" /> : <Copy size={11} />}
                        {copiedField === 'url' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                      <div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">Institution Token / Code</div>
                        <div className="font-mono text-[0.6875rem] font-bold text-[var(--text-primary)]">{schoolSlug}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(schoolSlug, 'token')}
                        className="px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.625rem] flex items-center gap-1 cursor-pointer hover:bg-[var(--border)]"
                      >
                        {copiedField === 'token' ? <Check size={11} className="text-[var(--green)]" /> : <Copy size={11} />}
                        {copiedField === 'token' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Member Registration */}
        {activeTab === 'enroll' && (
          <div className="space-y-3.5 text-[0.75rem] text-[var(--text-secondary)]">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#7C3AED]" />
                {isBn ? 'মেশিনে শিক্ষার্থী ও শিক্ষকদের ফিঙ্গারপ্রিন্ট, ফেস ও কার্ড নিবন্ধন' : 'Enrolling Staff and Students into the Attendance Device'}
              </h4>
              <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
                {isBn
                  ? 'সফটওয়্যারের সাথে মেশিনের সংযোগ নিশ্চিত হলে প্রতিটি শিক্ষার্থী ও স্টাফকে ডিভাইসে রেজিস্টার করতে হবে যাতে পাঞ্চ করলে নাম ও রোল শনাক্ত হতে পারে।'
                  : 'Once connected, enroll students and teachers so that punch logs automatically map to their attendance records.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">১</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'সফটওয়্যার থেকে সদস্য যোগ (Enroll Members)' : 'Register Members from Software'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'ডিভাইস টেবিল থেকে কাঙ্ক্ষিত ডিভাইসের সারিতে "সদস্য নিবন্ধন" (User Plus আইকন) বাটনে ক্লিক করুন। ক্লাস বা ডিপার্টমেন্ট বেছে নিয়ে "সবাইকে নির্বাচন করুন" দিয়ে এক ক্লিকেই ডিভাইসে যুক্ত করুন।'
                      : 'Click the "Register Members" button on the device row. Filter students by Class/Section or staff by Department, and click "Enroll Selected" to assign Device User IDs/PINs in bulk.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">২</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'মেশিনে বায়োমেট্রিক স্ক্যান (আঙুল বা ফেস স্ক্যান)' : 'Record Biometric on the Physical Machine'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'মেশিনে Menu ➜ User Mgt. ➜ Edit/New User-এ যান। সফটওয়্যারে দেখানো সংশ্লিষ্ট ব্যক্তির Device PIN (যেমন: 1001, 1002) দিন। এরপর ব্যক্তির আঙুল ৩ বার প্রেস করুন অথবা ক্যামেরার সামনে ফেস স্ক্যান করান।'
                      : 'On the physical device, go to Menu ➜ User Mgt. ➜ Edit/New User. Enter the assigned Device PIN (e.g. 1001), then have the person scan their fingerprint 3 times or look into the face camera.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">৩</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'টেস্ট পাঞ্চ দিয়ে যাচাই' : 'Verify with Instant Test Punch'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'সদস্য তালিকা থেকে "টেস্ট পাঞ্চ" (Zap আইকন) ক্লিক করুন। সাথে সাথে আজকের হাজিরায় "Present" মার্ক হয়ে যাবে!'
                      : 'Click the "Test Punch" icon next to any registered member to verify that attendance is immediately marked in real-time.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USB Offline Mode */}
        {activeTab === 'usb' && (
          <div className="space-y-3.5 text-[0.75rem] text-[var(--text-secondary)]">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                <Usb size={14} className="text-[#7C3AED]" />
                {isBn ? 'ইউএসবি পেনড্রাইভ দিয়ে অফলাইন হাজিরা ও ইউজার সিঙ্ক' : 'USB Flash Drive Offline Attendance & User Sync'}
              </h4>
              <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
                {isBn
                  ? 'গেট বা ক্যাম্পাসে ইন্টারনেট বা লোকাল কেবল না থাকলেও পেনড্রাইভের মাধ্যমে সম্পূর্ণ হাজিরা ও শিক্ষার্থী তালিকা আদান-প্রদান করা সম্ভব।'
                  : 'Even if the gate has no network cable or Wi-Fi, you can import punches and load student lists using a standard USB pen drive.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">১</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'শিক্ষার্থী তালিকা মেশিনে লোড করা (User Export)' : 'Exporting Students into the Machine'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'সদস্য নিবন্ধন উইন্ডোতে "Export User File (USB)" ক্লিক করে CSV/DAT ফাইলটি পেনড্রাইভে নিন। পেনড্রাইভ মেশিনে লাগিয়ে Menu ➜ USB Manager ➜ Upload User Data দিন।'
                      : 'From the Member Registration window, click "Export User List (CSV)" to download the formatted user file onto your USB drive. Plug into machine and choose USB Manager ➜ Upload User Data.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#7C3AED18] text-[#7C3AED] font-bold text-[0.6875rem] flex items-center justify-center shrink-0 mt-0.5">২</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {isBn ? 'হাজিরা পেনড্রাইভে ডাউনলোড ও সফটওয়্যারে আপলোড' : 'Download Punch Logs & Import into Software'}
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn
                      ? 'মেশিনে পেনড্রাইভ লাগিয়ে Menu ➜ USB Manager ➜ Download ➜ Attendance Data দিন (এটি attlog.dat ফাইল সেভ করবে)। এরপর সফটওয়্যারে "Import USB Punch Log" বাটনে ফাইলটি আপলোড করলেই সবার হাজিরা রেকর্ড হয়ে যাবে!'
                      : 'On the machine, plug USB drive and select USB Manager ➜ Download ➜ Attendance Data (generates attlog.dat). Then click "Import USB Punch Log" in this software to immediately process all punches.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--green)]">
            <CheckCircle2 size={13} />
            <span>{isBn ? 'সিস্টেম প্রস্তুত ও সক্রিয়' : 'Hardware integration ready'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-[0.75rem] font-semibold cursor-pointer hover:opacity-90 transition-opacity border-0"
          >
            {isBn ? 'বুঝেছি, বন্ধ করুন' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
