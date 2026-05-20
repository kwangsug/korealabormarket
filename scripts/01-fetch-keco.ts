/**
 * KECO 직업분류 + 직업명 수집 (work24 채용공고 API 기반)
 *
 * 출처: work24 채용공고 API (210 L01) 응답에서 직업 분류 코드 추출
 * - work24는 KECO (한국고용직업분류) 코드 기반
 * - 채용공고 다수 fetch → 직업 코드 + 직업명 unique 추출 + 채용 빈도 집계
 * - 결과: data/raw/keco_jobs.json
 *
 * Note: 표준직무사전(215), 직업정보(350) API 신청 승인 후 본 스크립트 대체 가능.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const API_KEY = process.env.WORKNET_API_KEY;
if (!API_KEY) {
  console.error('WORKNET_API_KEY missing — set in .env');
  process.exit(1);
}

const BASE = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';

interface JobItem {
  jobCode: string;
  jobName: string;
  count: number;
}

async function fetchPage(pageIndex: number, displayRows = 100): Promise<string> {
  const url = `${BASE}?authKey=${API_KEY}&callTp=L&returnType=XML&startPage=${pageIndex}&display=${displayRows}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${pageIndex} failed: ${res.status}`);
  return await res.text();
}

function parseJobs(xml: string): { code: string; name: string }[] {
  const jobs: { code: string; name: string }[] = [];
  const codeRe = /<jobCode>([^<]+)<\/jobCode>/g;
  const nameRe = /<jobNm>([^<]+)<\/jobNm>/g;
  const codes: string[] = [];
  const names: string[] = [];
  let m;
  while ((m = codeRe.exec(xml)) !== null) codes.push(m[1]);
  while ((m = nameRe.exec(xml)) !== null) names.push(m[1]);
  const n = Math.min(codes.length, names.length);
  for (let i = 0; i < n; i++) jobs.push({ code: codes[i], name: names[i] });
  return jobs;
}

async function main() {
  const counter = new Map<string, JobItem>();
  const PAGES = 50;
  console.log(`work24 채용공고 API ${PAGES}페이지 fetch 시작`);

  for (let p = 1; p <= PAGES; p++) {
    try {
      const xml = await fetchPage(p, 100);
      const jobs = parseJobs(xml);
      if (jobs.length === 0) {
        console.log(`page ${p}: 0건 — stop`);
        break;
      }
      for (const j of jobs) {
        const existing = counter.get(j.code);
        if (existing) existing.count += 1;
        else counter.set(j.code, { jobCode: j.code, jobName: j.name, count: 1 });
      }
      console.log(`page ${p}: ${jobs.length} | unique ${counter.size}`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`page ${p}: ERROR`, e);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const result = Array.from(counter.values()).sort((a, b) => b.count - a.count);

  mkdirSync(resolve('data/raw'), { recursive: true });
  const outPath = resolve('data/raw/keco_jobs.json');
  writeFileSync(
    outPath,
    JSON.stringify(
      { extractedAt: new Date().toISOString(), totalUniqueJobs: result.length, jobs: result },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`\nsaved: ${outPath}`);
  console.log(`${result.length} unique 직업`);
  console.log('top 20:');
  for (const j of result.slice(0, 20)) {
    console.log(`${j.jobCode}  ${j.jobName.padEnd(30)}  ${j.count}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
