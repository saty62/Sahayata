import request from 'supertest';
import app from '../src/app';
import { setupTestDb, teardownTestDb } from './setup';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('Schemes & Deterministic Eligibility Tests', () => {
  it('should fetch published schemes with category filter', async () => {
    const res = await request(app).get('/api/schemes?category=पेंशन');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.schemes.length).toBeGreaterThan(0);
    expect(res.body.data.schemes[0].schemeId).toBe('SCH-014');
  });

  it('SCH-014: Deterministic match for widow aged 45 with BPL card', async () => {
    const res = await request(app).post('/api/eligibility/check').send({
      age: 45,
      isWidow: true,
      isBpl: true,
      district: 'Bhopal',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const matchingIds = res.body.data.matchingSchemes.map((m: any) => m.scheme.schemeId);
    expect(matchingIds).toContain('SCH-014');

    const sch14 = res.body.data.matchingSchemes.find((m: any) => m.scheme.schemeId === 'SCH-014');
    expect(sch14.isEligible).toBe(true);
    expect(sch14.matchedRules.length).toBeGreaterThanOrEqual(3);
    expect(sch14.unmatchedRules.length).toBe(0);
  });

  it('SCH-014: Should NOT match if woman is not a widow or lacks BPL card', async () => {
    const res = await request(app).post('/api/eligibility/check').send({
      age: 45,
      isWidow: false,
      isBpl: true,
      district: 'Bhopal',
    });

    expect(res.status).toBe(200);
    const matchingIds = res.body.data.matchingSchemes.map((m: any) => m.scheme.schemeId);
    expect(matchingIds).not.toContain('SCH-014');

    const otherSch14 = res.body.data.otherSchemes.find((m: any) => m.scheme.schemeId === 'SCH-014');
    expect(otherSch14).toBeDefined();
    expect(otherSch14.unmatchedRules.some((r: any) => r.ruleNameHindi.includes('विधवा'))).toBe(true);
  });

  it('SCH-022: Deterministic match for member of registered SHG', async () => {
    const res = await request(app).post('/api/eligibility/check').send({
      isShgMember: true,
      district: 'Raisen',
    });

    expect(res.status).toBe(200);
    const matchingIds = res.body.data.matchingSchemes.map((m: any) => m.scheme.schemeId);
    expect(matchingIds).toContain('SCH-022');
  });

  it('SCH-031: Deterministic match for pregnant woman with first child aged 22', async () => {
    const res = await request(app).post('/api/eligibility/check').send({
      age: 22,
      isPregnantFirstChild: true,
      district: 'Vidisha',
    });

    expect(res.status).toBe(200);
    const matchingIds = res.body.data.matchingSchemes.map((m: any) => m.scheme.schemeId);
    expect(matchingIds).toContain('SCH-031');
  });

  it('Natural-language inquiry parser extracts facts and returns deterministic results', async () => {
    const res = await request(app).post('/api/eligibility/parse-query').send({
      query: 'मेरी उम्र 38 वर्ष है, मैं सीहोर की रहने वाली हूं और मैं स्वयं सहायता समूह से जुड़ी हूं।',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.extractedFacts.isShgMember).toBe(true);
    const matchingIds = res.body.data.matchingSchemes.map((m: any) => m.scheme.schemeId);
    expect(matchingIds).toContain('SCH-022');
  });

  it('should support combined district filter and search query without query.$or collision', async () => {
    const res = await request(app).get('/api/schemes?district=Bhopal&search=पेंशन');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.schemes.length).toBeGreaterThan(0);
    expect(res.body.data.schemes[0].schemeId).toBe('SCH-014');
  });
});
