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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 bg-sage/40 rounded w-1/4 animate-pulse" />
        <div className="h-12 bg-sage/50 rounded w-3/4 animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-[#E8E5DD] animate-pulse" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-hindi text-2xl font-bold text-charcoal">
          योजना नहीं मिली (Scheme Not Found)
        </h2>
        <p className="font-hindi text-sm text-charcoal-muted">
          यह योजना उपलब्ध नहीं है अथवा हटा दी गई है।
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>मुख्य पृष्ठ पर वापस जाएं</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors font-hindi"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        <span>सभी योजनाओं की सूची पर वापस</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E5DD] shadow-soft-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-forest bg-sage px-2.5 py-1 rounded">
              {scheme.schemeId}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-forest/10 text-forest border border-forest/20">
              {scheme.category}
            </span>
          </div>

          {scheme.isSampleData && (
            <span className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
              <span>शैक्षणिक व मूल्यांकनात्मक नमूना योजना (Illustrative Demo)</span>
            </span>
          )}
        </div>

        <div>
          <h1 className="font-hindi text-3xl sm:text-4xl font-extrabold text-charcoal leading-tight">
            {scheme.titleHindi}
          </h1>
          <p className="text-sm sm:text-base text-charcoal-muted mt-1 font-medium">
            {scheme.titleEnglish}
          </p>
        </div>

        {/* Verification meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-muted pt-2 border-t border-[#E8E5DD]/70">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-forest" />
            <span>
              अंतिम सत्यापन (Last verified):{' '}
              {new Date(scheme.lastCheckedAt).toLocaleDateString('hi-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 text-forest" />
            <span>
              लागू क्षेत्र:{' '}
              {scheme.districts && scheme.districts.includes('ALL')
                ? 'मध्य प्रदेश के सभी 9 कार्यक्षेत्र जिले'
                : scheme.districts?.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Benefits, Eligibility, Documents, Steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Benefits */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-soft-sm space-y-4">
            <h2 className="font-hindi text-xl font-bold text-forest flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>योजना के लाभ (Benefits)</span>
            </h2>

            <ul className="space-y-3 font-hindi text-sm text-charcoal">
              {scheme.benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E5DD]/60">
                  <span className="w-2 h-2 rounded-full bg-forest mt-2 mr-3 shrink-0" />
                  <span className="leading-relaxed font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Who Can Apply & Detailed Eligibility */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-soft-sm space-y-4">
            <h2 className="font-hindi text-xl font-bold text-charcoal flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>कौन आवेदन कर सकता है? (Who Can Apply)</span>
            </h2>

            <div className="space-y-3 font-hindi text-sm text-charcoal">
              {scheme.aiSummaryDraft?.whoCanApply && scheme.aiSummaryDraft.whoCanApply.length > 0 ? (
                scheme.aiSummaryDraft.whoCanApply.map((point, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2.5 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {scheme.eligibilityRules?.isWidow && (
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                      <span>महिला का विधवा अथवा परित्यक्ता होना आवश्यक है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.minAge && scheme.eligibilityRules?.maxAge && (
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                      <span>आवेदक महिला की आयु {scheme.eligibilityRules.minAge} से {scheme.eligibilityRules.maxAge} वर्ष के बीच होनी चाहिए।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isBpl && (
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                      <span>परिवार का नाम गरीबी रेखा (BPL) सूची में दर्ज होना आवश्यक है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isShgMember && (
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                      <span>पंजीकृत महिला स्वयं सहायता समूह की सक्रिय सदस्य होना आवश्यक है।</span>
                    </div>
                  )}
                  {scheme.eligibilityRules?.isPregnantFirstChild && (
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                      <span>गर्भवती महिला प्रथम जीवित शिशु के जन्म हेतु पात्र है।</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Required Documents */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-soft-sm space-y-4">
            <h2 className="font-hindi text-xl font-bold text-charcoal flex items-center">
              <FileText className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>आवश्यक दस्तावेज़ (Required Documents)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scheme.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E5DD] flex items-center text-xs font-hindi text-charcoal"
                >
                  <FileText className="w-4 h-4 text-charcoal-muted mr-2 shrink-0" />
                  <span className="font-medium">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Application Procedure */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E5DD] shadow-soft-sm space-y-4">
            <h2 className="font-hindi text-xl font-bold text-charcoal">
              आवेदन प्रक्रिया (How to Apply)
            </h2>

            <div className="space-y-4 font-hindi">
              {scheme.applicationSteps?.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3.5">
                  <span className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="text-sm text-charcoal pt-0.5 leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Help Centres, Call-back CTA & Official Source */}
        <div className="space-y-6">
          {/* Action Card: Call-Back Assistance */}
          <div className="bg-gradient-to-br from-forest to-forest-dark text-white rounded-3xl p-6 shadow-soft-md space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent">
              <Phone className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-hindi text-lg font-bold">
                आवेदन में सहायता चाहिए?
              </h3>
              <p className="font-hindi text-xs text-sage mt-1 leading-relaxed">
                यदि आपको दस्तावेज़ तैयार करने या फॉर्म भरने में कोई समस्या है, तो हमारी सहायिका से निःशुल्क सहायता कॉल प्राप्त करें।
              </p>
            </div>

            <button
              onClick={() => setCallbackModalOpen(true)}
              className="w-full py-3 rounded-xl bg-accent text-[#252B27] font-hindi font-bold text-sm hover:bg-accent-dark transition-colors shadow-soft-sm"
            >
              निःशुल्क सहायता कॉल मांगें
            </button>
          </div>

          {/* Official Source Link */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8E5DD] shadow-soft-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-muted font-hindi">
              आधिकारिक स्रोत (Official Source)
            </h3>
            <p className="text-xs text-charcoal-muted font-hindi leading-relaxed">
              यह जानकारी मध्य प्रदेश शासन के आधिकारिक पोर्टल से ली गई है।
            </p>
            <a
              href={scheme.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-forest hover:underline break-all"
            >
              <span>{scheme.officialSourceUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 shrink-0" />
            </a>
          </div>

          {/* Nearby Help Centres */}
          {scheme.helpCentres && scheme.helpCentres.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#E8E5DD] shadow-soft-sm space-y-4">
              <h3 className="font-hindi text-base font-bold text-charcoal flex items-center">
                <Building className="w-4 h-4 mr-2 text-forest" />
                <span>नजदीकी सहायता केंद्र</span>
              </h3>

              <div className="space-y-3">
                {scheme.helpCentres.map((centre, idx) => (
                  <div key={idx} className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E5DD]/70 space-y-1">
                    <p className="font-hindi text-xs font-bold text-forest">
                      {centre.name}
                    </p>
                    <p className="text-[11px] text-charcoal-muted font-hindi">
                      {centre.address}
                    </p>
                    <p className="text-[11px] text-charcoal font-semibold flex items-center pt-1">
                      <Phone className="w-3 h-3 mr-1 text-forest" />
                      <span>{centre.contactNumber}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call-back Modal */}
      <HelpCallbackModal
        isOpen={callbackModalOpen}
        onClose={() => setCallbackModalOpen(false)}
        schemeTitle={scheme.titleHindi}
        schemeId={scheme.schemeId}
      />
    </div>
  );
}
