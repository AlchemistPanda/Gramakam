'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Search, Download, RefreshCw, Users, CheckCircle2,
  Camera, LogOut, ChevronUp, ChevronDown, ArrowLeft, Loader2,
  AlertCircle, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Registration {
  id: string;
  reg_number: number | null;
  child_name: string;
  age: number;
  gender: string;
  school_name: string;
  class_grade: string;
  interests: string | null;
  previous_experience: boolean;
  parent_name: string;
  mobile_number: string;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  consent_participate: boolean;
  consent_media: boolean;
  photo_url: string | null;
  photo_public_id: string | null;
  submitted_at: string;
}

const PASSCODE = '9090';

type SortKey = keyof Registration;
type SortDir = 'asc' | 'desc';

// ─── Passcode gate ────────────────────────────────────────────────────────────
function PasscodeGate({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {};

  const attempt = () => {
    if (value === PASSCODE) {
      onSuccess();
    } else {
      setError('Incorrect passcode');
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <motion.div
        animate={shakeAnim}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-maroon" />
        </div>
        <h1 className="text-xl font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Workshop Admin
        </h1>
        <p className="text-sm text-gray-500 mb-6">Enter passcode to continue</p>

        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          maxLength={10}
          className="w-full text-center text-2xl tracking-[0.5em] border-2 border-gray-200 rounded-xl py-3 focus:border-maroon focus:outline-none mb-3"
          placeholder="••••"
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={attempt}
          className="w-full py-3 bg-maroon text-white rounded-xl font-semibold text-sm hover:bg-maroon-dark transition-colors"
        >
          Unlock
        </button>
        <Link href="/workshop" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-maroon mt-4 transition-colors">
          <ArrowLeft size={12} /> Back to Workshop
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Photo thumbnail ──────────────────────────────────────────────────────────
function PhotoCell({ url, name }: { url: string | null; name: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return <span className="text-gray-300 text-xs">—</span>;

  // Insert fl_attachment flag into Cloudinary URL to force download
  const downloadUrl = url.includes('/upload/')
    ? url.replace('/upload/', '/upload/fl_attachment/')
    : url;

  return (
    <>
      <button onClick={() => setOpen(true)} className="group relative w-10 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-maroon transition-colors">
        <Image src={url} alt="Photo" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-sm w-full cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setOpen(false)} className="absolute -top-3 -right-3 bg-white rounded-full p-1 z-10 shadow">
                <X size={16} />
              </button>
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
                <Image src={url} alt="Full photo" fill className="object-cover" unoptimized />
              </div>
              <a
                href={downloadUrl}
                download={`${name.replace(/\s+/g, '_')}_photo.jpg`}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-charcoal text-sm font-semibold hover:bg-cream transition-colors shadow"
              >
                <Download size={14} /> Download Photo
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Export to CSV ────────────────────────────────────────────────────────────
function exportCSV(data: Registration[]) {
  const headers = [
    'Reg #', 'ID', 'Submitted At', 'Child Name', 'Age', 'Gender', 'School', 'Class/Grade',
    'Interests', 'Previous Experience', 'Parent Name', 'Mobile', 'WhatsApp',
    'Email', 'Address', 'Consent Participate', 'Consent Media', 'Photo URL',
  ];
  const rows = data.map(r => [
    r.reg_number != null ? `GRK-${String(r.reg_number).padStart(4, '0')}` : '',
    r.id,
    new Date(r.submitted_at).toLocaleString('en-IN'),
    r.child_name, r.age, r.gender, r.school_name, r.class_grade,
    r.interests ?? '', r.previous_experience ? 'Yes' : 'No',
    r.parent_name, r.mobile_number, r.whatsapp_number ?? '',
    r.email ?? '', r.address ?? '',
    r.consent_participate ? 'Yes' : 'No',
    r.consent_media ? 'Yes' : 'No',
    r.photo_url ?? '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `workshop-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ─── Main admin view ──────────────────────────────────────────────────────────
function AdminView({ onLogout }: { onLogout: () => void }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submitted_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterConsent, setFilterConsent] = useState<'all' | 'yes' | 'no'>('all');
  const [filterMedia, setFilterMedia] = useState<'all' | 'yes' | 'no'>('all');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/workshop/registrations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setRegistrations(data.registrations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const schools = useMemo(() => [...new Set(registrations.map(r => r.school_name))].sort(), [registrations]);
  const ages = useMemo(() => [...new Set(registrations.map(r => String(r.age)))].sort((a, b) => Number(a) - Number(b)), [registrations]);
  const classes = useMemo(() => [...new Set(registrations.map(r => r.class_grade))].sort(), [registrations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter(r => {
      const matchSearch = !q || [r.child_name, r.school_name, r.parent_name, r.mobile_number, r.email ?? '']
        .some(v => v.toLowerCase().includes(q));
      const matchConsent = filterConsent === 'all'
        ? true : filterConsent === 'yes' ? r.consent_participate : !r.consent_participate;
      const matchMedia = filterMedia === 'all'
        ? true : filterMedia === 'yes' ? r.consent_media : !r.consent_media;
      const matchSchool = !filterSchool || r.school_name === filterSchool;
      const matchAge = !filterAge || String(r.age) === filterAge;
      const matchClass = !filterClass || r.class_grade === filterClass;
      return matchSearch && matchConsent && matchMedia && matchSchool && matchAge && matchClass;
    }).sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [registrations, search, sortKey, sortDir, filterConsent, filterMedia, filterSchool, filterAge, filterClass]);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : null;

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 cursor-pointer hover:text-charcoal whitespace-nowrap select-none"
    >
      <span className="inline-flex items-center gap-1">{label}<SortIcon k={k} /></span>
    </th>
  );

  const mediaCount = registrations.filter(r => r.consent_media).length;
  const hasPhoto = registrations.filter(r => r.photo_url).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-charcoal text-white px-4 py-5 sticky top-0 z-30 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-maroon rounded-lg flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Workshop Registrations
              </h1>
              <p className="text-white/40 text-xs">Gramakam 2026 · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium disabled:opacity-40"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/40 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Users size={18} className="text-maroon" />, label: 'Total', value: registrations.length },
            { icon: <CheckCircle2 size={18} className="text-green-600" />, label: 'Consent Given', value: registrations.filter(r => r.consent_participate).length },
            { icon: <Camera size={18} className="text-blue-500" />, label: 'Media OK', value: mediaCount },
            { icon: <Camera size={18} className="text-purple-500" />, label: 'With Photo', value: hasPhoto },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-charcoal leading-none">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, school, mobile..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-maroon focus:outline-none bg-white"
            />
          </div>
          <select
            value={filterConsent}
            onChange={e => setFilterConsent(e.target.value as 'all' | 'yes' | 'no')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-maroon focus:outline-none text-gray-600"
          >
            <option value="all">All Consent</option>
            <option value="yes">Consent: Yes</option>
            <option value="no">Consent: No</option>
          </select>
          <select
            value={filterMedia}
            onChange={e => setFilterMedia(e.target.value as 'all' | 'yes' | 'no')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-maroon focus:outline-none text-gray-600"
          >
            <option value="all">All Media</option>
            <option value="yes">Media OK: Yes</option>
            <option value="no">Media OK: No</option>
          </select>
          <select
            value={filterSchool}
            onChange={e => setFilterSchool(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-maroon focus:outline-none text-gray-600 max-w-[160px] truncate"
          >
            <option value="">All Schools</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterAge}
            onChange={e => setFilterAge(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-maroon focus:outline-none text-gray-600"
          >
            <option value="">All Ages</option>
            {ages.map(a => <option key={a} value={a}>Age {a}</option>)}
          </select>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-maroon focus:outline-none text-gray-600"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || filterConsent !== 'all' || filterMedia !== 'all' || filterSchool || filterAge || filterClass) && (
            <button
              onClick={() => { setSearch(''); setFilterConsent('all'); setFilterMedia('all'); setFilterSchool(''); setFilterAge(''); setFilterClass(''); }}
              className="text-xs text-gray-400 hover:text-maroon transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {registrations.length}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle size={16} />
            <p className="text-sm">{error}</p>
            <button onClick={load} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading registrations...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{registrations.length === 0 ? 'No registrations yet.' : 'No results match your filters.'}</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/60">
                  <tr>
                    <th className="w-10 py-3 px-3 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 whitespace-nowrap">Reg #</th>
                    <th className="w-12 py-3 px-2 text-xs font-semibold text-gray-500">Photo</th>
                    <Th k="child_name" label="Child Name" />
                    <Th k="age" label="Age" />
                    <Th k="gender" label="Gender" />
                    <Th k="school_name" label="School" />
                    <Th k="class_grade" label="Class" />
                    <Th k="parent_name" label="Parent" />
                    <Th k="mobile_number" label="Mobile" />
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 whitespace-nowrap">Consent</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 whitespace-nowrap">Media</th>
                    <Th k="submitted_at" label="Submitted" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="border-b border-gray-50 hover:bg-cream/20 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-3 px-3 font-mono text-xs text-maroon font-semibold whitespace-nowrap">
                          {r.reg_number != null ? `GRK-${String(r.reg_number).padStart(4, '0')}` : '—'}
                        </td>
                        <td className="py-3 px-2"><PhotoCell url={r.photo_url} name={r.child_name} /></td>
                        <td className="py-3 px-3 font-semibold text-charcoal whitespace-nowrap">{r.child_name}</td>
                        <td className="py-3 px-3 text-gray-600">{r.age}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs">{r.gender}</td>
                        <td className="py-3 px-3 text-gray-600 max-w-[140px] truncate">{r.school_name}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs">{r.class_grade}</td>
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{r.parent_name}</td>
                        <td className="py-3 px-3">
                          <a href={`tel:${r.mobile_number}`} onClick={e => e.stopPropagation()} className="text-maroon hover:underline text-xs">{r.mobile_number}</a>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.consent_participate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {r.consent_participate ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.consent_media ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.consent_media ? '✓ Yes' : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(r.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          <br />
                          <span className="text-gray-300">
                            {new Date(r.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                      {/* Expanded row */}
                      <AnimatePresence>
                        {expandedId === r.id && (
                          <tr key={`${r.id}-expanded`}>
                            <td colSpan={12} className="bg-cream/30 border-b border-amber-100">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                                  {r.interests && (
                                    <div><span className="text-gray-400 text-xs block">Interests</span><span className="text-charcoal">{r.interests}</span></div>
                                  )}
                                  <div><span className="text-gray-400 text-xs block">Prev. Experience</span><span className="text-charcoal">{r.previous_experience ? 'Yes' : 'No'}</span></div>
                                  {r.whatsapp_number && (
                                    <div><span className="text-gray-400 text-xs block">WhatsApp</span><a href={`https://wa.me/${r.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-maroon hover:underline" onClick={e => e.stopPropagation()}>{r.whatsapp_number}</a></div>
                                  )}
                                  {r.email && (
                                    <div><span className="text-gray-400 text-xs block">Email</span><a href={`mailto:${r.email}`} className="text-maroon hover:underline" onClick={e => e.stopPropagation()}>{r.email}</a></div>
                                  )}
                                  {r.address && (
                                    <div className="col-span-2"><span className="text-gray-400 text-xs block">Address</span><span className="text-charcoal">{r.address}</span></div>
                                  )}
                                  <div className="col-span-2 sm:col-span-4 flex items-center gap-4">
                                    {r.reg_number != null && (
                                      <span className="text-maroon font-bold font-mono text-base">GRK-{String(r.reg_number).padStart(4, '0')}</span>
                                    )}
                                    <span className="text-gray-300 text-xs font-mono">UUID: {r.id}</span>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkshopAdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AdminView onLogout={() => setUnlocked(false)} />
        </motion.div>
      ) : (
        <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PasscodeGate onSuccess={() => setUnlocked(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
