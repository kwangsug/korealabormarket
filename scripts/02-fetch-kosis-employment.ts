/**
 * KOSIS 직업별 취업자 수 수집 (Treemap 면적의 source)
 *
 * 통계: 경제활동인구조사 — 직업별 취업자 (KSCO 기준)
 * 단위: KSCO 대분류 10개 + 중분류 ~50개
 *
 * 산출: data/raw/employment_by_job.json
 * 형식: { jobCode, jobName, level: 'major'|'sub', employed: number, period: 'YYYYMM' }
 *
 * Note: 통계표 ID는 KOSIS에서 직접 검색 후 확정. 기본 가설 = DT_1DA7012S.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const API_KEY = process.env.KOSIS_API_KEY;
if (!API_KEY) {
  console.error('KOSIS_API_KEY missing — set in .env');
  process.exit(1);
}

const BASE = 'https://kosis.kr/openapi/Param/statisticsParameterData.do';

// 후보 통계표 ID — 확정 필요
// DT_1DA7012S: 직업별 취업자 (월별, KSCO 7자리)
// DT_1DE7051S: 직업·종사상지위별 취업자
const CANDIDATES = [
  { orgId: '101', tblId: 'DT_1DA7012S', desc: '직업별 취업자 (월별)' },
  { orgId: '101', tblId: 'DT_1DE7051S', desc: '직업·종사상지위별 취업자' },
];

async function tryFetch(orgId: string, tblId: string) {
  const url = new URL(BASE);
  url.searchParams.set('method', 'getList');
  url.searchParams.set('apiKey', API_KEY!);
  url.searchParams.set('format', 'json');
  url.searchParams.set('jsonVD', 'Y');
  url.searchParams.set('orgId', orgId);
  url.searchParams.set('tblId', tblId);
  url.searchParams.set('prdSe', 'M');
  url.searchParams.set('startPrdDe', '202503');
  url.searchParams.set('endPrdDe', '202503');
  url.searchParams.set('objL1', 'ALL');
  url.searchParams.set('itmId', 'T20');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { err: text.slice(0, 200) };
  }
}

interface Row {
  C1?: string;
  C1_NM?: string;
  PRD_DE?: string;
  DT?: string;
  UNIT_NM?: string;
}

async function main() {
  console.log('KOSIS 직업별 취업자 통계 fetch 시작');
  const collected: any[] = [];

  for (const c of CANDIDATES) {
    console.log(`\n시도: ${c.tblId} (${c.desc})`);
    const data = await tryFetch(c.orgId, c.tblId);
    if (data.err) {
      console.log(`  fail: ${data.err.slice(0, 100)}`);
      continue;
    }
    if (!Array.isArray(data)) {
      console.log(`  unexpected format:`, JSON.stringify(data).slice(0, 200));
      continue;
    }
    console.log(`  rows: ${data.length}`);
    const sample: Row = data[0];
    console.log(`  sample:`, sample);
    collected.push({ tblId: c.tblId, rowsCount: data.length, sample, data });
    break;
  }

  if (collected.length === 0) {
    console.error('\nNO TBLID matched. KOSIS에서 통계표 ID 직접 확인 필요:');
    console.error('  https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1DA7012S');
    process.exit(1);
  }

  mkdirSync(resolve('data/raw'), { recursive: true });
  const outPath = resolve('data/raw/employment_by_job.json');
  writeFileSync(outPath, JSON.stringify(collected[0], null, 2), 'utf-8');
  console.log(`\nsaved: ${outPath}`);
  console.log(`rows: ${collected[0].rowsCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
