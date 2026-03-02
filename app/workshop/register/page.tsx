'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Loader2, Camera, ArrowLeft, AlertCircle } from 'lucide-react';
import { compressImage } from '@/lib/imageCompressor';

// ─── Bilingual label helper ──────────────────────────────────────────────────
function Label({ en, ml, required }: { en: string; ml: string; required?: boolean }) {
  return (
    <label className="block mb-1.5">
      <span className="text-sm font-semibold text-charcoal">{en}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <span className="block text-xs text-gray-500 mt-0.5">{ml}</span>
    </label>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-maroon focus:outline-none text-sm transition-colors bg-white';
const errorClass = 'border-red-400 bg-red-50';

interface RegistrationForm {
  child_name: string;
  age: string;
  gender: string;
  school_name: string;
  class_grade: string;
  interests: string;
  previous_experience: boolean;
  parent_name: string;
  mobile_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  consent_participate: boolean;
  consent_media: boolean | null;
}

const empty: RegistrationForm = {
  child_name: '', age: '', gender: '', school_name: '', class_grade: '',
  interests: '', previous_experience: false, parent_name: '',
  mobile_number: '', whatsapp_number: '', email: '', address: '',
  consent_participate: false, consent_media: null,
};

export default function WorkshopRegisterPage() {
  const [form, setForm] = useState<RegistrationForm>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm | 'photo', string>>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [successRegCode, setSuccessRegCode] = useState<string>('');
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof RegistrationForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.child_name.trim())       e.child_name       = 'Required / ആവശ്യമാണ്';
    if (!form.age || Number(form.age) < 5 || Number(form.age) > 20)
                                        e.age              = 'Enter a valid age (5–20) / 5–20 വയസ്';
    if (!form.gender)                   e.gender           = 'Required / ആവശ്യമാണ്';
    if (!form.school_name.trim())       e.school_name      = 'Required / ആവശ്യമാണ്';
    if (!form.class_grade.trim())       e.class_grade      = 'Required / ആവശ്യമാണ്';
    if (!form.parent_name.trim())       e.parent_name      = 'Required / ആവശ്യമാണ്';
    if (!form.mobile_number.match(/^\+?[0-9]{10,13}$/))
                                        e.mobile_number    = 'Enter a valid mobile number / ശരിയായ നമ്പർ നൽകൂ';
    if (!form.consent_participate)      e.consent_participate = 'Parental consent is required / രക്ഷിതാവിന്റെ സമ്മതം ആവശ്യമാണ്';
    if (form.consent_media === null)       e.consent_media       = 'Please select Yes or No / ദയവായി തിരഞ്ഞെടുക്കൂ';
    if (!photoFile)                       e.photo               = 'Photo is required / ഫോട്ടോ നിർബന്ധമാണ്';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Please select an image file / ഒരു ഇമേജ് ഫയൽ തിരഞ്ഞെടുക്കൂ' }));
      return;
    }
    // Allow up to 20 MB — files over 5 MB will be auto-compressed before upload
    if (file.size > 20 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Image must be under 20 MB / 20 MB-ൽ കുറഞ്ഞ ഫയൽ തിരഞ്ഞെടുക്കൂ' }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, photo: undefined }));
  };

  // Upload directly to Cloudinary (unsigned preset — no server, no signature)
  const uploadWithProgress = (file: File): Promise<{ url: string; publicId: string }> =>
    new Promise((resolve, reject) => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) { reject(new Error('Cloudinary not configured')); return; }

      const fd = new globalThis.FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'gramakam-workshop');

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      });
      xhr.addEventListener('load', () => {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ url: parsed.secure_url as string, publicId: parsed.public_id as string });
        } else {
          const errObj = parsed.error as Record<string, unknown> | undefined;
          reject(new Error((errObj?.message as string) ?? `Upload failed (HTTP ${xhr.status})`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error — check your connection')));
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.send(fd);
    });

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    try {
      let photoUrl: string | null = null;
      let photoPublicId: string | null = null;

      // Step 1: Upload photo if provided
      // Only compress if the file exceeds 5 MB — otherwise keep original quality
      if (photoFile) {
        setUploading(true);
        setUploadProgress(0);
        const FOUR_MB = 4 * 1024 * 1024;
        const fileToUpload = photoFile.size > FOUR_MB
          ? await compressImage(photoFile, { maxWidth: 1920, maxHeight: 1920, quality: 0.88, maxSizeMB: 3.5 })
          : photoFile;
        const uploadData = await uploadWithProgress(fileToUpload);
        setUploading(false);
        photoUrl = uploadData.url;
        photoPublicId = uploadData.publicId;
      }

      // Step 2: Submit registration
      const res = await fetch('/api/workshop/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age), photo_url: photoUrl, photo_public_id: photoPublicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');

      setSuccessId(data.id);
      setSuccessRegCode(data.regCode ?? '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (successId) {
    return (
      <div className="min-h-screen bg-cream/30 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Registration Successful!
          </h2>
          <p className="text-gray-500 text-sm mb-1">രജിസ്ട്രേഷൻ വിജയകരമായി പൂർത്തിയായി!</p>
          <p className="text-gray-600 mt-4 leading-relaxed text-sm">
            Thank you for registering for the Gramakam Children&apos;s Acting Workshop 2026.
            We will contact you on the provided mobile number with further details.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            ഗ്രാമകം കുട്ടികളുടെ ആക്ടിംഗ് വർക്ക്‌ഷോപ്പ് 2026-ൽ രജിസ്റ്റർ ചെയ്തതിന് നന്ദി.
            കൂടുതൽ വിവരങ്ങൾക്കായി ഞങ്ങൾ നിങ്ങളുടെ മൊബൈൽ നമ്പറിൽ ബന്ധപ്പെടും.
          </p>
          {successRegCode && (
            <div className="mt-5 bg-maroon/5 border-2 border-maroon/20 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-1">Your Registration Number</p>
              <p className="text-3xl font-bold text-maroon tracking-widest" style={{ fontFamily: 'var(--font-heading)' }}>{successRegCode}</p>
              <p className="text-xs text-gray-400 mt-1">Save this number for your reference / ദയവായി ഈ നമ്പർ സൂക്ഷിക്കൂ</p>
            </div>
          )}
          <div className="mt-3 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-300 mb-0.5">Reference ID</p>
            <p className="font-mono text-xs text-gray-400 break-all">{successId}</p>
          </div>
          <Link
            href="/workshop"
            className="inline-flex items-center gap-2 mt-6 text-maroon font-semibold text-sm hover:underline"
          >
            <ArrowLeft size={14} /> Back to Workshop Page
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-cream/20 min-h-screen">
      {/* Header */}
      <div className="bg-maroon text-white py-12 px-4">
        <div className="container-custom max-w-2xl">
          <Link href="/workshop" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={14} /> Back to Workshop
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Children&apos;s Acting Workshop Registration
          </h1>
          <p className="text-white/70 mt-1 text-sm">വർക്ക്‌ഷോപ്പ് രജിസ്ട്രേഷൻ</p>
          <p className="text-white/60 text-xs mt-3">
            Fields marked <span className="text-red-300">*</span> are required &nbsp;|&nbsp; <span className="text-white/40">* അടയാളമുള്ള ഫീൽഡുകൾ നിർബന്ധമാണ്</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="container-custom max-w-2xl py-8 px-4 space-y-6">

          {/* Submit error */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm">{submitError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Section 1: Child's Details ──────────────────────────────── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              1. Child&apos;s Details
            </h2>
            <p className="text-sm text-maroon mb-5">കുട്ടിയുടെ വിവരങ്ങൾ</p>

            {/* Child name */}
            <div className="mb-4">
              <Label en="Child's Full Name" ml="കുട്ടിയുടെ മുഴുവൻ പേര്" required />
              <input
                type="text"
                value={form.child_name}
                onChange={e => set('child_name', e.target.value)}
                className={`${inputClass} ${errors.child_name ? errorClass : ''}`}
                placeholder="Full name as in school records"
              />
              {errors.child_name && <p className="text-xs text-red-500 mt-1">{errors.child_name}</p>}
            </div>

            {/* Age + Gender row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label en="Age" ml="വയസ്" required />
                <input
                  type="number"
                  min={5} max={20}
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                  className={`${inputClass} ${errors.age ? errorClass : ''}`}
                  placeholder="8"
                />
                {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
              </div>
              <div>
                <Label en="Gender" ml="ലിംഗം" required />
                <select
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                  className={`${inputClass} ${errors.gender ? errorClass : ''}`}
                >
                  <option value="">Select / തിരഞ്ഞെടുക്കൂ</option>
                  <option value="Male">Male / ആൺ</option>
                  <option value="Female">Female / പെൺ</option>
                  <option value="Other">Other / മറ്റ്</option>
                </select>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>
            </div>

            {/* School + Class row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label en="School Name" ml="സ്കൂളിന്റെ പേര്" required />
                <input
                  type="text"
                  value={form.school_name}
                  onChange={e => set('school_name', e.target.value)}
                  className={`${inputClass} ${errors.school_name ? errorClass : ''}`}
                  placeholder="School name"
                />
                {errors.school_name && <p className="text-xs text-red-500 mt-1">{errors.school_name}</p>}
              </div>
              <div>
                <Label en="Class / Grade" ml="ക്ലാസ്" required />
                <input
                  type="text"
                  value={form.class_grade}
                  onChange={e => set('class_grade', e.target.value)}
                  className={`${inputClass} ${errors.class_grade ? errorClass : ''}`}
                  placeholder="e.g. 5th Standard"
                />
                {errors.class_grade && <p className="text-xs text-red-500 mt-1">{errors.class_grade}</p>}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-4">
              <Label en="Interests (Art, Dance, Sports, etc.)" ml="താൽപര്യങ്ങൾ (ചിത്രരചന, നൃത്തം, കായികം തുടങ്ങിയവ)" />
              <input
                type="text"
                value={form.interests}
                onChange={e => set('interests', e.target.value)}
                className={inputClass}
                placeholder="e.g. Drawing, Dance, Football"
              />
            </div>

            {/* Previous experience */}
            <div>
              <Label en="Previous Experience in Similar Workshops" ml="മുമ്പ് സമാന വർക്ക്‌ഷോപ്പുകളിൽ പങ്കെടുത്തിട്ടുണ്ടോ" />
              <div className="flex gap-6 mt-1">
                {[{ val: true, en: 'Yes', ml: 'ഉണ്ട്' }, { val: false, en: 'No', ml: 'ഇല്ല' }].map(o => (
                  <label key={String(o.val)} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prev_exp"
                      checked={form.previous_experience === o.val}
                      onChange={() => set('previous_experience', o.val)}
                      className="w-4 h-4 accent-maroon"
                    />
                    <span className="text-sm text-charcoal">{o.en} / <span className="text-gray-500">{o.ml}</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section 2: Parent / Guardian Details ─────────────────────── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              2. Parent / Guardian Details
            </h2>
            <p className="text-sm text-maroon mb-5">മാതാപിതാവ് / രക്ഷിതാവിന്റെ വിവരങ്ങൾ</p>

            {/* Parent name */}
            <div className="mb-4">
              <Label en="Parent / Guardian Name" ml="മാതാപിതാവ് / രക്ഷിതാവിന്റെ പേര്" required />
              <input
                type="text"
                value={form.parent_name}
                onChange={e => set('parent_name', e.target.value)}
                className={`${inputClass} ${errors.parent_name ? errorClass : ''}`}
                placeholder="Full name"
              />
              {errors.parent_name && <p className="text-xs text-red-500 mt-1">{errors.parent_name}</p>}
            </div>

            {/* Mobile + WhatsApp row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label en="Mobile Number" ml="മൊബൈൽ നമ്പർ" required />
                <input
                  type="tel"
                  value={form.mobile_number}
                  onChange={e => set('mobile_number', e.target.value)}
                  className={`${inputClass} ${errors.mobile_number ? errorClass : ''}`}
                  placeholder="+91 9876543210"
                />
                {errors.mobile_number && <p className="text-xs text-red-500 mt-1">{errors.mobile_number}</p>}
              </div>
              <div>
                <Label en="WhatsApp Number" ml="വാട്സ്ആപ്പ് നമ്പർ" />
                <input
                  type="tel"
                  value={form.whatsapp_number}
                  onChange={e => set('whatsapp_number', e.target.value)}
                  className={inputClass}
                  placeholder="If different from mobile"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <Label en="Email Address" ml="ഇമെയിൽ വിലാസം" />
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>

            {/* Address */}
            <div>
              <Label en="Residential Address" ml="താമസ വിലാസം" />
              <textarea
                rows={3}
                value={form.address}
                onChange={e => set('address', e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="House name, Street, Place, District"
              />
            </div>
          </div>

          {/* ── Section 3: Photo Upload ───────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              3. Child&apos;s Photo <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-maroon mb-4">കുട്ടിയുടെ ഫോട്ടോ</p>
            <p className="text-xs text-gray-400 mb-4">A full size photo preferred.</p>

            {photoPreview ? (
              <div className="flex items-end gap-3">
                <div className="relative w-32 h-40 rounded-2xl overflow-hidden border-2 border-maroon/20 shrink-0">
                  <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center gap-2 w-full border-2 border-dashed rounded-2xl py-8 transition-colors ${errors.photo ? 'border-red-300 text-red-400 hover:border-red-400' : 'border-gray-200 text-gray-400 hover:border-maroon hover:text-maroon'}`}
              >
                <Camera size={28} />
                <span className="text-sm font-medium">Click to upload photo</span>
                <span className="text-xs">ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക</span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
            {errors.photo && <p className="text-xs text-red-500 mt-2">{errors.photo}</p>}
          </div>

          {/* ── Section 4: Consent ───────────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-charcoal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              4. Consent &amp; Declaration
            </h2>
            <p className="text-sm text-maroon mb-5">സമ്മതപ്രഖ്യാപനം</p>

            {/* Consent to participate */}
            <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors mb-4 ${form.consent_participate ? 'border-green-300 bg-green-50' : errors.consent_participate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-maroon/40'}`}>
              <input
                type="checkbox"
                checked={form.consent_participate}
                onChange={e => set('consent_participate', e.target.checked)}
                className="w-4 h-4 accent-maroon mt-0.5 shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  I give permission for my child to participate in the workshop. <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  എന്റെ കുട്ടിക്ക് ഈ വർക്ക്‌ഷോപ്പിൽ പങ്കെടുക്കുന്നതിനായി ഞാൻ സമ്മതം നൽകുന്നു.
                </p>
              </div>
            </label>
            {errors.consent_participate && <p className="text-xs text-red-500 -mt-2 mb-4 ml-1">{errors.consent_participate}</p>}

            {/* Consent for media — mandatory yes/no */}
            <div className={`p-4 rounded-2xl border transition-colors ${errors.consent_media ? 'border-red-300 bg-red-50' : form.consent_media === null ? 'border-gray-200' : 'border-blue-200 bg-blue-50/40'}`}>
              <p className="text-sm font-semibold text-charcoal mb-0.5">
                Permission for photos / videos to be taken during the workshop. <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mb-3">
                വർക്ക്‌ഷോപ്പിനിടെ ഫോട്ടോ / വീഡിയോ എടുക്കുന്നതിനുള്ള അനുമതി.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => set('consent_media', true)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    form.consent_media === true
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  ✓ Yes / അനുവദിക്കുന്നു
                </button>
                <button
                  type="button"
                  onClick={() => set('consent_media', false)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    form.consent_media === false
                      ? 'border-gray-500 bg-gray-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  ✗ No / അനുവദിക്കുന്നില്ല
                </button>
              </div>
            </div>
            {errors.consent_media && <p className="text-xs text-red-500 mt-2 ml-1">{errors.consent_media}</p>}
          </div>

          {/* ── Upload progress bar ──────────────────────────────────── */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-charcoal flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-maroon" />
                    {uploadProgress < 100 ? 'Uploading photo...' : 'Processing photo...'}
                  </p>
                  <span className="text-sm font-bold text-maroon">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-maroon rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുന്നു... {uploadProgress}%</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-maroon hover:bg-maroon-dark text-white font-bold rounded-2xl text-base transition-all duration-300 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-maroon/20"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploading ? `Uploading photo... ${uploadProgress}%` : 'Submitting... / സമർപ്പിക്കുന്നു...'}
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit Registration / രജിസ്ട്രേഷൻ സമർപ്പിക്കൂ
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            By submitting, you agree to our use of your details for workshop coordination only.
            <br />
            <span>സമർപ്പിക്കുന്നതിലൂടെ, വർക്ക്‌ഷോപ്പ് ആസൂത്രണത്തിനു മാത്രം നിങ്ങളുടെ വിവരങ്ങൾ ഉപയോഗിക്കുന്നതിന് സമ്മതിക്കുന്നു.</span>
          </p>
        </div>
      </form>
    </div>
  );
}
