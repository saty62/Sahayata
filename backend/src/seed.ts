import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Scheme } from './models/Scheme';
import { Campaign } from './models/Campaign';
import { Donation } from './models/Donation';
import { Receipt } from './models/Receipt';
import { ReceiptCounter } from './models/ReceiptCounter';
import { config } from './config';
import { logger } from './utils/logger';
import { getFinancialYearCounterKey, getFinancialYearString } from './utils/financialYear';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export async function seedDatabase() {
  logger.info('Starting Sahayata database seed script...');

  let mongoReplSet: MongoMemoryReplSet | null = null;
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(config.mongo.uri, { serverSelectionTimeoutMS: 2000 });
      logger.info('Connected to MongoDB for seeding');
    } catch (e) {
      logger.info('Starting local in-memory Mongo replica set for seed...');
      mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongoReplSet.getUri());
    }
  }

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Scheme.deleteMany({}),
    Campaign.deleteMany({}),
    Donation.deleteMany({}),
    Receipt.deleteMany({}),
    ReceiptCounter.deleteMany({}),
  ]);
  logger.info('Cleared existing collections');

  // 2. Initialize Receipt Counter
  const fyKey = getFinancialYearCounterKey(new Date());
  await ReceiptCounter.create({
    _id: fyKey,
    sequence: 1000,
  });
  logger.info(`Initialized ReceiptCounter for ${fyKey} at 1000`);

  // 3. Create Demo Users
  const salt = await bcrypt.genSalt(10);

  // Demo Admin
  const adminUser = await User.create({
    name: 'Shalini Sharma (Trust Admin)',
    email: 'admin@sahayata.org.in',
    mobile: '9826012345',
    passwordHash: await bcrypt.hash('Admin@1234', salt),
    role: 'ADMIN',
    pan: 'ABCDE1234F',
    address: {
      street: '14, Arera Hills',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462011',
    },
  });

  // Demo Donor
  const donorUser = await User.create({
    name: 'Rajesh Verma (Sample Donor)',
    email: 'donor@sahayata.org.in',
    mobile: '9826198765',
    passwordHash: await bcrypt.hash('Donor@1234', salt),
    role: 'DONOR',
    pan: 'BKPVR9876G',
    address: {
      street: 'Flat 402, Narmada Residency, MP Nagar',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462023',
    },
  });

  logger.info('Created demo Admin and Donor users');

  // 4. Seed the 3 Exact Schemes Specified in Prompt Section 11 + Help Centres
  const schemesData = [
    {
      schemeId: 'SCH-014',
      titleHindi: 'राज्य विधवा पेंशन योजना',
      titleEnglish: 'State Widow Pension Scheme',
      category: 'पेंशन',
      districts: ['Bhopal', 'Sehore', 'Raisen', 'Rajgarh', 'Vidisha', 'Hoshangabad', 'Jabalpur', 'Indore', 'Gwalior'],
      eligibilityRules: {
        minAge: 18,
        maxAge: 79,
        isWidow: true,
        isBpl: true,
        districts: ['ALL'],
        customConditionsHindi: ['आवेदिका मध्य प्रदेश की स्थायी निवासी हो', 'शासकीय सेवा में न हो'],
      },
      benefits: [
        '₹600 प्रतिमाह सीधे बैंक खाते में',
        'डीबीटी (DBT) के माध्यम से नियमित भुगतान',
        'वार्षिक सत्यापन प्रक्रिया में सरलता',
      ],
      documents: [
        'पति का आधिकारिक मृत्यु प्रमाण पत्र',
        'बीपीएल (BPL) राशन कार्ड',
        'आधार कार्ड एवं समग्र सामाजिक सुरक्षा आईडी',
        'राष्ट्रीयकृत बैंक खाता पासबुक (आईएफएससी सहित)',
      ],
      applicationSteps: [
        'समग्र पोर्टल या लोक सेवा केंद्र (CSC) पर जाएं।',
        'प्रपत्र-1 विधवा पेंशन आवेदन पत्र भरें।',
        'मृत्यु प्रमाण पत्र एवं बीपीएल राशन कार्ड संलग्न करें।',
        'ग्राम पंचायत सचिव या वार्ड प्रभारी द्वारा सत्यापन उपरांत 30 दिवस में पेंशन प्रारंभ।',
      ],
      officialSourceUrl: 'https://socialsecurity.mp.gov.in/Schemes/WidowPension.aspx',
      officialNoticeText: `मध्य प्रदेश शासन, सामाजिक न्याय एवं दिव्यांगजन सशक्तिकरण विभाग। अधिसूचना क्रमांक 24/स.न्या./2026।
विषय: कल्याणी (विधवा) पेंशन योजना नियम एवं पात्रता निर्देश।
1. पात्रता: 18 से 79 वर्ष आयु वर्ग की समस्त परित्यक्ता/विधवा महिलाएं जो गरीबी रेखा के नीचे (BPL) जीवन यापन कर रही हों।
2. सहायता राशि: रुपये 600/- प्रतिमाह की दर से प्रत्येक पात्र हितग्राही को बैंक खाते में प्रदाय की जाएगी।
3. आवश्यक अभिलेख: पति का मृत्यु प्रमाण पत्र, बीपीएल सूची में नाम, समग्र आईडी तथा आधार नंबर।
4. आवेदन लोक सेवा केंद्र या संबंधित जनपद पंचायत कार्यालय में निःशुल्क स्वीकार किए जाएंगे।`,
      aiSummaryDraft: {
        summaryHindi: 'यह योजना 18 से 79 वर्ष की विधवा महिलाओं को सम्मानजनक जीवन के लिए ₹600 प्रति माह की आर्थिक पेंशन प्रदान करती है।',
        whoCanApply: [
          'महिला विधवा हो और आयु 18 से 79 वर्ष के बीच हो।',
          'परिवार के पास वैध बीपीएल (गरीबी रेखा) कार्ड होना चाहिए।',
        ],
        benefits: ['₹600 प्रति माह सीधे बैंक खाते में प्राप्त होगा।'],
        requiredDocuments: ['पति का मृत्यु प्रमाण पत्र', 'बीपीएल राशन कार्ड', 'आधार कार्ड और समग्र आईडी', 'बैंक पासबुक'],
        applicationSteps: ['लोक सेवा केंद्र या ग्राम पंचायत कार्यालय में आवेदन दें।', 'सत्यापन के बाद राशि सीधे खाते में आएगी।'],
        importantConditions: ['शासकीय सेवा या अन्य नियमित पेंशनधारी न हों।'],
        generatedAt: new Date('2026-09-12'),
        modelUsed: 'llama-3.3-70b-versatile',
      },
      summaryStatus: 'APPROVED',
      published: true,
      isSampleData: true,
      lastCheckedAt: new Date('2026-09-12'),
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      helpCentres: [
        {
          name: 'महिला सहायता केंद्र - भोपाल कलेक्ट्रेट',
          address: 'कक्ष क्र. 12, कलेक्ट्रेट परिसर, कोहेफिज़ा, भोपाल',
          district: 'Bhopal',
          contactNumber: '+91 755 254 0101',
        },
        {
          name: 'लोक सेवा केंद्र - सीहोर',
          address: 'तहसील चौराहा, सीहोर, मध्य प्रदेश',
          district: 'Sehore',
          contactNumber: '+91 7562 224 890',
        },
      ],
    },
    {
      schemeId: 'SCH-022',
      titleHindi: 'स्वयं सहायता समूह ऋण सहायता योजना',
      titleEnglish: 'Self-help Group Loan Support Scheme',
      category: 'आजीविका',
      districts: ['Bhopal', 'Sehore', 'Raisen', 'Rajgarh', 'Vidisha', 'Hoshangabad', 'Jabalpur', 'Indore', 'Gwalior'],
      eligibilityRules: {
        isShgMember: true,
        districts: ['ALL'],
        customConditionsHindi: ['पंजीकृत महिला स्वयं सहायता समूह की सक्रिय सदस्य हो', 'समूह न्यूनतम 6 माह से कार्यरत हो'],
      },
      benefits: [
        'कम ब्याज दर पर ₹3 लाख तक का व्यवसाय ऋण',
        'ब्याज अनुदान (Interest Subvention) सहायता',
        'कौशल उन्नयन एवं आजीविका प्रशिक्षण निःशुल्क',
      ],
      documents: [
        'स्वयं सहायता समूह (SHG) पंजीकरण प्रमाण पत्र',
        'समूह की बैठक कार्यवाही रजिस्टर की प्रति',
        'आवेदिका का आधार कार्ड',
        'समूह का सक्रिय बैंक खाता विवरण (6 माह का)',
      ],
      applicationSteps: [
        'समूह की मासिक बैठक में ऋण प्रस्ताव पारित करें।',
        'ग्राम संगठन (VO) या क्लस्टर लेवल फेडरेशन (CLF) में आवेदन प्रस्तुत करें।',
        'म.प्र. राज्य ग्रामीण आजीविका मिशन (SRLM) ब्लॉक कार्यालय से स्वीकृति प्राप्त करें।',
      ],
      officialSourceUrl: 'https://mpdistricts.nic.in/livelihood/shg-credit.html',
      officialNoticeText: `मध्य प्रदेश राज्य ग्रामीण आजीविका मिशन (MPSRLM), पंचायत एवं ग्रामीण विकास विभाग।
अधिसूचना क्रमांक 88/आजीविका/क्रेडिट/2026।
समस्त पंजीकृत महिला स्वयं सहायता समूहों को आजीविका संवर्धन हेतु क्रेडिट लिंकेज उपलब्ध कराया जा रहा है।
पात्रता: पंजीकृत समूह की सक्रिय महिला सदस्य।
ऋण सीमा: प्रथम चरण में ₹1 लाख से ₹3 लाख तक का कम ब्याज दर पर ऋण उपलब्ध।
ब्याज दर में 3% का अतिरिक्त अनुदान समय पर भुगतान करने वाले समूहों को देय होगा।`,
      aiSummaryDraft: {
        summaryHindi: 'पंजीकृत स्वयं सहायता समूहों की महिला सदस्यों को खुद का काम शुरू करने के लिए ₹3 लाख तक का आसान व कम ब्याज वाला ऋण दिया जाता है।',
        whoCanApply: ['महिला किसी पंजीकृत स्वयं सहायता समूह (SHG) की सक्रिय सदस्य हो।', 'समूह नियमित बचत कर रहा हो।'],
        benefits: ['₹3 लाख तक का ऋण अत्यंत रियायती ब्याज दर पर।', 'आजीविका प्रशिक्षण की निःशुल्क व्यवस्था।'],
        requiredDocuments: ['समूह पंजीकरण प्रमाण पत्र', 'समूह का बैंक पासबुक', 'आधार कार्ड'],
        applicationSteps: ['समूह की बैठक में प्रस्ताव पारित कर ब्लॉक आजीविका मिशन कार्यालय में जमा करें।'],
        importantConditions: ['ऋण राशि का उपयोग केवल आजीविका व्यवसाय गतिविधि के लिए ही किया जा सकेगा।'],
        generatedAt: new Date('2026-08-30'),
        modelUsed: 'llama-3.3-70b-versatile',
      },
      summaryStatus: 'APPROVED',
      published: true,
      isSampleData: true,
      lastCheckedAt: new Date('2026-08-30'),
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      helpCentres: [
        {
          name: 'आजीविका सुविधा केंद्र - रायसेन',
          address: 'जनपद पंचायत परिसर, सांची मार्ग, रायसेन',
          district: 'Raisen',
          contactNumber: '+91 7482 222 150',
        },
        {
          name: 'महिला उद्यमिता सहायता डेस्क - होशंगाबाद',
          address: 'जिला पंचायत कार्यालय, नर्मदापुरम',
          district: 'Hoshangabad',
          contactNumber: '+91 7574 253 400',
        },
      ],
    },
    {
      schemeId: 'SCH-031',
      titleHindi: 'मातृत्व नकद प्रोत्साहन योजना',
      titleEnglish: 'Maternity Cash Benefit Scheme',
      category: 'स्वास्थ्य',
      districts: ['Bhopal', 'Sehore', 'Raisen', 'Rajgarh', 'Vidisha', 'Hoshangabad', 'Jabalpur', 'Indore', 'Gwalior'],
      eligibilityRules: {
        isPregnantFirstChild: true,
        minAge: 19,
        districts: ['ALL'],
        customConditionsHindi: ['गर्भवती महिला प्रथम जीवित संतान हेतु', 'न्यूनतम आयु 19 वर्ष'],
      },
      benefits: [
        '₹5,000 की कुल वित्तीय सहायता किस्तों में',
        'प्रथम किस्त ₹1,000 गर्भावस्था के प्रारंभिक पंजीकरण पर',
        'द्वितीय किस्त ₹2,000 प्रसव पूर्व जांच (ANC) कराने पर',
        'तृतीय किस्त ₹2,000 संस्थागत प्रसव एवं प्रथम टीकाकरण उपरांत',
      ],
      documents: [
        'एमसीपी कार्ड (मातृ एवं बाल सुरक्षा कार्ड)',
        'गर्भवती महिला एवं पति का आधार कार्ड',
        'महिला का व्यक्तिगत बैंक खाता पासबुक (आधार लिंक)',
        'प्रसव पूर्व जांच रिपोर्ट प्रति',
      ],
      applicationSteps: [
        'गर्भावस्था के 150 दिवस के भीतर निकटतम आंगनवाड़ी केंद्र पर पंजीकरण कराएं।',
        'आशा (ASHA) कार्यकर्ता के माध्यम से प्रपत्र 1-A भरें।',
        'समय पर टीकाकरण व प्रसव पूर्व जांच कराने पर किस्तों का प्रत्यक्ष बैंक अंतरण (DBT)।',
      ],
      officialSourceUrl: 'https://wcd.mp.gov.in/schemes/maternity-benefit.aspx',
      officialNoticeText: `महिला एवं बाल विकास विभाग, मध्य प्रदेश शासन।
मातृ वंदना कार्यक्रम दिशा-निर्देश 2026।
उद्देश्य: पहले जीवित बच्चे के जन्म पर गर्भवती महिलाओं को पोषण सुरक्षा एवं मजदूरी की आंशिक क्षतिपूर्ति हेतु नकद प्रोत्साहन।
लाभ राशि: कुल ₹5,000 तीन किस्तों में (1000 + 2000 + 2000) डीबीटी के माध्यम से सीधे आधार लिंक्ड बैंक खाते में।
पात्रता: गर्भवती महिला, पहला बच्चा, आयु 19 वर्ष या अधिक। केंद्र अथवा राज्य सरकार के नियमित कर्मचारी अपात्र।`,
      aiSummaryDraft: {
        summaryHindi: 'गर्भवती महिलाओं को पहले बच्चे के सुरक्षित जन्म और पोषण हेतु ₹5,000 की आर्थिक सहायता तीन किस्तों में सीधे बैंक खाते में दी जाती है।',
        whoCanApply: ['महिला गर्भवती हो और यह उसका पहला जीवित बच्चा हो।', 'महिला की उम्र 19 साल या उससे अधिक हो।'],
        benefits: ['₹5,000 की आर्थिक मदद किस्तों में पोषण और स्वास्थ्य जांच के लिए।'],
        requiredDocuments: ['एमसीपी कार्ड', 'आधार कार्ड', 'बैंक खाता विवरण'],
        applicationSteps: ['नजदीकी आंगनवाड़ी केंद्र में आशा कार्यकर्ता के सहयोग से पंजीकरण कराएं।'],
        importantConditions: ['सरकारी नौकरी में कार्यरत महिलाएं इस लाभ के लिए पात्र नहीं हैं।'],
        generatedAt: new Date('2026-10-05'),
        modelUsed: 'llama-3.3-70b-versatile',
      },
      summaryStatus: 'APPROVED',
      published: true,
      isSampleData: true,
      lastCheckedAt: new Date('2026-10-05'),
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      helpCentres: [
        {
          name: 'मातृ स्वास्थ्य सहायता केंद्र - विदिशा',
          address: 'जिला महिला चिकित्सालय परिसर, विदिशा',
          district: 'Vidisha',
          contactNumber: '+91 7592 233 112',
        },
      ],
    },
    {
      schemeId: 'SCH-045',
      titleHindi: 'मुख्यमंत्री कन्या उच्च शिक्षा प्रोत्साहन योजना',
      titleEnglish: 'Chief Minister Girls Higher Education Incentive',
      category: 'शिक्षा',
      districts: ['ALL'],
      eligibilityRules: {
        minAge: 17,
        maxAge: 25,
        districts: ['ALL'],
        customConditionsHindi: ['12वीं कक्षा में 70% या अधिक अंक', 'मध्य प्रदेश के शासकीय महाविद्यालय में नियमित प्रवेश'],
      },
      benefits: [
        'उच्च शिक्षा हेतु प्रतिवर्ष ₹25,000 की छात्रवृत्ति',
        'पुस्तकों एवं अध्ययन सामग्री हेतु एकमुश्त ₹5,000 अतिरिक्त',
      ],
      documents: ['12वीं की अंकसूची', 'महाविद्यालय प्रवेश रसीद', 'आधार कार्ड', 'मूल निवास प्रमाण पत्र'],
      applicationSteps: ['उच्च शिक्षा पोर्टल पर ऑनलाइन पंजीकरण करें।', 'दस्तावेज़ सत्यापन महाविद्यालय स्तर पर करवाएं।'],
      officialSourceUrl: 'https://highereducation.mp.gov.in',
      summaryStatus: 'APPROVED',
      published: true,
      isSampleData: true,
      lastCheckedAt: new Date('2026-09-20'),
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
    },
  ];

  await Scheme.insertMany(schemesData);
  logger.info(`Seeded ${schemesData.length} illustrative schemes (including SCH-014, SCH-022, SCH-031)`);

  // 5. Seed Campaigns
  const campaignsData = [
    {
      name: 'Rural Women Nutrition & Maternal Health Support',
      nameHindi: 'ग्रामीण मातृ स्वास्थ्य एवं पोषण सुरक्षा अभियान',
      slug: 'maternal-health-bhopal',
      description: 'Providing critical nutrition baskets, prenatal checkup transport, and medicine assistance to 1,200 expectant mothers in Sehore and Raisen districts.',
      descriptionHindi: 'सीहोर और रायसेन के ग्रामीण अंचलों में 1,200 गर्भवती माताओं को पोषण किट, निःशुल्क स्वास्थ्य जांच परिवहन और प्राथमिक दवाइयां उपलब्ध कराने का संकल्प।',
      category: 'Health',
      targetAmount: 500000,
      collectedAmount: 145000,
      status: 'ACTIVE',
      isFeatured: true,
    },
    {
      name: 'Vidisha & Rajgarh SHG Livelihood Toolkits',
      nameHindi: 'विदिशा एवं राजगढ़ महिला स्व-रोजगार टूलकिट संवर्धन',
      slug: 'shg-livelihood-toolkits',
      description: 'Equipping 350 women self-help groups with food processing machines, sewing equipment, and artisan looms to generate sustainable monthly incomes.',
      descriptionHindi: '350 महिला स्वयं सहायता समूहों को सिलाई मशीन, खाद्य प्रसंस्करण उपकरण और हथकरघा टूलकिट देकर उन्हें स्वावलंबी उद्यमी बनाने का प्रयास।',
      category: 'Livelihood',
      targetAmount: 750000,
      collectedAmount: 280000,
      status: 'ACTIVE',
      isFeatured: true,
    },
    {
      name: 'Emergency Widow Family Relief & Education Fund',
      nameHindi: 'निराश्रित विधवा परिवार सहायता एवं बालिका शिक्षा कोष',
      slug: 'widow-family-relief',
      description: 'Supporting destitute widow households with monthly rations and children school fees assistance across Bhopal and Hoshangabad.',
      descriptionHindi: 'भोपाल व होशंगाबाद के निराश्रित परिवारों को मासिक राशन और बच्चों की विद्यालयी शिक्षा हेतु वित्तीय संबल प्रदान करना।',
      category: 'Pension',
      targetAmount: 400000,
      collectedAmount: 95000,
      status: 'ACTIVE',
      isFeatured: false,
    },
  ];

  const createdCampaigns = await Campaign.insertMany(campaignsData);
  logger.info(`Seeded ${createdCampaigns.length} campaigns`);

  // 6. Seed Sample Completed Donations & Concurrency-Safe Sequential Receipts
  const campaign1 = createdCampaigns[0];
  const campaign2 = createdCampaigns[1];

  const sampleDonations = [
    {
      donorId: donorUser._id,
      donorName: 'Rajesh Verma',
      donorEmail: 'donor@sahayata.org.in',
      donorMobile: '9826198765',
      donorPan: 'BKPVR9876G',
      donorAddress: { street: '402 Narmada Residency', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462023' },
      campaignId: campaign1._id,
      amount: 2000,
      paymentMode: 'UPI',
      paymentStatus: 'COMPLETED',
      idempotencyKey: 'IDEM-SEED-001',
      transactionReference: 'UPI-BHOPAL-998811',
      donationType: 'ONE_TIME',
      isSimulated: true,
      receiptSeq: 1001,
    },
    {
      donorName: 'Ananya Deshmukh',
      donorEmail: 'ananya.deshmukh@sample.in',
      donorMobile: '9425011223',
      donorPan: 'ANDSM4512H',
      donorAddress: { street: 'Sector C, Indrapuri', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462021' },
      campaignId: campaign2._id,
      amount: 5000,
      paymentMode: 'NET_BANKING',
      paymentStatus: 'COMPLETED',
      idempotencyKey: 'IDEM-SEED-002',
      transactionReference: 'NETBNK-MP-445522',
      donationType: 'ONE_TIME',
      isSimulated: true,
      receiptSeq: 1002,
    },
    {
      donorName: 'Vikramaditya Rao',
      donorEmail: 'vikram.rao@sample.in',
      donorMobile: '9893044556',
      donorPan: 'VKMR9812K',
      donorAddress: { street: 'South Tukoganj', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' },
      campaignId: campaign1._id,
      amount: 1000,
      paymentMode: 'DEBIT_CARD',
      paymentStatus: 'COMPLETED',
      idempotencyKey: 'IDEM-SEED-003',
      transactionReference: 'CARD-TXN-778899',
      donationType: 'MONTHLY_SIMULATED',
      isSimulated: true,
      receiptSeq: 1003,
    },
  ];

  const fyDisplay = getFinancialYearString(new Date());

  for (const item of sampleDonations) {
    const seqStr = String(item.receiptSeq).padStart(6, '0');
    const receiptNumber = `AC/${fyDisplay}/${seqStr}`;
    const certificateNumber = `80G/${fyDisplay}/${seqStr}`;

    const donation = await Donation.create({
      donorId: item.donorId,
      donorName: item.donorName,
      donorEmail: item.donorEmail,
      donorMobile: item.donorMobile,
      donorPan: item.donorPan,
      donorAddress: item.donorAddress,
      campaignId: item.campaignId,
      amount: item.amount,
      paymentMode: item.paymentMode,
      paymentStatus: item.paymentStatus,
      idempotencyKey: item.idempotencyKey,
      transactionReference: item.transactionReference,
      donationType: item.donationType,
      isSimulated: item.isSimulated,
    });

    await Receipt.create({
      donationId: donation._id,
      donorId: donation.donorId,
      receiptNumber,
      certificateNumber,
      donorPAN: donation.donorPan,
      donorName: donation.donorName,
      donorAddress: `${item.donorAddress.street}, ${item.donorAddress.city}, ${item.donorAddress.state}`,
      amount: donation.amount,
      donationDate: new Date(),
      trustPAN: config.trust.pan,
      trust80GNumber: config.trust.eightyGNumber,
      generationStatus: 'COMPLETED',
      receiptPdfUrl: `/api/receipts/${donation._id}/download`,
      certificatePdfUrl: `/api/receipts/${donation._id}/certificate`,
    });
  }

  // Update counter sequence to 1004 so next live donation starts at 1004
  await ReceiptCounter.findByIdAndUpdate(fyKey, { sequence: 1004 });

  logger.info('Database seeding completed successfully!');
  logger.info('=============================================');
  logger.info('DEMO ACCOUNTS:');
  logger.info('Admin Login : admin@sahayata.org.in  /  Admin@1234');
  logger.info('Donor Login : donor@sahayata.org.in  /  Donor@1234');
  logger.info('=============================================');

  if (require.main === module) {
    await mongoose.disconnect();
    if (mongoReplSet) await mongoReplSet.stop();
    process.exit(0);
  }
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    logger.error('Seeding error:', err);
    process.exit(1);
  });
}
