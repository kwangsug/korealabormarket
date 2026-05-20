# Korea Labor Market — 한국 노동시장 시각화

Karpathy의 [karpathy/jobs](https://github.com/karpathy/jobs) 한국 버전.

한국 노동시장을 직업/산업/직군 단위로 시각화. Treemap에서 면적 = 고용 인원, 색 = 선택 메트릭 (임금/학력/전망/AI 노출도/인크루트 채용 트렌드).

## 데이터 소스

- **국민연금** (odcloud) — 기업별 추정 연봉 + 가입자수
- **KOSIS 통계청** — 산업별·규모별 임금
- **DART** — 상장기업 평균 연봉
- **KEIS 고용정보원** — 직업별 임금
- **워크넷 (work24.go.kr OpenAPI)** — 채용공고·기업·직업정보
- **인크루트 28년 채용 데이터** — 직군 분류 + 트렌드 (차별화 자산)
- **Claude API (Sonnet)** — AI Exposure 점수 (한국 컨텍스트 prompt)

## Karpathy 원본과 차이

| Karpathy | korealabormarket |
|---|---|
| BLS OOH 342 직업 | 인크루트 직군 × KSIC 산업 교차 ~200~300 셀 |
| Median Pay | 국민연금 + DART + KEIS 합산 추정 |
| 4 layers | 5+ layers: 임금·학력·전망·AI·**인크루트 28년 트렌드** |
| Treemap (d3) | Treemap (d3) — 동일 |

## CHO 컨텍스트 결합 (의장 IR deck slide 7)

- 인구절벽: 합계출산율 0.75
- NEET 20% (대졸 45%)
- 미충원 약 50만 (돌봄·제조·건설·서비스·기술)
- → "AI 노출도 높음 + 미충원" 직종 = 정책 우선순위

## 일정 (D+5 MVP)

| Day | 작업 |
|---|---|
| D+1 (목) | 데이터 추출 스크립트 — salary DB + work24 API + 워크넷 scrape |
| D+2 (금) | AI Exposure LLM scoring (Claude) + 인크루트 트렌드 매핑 |
| D+3 (토) | Treemap 사이트 빌드 (d3.js) |
| D+4 (일) | UI polish + 한국어 라벨 + 추가 layer |
| D+5 (월) | 데모 + 1-pager |

## 폴더 구조 (예정)

```
korealabormarket/
├── scripts/         data 추출 + LLM scoring (TS)
├── data/            결과 JSON·CSV
├── site/            정적 사이트 (d3 treemap)
├── prompts/         LLM scoring prompt
└── docs/            분석 노트
```
