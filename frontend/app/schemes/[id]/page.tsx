'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  ExternalLink,
  Phone,
  Building,
  HelpCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  Share2,
  Landmark,
  PhoneCall,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { Scheme } from '@/types';
import HelpCallbackModal from '@/components/HelpCallbackModal';

export default function SchemeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (id) {
      api.getSchemeById(id)
        .then((res) => {
          if (res.success && res.data?.scheme) {
            setScheme(res.data.scheme);
          }
        })
        .catch((err) => {
          console.error('Failed to load scheme:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 bg-sage/40 rounded-full w-1/4 animate-pulse" />
        <div className="h-12 bg-sage/50 rounded-2xl w-3/4 animate-pulse" />
        <div className="h-44 bg-white rounded-3xl border border-ivory-border animate-pulse" />
      </main>
    );
  }

  if (!scheme) {
    return (
      <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal">
          योजना नहीं मिली (Scheme Not Found)
        </h1>
        <p className="font-hindi text-sm text-charcoal-muted leading-relaxed">
          यह योजना वर्तमान में उपलब्ध नहीं है अथवा हटा दी गई है।
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-forest text-white text-xs font-hindi font-bold touch-target shadow-soft-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>मुख्य पृष्ठ पर वापस जाएं</span>
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 sm:pb-16">
      {/* Accessible Breadcrumb Trail */}
      <nav aria-label="ब्रेडक्रम्ब नेविगेशन" className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-hindi text-charcoal-muted">
          <Link href="/" className="hover:text-forest transition-colors">
            मुख्य पृष्ठ
          </Link>
          <span>/</span>
          <Link href="/#schemes" className="hover:text-forest transition-colors">
            योजनाएं
          </Link>
          <span>/</span>
          <span className="text-forest font-bold truncate max-w-[200px] sm:max-w-xs">
            {scheme.titleHindi}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-ivory-border bg-white text-xs font-hindi font-medium text-charcoal hover:bg-sage/40 transition-colors shadow-soft-sm touch-target"
          aria-label="योजना लिंक कॉपी करें"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">लिंक कॉपी हुआ!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-charcoal-muted" />
              <span>साझा करें</span>
            </>
          )}
        </button>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-6 border-l-4 border-l-forest">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-xs font-bold text-forest bg-sage/70 px-3 py-1 rounded-md border border-sage-dark/40">
              {scheme.schemeId}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest/10 text-forest border border-forest/20 font-hindi">
              {scheme.category}
            </span>
          </div>

          {scheme.isSampleData && (
            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full flex items-center font-hindi">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700 shrink-0" />
              <span>शैक्षणिक व मूल्यांकनात्मक नमूना योजना (Illustrative Demo)</span>
            </span>
          )}
        </div>

        <div>
          <h1 className="heading-hindi text-2xl sm:text-3xl md:text-4xl font-extrabold text-charcoal leading-tight">
            {scheme.titleHindi}
          </h1>
          <p className="text-sm sm:text-base text-charcoal-muted mt-1 font-medium">
            {scheme.titleEnglish}
          </p>
        </div>

        {/* Verification meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted pt-3 border-t border-ivory-border font-hindi">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-forest shrink-0" />
            <span>
              अंतिम सत्यापन:{' '}
              <strong>
                {new Date(scheme.lastCheckedAt).toLocaleDateString('hi-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </span>
          </div>

          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 text-forest shrink-0" />
            <span>
              लागू क्षेत्र:{' '}
              <strong>
                {scheme.districts && scheme.districts.includes('ALL')
                  ? 'मध्य प्रदेश के सभी 9 कार्यक्षेत्र जिले'
                  : scheme.districts?.join(', ')}
              </strong>
            </span>
          </div>

          <div className="flex items-center text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 mr-1 shrink-0" />
            <span>सत्यापित शासकीय प्रावधान</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Benefits, Eligibility, Documents, Steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Key Benefits */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-4" aria-labelledby="benefits-heading">
            <h2 id="benefits-heading" className="font-hindi text-xl font-bold text-forest flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>योजना के लाभ (Benefits)</span>
            </h2>

            <ul className="space-y-3 font-hindi text-sm text-charcoal">
              {scheme.benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start bg-[#FAF9F6] p-4 rounded-2xl border border-sage/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest mt-1.5 mr-3 shrink-0" />
                  <span className="leading-relaxed font-bold text-forest-dark">{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: Who Can Apply & Detailed Eligibility */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-4" aria-labelledby="eligibility-heading">
            <h2 id="eligibility-heading" className="font-hindi text-xl font-bold text-charcoal flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>कौन आवेदन कर सकता है? (Who Can Apply)</span>
            </h2>

            <div className="space-y-3 font-hindi text-sm text-charcoal leading-relaxed">
              {scheme.aiSummaryDraft?.whoCanApply && scheme.aiSummaryDraft.whoCanApply.length > 0 ? (
                scheme.aiSummaryDraft.whoCanApply.map((point, idx) => (
                  <div key={idx} className="flex items-start bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-2.5">
                  {scheme.eligibilityRules?.isWidow && (
                    <div className="flex items-center bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 shrink-0" />
                      <span>महिला का निराश्रित, विधवा अथवा कल्याणी होना आवश्यक है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.minAge && scheme.eligibilityRules?.maxAge && (
                    <div className="flex items-center bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 shrink-0" />
                      <span>आवेदक महिला की आयु {scheme.eligibilityRules.minAge} से {scheme.eligibilityRules.maxAge} वर्ष के बीच होनी चाहिए।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isBpl && (
                    <div className="flex items-center bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 shrink-0" />
                      <span>परिवार का नाम गरीबी रेखा (BPL) सूची में दर्ज होना अनिवार्य है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isShgMember && (
                    <div className="flex items-center bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 shrink-0" />
                      <span>पंजीकृत महिला स्वयं सहायता समूह (SHG) की सक्रिय सदस्य होना आवश्यक है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isPregnantFirstChild && (
                    <div className="flex items-center bg-[#FAF9F6] p-3 rounded-xl border border-ivory-border">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2.5 shrink-0" />
                      <span>गर्भवती महिला प्रथम जीवित शिशु के जन्म हेतु पंजीकृत हो।</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Required Documents */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-4" aria-labelledby="documents-heading">
            <h2 id="documents-heading" className="font-hindi text-xl font-bold text-charcoal flex items-center">
              <FileText className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>आवश्यक दस्तावेज़ (Required Documents Checklist)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scheme.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] p-4 rounded-2xl border border-ivory-border flex items-center text-xs font-hindi text-charcoal font-medium"
                >
                  <FileText className="w-4 h-4 text-forest mr-2.5 shrink-0" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Application Procedure */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-ivory-border shadow-soft-sm space-y-4" aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="font-hindi text-xl font-bold text-charcoal">
              आवेदन प्रक्रिया (Step-by-Step Procedure)
            </h2>

            <div className="space-y-4 font-hindi">
              {scheme.applicationSteps?.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3.5 bg-[#FAF9F6] p-4 rounded-2xl border border-ivory-border">
                  <span className="w-8 h-8 rounded-full bg-forest text-white text-xs font-extrabold flex items-center justify-center shrink-0 font-sans shadow-soft-sm">
                    {idx + 1}
                  </span>
                  <div className="text-sm text-charcoal pt-1 leading-relaxed font-medium">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Help Centre & Call-Back Assistance */}
        <div className="space-y-6">
          {/* Action Card: Call-Back Assistance */}
          <div className="bg-gradient-to-br from-forest via-[#1e4d3a] to-forest text-white rounded-3xl p-6 sm:p-8 shadow-soft-md space-y-4 border border-forest-light">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-accent border border-white/20">
              <PhoneCall className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-hindi text-xl font-bold leading-tight">
                आवेदन में सहायता चाहिए?
              </h3>
              <p className="font-hindi text-xs sm:text-sm text-sage-light mt-1.5 leading-relaxed">
                यदि आपको दस्तावेज़ तैयार करने या फॉर्म भरने में कोई समस्या है, तो हमारी सहायिका से निःशुल्क सहायता कॉल प्राप्त करें।
              </p>
            </div>

            <button
              onClick={() => setCallbackModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-accent text-charcoal font-hindi font-extrabold text-sm hover:bg-accent-dark transition-colors shadow-soft-sm touch-target"
            >
              निःशुल्क सहायता कॉल मांगें
            </button>
          </div>

          {/* Official Gazette Source Link */}
          <div className="bg-white rounded-3xl p-6 border border-ivory-border shadow-soft-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest font-hindi">
              आधिकारिक स्रोत (Official Source)
            </h3>
            <p className="text-xs text-charcoal-muted font-hindi leading-relaxed">
              यह जानकारी मध्य प्रदेश शासन के आधिकारिक पोर्टल एवं गजट अधिसूचना से सत्यापित है।
            </p>
            <a
              href={scheme.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-forest hover:underline break-all"
            >
              <span className="truncate">{scheme.officialSourceUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 shrink-0" />
            </a>
          </div>

          {/* Nearby Help Centres */}
          {scheme.helpCentres && scheme.helpCentres.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-ivory-border shadow-soft-sm space-y-4">
              <h3 className="font-hindi text-base font-bold text-charcoal flex items-center">
                <Building className="w-4 h-4 mr-2 text-forest" />
                <span>नजदीकी सहायता केंद्र</span>
              </h3>

              <div className="space-y-3">
                {scheme.helpCentres.map((centre, idx) => (
                  <div key={idx} className="bg-[#FAF9F6] p-4 rounded-2xl border border-sage/60 space-y-1.5">
                    <p className="font-hindi text-xs font-bold text-forest">
                      {centre.name}
                    </p>
                    <p className="text-[11px] text-charcoal-muted font-hindi leading-relaxed">
                      {centre.address}
                    </p>
                    <div className="pt-1">
                      <a
                        href={`tel:${centre.contactNumber}`}
                        className="inline-flex items-center text-xs text-charcoal font-bold hover:text-forest transition-colors"
                      >
                        <Phone className="w-3 h-3 mr-1 text-forest" />
                        <span>{centre.contactNumber}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Call-Back Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-ivory-border sm:hidden z-30 shadow-soft-lg flex items-center justify-between gap-3">
        <div className="text-xs font-hindi">
          <p className="font-bold text-charcoal truncate">{scheme.titleHindi}</p>
          <p className="text-[11px] text-charcoal-muted">निःशुल्क सहायता कॉल</p>
        </div>
        <button
          onClick={() => setCallbackModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-forest text-white font-hindi font-bold text-xs touch-target shadow-soft-sm shrink-0 flex items-center space-x-1.5"
        >
          <PhoneCall className="w-3.5 h-3.5 text-accent" />
          <span>सहायता मांगें</span>
        </button>
      </div>

      {/* Call-back Modal */}
      <HelpCallbackModal
        isOpen={callbackModalOpen}
        onClose={() => setCallbackModalOpen(false)}
        schemeTitle={scheme.titleHindi}
        schemeId={scheme.schemeId}
      />
    </main>
  );
}
