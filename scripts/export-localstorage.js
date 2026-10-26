/**
 * EduTech localStorage backup — run this in the browser console.
 *
 * WHY THIS EXISTS
 * Every EduTech record (students, fees, exams, classes, HR, library, ...) lives
 * in localStorage, namespaced by origin + institution slug + user id. If any of
 * those three change, the app looks "empty" even though the data is still there.
 * This dumps a full, restorable snapshot before anything else is attempted.
 *
 * HOW TO USE
 *   1. Open the EXACT url you used before (e.g. https://localhost:5173).
 *   2. DevTools (F12) -> Console.
 *   3. Paste this whole file and press Enter.
 *   4. A .json file downloads. Repeat in every browser/profile you ever used.
 *
 * The snapshot keys are RAW localStorage keys (no assumption about slug),
 * so a restore can target any namespace.
 */
(() => {
  const snap = {
    _meta: {
      origin: location.origin,
      host: location.host,
      takenAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      slug: sessionStorage.getItem('edutech_inst_slug'),
      userId: sessionStorage.getItem('edutech_user_id'),
    },
    entries: {},
    stats: { keys: 0, edutechKeys: 0, bytes: 0, records: 0 },
  };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k);
    snap.entries[k] = v;
    snap.stats.keys++;
    snap.stats.bytes += k.length + v.length;
    if (k.startsWith('edutech')) snap.stats.edutechKeys++;
    try {
      const parsed = JSON.parse(v);
      if (parsed && parsed.state && typeof parsed.state === 'object') {
        snap.stats.records += Object.values(parsed.state).reduce(
          (a, x) => a + (Array.isArray(x) ? x.length : 0), 0
        );
      }
    } catch { /* not JSON — still backed up verbatim */ }
  }

  console.table({
    origin: location.origin,
    slug: snap._meta.slug,
    userId: snap._meta.userId,
    'total keys': snap.stats.keys,
    'edutech keys': snap.stats.edutechKeys,
    'approx records': snap.stats.records,
    'size (KB)': +(snap.stats.bytes / 1024).toFixed(1),
  });

  const name = `edutech-backup_${location.host}_${(snap._meta.slug || 'no-slug')}_${Date.now()}.json`;
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  console.log(`%cSaved ${name}`, 'color:#22c55e;font-weight:bold');
  if (snap.stats.edutechKeys === 0) {
    console.warn('%cNo edutech keys on THIS origin — try the other url you used.', 'color:#ef4444');
  }
})();
