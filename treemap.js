/**
 * 한국 노동시장 Treemap — d3.js
 * 데이터: site/data.json (build:site 스크립트 출력)
 */

const W = window.innerWidth - 64;
const H = Math.max(600, window.innerHeight - 220);

let CURRENT_LAYER = 'employed';
let DATA = null;

const TIP = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

async function init() {
  try {
    DATA = await d3.json('data.json');
  } catch (e) {
    const c = document.getElementById('treemap');
    while (c.firstChild) c.removeChild(c.firstChild);
    const p = document.createElement('p');
    p.style.color = '#c00';
    p.style.padding = '20px';
    p.textContent = 'data.json 로드 실패. npm run build:site 먼저 실행하세요.';
    c.appendChild(p);
    return;
  }
  render();
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      CURRENT_LAYER = btn.dataset.layer;
      render();
    });
  });
}

function render() {
  d3.select('#treemap').select('svg').remove();
  const svg = d3.select('#treemap').append('svg').attr('width', W).attr('height', H);

  const root = d3
    .hierarchy({ children: DATA.jobs })
    .sum((d) => d.employed || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  d3.treemap().size([W, H]).padding(1)(root);

  const color = colorScale(CURRENT_LAYER, DATA.jobs);

  const cells = svg
    .selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', (d) => `translate(${d.x0},${d.y0})`);

  cells
    .append('rect')
    .attr('class', 'cell')
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('fill', (d) => color(d.data[CURRENT_LAYER] ?? 0))
    .on('mousemove', (event, d) => {
      TIP.style('opacity', 1)
        .style('left', event.pageX + 12 + 'px')
        .style('top', event.pageY + 12 + 'px');
      const lines = [
        d.data.jobName,
        '종사자: ' + (d.data.employed != null ? d.data.employed.toLocaleString() : '-'),
        '평균 임금: ' + (d.data.wage ? d.data.wage.toLocaleString() + '원' : '-'),
        '학력: ' + (d.data.education ?? '-'),
        '전망: ' + (d.data.outlook ?? '-'),
        'AI 노출도: ' + (d.data.ai_exposure ?? '-') + '/10',
      ];
      if (d.data.ai_rationale) lines.push(d.data.ai_rationale);
      TIP.text(lines.join('\n'));
    })
    .on('mouseout', () => TIP.style('opacity', 0));

  cells
    .append('text')
    .attr('class', 'cell-label')
    .attr('x', 4)
    .attr('y', 14)
    .text((d) => {
      const w = d.x1 - d.x0;
      const h = d.y1 - d.y0;
      if (w < 50 || h < 20) return '';
      return d.data.jobName.length > 12 ? d.data.jobName.slice(0, 11) + '…' : d.data.jobName;
    });

  document.getElementById('legend').textContent =
    '색상: ' +
    labelOf(CURRENT_LAYER) +
    ' · 총 ' +
    root.leaves().length +
    ' 직업 · 총 종사자 ' +
    (root.value || 0).toLocaleString();
}

function labelOf(layer) {
  return ({
    employed: '종사자 수',
    wage: '평균 임금',
    education: '학력 요구',
    outlook: '직업 전망',
    ai_exposure: 'AI 노출도',
  })[layer];
}

function colorScale(layer, jobs) {
  const values = jobs.map((j) => j[layer]).filter((v) => v != null && !isNaN(v));
  if (layer === 'ai_exposure') {
    return d3.scaleSequential(d3.interpolateOrRd).domain([0, 10]);
  }
  if (layer === 'wage') {
    const ext = d3.extent(values);
    return d3.scaleSequential(d3.interpolateBlues).domain(ext);
  }
  if (layer === 'outlook') {
    return (v) => ({ 증가: '#2ecc71', 유지: '#95a5a6', 감소: '#e74c3c' })[v] || '#bbb';
  }
  if (layer === 'education') {
    return (v) =>
      ({
        고졸이하: '#3498db',
        전문대졸: '#2980b9',
        대졸: '#8e44ad',
        대학원: '#6c3483',
      })[v] || '#bbb';
  }
  const ext = d3.extent(values);
  return d3.scaleSequential(d3.interpolateGreys).domain([ext[0], ext[1] * 1.5]);
}

init();

// Tooltip CSS: white-space pre-line for newlines
const tipStyle = document.createElement('style');
tipStyle.textContent = '.tooltip { white-space: pre-line; }';
document.head.appendChild(tipStyle);
