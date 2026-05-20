# Korea Labor Market — 한국 2,500만 취업자, 어느 분야에서 일하는가

Karpathy의 [karpathy/jobs](https://github.com/karpathy/jobs) 한국 버전. 단순. 빠름.

**질문**: 한국 취업자 약 2,500만 명이 직업별로 어떻게 분포해 있는가? 임금·학력·전망·AI 노출도는?

**답**: Treemap 1개. 사각형 면적 = 종사자 수. 색 = 선택 메트릭 4종.

## Karpathy 원본과 매칭

| Karpathy | korealabormarket |
|---|---|
| BLS OOH 342 직업 | **KECO ~150 직업** (KOSIS 매칭) |
| Median Pay | KEIS 직업별 평균 임금 |
| Education | 워크넷 직업사전 학력 |
| BLS Outlook | 워크넷 전망 |
| Digital AI Exposure | **Claude scoring (한국 컨텍스트)** |

## 4 Layers (Treemap 색)

| Layer | 데이터 |
|---|---|
| 1. 평균 임금 | KEIS |
| 2. 학력 요구 | 워크넷 직업사전 |
| 3. 직업 전망 | 워크넷 전망 |
| 4. AI 노출도 | Claude Sonnet (한국 컨텍스트 prompt) |

면적 = **종사자 수** (KOSIS 직업별 취업자 통계).

## 데이터 파이프라인

1. **fetch** — KOSIS / 워크넷 / work24 → 직업별 종사자·임금·학력·전망 수집
2. **score** — Claude로 AI 노출도 0~10 점수 + 한 줄 근거
3. **build** — `site/data.json` 단일 파일로 머지
4. **site** — d3.js treemap (GitHub Pages 호스팅)

## D+5 (월요일) 데모

| Day | 작업 |
|---|---|
| D+1 목 | 데이터 수집 (script 01~04) |
| D+2 금 | AI 노출도 scoring (script 05) |
| D+3 토 | site treemap 빌드 |
| D+4 일 | UI polish + 한국어 라벨 |
| **D+5 월** | **데모** |

## 호스팅

GitHub Pages — `kwangsug.github.io/korealabormarket/`

## 폴더 구조

```
scripts/   data 수집 + scoring (TS)
data/      raw / processed JSON
prompts/   LLM scoring prompt
site/      d3 treemap (정적)
docs/      분석 노트
```
