import { simulateAlarm, simulateFdc, simulateR2r, simulateSpc } from './models.mjs';

const locale = document.documentElement.lang === 'ko' ? 'ko' : 'en';
const messages = {
  en: {
    noMonteCarlo: 'No detection within horizon', error: 'Check the input ranges and try again.',
    spcIntro: 'Synthetic Monte Carlo summary (finite horizon):', falseAlarm: 'no-shift horizon alarm probability', detection: 'post-change detection', medianDelay: 'median detected-run delay (point estimate, samples)', ci95: '95% Wilson interval',
    fdc: 'Phase feature summary:', flagged: 'flagged', clear: 'not flagged', missing: 'missing fraction', context: 'context mismatch', phaseNames: ['load','ramp','steady','purge'],
    meanFeature: 'max |mean z|', spreadFeature: 'max |spread z|', slopeFeature: 'max |slope z|',
    fdcLegend: 'Orange=pressure index; blue=flow index. Statistical threshold is per feature and is not multiplicity-adjusted; it is not an equipment alarm setting.',
    apc: 'Synthetic 70-run result:', rmse: 'post-disturbance RMSE', peak: 'peak |output|', saturation: 'actuator at limit',
    apcNote: (run) => `Disturbance starts at run ${run}. Orange=process output; blue=actuator correction.`,
    alarm: 'Synthetic Monte Carlo summary:', delay: 'median detected-run delay (point estimate, samples)', meanDelay: 'mean detected-run delay (point estimate, samples)',
    spcNote: (run, trials) => `Change begins at sample ${run}; trials=${trials}. “No detection within horizon” means no run signaled before the finite horizon.`,
    alarmNote: (trials, run, vote) => `${trials} independent synthetic trials; event starts at sample ${run}; vote=${vote}-of-n.`,
    percent: (x) => `${(100*x).toFixed(1)}%`, interval: (xs) => `${(100*xs[0]).toFixed(1)}–${(100*xs[1]).toFixed(1)}%`, samples: (x) => x === null ? '—' : `${x.toFixed(1)}`
  },
  ko: {
    noMonteCarlo: '관측 구간 내 검출 없음', error: '입력 범위를 확인하고 다시 실행하세요.',
    spcIntro: '합성 몬테카를로 요약(유한 구간):', falseAlarm: '무변화 전체 구간 알람 확률', detection: '변화 후 검출', medianDelay: '검출 시행 중앙 지연(점 추정, 표본)', ci95: '95% 윌슨 구간',
    fdc: '단계별 특징 요약:', flagged: '표시', clear: '미표시', missing: '결측 비율', context: '맥락 불일치', phaseNames: ['투입','상승','정상 처리','퍼지'],
    meanFeature: '최대 |평균 z|', spreadFeature: '최대 |산포 z|', slopeFeature: '최대 |기울기 z|',
    fdcLegend: '주황색=압력 지수, 파란색=유량 지수. 통계 임계값은 특징별로 적용하며 다중검정을 보정하지 않습니다. 장비 알람 설정값이 아닙니다.',
    apc: '합성 70회 런 결과:', rmse: '외란 후 RMSE', peak: '최대 |출력|', saturation: '액추에이터 한계 도달',
    apcNote: (run) => `외란은 ${run}번째 런부터 시작합니다. 주황색=공정 출력, 파란색=액추에이터 보정.`,
    alarm: '합성 몬테카를로 요약:', delay: '검출 시행 중앙 지연(점 추정, 표본)', meanDelay: '검출 시행 평균 지연(점 추정, 표본)',
    spcNote: (run, trials) => `변화 시작 표본=${run}; 반복=${trials}. ‘구간 내 검출 없음’은 유한 관측 구간 안에서 신호가 없었음을 뜻합니다.`,
    alarmNote: (trials, run, vote) => `독립 합성 시행 ${trials}회; 사건 시작 표본=${run}; 투표=${vote}-of-n.`,
    percent: (x) => `${(100*x).toFixed(1)}%`, interval: (xs) => `${(100*xs[0]).toFixed(1)}–${(100*xs[1]).toFixed(1)}%`, samples: (x) => x === null ? '—' : `${x.toFixed(1)}`
  }
}[locale];

function value(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing control ${id}`);
  const number = Number(element.value);
  if (!Number.isFinite(number)) throw new Error(`Invalid value ${id}`);
  return number;
}

function write(id, valueText) {
  const element = document.getElementById(id);
  if (element) element.textContent = valueText;
}

function error(id, err) {
  write(id, `${messages.error} ${err.message}`);
}

function draw(svg, series, { min = null, max = null, boundaries = [], horizontalLines = [] } = {}) {
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const width = 720, height = 260, left = 50, right = 700, top = 24, bottom = 225;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const values = series.flatMap(item => item.values).filter(Number.isFinite);
  if (!values.length) return;
  const lo = min ?? Math.min(-0.5, ...values), hi = max ?? Math.max(0.5, ...values);
  const span = Math.max(1e-9, hi - lo);
  const x = (i, count) => left + (count <= 1 ? 0 : i * (right - left) / (count - 1));
  const y = v => bottom - (v - lo) * (bottom - top) / span;
  for (const tick of [0, 0.5, 1]) {
    const yy = top + tick * (bottom - top);
    const line = document.createElementNS(NS, 'line'); line.setAttribute('x1', left); line.setAttribute('x2', right); line.setAttribute('y1', yy); line.setAttribute('y2', yy); line.setAttribute('class', tick === 0.5 ? 'axis' : 'zero'); svg.append(line);
  }
  for (const boundary of boundaries) {
    const line = document.createElementNS(NS, 'line'); line.setAttribute('x1', x(boundary, series[0].values.length)); line.setAttribute('x2', x(boundary, series[0].values.length)); line.setAttribute('y1', top); line.setAttribute('y2', bottom); line.setAttribute('class', 'limit'); svg.append(line);
  }
  for (const value of horizontalLines) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', left); line.setAttribute('x2', right);
    line.setAttribute('y1', y(value)); line.setAttribute('y2', y(value));
    line.setAttribute('class', 'limit'); svg.append(line);
  }
  series.forEach((item, index) => {
    const className = index % 2 ? 'signal-secondary' : 'signal';
    let points = [];
    const appendSegment = () => {
      if (points.length > 1) {
        const line = document.createElementNS(NS, 'polyline');
        line.setAttribute('points', points.join(' ')); line.setAttribute('class', className); svg.append(line);
      }
      points = [];
    };
    item.values.forEach((value, sample) => {
      if (Number.isFinite(value)) points.push(`${x(sample, item.values.length).toFixed(1)},${y(value).toFixed(1)}`);
      else appendSegment();
    });
    appendSegment();
  });
}

function runSpc() {
  try {
    const result = simulateSpc({ shift: value('spc-shift'), noise: value('spc-noise'), lambda: value('spc-lambda'), horizon: value('spc-horizon'), seed: value('spc-seed'), mode: document.getElementById('spc-mode').value });
    draw(document.getElementById('spc-chart'), [{ values: result.observations }], { min: -3.5, max: 3.5, horizontalLines: [-3, 3] });
    const lines = result.series.map(s => `${s.name}: ${messages.falseAlarm} ${messages.percent(s.falseAlarmRate)} (${messages.ci95} ${messages.interval(s.falseAlarmCI95)}), ${messages.detection} ${messages.percent(s.detectionRate)} (${messages.ci95} ${messages.interval(s.detectionCI95)}), ${messages.medianDelay} ${messages.samples(s.medianDelay)}`);
    write('spc-results', `${messages.spcIntro}\n${lines.join('\n')}\n${messages.spcNote(result.changeAt + 1, result.trials)}`);
  } catch (err) { error('spc-results', err); }
}

function runFdc() {
  try {
    const result = simulateFdc({ fault: document.getElementById('fdc-fault').value, threshold: value('fdc-threshold'), seed: value('fdc-seed') });
    draw(document.getElementById('fdc-chart'), [{ values: result.rows.map(r => r.values[0]) }, { values: result.rows.map(r => r.values[1]) }], { min: -0.2, max: 2.1, boundaries: [19.5, 39.5, 59.5] });
    const phaseIndex = new Map(['load', 'ramp', 'steady', 'purge'].map((name, i) => [name, messages.phaseNames[i]]));
    const lines = result.phaseMetrics.map(m => {
      const mean = Math.max(...m.channelFeatures.map(feature => Math.abs(feature.meanZ)));
      const spread = Math.max(...m.channelFeatures.map(feature => Math.abs(feature.dispersionZ)));
      const slope = Math.max(...m.channelFeatures.map(feature => Math.abs(feature.slopeZ)));
      return `${phaseIndex.get(m.phase)}: ${messages.meanFeature}=${mean.toFixed(2)}, ${messages.spreadFeature}=${spread.toFixed(2)}, ${messages.slopeFeature}=${slope.toFixed(2)} (${m.flagged ? messages.flagged : messages.clear}), ${messages.missing} ${(100*m.missingRate).toFixed(1)}%, ${messages.context} ${(100*m.contextMismatch).toFixed(1)}%`;
    });
    write('fdc-results', `${messages.fdc}\n${lines.join('\n')}\n${messages.fdcLegend}`);
  } catch (err) { error('fdc-results', err); }
}

function runApc() {
  try {
    const result = simulateR2r({ gain: value('apc-gain'), lag: value('apc-lag'), delay: value('apc-delay'), lambda: value('apc-lambda'), noise: value('apc-noise'), disturbance: value('apc-disturbance'), limit: value('apc-limit'), seed: value('apc-seed') });
    draw(document.getElementById('apc-chart'), [{ values: result.output }, { values: result.control }]);
    write('apc-results', `${messages.apc}\n${messages.rmse}: ${result.rmse.toFixed(3)}; ${messages.peak}: ${result.peak.toFixed(3)}; ${messages.saturation}: ${messages.percent(result.saturationFraction)}.\n${messages.apcNote(result.disturbanceAt + 1)}`);
  } catch (err) { error('apc-results', err); }
}

function runAlarm() {
  try {
    const result = simulateAlarm({ threshold: value('alarm-threshold'), persistence: value('alarm-persistence'), signals: value('alarm-signals'), vote: document.getElementById('alarm-vote').value, correlation: value('alarm-correlation'), shift: value('alarm-shift'), seed: value('alarm-seed') });
    write('alarm-results', `${messages.alarm}\n${messages.falseAlarm}: ${messages.percent(result.falseAlarmRate)} (${messages.ci95} ${messages.interval(result.falseAlarmCI95)}); ${messages.detection}: ${messages.percent(result.detectionRate)} (${messages.ci95} ${messages.interval(result.detectionCI95)}); ${messages.medianDelay}: ${messages.samples(result.medianDelay)}; ${messages.meanDelay}: ${messages.samples(result.meanDelay)}.\n${messages.alarmNote(result.trials, result.changeAt + 1, result.vote)}`);
  } catch (err) { error('alarm-results', err); }
}

document.getElementById('run-spc')?.addEventListener('click', runSpc);
document.getElementById('run-fdc')?.addEventListener('click', runFdc);
document.getElementById('run-apc')?.addEventListener('click', runApc);
document.getElementById('run-alarm')?.addEventListener('click', runAlarm);
