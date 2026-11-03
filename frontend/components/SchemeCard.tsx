import React from 'react';
import Link from 'next/link';
import { Scheme } from '@/types';
import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  Landmark,
  HeartPulse,
  HeartHandshake,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'पेंशन':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-900',
          border: 'border-emerald-300',
          badgeText: 'पेंशन (Pension)',
          icon: <Landmark className="w-3.5 h-3.5 mr-1 text-emerald-700" />,
        };
      case 'स्वास्थ्य':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-900',
          border: 'border-rose-300',
          badgeText: 'स्वास्थ्य (Health)',
          icon: <HeartPulse className="w-3.5 h-3.5 mr-1 text-rose-700" />,
        };
      case 'आजीविका':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-950',
          border: 'border-amber-300',
          badgeText: 'आजीविका (Livelihood)',
          icon: <HeartHandshake className="w-3.5 h-3.5 mr-1 text-amber-800" />,
        };
      case 'शिक्षा':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          border: 'border-blue-300',
          badgeText: 'शिक्षा (Education)',
          icon: <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-700" />,
        };
      default:
        return {
          bg: 'bg-stone-50',
          text: 'text-stone-900',
          border: 'border-stone-300',
          badgeText: category,
          icon: <Sparkles className="w-3.5 h-3.5 mr-1 text-stone-700" />,
        };
    }
  };

  const meta = getCategoryMeta(scheme.category);

  return (
    <article className="bg-white rounded-3xl border border-ivory-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between overflow-hidden group card-hover border-l-4 border-l-forest">
      <div className="p-6 space-y-4">
        {/* Top Meta: Scheme ID, Category & Sample Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-forest bg-sage/70 px-2.5 py-1 rounded-md border border-sage-dark/40">
              {scheme.schemeId}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center font-hindi ${meta.bg} ${meta.text} ${meta.border}`}
            >
              {meta.icon}
              <span>{meta.badgeText}</span>
            </span>
          </div>

          {scheme.isSampleData && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300/80 px-2 py-0.5 rounded-full font-hindi">
              उदाहरण (Sample)
            </span>
          )}
        </div>

        {/* Scheme Titles */}
        <div>
          <h3 className="font-hindi text-xl sm:text-2xl font-bold text-charcoal group-hover:text-forest transition-colors leading-snug">
            <Link href={`/schemes/${scheme._id}`} className="focus:outline-none focus:underline">
              {scheme.titleHindi}
            </Link>
          </h3>
          <p className="text-xs text-charcoal-muted font-medium mt-0.5">
            {scheme.titleEnglish}
          </p>
        </div>

        {/* Primary Benefit Highlight Card */}
        {scheme.benefits && scheme.benefits.length > 0 && (
          <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-sage/60 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-forest tracking-wider font-hindi block">
              योजना का मुख्य आर्थिक लाभ:
            </span>
            <p className="font-hindi text-base font-extrabold text-forest-dark">
              {scheme.benefits[0]}
            </p>
          </div>
        )}

        {/* Basic Eligibility Highlights */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-charcoal-muted font-hindi block">
            मूल पात्रता शर्तें:
          </span>
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
                <span>आयु सीमा: {scheme.eligibilityRules.minAge} से {scheme.eligibilityRules.maxAge} वर्ष</span>
              </li>
            )}
            {scheme.eligibilityRules?.isBpl && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>बीपीएल (गरीबी रेखा) राशन कार्डधारक</span>
              </li>
            )}
            {scheme.eligibilityRules?.isShgMember && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>पंजीकृत स्व-सहायता समूह (SHG) सदस्या</span>
              </li>
            )}
            {scheme.eligibilityRules?.isPregnantFirstChild && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>गर्भवती महिला (प्रथम जीवित संतान हेतु)</span>
              </li>
            )}
            {scheme.districts && scheme.districts.length > 0 && (
              <li className="flex items-center text-xs text-charcoal font-hindi">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest mr-1.5 shrink-0" />
                <span>
                  {scheme.districts.includes('ALL') ? 'मध्य प्रदेश के सभी 9 जिले' : scheme.districts.join(', ')}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer bar with Verified date & CTA */}
      <div className="px-6 py-4 bg-[#FAF9F6] border-t border-ivory-border flex items-center justify-between text-xs">
        <div className="flex items-center text-charcoal-muted font-hindi">
          <Calendar className="w-3.5 h-3.5 mr-1 text-forest" />
          <span>
            सत्यापित: {new Date(scheme.lastCheckedAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <Link
          href={`/schemes/${scheme._id}`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-forest text-white font-hindi font-bold hover:bg-forest-hover transition-colors shadow-soft-sm touch-target"
        >
          <span>विवरण देखें</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
