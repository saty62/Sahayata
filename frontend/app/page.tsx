'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Sparkles, Phone, Users, Shield, ArrowRight, Heart, CheckCircle2, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { Scheme, Campaign } from '@/types';
import SchemeCard from '@/components/SchemeCard';
import CampaignCard from '@/components/CampaignCard';

const DISTRICTS = [
  'सभी जिले (All Districts)',
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

const CATEGORIES = [
  { id: 'all', labelHindi: 'सभी योजनाएं', labelEnglish: 'All Schemes' },
  { id: 'पेंशन', labelHindi: 'पेंशन (Pension)', icon: '🛡️' },
  { id: 'स्वास्थ्य', labelHindi: 'स्वास्थ्य एवं पोषण (Health)', icon: '🌿' },
  { id: 'आजीविका', labelHindi: 'आजीविका व ऋण (Livelihood)', icon: '💼' },
  { id: 'शिक्षा', labelHindi: 'शिक्षा (Education)', icon: '📚' },
];

export default function HomePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('सभी जिले (All Districts)');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
          queryParams.district = selectedDistrict;
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
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION: Hindi Welcome & Direct Scheme Discovery */}
      <section className="bg-gradient-to-b from-sage/40 via-sage/10 to-transparent pt-12 pb-16 border-b border-[#E8E5DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-forest/10 border border-forest/20 text-forest text-xs font-semibold font-hindi">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span>मध्य प्रदेश की महिलाओं के अधिकार एवं सरकारी योजनाएं</span>
          </div>

          <h1 className="font-hindi text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal tracking-tight max-w-4xl mx-auto leading-tight">
            आपके लिए कौन-सी <span className="text-forest underline decoration-accent decoration-4 underline-offset-8">सरकारी योजना</span> है?
          </h1>

          <p className="font-hindi text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
            अपनी जानकारी दें और जानें कि आप किन योजनाओं के लिए आवेदन कर सकती हैं। सरल भाषा में नियम, आवश्यक दस्तावेज़ और सीधे सहायता केंद्र।
          </p>

          {/* Search & District Bar */}
          <div className="max-w-3xl mx-auto bg-white p-3 sm:p-4 rounded-2xl shadow-soft-md border border-[#E8E5DD] flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 text-charcoal-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="योजना का नाम खोजें (उदा. विधवा पेंशन, मातृत्व, ऋण)..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest placeholder:text-charcoal-light"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-0 bg-[#FAF9F6] text-sm text-charcoal font-hindi focus:ring-2 focus:ring-forest cursor-pointer"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-hindi font-medium transition-all flex items-center space-x-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-forest text-white shadow-soft-sm font-semibold'
                    : 'bg-white text-charcoal hover:bg-sage/40 border border-[#E8E5DD]'
                }`}
              >
                <span>{cat.labelHindi}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SCHEMES DISCOVERY GRID (FIRST SECTION) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest font-hindi">
              <Sparkles className="w-4 h-4 text-accent fill-current" />
              <span>सत्यापित सरकारी योजनाएं (Official Welfare Schemes)</span>
            </div>
            <h2 className="font-hindi text-2xl sm:text-3xl font-bold text-charcoal mt-1">
              उपलब्ध योजनाएं ({schemes.length})
            </h2>
          </div>

          <Link
            href="/eligibility"
            className="inline-flex items-center text-sm font-hindi font-semibold text-forest hover:text-forest-dark transition-colors self-start sm:self-auto bg-sage/60 px-4 py-2 rounded-xl border border-sage-dark/30"
          >
            <span>अपनी सीधी पात्रता जांचें</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 bg-white rounded-2xl border border-[#E8E5DD] animate-pulse p-6 space-y-4">
                <div className="h-4 bg-sage/50 rounded w-1/3" />
                <div className="h-6 bg-sage/40 rounded w-3/4" />
                <div className="h-20 bg-sage/20 rounded" />
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
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-12 text-center space-y-3">
            <p className="font-hindi text-lg font-semibold text-charcoal">
              कोई योजना नहीं मिली (No schemes matched your criteria)
            </p>
            <p className="font-hindi text-sm text-charcoal-muted">
              कृपया दूसरा जिला या श्रेणी चुनकर खोजें, अथवा सभी योजनाओं को देखने के लिए फ़िल्टर हटाएं।
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDistrict('सभी जिले (All Districts)');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-hindi"
            >
              फ़िल्टर रीसेट करें
            </button>
          </div>
        )}
      </section>

      {/* 3. ELIGIBILITY FINDER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest to-forest-dark text-white rounded-3xl p-8 sm:p-12 shadow-soft-lg flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wider font-hindi">
              AI एवं नियम आधारित खोजक
            </span>
            <h2 className="font-hindi text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
              क्या आप अपनी पात्रता को लेकर असमंजस में हैं?
            </h2>
            <p className="font-hindi text-sm sm:text-base text-sage/95 leading-relaxed">
              केवल 2 मिनट में 5 सरल प्रश्नों के उत्तर देकर या अपनी परिस्थिति लिखकर जानें कि आप किन योजनाओं का लाभ पाने की पात्र हैं। 100% पारदर्शी एवं स्पष्ट नियम।
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-sage pt-2">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-accent" />
                कोई व्यक्तिगत डेटा संचित नहीं
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-accent" />
                सरल हिंदी में परिणाम
              </span>
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <Link
              href="/eligibility"
              className="inline-flex items-center px-6 py-3.5 rounded-xl bg-accent text-[#252B27] font-hindi font-bold text-base hover:bg-accent-dark transition-all shadow-soft-md"
            >
              <Sparkles className="w-5 h-5 mr-2 fill-current" />
              <span>पात्रता जांच शुरू करें</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. DONATION CAMPAIGNS SECTION */}
      <section id="campaigns" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest font-hindi">
              <Heart className="w-4 h-4 text-accent fill-current" />
              <span>सहयोग एवं सशक्तिकरण (Charitable Campaigns)</span>
            </div>
            <h2 className="font-hindi text-2xl sm:text-3xl font-bold text-charcoal mt-1">
              सक्रिय दान अभियान
            </h2>
            <p className="font-hindi text-sm text-charcoal-muted mt-1">
              आपके सहयोग से मध्य प्रदेश के 9 जिलों में निराश्रित महिलाओं और माताओं के जीवन में प्रत्यक्ष परिवर्तन आ रहा है।
            </p>
          </div>

          <Link
            href="/donate"
            className="inline-flex items-center text-sm font-hindi font-semibold text-forest hover:text-forest-dark transition-colors self-start sm:self-auto"
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

      {/* 5. ABOUT THE ORGANIZATION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E5DD] shadow-soft-sm space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold text-forest uppercase tracking-wider font-hindi">
              कंपनी ए चैरिटेबल ट्रस्ट (Company A Charitable Trust)
            </span>
            <h2 className="font-hindi text-2xl sm:text-3xl font-bold text-charcoal">
              भोपाल, मध्य प्रदेश से संचालित सेवा संकल्प
            </h2>
            <p className="font-hindi text-sm sm:text-base text-charcoal-muted leading-relaxed">
              हमारा संगठन भोपाल स्थित एक पंजीकृत धर्मार्थ न्यास है, जो पिछले 8 वर्षों से मध्य प्रदेश के 9 प्रमुख जिलों—भोपाल, सीहोर, रायसेन, राजगढ़, विदिशा, होशंगाबाद, जबलपुर, इंदौर और ग्वालियर में महिलाओं के स्वास्थ्य, पोषण, आजीविका और कानूनी अधिकारों हेतु जमीनी स्तर पर कार्य कर रहा है।
            </p>
          </div>

          {/* Org Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-[#E8E5DD]">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest">9</span>
              <p className="font-hindi text-xs text-charcoal-muted font-medium">कार्यक्षेत्र जिले (Districts)</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest">220+</span>
              <p className="font-hindi text-xs text-charcoal-muted font-medium">समर्पित कर्मचारी (Staff)</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest">1,400+</span>
              <p className="font-hindi text-xs text-charcoal-muted font-medium">ग्राम कार्यकर्ता व स्वयंसेवक (Volunteers)</p>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-forest">100%</span>
              <p className="font-hindi text-xs text-charcoal-muted font-medium">80G कर छूट व पारदर्शी रसीदें</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
