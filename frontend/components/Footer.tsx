import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Heart, Shield, FileText, CheckCircle2, Award } from 'lucide-react';

const OPERATIONAL_DISTRICTS = [
  'भोपाल',
  'सीहोर',
  'रायसेन',
  'राजगढ़',
  'विदिशा',
  'होशंगाबाद',
  'जबलपुर',
  'इंदौर',
  'ग्वालियर',
];

export default function Footer() {
  return (
    <footer className="bg-forest text-white pt-16 pb-14 border-t-4 border-accent relative" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* District Coverage Ribbon */}
        <div className="mb-12 pb-8 border-b border-white/10">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 font-hindi flex items-center">
            <MapPin className="w-4 h-4 mr-1.5" />
            मध्य प्रदेश कार्यक्षेत्र (9 जिले) — जिला अनुसार योजनाओं के लिए क्लिक करें:
          </p>
          <div className="flex flex-wrap gap-2">
            {OPERATIONAL_DISTRICTS.map((district) => (
              <Link
                key={district}
                href={`/?district=${encodeURIComponent(district)}`}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-accent hover:text-charcoal text-xs font-hindi font-medium text-sage-light transition-all border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {district}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/15">
          {/* Column 1: Organization Overview */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent border border-white/15 shadow-soft-sm">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="font-hindi font-extrabold text-2xl text-white">सहायता</span>
                <p className="text-xs text-sage font-hindi">कंपनी ए चैरिटेबल ट्रस्ट (पंजीकृत)</p>
              </div>
            </div>

            <p className="text-sm text-sage-light font-hindi leading-relaxed">
              मध्य प्रदेश के 9 जिलों में ग्रामीण एवं वंचित महिलाओं के स्वास्थ्य, पोषण, आजीविका और सामाजिक सुरक्षा हेतु समर्पित पंजीकृत धर्मार्थ न्यास।
            </p>

            <div className="text-xs text-sage space-y-1 font-mono pt-1">
              <p>पंजीकरण: MP/BPL/TRUST/2018/8942</p>
              <p>80G प्रमाणन: CIT(E)/BPL/80G/2023-24/A-1089</p>
              <p>ट्रस्ट PAN: AAATC1234F</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              कल्याण योजनाएं
            </h3>
            <ul className="space-y-2.5 text-sm text-sage-light font-hindi">
              <li>
                <Link href="/?category=पेंशन" className="hover:text-accent transition-colors block py-0.5">
                  विधवा एवं कल्याणी पेंशन
                </Link>
              </li>
              <li>
                <Link href="/?category=स्वास्थ्य" className="hover:text-accent transition-colors block py-0.5">
                  मातृत्व पोषण एवं स्वास्थ्य लाभ
                </Link>
              </li>
              <li>
                <Link href="/?category=आजीविका" className="hover:text-accent transition-colors block py-0.5">
                  स्वयं सहायता समूह (SHG) ऋण
                </Link>
              </li>
              <li>
                <Link href="/?category=शिक्षा" className="hover:text-accent transition-colors block py-0.5">
                  बालिका उच्च शिक्षा प्रोत्साहन
                </Link>
              </li>
              <li>
                <Link href="/eligibility" className="hover:text-white transition-colors text-accent font-bold inline-flex items-center mt-1">
                  <span>→ पात्रता खोजक (Check Eligibility)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Free Helpline */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              निःशुल्क महिला हेल्पलाइन
            </h3>
            <div className="bg-white/10 p-4 rounded-2xl space-y-2 border border-white/15">
              <p className="text-xs text-sage font-hindi">योजना जानकारी एवं आवेदन मार्गदर्शन हेतु कॉल करें:</p>
              <div className="flex items-center space-x-2 text-white">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <a
                  href="tel:18002334567"
                  className="text-xl font-bold tracking-wider hover:text-accent transition-colors"
                >
                  1800-233-4567
                </a>
              </div>
              <p className="text-[11px] text-sage/80 font-hindi">
                सोमवार से शनिवार (प्रातः 9:00 - सायं 6:00) | टोल-फ्री
              </p>
            </div>

            <div className="space-y-2 text-xs text-sage-light pt-1">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>14, अरेरा हिल्स, भोपाल, मध्य प्रदेश - 462011</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>sahayata@companya-trust.org</span>
              </div>
            </div>
          </div>

          {/* Column 4: Donor & Compliance Notice */}
          <div className="space-y-4">
            <h3 className="font-hindi text-base font-bold text-accent tracking-wide uppercase">
              दान एवं 80G कर छूट
            </h3>
            <p className="text-xs text-sage-light font-hindi leading-relaxed">
              इस मंच के माध्यम से किए गए प्रत्येक दान पर आयकर अधिनियम 1961 की धारा 80G के तहत 50% कर छूट प्राप्त होती है। दान के तुरंत बाद स्वचालित पीडीएफ रसीद व प्रमाण पत्र जारी किया जाता है।
            </p>
            <div className="pt-2">
              <Link
                href="/donate"
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-accent text-charcoal font-hindi font-bold text-xs hover:bg-accent-dark transition-all shadow-soft-sm"
              >
                <Heart className="w-4 h-4 mr-1.5 fill-current" />
                <span>सहयोग करें (Donate with 80G)</span>
              </Link>
            </div>
            <p className="text-[10px] text-sage/70 font-hindi">
              *केवल भारतीय घरेलू बैंक/UPI भुगतान स्वीकार्य हैं। विदेशी अंशदान प्रतिबंधित है।
            </p>
          </div>
        </div>

        {/* Mandatory Illustrative Demonstration Notice */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-sage/80 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span className="font-hindi">
              तकनीकी मूल्यांकन एवं अकादमिक प्रस्तुति हेतु निर्मित प्रदर्शन मंच (Fictional Trust Demo Data)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>© 2026 Company A Charitable Trust</span>
            <Link href="/admin" className="text-sage hover:text-white underline font-hindi">
              प्रशासनिक लॉगिन (Admin)
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
