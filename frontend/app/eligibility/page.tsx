'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Phone,
  FileText,
  Calendar,
  AlertTriangle,
  Bot,
  ListFilter,
  Check,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { api } from '@/lib/api';
import { EligibilityEvaluationResponse, SchemeMatchResult } from '@/types';
import HelpCallbackModal from '@/components/HelpCallbackModal';

const MP_DISTRICTS = [
  'Bhopal',
  'Sehore',
  'Raisen',
  'Rajgarh',
  'Vidisha',
  'Hoshangabad',
  'Jabalpur',
  'Indore',
  'Gwalior',
];

export default function EligibilityFinderPage() {
  const [mode, setMode] = useState<'questionnaire' | 'natural'>('questionnaire');

  // Multi-step questionnaire state
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number | ''>(35);
  const [district, setDistrict] = useState('Bhopal');
  const [isWidow, setIsWidow] = useState<boolean | null>(null);
  const [isBpl, setIsBpl] = useState<boolean | null>(null);
  const [isShgMember, setIsShgMember] = useState<boolean | null>(null);
  const [isPregnantFirstChild, setIsPregnantFirstChild] = useState<boolean | null>(null);

  // Natural Language State
  const [naturalQuery, setNaturalQuery] = useState('');
  const [naturalQueryLoading, setNaturalQueryLoading] = useState(false);
  const [extractedFacts, setExtractedFacts] = useState<any>(null);

  // Results State
  const [results, setResults] = useState<EligibilityEvaluationResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [selectedSchemeForHelp, setSelectedSchemeForHelp] = useState<string>('');

  // Handle questionnaire submit
  const handleQuestionnaireSubmit = async () => {
    setEvaluating(true);
    setError('');
    try {
      const facts = {
        age: age === '' ? undefined : Number(age),
        district,
        isWidow: isWidow ?? undefined,
        isBpl: isBpl ?? undefined,
        isShgMember: isShgMember ?? undefined,
        isPregnantFirstChild: isPregnantFirstChild ?? undefined,
      };

      const res = await api.checkEligibility(facts);
      if (res.success) {
        setResults(res.data);
      } else {
        setError(res.message || 'पात्रता जांच में समस्या आई।');
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setEvaluating(false);
    }
  };

  // Handle Natural Language Submit
  const handleNaturalQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;

    setNaturalQueryLoading(true);
    setError('');
    try {
      const res = await api.parseNaturalQuery(naturalQuery);
      if (res.success) {
        setResults(res.data);
        setExtractedFacts(res.data.extractedFacts);
      } else {
        setError(res.message || 'आपके प्रश्न को समझने में कठिनाई हुई।');
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setNaturalQueryLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setStep(1);
    setIsWidow(null);
    setIsBpl(null);
    setIsShgMember(null);
    setIsPregnantFirstChild(null);
    setNaturalQuery('');
    setExtractedFacts(null);
    setError('');
  };

  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* Page Title & Intro */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-bold font-hindi shadow-soft-sm">
          <Sparkles className="w-3.5 h-3.5 text-accent fill-current" />
          <span>सरल एवं पारदर्शी पात्रता खोजक (Deterministic Rule Engine)</span>
        </div>
        <h1 className="heading-hindi text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal">
          आपके लिए उपयुक्त सरकारी योजना खोजें
        </h1>
        <p className="font-hindi text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          कुछ सरल प्रश्नों के उत्तर दें या अपनी परिस्थिति सरल हिंदी में बताएं। हम आपको स्पष्ट बताएंगे कि आप किन योजनाओं के लिए पात्र हैं और क्यों।
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-2xl border border-ivory-border shadow-soft-sm flex space-x-1">
          <button
            onClick={() => {
              setMode('questionnaire');
              setResults(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-hindi font-bold transition-all flex items-center space-x-2 touch-target ${
              mode === 'questionnaire'
                ? 'bg-forest text-white shadow-soft-sm'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
            aria-pressed={mode === 'questionnaire'}
          >
            <ListFilter className="w-4 h-4" />
            <span>क्रमवार प्रश्नावली (Questionnaire)</span>
          </button>

          <button
            onClick={() => {
              setMode('natural');
              setResults(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-hindi font-bold transition-all flex items-center space-x-2 touch-target ${
              mode === 'natural'
                ? 'bg-forest text-white shadow-soft-sm'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
            aria-pressed={mode === 'natural'}
          >
            <Bot className="w-4 h-4 text-accent" />
            <span>AI सरल हिंदी खोज (Natural Language)</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-hindi border border-red-200" role="alert">
          {error}
        </div>
      )}

      {/* MODE 1: STEP-BY-STEP QUESTIONNAIRE */}
      {mode === 'questionnaire' && !results && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-8">
          {/* Progress dots & Step Label */}
          <div className="flex items-center justify-between pb-6 border-b border-ivory-border">
            <span className="text-xs font-bold text-forest font-hindi">
              चरण {step} / 3: {step === 1 ? 'आयु एवं जिला' : step === 2 ? 'सामाजिक व आर्थिक स्थिति' : 'समूह एवं मातृत्व स्थिति'}
            </span>
            <div className="flex space-x-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-2 rounded-full transition-all duration-300 ${
                    step >= s ? 'bg-forest' : 'bg-sage/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Age & District */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="q-age" className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  1. आपकी आयु (उम्र) कितनी है? (What is your age?) *
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    id="q-age"
                    type="number"
                    min={15}
                    max={100}
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-36 px-4 py-3 rounded-2xl border border-ivory-border text-xl font-bold text-forest bg-[#FAF9F6] focus:ring-2 focus:ring-forest font-sans touch-target"
                  />
                  <span className="text-sm font-hindi text-charcoal-muted">वर्ष पूर्ण (Years)</span>
                </div>
              </div>

              <div>
                <label htmlFor="q-district" className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  2. आप मध्य प्रदेश के किस जिले में रहती हैं? (Which district do you reside in?) *
                </label>
                <select
                  id="q-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full sm:w-80 px-4 py-3.5 rounded-2xl border border-ivory-border text-sm font-hindi text-charcoal bg-[#FAF9F6] focus:ring-2 focus:ring-forest cursor-pointer touch-target"
                >
                  {MP_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 rounded-2xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover transition-colors shadow-soft-sm flex items-center touch-target"
                >
                  <span>अगला कदम (Next Step)</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Widow status & BPL card */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  3. क्या आप निराश्रित अथवा विधवा हैं? (Are you a widow or destitute?) *
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setIsWidow(true)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isWidow === true
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isWidow === true}
                  >
                    हाँ (Yes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWidow(false)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isWidow === false
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isWidow === false}
                  >
                    नहीं (No)
                  </button>
                </div>
              </div>

              <div>
                <p className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  4. क्या आपके परिवार के पास बीपीएल (गरीबी रेखा) राशन कार्ड है? (Do you have a BPL card?) *
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setIsBpl(true)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isBpl === true
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isBpl === true}
                  >
                    हाँ (Yes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBpl(false)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isBpl === false
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isBpl === false}
                  >
                    नहीं (No)
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-2xl border border-ivory-border text-charcoal font-hindi font-semibold text-xs hover:bg-sage/30 touch-target flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>पीछे (Back)</span>
                </button>
                <button
                  type="button"
                  disabled={isWidow === null || isBpl === null}
                  onClick={() => setStep(3)}
                  className="px-8 py-3.5 rounded-2xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover disabled:opacity-50 touch-target flex items-center space-x-1 shadow-soft-sm"
                >
                  <span>अगला कदम (Next Step)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: SHG & Pregnancy Status */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  5. क्या आप किसी पंजीकृत स्वयं सहायता समूह (SHG) की सक्रिय सदस्य हैं? (Are you an SHG member?) *
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setIsShgMember(true)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isShgMember === true
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isShgMember === true}
                  >
                    हाँ (Yes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShgMember(false)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isShgMember === false
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isShgMember === false}
                  >
                    नहीं (No)
                  </button>
                </div>
              </div>

              <div>
                <p className="block text-sm sm:text-base font-bold text-charcoal font-hindi mb-2">
                  6. क्या आप वर्तमान में अपने पहले बच्चे के साथ गर्भवती हैं? (Are you pregnant with your first child?) *
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setIsPregnantFirstChild(true)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isPregnantFirstChild === true
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isPregnantFirstChild === true}
                  >
                    हाँ (Yes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPregnantFirstChild(false)}
                    className={`py-3.5 rounded-2xl text-sm font-hindi font-bold border transition-all touch-target ${
                      isPregnantFirstChild === false
                        ? 'bg-forest text-white border-forest shadow-soft-sm'
                        : 'bg-[#FAF9F6] text-charcoal border-ivory-border hover:bg-sage/40'
                    }`}
                    aria-pressed={isPregnantFirstChild === false}
                  >
                    नहीं (No)
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-2xl border border-ivory-border text-charcoal font-hindi font-semibold text-xs hover:bg-sage/30 touch-target flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>पीछे (Back)</span>
                </button>
                <button
                  type="button"
                  disabled={evaluating || isShgMember === null || isPregnantFirstChild === null}
                  onClick={handleQuestionnaireSubmit}
                  className="px-8 py-4 rounded-2xl bg-forest text-white font-hindi font-extrabold text-sm hover:bg-forest-hover disabled:opacity-50 shadow-soft-md touch-target"
                >
                  {evaluating ? 'पात्रता नियम जाँचे जा रहे हैं...' : 'पात्रता परिणाम देखें (View Matches)'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: NATURAL LANGUAGE HINDI QUERY */}
      {mode === 'natural' && !results && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-ivory-border shadow-soft-sm space-y-6">
          <div className="flex items-center space-x-3 text-forest">
            <div className="w-10 h-10 rounded-2xl bg-forest/10 flex items-center justify-center text-forest">
              <Bot className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="font-hindi text-xl font-bold text-charcoal">
                अपनी भाषा में लिखें (Natural Hindi Inquiry)
              </h2>
              <p className="text-xs text-charcoal-muted font-hindi">
                बोलकर या लिखकर बताएं; AI तथ्य निकालेगा और नियम से मिलान करेगा
              </p>
            </div>
          </div>

          <form onSubmit={handleNaturalQuerySubmit} className="space-y-4">
            <div className="space-y-2">
              <textarea
                rows={4}
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="उदा: मेरी उम्र 38 वर्ष है, मैं सीहोर जिले की रहने वाली हूं, मैं विधवा हूं और मेरे पास बीपीएल कार्ड है।"
                className="w-full p-4 rounded-2xl border border-ivory-border bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest leading-relaxed touch-target"
                aria-label="अपनी परिस्थिति हिंदी में लिखें"
              />
            </div>

            {/* Sample Prompts */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-charcoal-muted font-hindi">
                नमूना प्रश्न (Click to try sample):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'मैं विधवा हूं और मेरे पास बीपीएल कार्ड है।',
                  'मैं स्वयं सहायता समूह से जुड़ी हूं और ऋण सहायता चाहती हूं।',
                  'मेरी उम्र 22 साल है और मैं पहले बच्चे से गर्भवती हूं।',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNaturalQuery(sample)}
                    className="text-xs bg-sage/50 hover:bg-sage text-forest px-3.5 py-2 rounded-xl border border-sage-dark/40 font-hindi transition-colors text-left touch-target"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={naturalQueryLoading || !naturalQuery.trim()}
                className="px-8 py-3.5 rounded-2xl bg-forest text-white font-hindi font-bold text-sm hover:bg-forest-hover disabled:opacity-50 shadow-soft-sm flex items-center touch-target"
              >
                <Sparkles className="w-4 h-4 mr-2 text-accent fill-current" />
                <span>{naturalQueryLoading ? 'AI तथ्य निकाल रहा है...' : 'पात्रता खोजें (Analyze & Match)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {results && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Reset & Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-ivory-border shadow-soft-sm">
            <div>
              <span className="text-xs font-bold text-forest uppercase tracking-wider font-hindi">
                जांच परिणाम (Evaluation Completed)
              </span>
              <h2 className="font-hindi text-2xl font-extrabold text-charcoal mt-0.5">
                {results.matchingSchemes.length} संभावित उपयुक्त योजनाएं पाई गईं
              </h2>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center px-5 py-2.5 rounded-xl border border-ivory-border text-xs font-bold font-hindi text-charcoal hover:bg-sage/40 transition-colors self-start sm:self-auto touch-target"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>पुनः जांच करें (Reset)</span>
            </button>
          </div>

          {/* AI Fact Extraction Feedback */}
          {extractedFacts && (
            <div className="bg-sage/40 p-5 rounded-3xl border border-sage-dark/40 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-forest font-hindi">
                <Bot className="w-4 h-4 text-forest" />
                <span>AI द्वारा पहचाने गए आपके तथ्य (Extracted User Facts):</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-hindi">
                {extractedFacts.age && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">आयु: {extractedFacts.age} वर्ष</span>}
                {extractedFacts.district && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">जिला: {extractedFacts.district}</span>}
                {extractedFacts.isWidow && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">वैवाहिक स्थिति: विधवा</span>}
                {extractedFacts.isBpl && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">राशन कार्ड: बीपीएल</span>}
                {extractedFacts.isShgMember && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">स्वयं सहायता समूह: सदस्य</span>}
                {extractedFacts.isPregnantFirstChild && <span className="bg-white px-3 py-1.5 rounded-lg border border-ivory-border font-medium">गर्भावस्था: पहला जीवित बच्चा</span>}
              </div>
              {extractedFacts.followUpQuestionsHindi && extractedFacts.followUpQuestionsHindi.length > 0 && (
                <p className="text-xs text-amber-900 font-hindi pt-1">
                  💡 {extractedFacts.followUpQuestionsHindi[0]}
                </p>
              )}
            </div>
          )}

          {/* MATCHING SCHEMES SECTION */}
          <div className="space-y-6">
            <h3 className="font-hindi text-xl font-bold text-forest flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-forest shrink-0" />
              <span>आपके लिए संभावित रूप से उपयुक्त योजनाएं (Matching Schemes)</span>
            </h3>

            {results.matchingSchemes.length > 0 ? (
              <div className="space-y-6">
                {results.matchingSchemes.map(({ scheme, matchedRules, disclaimerHindi }) => (
                  <div
                    key={scheme._id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-forest/40 shadow-soft-md space-y-6 border-l-4 border-l-forest"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-forest bg-sage/80 px-2.5 py-1 rounded border border-sage-dark/40">
                            {scheme.schemeId}
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-forest/10 text-forest font-hindi">
                            {scheme.category}
                          </span>
                        </div>
                        <h4 className="font-hindi text-2xl font-extrabold text-charcoal mt-1.5">
                          {scheme.titleHindi}
                        </h4>
                        <p className="text-xs text-charcoal-muted font-medium">{scheme.titleEnglish}</p>
                      </div>

                      <div className="bg-emerald-50 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 self-start sm:self-auto font-hindi flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 mr-1" />
                        <span>100% पात्रता नियम मेल खाए</span>
                      </div>
                    </div>

                    {/* Benefit Highlight */}
                    {scheme.benefits && scheme.benefits.length > 0 && (
                      <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-sage/60 space-y-0.5">
                        <span className="text-xs font-bold text-forest uppercase tracking-wider font-hindi block">
                          मुख्य वित्तीय लाभ:
                        </span>
                        <p className="font-hindi text-base font-extrabold text-forest-dark">
                          {scheme.benefits[0]}
                        </p>
                      </div>
                    )}

                    {/* Explainable Rules Breakdown */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-charcoal font-hindi block">
                        नियम सत्यापन विवरण (Why this matches you):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchedRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex items-start text-xs font-hindi"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 mr-2 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-emerald-950">{rule.ruleNameHindi}: </strong>
                              <span className="text-emerald-900">{rule.requiredCondition} (आपकी जानकारी: {rule.userValue})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents checklist */}
                    {scheme.documents && scheme.documents.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-charcoal font-hindi block">
                          आवेदन हेतु आवश्यक दस्तावेज़:
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs font-hindi">
                          {scheme.documents.map((doc, idx) => (
                            <span key={idx} className="bg-[#FAF9F6] px-3 py-1.5 rounded-lg border border-ivory-border font-medium">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mandatory Disclaimer */}
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 flex items-start space-x-3 text-xs font-hindi text-amber-950">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {disclaimerHindi}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <Link
                        href={`/schemes/${scheme._id}`}
                        className="inline-flex items-center px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-hindi font-bold hover:bg-forest-hover touch-target shadow-soft-sm"
                      >
                        <span>संपूर्ण विवरण एवं आवेदन चरण देखें</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedSchemeForHelp(scheme.titleHindi);
                          setCallbackModalOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2.5 rounded-xl border border-forest text-forest text-xs font-hindi font-bold hover:bg-sage/40 touch-target"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        <span>इस योजना हेतु सहायता कॉल मांगें</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-ivory-border text-center space-y-2">
                <p className="font-hindi text-base font-bold text-charcoal">
                  दी गई जानकारी के अनुसार कोई सीधी योजना नहीं मिली।
                </p>
                <p className="font-hindi text-xs text-charcoal-muted">
                  नीचे दी गई अन्य योजनाओं के नियम देखें अथवा हेल्पलाइन पर संपर्क करें।
                </p>
              </div>
            )}
          </div>

          {/* OTHER SCHEMES & UNSATISFIED CONDITIONS */}
          {results.otherSchemes.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-ivory-border">
              <h3 className="font-hindi text-base font-bold text-charcoal-muted">
                अन्य योजनाएं जो पूर्णतः मेल नहीं खातीं (Conditions Not Met)
              </h3>

              <div className="space-y-4">
                {results.otherSchemes.map(({ scheme, unmatchedRules }) => (
                  <div
                    key={scheme._id}
                    className="bg-white/80 p-5 rounded-2xl border border-ivory-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-hindi text-base font-bold text-charcoal">
                        {scheme.titleHindi} ({scheme.category})
                      </h4>
                      <Link
                        href={`/schemes/${scheme._id}`}
                        className="text-xs font-hindi text-forest font-bold hover:underline"
                      >
                        विवरण देखें →
                      </Link>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-charcoal-muted font-hindi block">
                        अपूर्ण शर्तें (Missing Conditions):
                      </span>
                      {unmatchedRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center text-xs font-hindi text-stone-600">
                          <XCircle className="w-3.5 h-3.5 text-stone-400 mr-2 shrink-0" />
                          <span>{rule.requiredCondition} (वर्तमान में: {rule.userValue})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Free Callback Modal */}
      <HelpCallbackModal
        isOpen={callbackModalOpen}
        onClose={() => setCallbackModalOpen(false)}
        schemeTitle={selectedSchemeForHelp}
      />
    </main>
  );
}
