'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Globe,
  FileText,
  AlertCircle,
  Check,
  Save,
  RotateCcw,
  X
} from 'lucide-react';
import { api } from '@/lib/api';
import { Scheme } from '@/types';

export default function SchemeCmsPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editor Modal / Panel State
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form Fields
  const [formSchemeId, setFormSchemeId] = useState('');
  const [formTitleHindi, setFormTitleHindi] = useState('');
  const [formTitleEnglish, setFormTitleEnglish] = useState('');
  const [formCategory, setFormCategory] = useState<'पेंशन' | 'स्वास्थ्य' | 'आजीविका' | 'शिक्षा' | 'अन्य'>('पेंशन');
  const [formDistricts, setFormDistricts] = useState('ALL');
  const [formOfficialUrl, setFormOfficialUrl] = useState('');
  const [formNoticeText, setFormNoticeText] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formDocuments, setFormDocuments] = useState('');
  const [formSteps, setFormSteps] = useState('');

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.getSchemes({ published: undefined }); // all published and unpublished
      if (res.success) {
        setSchemes(res.data.schemes || []);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        router.push('/login?redirect=/admin/schemes');
      } else {
        setError(err.message || 'योजनाएं लोड नहीं हो सकीं।');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingScheme(null);
    setFormSchemeId(`SCH-${Math.floor(100 + Math.random() * 900)}`);
    setFormTitleHindi('');
    setFormTitleEnglish('');
    setFormCategory('पेंशन');
    setFormDistricts('ALL');
    setFormOfficialUrl('https://mp.gov.in');
    setFormNoticeText('');
    setFormBenefits('');
    setFormDocuments('');
    setFormSteps('');
    setError('');
    setSuccessMsg('');
  };

  const openEditModal = (scheme: Scheme) => {
    setIsCreatingNew(false);
    setEditingScheme(scheme);
    setFormSchemeId(scheme.schemeId);
    setFormTitleHindi(scheme.titleHindi);
    setFormTitleEnglish(scheme.titleEnglish);
    setFormCategory(scheme.category);
    setFormDistricts(scheme.districts?.join(', ') || 'ALL');
    setFormOfficialUrl(scheme.officialSourceUrl);
    setFormNoticeText(scheme.officialNoticeText || '');
    setFormBenefits(scheme.benefits?.join('\n') || '');
    setFormDocuments(scheme.documents?.join('\n') || '');
    setFormSteps(scheme.applicationSteps?.join('\n') || '');
    setError('');
    setSuccessMsg('');
  };

  // AI Summary Generation
  const handleGenerateAiSummary = async () => {
    if (!formNoticeText.trim()) {
      setError('कृपया पहले आधिकारिक अधिसूचना / परिपत्र की विषय-वस्तु (Notice Text) दर्ज करें।');
      return;
    }

    if (!editingScheme && isCreatingNew) {
      setError('कृपया पहले योजना की मूल जानकारी सहेजें (Save), उसके पश्चात AI सारांश बनाएं।');
      return;
    }

    setIsAiLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.generateAiSummary(editingScheme!._id, formNoticeText);
      if (res.success && res.data?.aiSummaryDraft) {
        const draft = res.data.aiSummaryDraft;
        setFormBenefits(draft.benefits?.join('\n') || formBenefits);
        setFormDocuments(draft.requiredDocuments?.join('\n') || formDocuments);
        setFormSteps(draft.applicationSteps?.join('\n') || formSteps);
        setSuccessMsg('Groq AI द्वारा आधिकारिक परिपत्र से संरचित सारांश तैयार कर लिया गया है। कृपया समीक्षा करें।');
        loadSchemes();
      } else {
        setError(res.message || 'AI सारांश निर्माण विफल रहा।');
      }
    } catch (err: any) {
      setError(err.message || 'Groq AI सेवा से संपर्क में त्रुटि।');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save or Update Scheme
  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const payload: any = {
        schemeId: formSchemeId.trim().toUpperCase(),
        titleHindi: formTitleHindi.trim(),
        titleEnglish: formTitleEnglish.trim(),
        category: formCategory,
        districts: formDistricts.split(',').map((d) => d.trim()),
        officialSourceUrl: formOfficialUrl.trim(),
        officialNoticeText: formNoticeText.trim(),
        benefits: formBenefits.split('\n').map((b) => b.trim()).filter(Boolean),
        documents: formDocuments.split('\n').map((d) => d.trim()).filter(Boolean),
        applicationSteps: formSteps.split('\n').map((s) => s.trim()).filter(Boolean),
      };

      if (isCreatingNew) {
        const res = await api.createScheme(payload);
        if (res.success) {
          setSuccessMsg('नई योजना सफलतापूर्वक सहेजी गई!');
          setIsCreatingNew(false);
          setEditingScheme(res.data.scheme);
          loadSchemes();
        }
      } else if (editingScheme) {
        const res = await api.updateScheme(editingScheme._id, payload);
        if (res.success) {
          setSuccessMsg('योजना विवरण सफलतापूर्वक अद्यतन किया गया!');
          setEditingScheme(res.data.scheme);
          loadSchemes();
        }
      }
    } catch (err: any) {
      setError(err.message || 'सहेजने में त्रुटि हुई।');
    }
  };

  // Approve AI Summary
  const handleApproveSummary = async (approve: boolean) => {
    if (!editingScheme) return;
    try {
      const res = await api.approveSchemeSummary(editingScheme._id, {
        approve,
        editedSummary: {
          benefits: formBenefits.split('\n').filter((b) => b.trim().length > 0),
          requiredDocuments: formDocuments.split('\n').filter((d) => d.trim().length > 0),
          applicationSteps: formSteps.split('\n').filter((s) => s.trim().length > 0),
        },
      });

      if (res.success) {
        setEditingScheme(res.data.scheme);
        setSuccessMsg(approve ? 'सारांश स्वीकृत (APPROVED)। अब आप इसे प्रकाशित कर सकते हैं।' : 'ड्राफ्ट अस्वीकृत कर दिया गया।');
        loadSchemes();
      }
    } catch (err: any) {
      setError(err.message || 'स्वीकृति प्रक्रिया में त्रुटि।');
    }
  };

  // Publish / Unpublish Toggle
  const handlePublishToggle = async (scheme: Scheme, publish: boolean) => {
    try {
      const res = await api.publishScheme(scheme._id, publish);
      if (res.success) {
        loadSchemes();
        if (editingScheme && editingScheme._id === scheme._id) {
          setEditingScheme(res.data.scheme);
        }
      }
    } catch (err: any) {
      setError(err.message || 'प्रकाशन स्थिति बदलने में त्रुटि।');
    }
  };

  // Delete Scheme
  const handleDeleteScheme = async (id: string) => {
    if (!confirm('क्या आप निश्चित रूप से इस योजना को हटाना चाहते हैं?')) return;
    try {
      const res = await api.deleteScheme(id);
      if (res.success) {
        if (editingScheme && editingScheme._id === id) {
          setEditingScheme(null);
        }
        loadSchemes();
      }
    } catch (err: any) {
      setError(err.message || 'योजना हटाने में त्रुटि।');
    }
  };

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-border">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-white border border-ivory-border text-charcoal hover:bg-sage/40 transition-colors touch-target"
            aria-label="एडमिन डैशबोर्ड पर वापस जाएं"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="heading-hindi text-2xl sm:text-3xl font-extrabold text-charcoal">
              सरकारी योजना सीएमएस (Scheme Management)
            </h1>
            <p className="text-xs text-charcoal-muted font-hindi mt-0.5">
              आधिकारिक अधिसूचना जोड़ें, Groq AI द्वारा सरल हिंदी सारांश बनाएं, समीक्षा करें और प्रकाशित करें।
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-5 py-3 rounded-2xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm touch-target"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>नई योजना जोड़ें (Add Scheme)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-hindi border border-red-200 flex items-center" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-xs font-hindi border border-emerald-200 flex items-center" role="status">
          <CheckCircle className="w-4 h-4 mr-2 shrink-0 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Schemes Table */}
      <section className="bg-white rounded-3xl border border-ivory-border shadow-soft-sm overflow-hidden" aria-labelledby="schemes-table-heading">
        <h2 id="schemes-table-heading" className="sr-only">योजनाओं की सूची</h2>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-charcoal font-bold border-b border-ivory-border font-hindi">
              <tr>
                <th scope="col" className="py-3.5 px-4">कोड (ID)</th>
                <th scope="col" className="py-3.5 px-4">योजना नाम (Hindi & English)</th>
                <th scope="col" className="py-3.5 px-4">श्रेणी (Category)</th>
                <th scope="col" className="py-3.5 px-4">AI ड्राफ्ट स्थिति (AI Summary)</th>
                <th scope="col" className="py-3.5 px-4">प्रकाशन स्थिति (Status)</th>
                <th scope="col" className="py-3.5 px-4 text-right">कार्रवाई (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-border">
              {schemes.map((scheme) => (
                <tr key={scheme._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-forest">
                    {scheme.schemeId}
                  </td>
                  <td className="py-4 px-4 max-w-sm">
                    <div className="font-hindi font-bold text-charcoal">{scheme.titleHindi}</div>
                    <div className="text-[11px] text-charcoal-muted font-medium">{scheme.titleEnglish}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-forest/10 text-forest text-[11px] font-bold font-hindi">
                      {scheme.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold font-hindi ${
                        scheme.summaryStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                          : scheme.summaryStatus === 'DRAFT'
                          ? 'bg-amber-50 text-amber-950 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {scheme.summaryStatus === 'APPROVED'
                        ? 'स्वीकृत (Approved)'
                        : scheme.summaryStatus === 'DRAFT'
                        ? 'ड्राफ्ट समीक्षाधीन'
                        : 'कोई ड्राफ्ट नहीं'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handlePublishToggle(scheme, !scheme.published)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-hindi transition-colors touch-target ${
                        scheme.published
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                      }`}
                    >
                      {scheme.published ? '✓ प्रकाशित (Live)' : 'अप्रदर्शित (Hidden)'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => openEditModal(scheme)}
                      className="p-2 text-forest hover:bg-sage/40 rounded-xl transition-colors touch-target"
                      title="संपादित करें / AI सारांश बनाएं"
                      aria-label={`${scheme.titleHindi} संपादित करें`}
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <Link
                      href={`/schemes/${scheme._id}`}
                      target="_blank"
                      className="p-2 text-charcoal hover:bg-sage/40 rounded-xl transition-colors inline-block touch-target"
                      title="पूर्वावलोकन देखें"
                      aria-label={`${scheme.titleHindi} पूर्वावलोकन`}
                    >
                      <Eye className="w-4 h-4 inline" />
                    </Link>
                    <button
                      onClick={() => handleDeleteScheme(scheme._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors touch-target"
                      title="हटाएं"
                      aria-label={`${scheme.titleHindi} हटाएं`}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Schemes Cards */}
        <div className="md:hidden divide-y divide-ivory-border">
          {schemes.map((scheme) => (
            <div key={scheme._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-forest bg-sage/60 px-2 py-0.5 rounded">
                    {scheme.schemeId}
                  </span>
                  <h3 className="font-hindi font-bold text-sm text-charcoal mt-1">{scheme.titleHindi}</h3>
                  <p className="text-[11px] text-charcoal-muted">{scheme.titleEnglish}</p>
                </div>
                <span className="text-[11px] font-bold text-forest bg-forest/10 px-2.5 py-0.5 rounded-full">
                  {scheme.category}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-xs font-hindi text-charcoal-muted">
                  {scheme.summaryStatus === 'APPROVED' ? '✓ सारांश स्वीकृत' : 'ड्राफ्ट'}
                </span>
                <button
                  onClick={() => handlePublishToggle(scheme, !scheme.published)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-hindi ${
                    scheme.published ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {scheme.published ? 'प्रकाशित' : 'अप्रदर्शित'}
                </button>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-ivory-border">
                <button
                  onClick={() => openEditModal(scheme)}
                  className="px-3 py-1.5 rounded-lg bg-sage/60 text-forest text-xs font-bold font-hindi flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>संपादित</span>
                </button>
                <Link
                  href={`/schemes/${scheme._id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-ivory-border text-charcoal text-xs font-bold font-hindi flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>देखें</span>
                </Link>
                <button
                  onClick={() => handleDeleteScheme(scheme._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  aria-label="हटाएं"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CMS EDITOR MODAL */}
      {(editingScheme || isCreatingNew) && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editor-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 shadow-soft-lg border border-ivory-border space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-border">
              <div>
                <h2 id="editor-modal-title" className="font-hindi text-2xl font-bold text-charcoal">
                  {isCreatingNew ? 'नई कल्याण योजना जोड़ें' : `संपादित करें: ${editingScheme?.titleHindi}`}
                </h2>
                <p className="text-xs text-charcoal-muted font-hindi mt-0.5">
                  आधिकारिक अधिसूचना दर्ज कर Groq AI द्वारा सरल हिंदी सारांश उत्पन्न करें
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingScheme(null);
                  setIsCreatingNew(false);
                }}
                className="text-charcoal-muted hover:text-charcoal p-2 rounded-full hover:bg-sage/40 transition-colors touch-target"
                aria-label="संपादक बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-6">
              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="form-scheme-id" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    योजना कोड (Scheme ID) *
                  </label>
                  <input
                    id="form-scheme-id"
                    type="text"
                    required
                    value={formSchemeId}
                    onChange={(e) => setFormSchemeId(e.target.value)}
                    placeholder="उदा. SCH-014"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-border text-xs font-mono font-bold bg-[#FAF9F6] touch-target"
                  />
                </div>

                <div>
                  <label htmlFor="form-category" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    श्रेणी (Category) *
                  </label>
                  <select
                    id="form-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-ivory-border text-xs font-hindi bg-[#FAF9F6] touch-target"
                  >
                    <option value="पेंशन">पेंशन (Pension)</option>
                    <option value="स्वास्थ्य">स्वास्थ्य (Health)</option>
                    <option value="आजीविका">आजीविका (Livelihood)</option>
                    <option value="शिक्षा">शिक्षा (Education)</option>
                    <option value="अन्य">अन्य (Other)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="form-districts" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    लागू जिले (Districts)
                  </label>
                  <input
                    id="form-districts"
                    type="text"
                    value={formDistricts}
                    onChange={(e) => setFormDistricts(e.target.value)}
                    placeholder="ALL या Bhopal, Sehore"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-border text-xs font-hindi bg-[#FAF9F6] touch-target"
                  />
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="form-title-hindi" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    योजना का हिंदी नाम *
                  </label>
                  <input
                    id="form-title-hindi"
                    type="text"
                    required
                    value={formTitleHindi}
                    onChange={(e) => setFormTitleHindi(e.target.value)}
                    placeholder="उदा. राज्य विधवा पेंशन योजना"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-border text-sm font-hindi bg-[#FAF9F6] touch-target"
                  />
                </div>

                <div>
                  <label htmlFor="form-title-english" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    English Title *
                  </label>
                  <input
                    id="form-title-english"
                    type="text"
                    required
                    value={formTitleEnglish}
                    onChange={(e) => setFormTitleEnglish(e.target.value)}
                    placeholder="State Widow Pension Scheme"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-border text-sm bg-[#FAF9F6] touch-target"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="form-url" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                  आधिकारिक स्रोत लिंक (Official URL) *
                </label>
                <input
                  id="form-url"
                  type="url"
                  required
                  value={formOfficialUrl}
                  onChange={(e) => setFormOfficialUrl(e.target.value)}
                  placeholder="https://mp.gov.in/schemes/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ivory-border text-xs font-mono bg-[#FAF9F6] touch-target"
                />
              </div>

              {/* Official Notice Text & AI Trigger Section */}
              <div className="space-y-2 bg-[#FAF9F6] p-5 rounded-2xl border border-ivory-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor="form-notice" className="block text-xs font-bold text-forest font-hindi">
                    आधिकारिक परिपत्र / अधिसूचना की मूल विषय-वस्तु (Official Notice Text):
                  </label>
                  {editingScheme && (
                    <button
                      type="button"
                      disabled={isAiLoading || !formNoticeText.trim()}
                      onClick={handleGenerateAiSummary}
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover transition-colors shadow-soft-sm disabled:opacity-50 touch-target"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-accent fill-current" />
                      <span>{isAiLoading ? 'Groq AI विश्लेषण कर रहा है...' : 'Groq AI द्वारा सरल हिंदी सारांश बनाएं'}</span>
                    </button>
                  )}
                </div>

                <textarea
                  id="form-notice"
                  rows={4}
                  value={formNoticeText}
                  onChange={(e) => setFormNoticeText(e.target.value)}
                  placeholder="मध्य प्रदेश शासन द्वारा जारी आदेश अथवा अधिसूचना का मूल पाठ यहाँ पेस्ट करें..."
                  className="w-full p-3.5 rounded-xl border border-ivory-border bg-white text-xs font-hindi leading-relaxed focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Benefits, Documents, Steps Textareas */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="form-benefits" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    आर्थिक व अन्य लाभ (Benefits - प्रति पंक्ति एक लाभ):
                  </label>
                  <textarea
                    id="form-benefits"
                    rows={3}
                    value={formBenefits}
                    onChange={(e) => setFormBenefits(e.target.value)}
                    placeholder="₹600 प्रतिमाह आर्थिक सहायता..."
                    className="w-full p-3 rounded-xl border border-ivory-border bg-[#FAF9F6] text-xs font-hindi"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="form-docs" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                      आवश्यक दस्तावेज़ (Documents - प्रति पंक्ति एक):
                    </label>
                    <textarea
                      id="form-docs"
                      rows={3}
                      value={formDocuments}
                      onChange={(e) => setFormDocuments(e.target.value)}
                      placeholder="आधार कार्ड&#10;समग्र आईडी&#10;बीपीएल राशन कार्ड..."
                      className="w-full p-3 rounded-xl border border-ivory-border bg-[#FAF9F6] text-xs font-hindi"
                    />
                  </div>

                  <div>
                    <label htmlFor="form-steps" className="block text-xs font-bold text-charcoal font-hindi mb-1">
                      आवेदन चरण (Application Steps - प्रति पंक्ति एक):
                    </label>
                    <textarea
                      id="form-steps"
                      rows={3}
                      value={formSteps}
                      onChange={(e) => setFormSteps(e.target.value)}
                      placeholder="ग्राम पंचायत या लोक सेवा केंद्र जाएं&#10;आवेदन पत्र भरें..."
                      className="w-full p-3 rounded-xl border border-ivory-border bg-[#FAF9F6] text-xs font-hindi"
                    />
                  </div>
                </div>
              </div>

              {/* Approval Buttons */}
              {editingScheme && editingScheme.summaryStatus === 'DRAFT' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-amber-950 font-hindi">
                    <strong>AI सारांश समीक्षाधीन है:</strong> कृपया विवरण जांचें और स्वीकृत अथवा अस्वीकृत करें।
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApproveSummary(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-hindi font-bold hover:bg-emerald-800 touch-target"
                    >
                      ✓ स्वीकृत करें (Approve)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveSummary(false)}
                      className="px-4 py-2 rounded-xl border border-red-300 text-red-700 bg-white text-xs font-hindi font-bold hover:bg-red-50 touch-target"
                    >
                      ✕ अस्वीकृत करें
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-ivory-border flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingScheme(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-ivory-border text-xs font-hindi text-charcoal hover:bg-sage/40 touch-target"
                >
                  रद्द करें (Cancel)
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm flex items-center touch-target"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>सहेजें (Save Scheme)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
