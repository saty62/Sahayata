'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Sparkles,
  Phone,
  Users,
  Shield,
  ArrowRight,
  Heart,
  CheckCircle2,
  MapPin,
  HelpCircle,
  X,
  PhoneCall,
  Landmark,
  HeartPulse,
  HeartHandshake,
  GraduationCap
} from 'lucide-react';
import { api } from '@/lib/api';
import { Scheme, Campaign } from '@/types';
import SchemeCard from '@/components/SchemeCard';
import CampaignCard from '@/components/CampaignCard';
import HelpCallbackModal from '@/components/HelpCallbackModal';

const DISTRICTS = [
  'सभी जिले (All Districts)',
  'भोपाल (Bhopal)',
  'सीहोर (Sehore)',
  'रायसेन (Raisen)',
  'राजगढ़ (Rajgarh)',
  'विदिशा (Vidisha)',
  'होशंगाबाद (Hoshangabad)',
  'जबलपुर (Jabalpur)',
  'इंदौर (Indore)',
  'ग्वालियर (Gwalior)',
];

const CATEGORIES = [
  { id: 'all', labelHindi: 'सभी योजनाएं', labelEnglish: 'All' },
  { id: 'पेंशन', labelHindi: 'पेंशन योजनाएं', labelEnglish: 'Pension', icon: <Landmark className="w-4 h-4 mr-1.5" /> },
  { id: 'स्वास्थ्य', labelHindi: 'स्वास्थ्य व पोषण', labelEnglish: 'Health', icon: <HeartPulse className="w-4 h-4 mr-1.5" /> },
  { id: 'आजीविका', labelHindi: 'आजीविका व ऋण', labelEnglish: 'Livelihood', icon: <HeartHandshake className="w-4 h-4 mr-1.5" /> },
  { id: 'शिक्षा', labelHindi: 'शिक्षा प्रोत्साहन', labelEnglish: 'Education', icon: <GraduationCap className="w-4 h-4 mr-1.5" /> },
];

export default function HomePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('सभी जिले (All Districts)');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);

  // Fetch schemes & campaigns
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const queryParams: Record<string, any> = { published: true };
        if (selectedCategory !== 'all') {
          queryParams.category = selectedCategory;
        }
        if (selectedDistrict !== 'सभी जिले (All Districts)') {
          // Extract plain name if formatted as "भोपाल (Bhopal)"
          const cleanDistrict = selectedDistrict.split(' ')[0];
          queryParams.district = cleanDistrict;
        }
        if (searchQuery.trim()) {
          queryParams.search = searchQuery.trim();
        }

        const [schemesRes, campaignsRes] = await Promise.all([
          api.getSchemes(queryParams),
          api.getCampaigns('ACTIVE'),
        ]);

        if (schemesRes.success) {
          setSchemes(schemesRes.data.schemes || []);
        }
        if (campaignsRes.success) {
          setCampaigns(campaignsRes.data.campaigns || []);
        }
      } catch (err) {
        console.error('Failed to load homepage content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedCategory, selectedDistrict, searchQuery]);

  return (
    <main id="main-content" className="space-y-16 pb-24">
      {/* 1. HERO SECTION: Hindi Welcome & Direct Scheme Discovery */}
      <section className="bg-gradient-to-b from-sage/50 via-sage/15 to-transparent pt-12 pb-16 border-b border-ivory-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-bold font-hindi shadow-soft-sm">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span>मध्य प्रदेश शासन की महिला कल्याणकारी योजनाओं का आधिकारिक मार्गदर्शन</span>
          </div>

          <h1 className="heading-hindi text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-charcoal tracking-tight max-w-4xl mx-auto leading-tight">
            आपके लिए कौन-सी <span className="text-forest underline decoration-accent decoration-4 underline-offset-8">सरकारी योजना</span> है?
          </h1>

          <p className="font-hindi text-base sm:text-lg md:text-xl text-charcoal-muted max-w-3xl mx-auto leading-relaxed">
            अपनी परिस्थिति बताएं और जानें कि आप किन कल्याणकारी योजनाओं की पात्र हैं। सरल हिंदी में पात्रता नियम, आवश्यक दस्तावेज़ और निःशुल्क हेल्पलाइन सहायता।
          </p>

          {/* Search & District Bar */}
          <div className="max-w-3xl mx-auto bg-white p-3 sm:p-4 rounded-3xl shadow-soft-md border border-ivory-border flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-charcoal-light absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="योजना का नाम खोजें (उदा. विधवा पेंशन, मातृत्व सहायता, ऋण)..."
                className="w-full pl-12 pr-10 py-3 rounded-2xl border-0 bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest placeholder:text-charcoal-light touch-target"
                aria-label="योजना का नाम खोजें"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal p-1"
                  aria-label="खोज साफ़ करें"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="sm:w-64">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-0 bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest cursor-pointer touch-target"
                aria-label="जिला चुनें"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs: Mobile Horizontal Scroll with Snap */}
          <div className="pt-2">
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-hindi font-bold transition-all flex items-center shrink-0 touch-target ${
                    selectedCategory === cat.id
                      ? 'bg-forest text-white shadow-soft-sm'
                      : 'bg-white text-charcoal hover:bg-sage/50 border border-ivory-border'
                  }`}
                  aria-pressed={selectedCategory === cat.id}
                >
                  {cat.icon}
                  <span>{cat.labelHindi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCHEMES DISCOVERY GRID (MANDATORY FIRST SECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" aria-labelledby="schemes-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-ivory-border">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest font-hindi">
              <Sparkles className="w-4 h-4 text-accent fill-current shrink-0" />
              <span>सत्यापित सरकारी योजनाएं (Official Welfare Schemes)</span>
            </div>
            <h2 id="schemes-heading" className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal mt-1">
              उपलब्ध योजनाएं ({schemes.length})
            </h2>
            <p className="font-hindi text-xs sm:text-sm text-charcoal-muted mt-0.5">
              प्रत्येक योजना के नियम, आर्थिक सहायता एवं आवश्यक दस्तावेज़ों का संपूर्ण विवरण
            </p>
          </div>

          <Link
            href="/eligibility"
            className="inline-flex items-center text-sm font-hindi font-bold text-forest hover:text-forest-dark transition-colors self-start sm:self-auto bg-sage/70 hover:bg-sage px-4 py-2.5 rounded-2xl border border-sage-dark/40 shadow-soft-sm touch-target"
          >
            <span>पात्रता खोजक (Eligibility Finder)</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white rounded-3xl border border-ivory-border animate-pulse p-6 space-y-4">
                <div className="h-5 bg-sage/50 rounded-full w-1/3" />
                <div className="h-7 bg-sage/40 rounded-xl w-3/4" />
                <div className="h-20 bg-sage/20 rounded-2xl" />
                <div className="h-10 bg-sage/30 rounded-xl" />
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-ivory-border p-12 text-center space-y-4 shadow-soft-sm">
            <div className="w-16 h-16 rounded-full bg-sage/60 flex items-center justify-center text-forest mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-hindi text-xl font-bold text-charcoal">
              कोई योजना नहीं मिली (No schemes matched your criteria)
            </h3>
            <p className="font-hindi text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
              आपके चुने गए फ़िल्टर अनुसार परिणाम नहीं मिले। कृपया दूसरा जिला चुनें अथवा सभी योजनाओं को देखने के लिए फ़िल्टर हटाएं।
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDistrict('सभी जिले (All Districts)');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 rounded-xl bg-forest text-white font-hindi font-bold text-xs hover:bg-forest-hover shadow-soft-sm touch-target"
            >
              फ़िल्टर रीसेट करें (Reset Filters)
            </button>
          </div>
        )}
      </section>

      {/* 3. ELIGIBILITY FINDER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="पात्रता खोजक आमंत्रण">
        <div className="bg-gradient-to-r from-forest via-[#1e4d3a] to-forest text-white rounded-3xl p-8 sm:p-12 shadow-soft-lg flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden border border-forest-light">
          <div className="absolute right-0 top-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10 text-center lg:text-left">
            <span className="px-3.5 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-bold uppercase tracking-wider font-hindi inline-block">
              2 मिनट में स्पष्ट परिणाम
            </span>
            <h2 className="heading-hindi text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
              क्या आप अपनी पात्रता को लेकर असमंजस में हैं?
            </h2>
            <p className="font-hindi text-sm sm:text-base text-sage-light leading-relaxed">
              केवल 5 सरल प्रश्नों के उत्तर देकर जानें कि आप किन योजनाओं का लाभ पाने के योग्य हैं। हमारा पारदर्शी पात्रता इंजन आपको स्पष्ट बताता है कि कौन-सी शर्त पूरी हुई और कौन-से दस्तावेज़ आवश्यक हैं।
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-sage-light pt-2 font-hindi">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-accent shrink-0" />
                कोई व्यक्तिगत डेटा संचित नहीं
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-accent shrink-0" />
                100% स्पष्ट व पारदर्शी नियम
              </span>
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <Link
              href="/eligibility"
              className="inline-flex items-center px-8 py-4 rounded-2xl bg-accent text-charcoal font-hindi font-extrabold text-base hover:bg-accent-dark transition-all shadow-soft-md touch-target"
            >
              <Sparkles className="w-5 h-5 mr-2 fill-current" />
              <span>पात्रता जांच शुरू करें</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. DONATION CAMPAIGNS SECTION */}
      <section id="campaigns" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24" aria-labelledby="campaigns-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-ivory-border">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest font-hindi">
              <Heart className="w-4 h-4 text-accent fill-current shrink-0" />
              <span>सहयोग एवं सशक्तिकरण (Charitable Campaigns)</span>
            </div>
            <h2 id="campaigns-heading" className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal mt-1">
              सक्रिय दान अभियान
            </h2>
            <p className="font-hindi text-xs sm:text-sm text-charcoal-muted mt-0.5">
              आपके प्रत्येक दान पर आयकर धारा 80G के तहत कर छूट मिलती है। तुरंत डिजिटल रसीद जारी की जाती है।
            </p>
          </div>

          <Link
            href="/donate"
            className="inline-flex items-center text-sm font-hindi font-bold text-forest hover:text-forest-dark transition-colors self-start sm:self-auto touch-target"
          >
            <span>सभी अभियान देखें</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <CampaignCard key={camp._id} campaign={camp} />
          ))}
        </div>
      </section>

      {/* 5. ABOUT THE ORGANIZATION & STATUTORY METRICS */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24" aria-labelledby="about-heading">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-ivory-border shadow-soft-sm space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold text-forest uppercase tracking-wider font-hindi">
              कंपनी ए चैरिटेबल ट्रस्ट (Company A Charitable Trust, Bhopal)
            </span>
            <h2 id="about-heading" className="font-hindi text-2xl sm:text-3xl font-extrabold text-charcoal leading-snug">
              भोपाल, मध्य प्रदेश से संचालित सेवा संकल्प
            </h2>
            <p className="font-hindi text-sm sm:text-base text-charcoal-muted leading-relaxed">
              हमारा संगठन भोपाल स्थित एक पंजीकृत धर्मार्थ न्यास है, जो पिछले 8 वर्षों से मध्य प्रदेश के 9 प्रमुख जिलों—भोपाल, सीहोर, रायसेन, राजगढ़, विदिशा, होशंगाबाद, जबलपुर, इंदौर और ग्वालियर में महिलाओं के स्वास्थ्य, पोषण, आजीविका और कानूनी अधिकारों हेतु कार्य कर रहा है।
            </p>
          </div>

          {/* Org Metrics with Indian Design Accents */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-ivory-border">
            <div className="p-4 rounded-2xl bg-sage/30 border border-sage-dark/30 space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest font-sans">9</span>
              <p className="font-hindi text-xs text-charcoal font-bold">कार्यक्षेत्र जिले</p>
              <p className="text-[11px] text-charcoal-muted">मध्य प्रदेश के 9 जिले</p>
            </div>
            <div className="p-4 rounded-2xl bg-sage/30 border border-sage-dark/30 space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest font-sans">220+</span>
              <p className="font-hindi text-xs text-charcoal font-bold">समर्पित कर्मचारी</p>
              <p className="text-[11px] text-charcoal-muted">पूर्णकालिक क्षेत्र समन्वयक</p>
            </div>
            <div className="p-4 rounded-2xl bg-sage/30 border border-sage-dark/30 space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest font-sans">1,400+</span>
              <p className="font-hindi text-xs text-charcoal font-bold">ग्राम स्वयंसेवक</p>
              <p className="text-[11px] text-charcoal-muted">सक्रिय महिला मित्र कार्यकर्ता</p>
            </div>
            <div className="p-4 rounded-2xl bg-sage/30 border border-sage-dark/30 space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest font-sans">100%</span>
              <p className="font-hindi text-xs text-charcoal font-bold">पारदर्शी 80G रसीदें</p>
              <p className="text-[11px] text-charcoal-muted">स्वचालित व अनुपालन युक्त</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Emergency / Help Dial Action for Mobile Beneficiaries */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={() => setCallbackModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-3 rounded-full bg-forest text-white shadow-soft-lg hover:bg-forest-hover border-2 border-accent transition-all touch-target focus:outline-none focus:ring-4 focus:ring-accent"
          aria-label="निःशुल्क सहायता कॉल अनुरोध करें"
        >
          <PhoneCall className="w-5 h-5 text-accent animate-bounce" />
          <span className="font-hindi font-bold text-xs sm:text-sm">निःशुल्क सहायता</span>
        </button>
      </div>

      {/* Callback Modal */}
      <HelpCallbackModal
        isOpen={callbackModalOpen}
        onClose={() => setCallbackModalOpen(false)}
      />
    </main>
  );
}
