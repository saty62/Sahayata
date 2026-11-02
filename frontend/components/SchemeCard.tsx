import React from 'react';
import Link from 'next/link';
import { Scheme } from '@/types';
import { CheckCircle2, Calendar, ArrowRight, Bookmark } from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'पेंशन': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    'स्वास्थ्य': { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    'आजीविका': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'शिक्षा': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    'अन्य': { bg: 'bg-stone-50', text: 'text-stone-800', border: 'border-stone-200' },
  };

  const badge = categoryColors[scheme.category] || categoryColors['अन्य'];

  return (
    <div className="bg-white rounded-2xl border border-[#E8E5DD] shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-6 space-y-4">
        {/* Header: ID, Category & Illustrative Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-forest bg-sage/60 px-2 py-0.5 rounded">
              {scheme.schemeId}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {scheme.category}
            </span>
          </div>

          {scheme.isSampleData && (
            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
              उदाहरण (Demo)
            </span>
          )}
        </div>

        {/* Titles */}
        <div>
          <h3 className="font-hindi text-xl font-bold text-charcoal group-hover:text-forest transition-colors leading-snug">
            {scheme.titleHindi}
          </h3>
          <p className="text-xs text-charcoal-muted font-medium mt-0.5">
            {scheme.titleEnglish}
          </p>
        </div>

        {/* Key Highlight Benefit */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E8E5DD]/70">
            <span className="text-[11px] uppercase font-bold text-forest tracking-wider font-hindi block mb-1">
              मुख्य लाभ (Key Benefit):
            </span>
            <p className="font-hindi text-sm font-semibold text-forest-dark">
              {scheme.benefits[0]}
            </p>
          </div>
        )}

        {/* Basic Eligibility Highlights */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-charcoal-muted font-hindi">मूल पात्रता (Basic Eligibility):</span>
          <ul className="space-y-1">
            {scheme.eligibilityRules?.isWidow && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>निराश्रित / विधवा महिला</span>
              </li>
            )}
            {scheme.eligibilityRules?.minAge && scheme.eligibilityRules?.maxAge && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>आयु {scheme.eligibilityRules.minAge} से {scheme.eligibilityRules.maxAge} वर्ष</span>
              </li>
            )}
            {scheme.eligibilityRules?.isBpl && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>बीपीएल (गरीबी रेखा) कार्डधारक</span>
              </li>
            )}
            {scheme.eligibilityRules?.isShgMember && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>पंजीकृत स्वयं सहायता समूह (SHG) सदस्य</span>
              </li>
            )}
            {scheme.eligibilityRules?.isPregnantFirstChild && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>गर्भवती महिला (प्रथम जीवित संतान)</span>
              </li>
            )}
            {scheme.districts && scheme.districts.length > 0 && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>
                  {scheme.districts.includes('ALL') ? 'मध्य प्रदेश के सभी 9 कार्यक्षेत्र जिले' : scheme.districts.join(', ')}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer bar */}
      <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E8E5DD] flex items-center justify-between text-xs">
        <div className="flex items-center text-charcoal-muted">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          <span>
            सत्यापित: {new Date(scheme.lastCheckedAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <Link
          href={`/schemes/${scheme._id}`}
          className="inline-flex items-center font-hindi font-semibold text-forest hover:text-forest-dark transition-colors"
        >
          <span>विवरण देखें</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
