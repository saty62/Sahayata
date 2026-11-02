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

  // AI Summary Generator
  const handleGenerateAiSummary = async () => {
    if (!formNoticeText.trim()) {
      setError('कृपया सारांश बनाने के लिए सरकारी अधिसूचना का आधिकारिक पाठ (Official Notice Text) दर्ज करें।');
      return;
    }

    if (!editingScheme && !isCreatingNew) return;

    setIsAiLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      let targetId = editingScheme?._id;

      // If creating new, save basic draft first to obtain ID
      if (isCreatingNew) {
        const createRes = await api.createScheme({
          schemeId: formSchemeId,
          titleHindi: formTitleHindi || 'नई योजना ड्राफ्ट',
          titleEnglish: formTitleEnglish || 'New Scheme Draft',
          category: formCategory,
          districts: formDistricts.split(',').map((d) => d.trim()),
          officialSourceUrl: formOfficialUrl,
          officialNoticeText: formNoticeText,
        });

        if (!createRes.success) {
          throw new Error(createRes.message || 'ड्राफ्ट सहेजने में त्रुटि');
        }

        targetId = createRes.data.scheme._id;
        setEditingScheme(createRes.data.scheme);
        setIsCreatingNew(false);
      }

      const res = await api.generateSchemeSummary(targetId!, formNoticeText);

      if (res.success && res.data?.aiSummaryDraft) {
        const draft = res.data.aiSummaryDraft;
        setFormBenefits(draft.benefits?.join('\n') || formBenefits);
        setFormDocuments(draft.requiredDocuments?.join('\n') || formDocuments);
        setFormSteps(draft.applicationSteps?.join('\n') || formSteps);
        setEditingScheme(res.data.scheme);
        setSuccessMsg('Groq AI द्वारा संरचित हिंदी सारांश सफलतापूर्वक तैयार किया गया (Status: DRAFT)। समीक्षा करें और स्वीकृति दें।');
      } else {
        setError(res.message || 'AI सारांश निर्माण विफल रहा।');
      }
    } catch (err: any) {
      setError(err.message || 'AI सारांश निर्माण में त्रुटि हुई।');
    } finally {
      setIsAiLoading(false);
      loadSchemes();
    }
  };

  // Save / Update Scheme
  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const payload = {
      schemeId: formSchemeId.trim().toUpperCase(),
      titleHindi: formTitleHindi.trim(),
      titleEnglish: formTitleEnglish.trim(),
      category: formCategory,
      districts: formDistricts.split(',').map((d) => d.trim()),
      officialSourceUrl: formOfficialUrl.trim(),
      officialNoticeText: formNoticeText,
      benefits: formBenefits.split('\n').filter((b) => b.trim().length > 0),
      documents: formDocuments.split('\n').filter((d) => d.trim().length > 0),
      applicationSteps: formSteps.split('\n').filter((s) => s.trim().length > 0),
    };

    try {
      if (isCreatingNew) {
        const res = await api.createScheme(payload);
        if (res.success) {
          setSuccessMsg('योजना सफलतापूर्वक ड्राफ्ट के रूप में सहेजी गई।');
          setIsCreatingNew(false);
          setEditingScheme(res.data.scheme);
        }
      } else if (editingScheme) {
        const res = await api.updateScheme(editingScheme._id, payload);
        if (res.success) {
          setSuccessMsg('योजना विवरण सफलतापूर्वक अपडेट किया गया।');
          setEditingScheme(res.data.scheme);
        }
      }
      loadSchemes();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5DD]">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white border border-[#E8E5DD] text-charcoal hover:bg-sage/40 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal">
              सरकारी योजना सीएमएस (Scheme Management)
            </h1>
            <p className="text-xs text-charcoal-muted">
              आधिकारिक अधिसूचना जोड़ें, Groq AI द्वारा सरल हिंदी सारांश बनाएं, समीक्षा करें और प्रकाशित करें।
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover shadow-soft-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>नई योजना जोड़ें (Add Scheme)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-hindi border border-red-200 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-hindi border border-emerald-200 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Schemes Table */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-charcoal font-semibold border-b border-[#E8E5DD]">
              <tr>
                <th className="py-3 px-4">कोड (ID)</th>
                <th className="py-3 px-4">योजना नाम (Hindi & English)</th>
                <th className="py-3 px-4">श्रेणी (Category)</th>
                <th className="py-3 px-4">AI ड्राफ्ट स्थिति (AI Summary)</th>
                <th className="py-3 px-4">प्रकाशन स्थिति (Status)</th>
                <th className="py-3 px-4 text-right">कार्रवाई (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5DD]">
              {schemes.map((scheme) => (
                <tr key={scheme._id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-forest">
                    {scheme.schemeId}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-hindi font-bold text-charcoal">{scheme.titleHindi}</div>
                    <div className="text-[11px] text-charcoal-muted">{scheme.titleEnglish}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[11px] font-semibold">
                      {scheme.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        scheme.summaryStatus === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : scheme.summaryStatus === 'DRAFT'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {scheme.summaryStatus === 'APPROVED'
                        ? 'स्वीकृत (Approved)'
                        : scheme.summaryStatus === 'DRAFT'
                        ? 'ड्राफ्ट समीक्षाधीन'
                        : 'कोई ड्राफ्ट नहीं'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handlePublishToggle(scheme, !scheme.published)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        scheme.published
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {scheme.published ? '✓ प्रकाशित (Live)' : 'अप्रदर्शित (Hidden)'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(scheme)}
                      className="p-1.5 text-forest hover:bg-sage/40 rounded-lg transition-colors"
                      title="संपादित करें / AI सारांश बनाएं"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <Link
                      href={`/schemes/${scheme._id}`}
                      target="_blank"
                      className="p-1.5 text-charcoal hover:bg-sage/40 rounded-lg transition-colors inline-block"
                      title="पूर्वावलोकन देखें"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </Link>
                    <button
                      onClick={() => handleDeleteScheme(scheme._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="हटाएं"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CMS EDITOR MODAL */}
      {(editingScheme || isCreatingNew) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 shadow-soft-lg border border-[#E8E5DD] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E5DD]">
              <div>
                <h3 className="font-hindi text-2xl font-bold text-charcoal">
                  {isCreatingNew ? 'नई सरकारी योजना जोड़ें' : `योजना संपादन: ${editingScheme?.schemeId}`}
                </h3>
                <p className="text-xs text-charcoal-muted">
                  आधिकारिक अधिसूचना दर्ज करें और AI सारांश तैयार करें।
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingScheme(null);
                  setIsCreatingNew(false);
                }}
                className="text-charcoal-muted hover:text-charcoal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-6">
              {/* Basic Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    योजना कोड (Scheme ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSchemeId}
                    onChange={(e) => setFormSchemeId(e.target.value)}
                    placeholder="उदा. SCH-014"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-mono font-bold bg-[#FAF9F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    श्रेणी (Category) *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-hindi bg-[#FAF9F6]"
                  >
                    <option value="पेंशन">पेंशन (Pension)</option>
                    <option value="स्वास्थ्य">स्वास्थ्य (Health)</option>
                    <option value="आजीविका">आजीविका (Livelihood)</option>
                    <option value="शिक्षा">शिक्षा (Education)</option>
                    <option value="अन्य">अन्य (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    लागू जिले (Districts)
                  </label>
                  <input
                    type="text"
                    value={formDistricts}
                    onChange={(e) => setFormDistricts(e.target.value)}
                    placeholder="ALL या Bhopal, Sehore"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-xs font-hindi bg-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    योजना का हिंदी नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleHindi}
                    onChange={(e) => setFormTitleHindi(e.target.value)}
                    placeholder="उदा. राज्य विधवा पेंशन योजना"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-sm font-hindi bg-[#FAF9F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleEnglish}
                    onChange={(e) => setFormTitleEnglish(e.target.value)}
                    placeholder="State Widow Pension Scheme"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-sm bg-[#FAF9F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal font-hindi mb-1">
                  आधिकारिक स्रोत लिंक (Official URL) *
                </label>
                <input
                  type="url"
                  required
                  value={formOfficialUrl}
                  onChange={(e) => setFormOfficialUrl(e.target.value)}
                  placeholder="https://socialsecurity.mp.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] text-xs bg-[#FAF9F6]"
                />
              </div>

              {/* Official Notice Text & Groq AI Generator */}
              <div className="bg-sage/20 p-5 rounded-2xl border border-sage-dark/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-forest font-hindi">
                    आधिकारिक सरकारी अधिसूचना पाठ (Official Notice Text)
                  </label>

                  <button
                    type="button"
                    disabled={isAiLoading || !formNoticeText.trim()}
                    onClick={handleGenerateAiSummary}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover disabled:opacity-50 shadow-soft-sm self-start sm:self-auto"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 text-accent fill-current" />
                    <span>{isAiLoading ? 'Groq AI विश्लेषण कर रहा है...' : 'Groq AI से सरल हिंदी सारांश बनाएं'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={formNoticeText}
                  onChange={(e) => setFormNoticeText(e.target.value)}
                  placeholder="सरकारी राजपत्र या शासनादेश का संपूर्ण विवरण यहाँ पेस्ट करें..."
                  className="w-full p-3 rounded-xl border border-[#E8E5DD] bg-white text-xs font-hindi leading-relaxed"
                />
              </div>

              {/* Generated Content Review & Edit */}
              <div className="space-y-4">
                <h4 className="font-hindi text-sm font-bold text-charcoal">
                  योजना विवरण व लाभ (प्रत्येक बिंदु नई पंक्ति में दर्ज करें)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                    लाभ (Benefits):
                  </label>
                  <textarea
                    rows={3}
                    value={formBenefits}
                    onChange={(e) => setFormBenefits(e.target.value)}
                    placeholder="₹600 प्रतिमाह सीधे बैंक खाते में..."
                    className="w-full p-3 rounded-xl border border-[#E8E5DD] text-xs font-hindi bg-[#FAF9F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                    आवश्यक दस्तावेज़ (Required Documents):
                  </label>
                  <textarea
                    rows={3}
                    value={formDocuments}
                    onChange={(e) => setFormDocuments(e.target.value)}
                    placeholder="पति का मृत्यु प्रमाण पत्र&#10;बीपीएल राशन कार्ड..."
                    className="w-full p-3 rounded-xl border border-[#E8E5DD] text-xs font-hindi bg-[#FAF9F6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal font-hindi mb-1">
                    आवेदन चरण (Application Steps):
                  </label>
                  <textarea
                    rows={3}
                    value={formSteps}
                    onChange={(e) => setFormSteps(e.target.value)}
                    placeholder="लोक सेवा केंद्र पर जाएं...&#10;प्रपत्र भरें..."
                    className="w-full p-3 rounded-xl border border-[#E8E5DD] text-xs font-hindi bg-[#FAF9F6]"
                  />
                </div>
              </div>

              {/* Bottom Buttons: Save, Approve, Reject */}
              <div className="pt-4 border-t border-[#E8E5DD] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-forest text-white font-hindi font-bold text-xs hover:bg-forest-hover shadow-soft-sm flex items-center"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>ड्राफ्ट सहेजें (Save Changes)</span>
                </button>

                {editingScheme && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApproveSummary(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-hindi font-bold text-xs hover:bg-emerald-700 flex items-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      <span>सारांश स्वीकृत करें (Approve)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveSummary(false)}
                      className="px-4 py-2 rounded-xl border border-red-300 text-red-700 font-hindi font-semibold text-xs hover:bg-red-50"
                    >
                      अस्वीकृत करें (Reject)
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
