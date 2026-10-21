const finite = (name, value, min, max) => {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be in [${min}, ${max}]`);
};
const integer = (name, value, min, max) => {
  finite(name, value, min, max);
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be an integer`);
};
const clamp = (x, low, high) => Math.min(high, Math.max(low, x));

export function makeRandom(seed) {
  integer('seed', seed, 0, 0xffffffff);
  let state = (seed >>> 0) || 0x9e3779b9;
  let spare = null;
  const uniform = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const normal = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    const u1 = Math.max(Number.MIN_VALUE, uniform());
    const u2 = uniform();
    const radius = Math.sqrt(-2 * Math.log(u1));
    spare = radius * Math.sin(2 * Math.PI * u2);
    return radius * Math.cos(2 * Math.PI * u2);
  };
  return { uniform, normal };
}

function oneSpcRun({ shift, noise, lambda, horizon, seed, mode, inject }) {
  const rng = makeRandom(seed);
  const changeAt = Math.max(10, Math.floor(horizon / 6));
  let ewma = 0, cp = 0, cm = 0;
  const signalTimes = { Shewhart: null, EWMA: null, CUSUM: null };
  const observations = [], ewmaTrace = [], cusumTrace = [];
  for (let i = 0; i < horizon; i += 1) {
    let mean = 0;
    if (inject && i >= changeAt) {
      mean = mode === 'drift' ? shift * Math.min(1, (i - changeAt + 1) / 20) : shift;
    }
    const z = mean + noise * rng.normal();
    ewma = lambda * z + (1 - lambda) * ewma;
    const t = i + 1;
    const ewmaSigma = Math.sqrt(lambda / (2 - lambda) * (1 - Math.pow(1 - lambda, 2 * t)));
    cp = Math.max(0, cp + z - 0.5);
    cm = Math.max(0, cm - z - 0.5);
    const checks = { Shewhart: Math.abs(z) > 3, EWMA: Math.abs(ewma) > 3 * ewmaSigma, CUSUM: cp > 5 || cm > 5 };
    observations.push(z); ewmaTrace.push(ewma); cusumTrace.push(cp - cm);
    for (const name of Object.keys(checks)) if (checks[name] && signalTimes[name] === null) signalTimes[name] = i;
  }
  return { changeAt, signalTimes, observations, ewmaTrace, cusumTrace };
}

function median(values) {
  if (!values.length) return null;
  const xs = [...values].sort((a, b) => a - b);
  const middle = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[middle] : (xs[middle - 1] + xs[middle]) / 2;
}

function wilsonInterval(successes, trials) {
  const z = 1.96;
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denominator;
  const halfWidth = z * Math.sqrt(p * (1 - p) / trials + z2 / (4 * trials * trials)) / denominator;
  return [Math.max(0, center - halfWidth), Math.min(1, center + halfWidth)];
}

export function simulateSpc({ shift = 1, noise = 1, lambda = 0.2, horizon = 120, seed = 1, mode = 'step', trials = 300 } = {}) {
  finite('shift', shift, 0, 3); finite('noise', noise, 0.25, 2); finite('lambda', lambda, 0.05, 1);
  integer('horizon', horizon, 40, 300); integer('seed', seed, 1, 0xffffffff); integer('trials', trials, 50, 1000);
  if (!['step', 'drift'].includes(mode)) throw new RangeError('mode must be step or drift');
  const baseline = [];
  const shifted = [];
  for (let i = 0; i < trials; i += 1) {
    baseline.push(oneSpcRun({ shift, noise, lambda, horizon, seed: (seed + i * 7919) >>> 0, mode, inject: false }));
    shifted.push(oneSpcRun({ shift, noise, lambda, horizon, seed: (seed + 0x51ed270b + i * 104729) >>> 0, mode, inject: true }));
  }
  const series = ['Shewhart', 'EWMA', 'CUSUM'].map(name => {
    const falseAlarms = baseline.filter(run => run.signalTimes[name] !== null).length;
    const prechange = shifted.filter(run => run.signalTimes[name] !== null && run.signalTimes[name] < run.changeAt).length;
    const detections = shifted.filter(run => run.signalTimes[name] !== null && run.signalTimes[name] >= run.changeAt);
    const noSignal = shifted.length - prechange - detections.length;
    const delays = detections.map(run => run.signalTimes[name] - run.changeAt + 1);
    return {
      name,
      falseAlarmRate: falseAlarms / trials,
      falseAlarmCI95: wilsonInterval(falseAlarms, trials),
      shiftedPrechangeFirstAlarmCount: prechange,
      shiftedPrechangeFirstAlarmRate: prechange / trials,
      shiftedPostchangeFirstAlarmCount: detections.length,
      shiftedPostchangeFirstAlarmRate: detections.length / trials,
      shiftedNoSignalCount: noSignal,
      shiftedNoSignalRate: noSignal / trials,
      detectionRate: detections.length / trials,
      detectionCI95: wilsonInterval(detections.length, trials),
      medianDelay: median(delays)
    };
  });
  const example = oneSpcRun({ shift, noise, lambda, horizon, seed: (seed ^ 0xa5a5a5a5) >>> 0, mode, inject: true });
  return { changeAt: example.changeAt, observations: example.observations, ewma: example.ewmaTrace, cusum: example.cusumTrace, series, trials };
}

const PHASES = ['load', 'ramp', 'steady', 'purge'];
const NOMINAL = {
  load: [0.18, 0.25, 0.16], ramp: [0.86, 0.72, 0.92],
  steady: [0.78, 0.65, 0.88], purge: [0.22, 0.3, 0.2]
};

export function simulateFdc({ fault = 'normal', threshold = 2.5, seed = 1 } = {}) {
  finite('threshold', threshold, 0.5, 5); integer('seed', seed, 1, 0xffffffff);
  const valid = ['normal', 'pressure-bias', 'flow-ripple', 'process-drift', 'dropout', 'phase-skip'];
  if (!valid.includes(fault)) throw new RangeError('unsupported fault scenario');
  const rng = makeRandom(seed);
  const rows = [];
  for (let t = 0; t < 80; t += 1) {
    const phaseIndex = Math.floor(t / 20);
    const phase = PHASES[phaseIndex];
    const expectedPhase = fault === 'phase-skip' && t >= 40 && t < 60 ? PHASES[3] : phase;
    const values = NOMINAL[phase].map((center, channel) => center + 0.08 * rng.normal());
    if (fault === 'pressure-bias' && t >= 40 && t < 60) values[0] += 0.9;
    if (fault === 'flow-ripple' && t >= 40 && t < 60) values[1] += 0.8 * Math.sin(2 * Math.PI * (t - 40) / 5);
    if (fault === 'process-drift' && t >= 40 && t < 60) values[0] += 0.8 * (t - 39) / 20;
    const missing = fault === 'dropout' && t >= 43 && t <= 48;
    if (missing) values[1] = null;
    rows.push({ t, phase: expectedPhase, actualPhase: phase, values });
  }
  const phaseMetrics = PHASES.map(phase => {
    const rowsInPhase = rows.filter(row => row.actualPhase === phase);
    const channelFeatures = [0, 1, 2].map(channel => {
      const points = rowsInPhase.map((row, index) => ({ index, value: row.values[channel] }))
        .filter(point => Number.isFinite(point.value));
      if (points.length < 2) return { meanZ: 0, dispersionZ: 0, slopeZ: 0 };
      const values = points.map(point => point.value);
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const expected = NOMINAL[phase][channel];
      const sumSquares = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
      const sampleSd = Math.sqrt(sumSquares / (values.length - 1));
      const indexMean = points.reduce((sum, point) => sum + point.index, 0) / points.length;
      const sxx = points.reduce((sum, point) => sum + (point.index - indexMean) ** 2, 0);
      const slope = points.reduce((sum, point) => sum + (point.index - indexMean) * (point.value - mean), 0) / sxx;
      const referenceSd = 0.08;
      return {
        meanZ: (mean - expected) / (referenceSd / Math.sqrt(points.length)),
        // Normal-theory approximation: SE(s) ≈ σ/√(2(n−1)) for a stable Gaussian trace.
        dispersionZ: (sampleSd - referenceSd) / (referenceSd / Math.sqrt(2 * (points.length - 1))),
        // Under the declared iid Gaussian baseline, this is the OLS slope divided by its known-σ SE.
        slopeZ: slope / (referenceSd / Math.sqrt(sxx))
      };
    });
    const missingByChannel = [0, 1, 2].map(channel => rowsInPhase.filter(row => row.values[channel] === null).length / rowsInPhase.length);
    const missingRate = rowsInPhase.flatMap(row => row.values).filter(value => value === null).length / (rowsInPhase.length * 3);
    const contextMismatch = rowsInPhase.filter(row => row.phase !== phase).length / rowsInPhase.length;
    const featureScores = channelFeatures.flatMap(features => [features.meanZ, features.dispersionZ, features.slopeZ]);
    const score = Math.max(...featureScores.map(Math.abs));
    const flagged = score > threshold || missingRate > 0 || contextMismatch > 0;
    return { phase, score, flagged, missingRate, missingByChannel, contextMismatch, channelFeatures };
  });
  return { rows, phaseMetrics, fault, threshold };
}

export function simulateR2r({ gain = 0.45, lag = 0.25, delay = 0, metrologyDelay = 0, lambda = 0.35, noise = 0.08, disturbance = 1, limit = 1.5, seed = 1, runs = 70 } = {}) {
  finite('gain', gain, 0, 2); finite('lag', lag, 0, 0.9); integer('delay', delay, 0, 5);
  integer('metrologyDelay', metrologyDelay, 0, 5);
  finite('lambda', lambda, 0.05, 1); finite('noise', noise, 0, 0.5); finite('disturbance', disturbance, 0, 2); finite('limit', limit, 0.2, 3);
  integer('seed', seed, 1, 0xffffffff); integer('runs', runs, 30, 200);
  const rng = makeRandom(seed);
  const output = [], measured = [], control = [], metrologySourceRun = [];
  let x = 0, ewma = 0, previousControl = 0;
  const disturbanceAt = Math.floor(runs * 0.3);
  for (let k = 0; k < runs; k += 1) {
    const appliedIndex = k - 1 - delay;
    const applied = appliedIndex >= 0 ? control[appliedIndex] : 0;
    const d = k >= disturbanceAt ? disturbance : 0;
    x = lag * x + (1 - lag) * (d + applied);
    const observation = x + noise * rng.normal();
    const sourceRun = k - metrologyDelay;
    if (sourceRun >= 0) {
      const result = sourceRun === k ? observation : measured[sourceRun];
      ewma = lambda * result + (1 - lambda) * ewma;
      previousControl = clamp(previousControl - gain * ewma, -limit, limit);
    }
    output.push(x); measured.push(observation); control.push(previousControl);
    metrologySourceRun.push(sourceRun >= 0 ? sourceRun : null);
  }
  const post = output.slice(disturbanceAt);
  const rmse = Math.sqrt(post.reduce((sum, value) => sum + value * value, 0) / post.length);
  const saturationFraction = control.filter(value => Math.abs(value) >= limit - 1e-12).length / runs;
  return { output, measured, control, metrologySourceRun, disturbanceAt, rmse, peak: Math.max(...output.map(Math.abs)), saturationFraction };
}

function alarmTrial({ threshold, persistence, signals, vote, correlation, shift, seed, horizon, inject }) {
  const rng = makeRandom(seed);
  const changeAt = Math.floor(horizon / 2);
  let consecutive = 0;
  for (let t = 0; t < horizon; t += 1) {
    const common = rng.normal();
    let count = 0;
    for (let channel = 0; channel < signals; channel += 1) {
      const independent = rng.normal();
      const value = Math.sqrt(correlation) * common + Math.sqrt(1 - correlation) * independent +
        (inject && t >= changeAt && channel === 0 ? shift : 0);
      if (value > threshold) count += 1;
    }
    if (count >= vote) consecutive += 1; else consecutive = 0;
    if (consecutive >= persistence) return t;
  }
  return null;
}

export function simulateAlarm({ threshold = 2.5, persistence = 2, signals = 4, vote = '1', correlation = 0.2, shift = 2.5, seed = 1, horizon = 100, trials = 300 } = {}) {
  finite('threshold', threshold, 1, 4); integer('persistence', persistence, 1, 8); integer('signals', signals, 1, 8);
  finite('correlation', correlation, 0, 0.8); finite('shift', shift, 0.5, 4); integer('seed', seed, 1, 0xffffffff);
  integer('horizon', horizon, 60, 200); integer('trials', trials, 50, 1000);
  const required = vote === 'majority' ? Math.floor(signals / 2) + 1 : vote === 'all' ? signals : Number(vote);
  integer('vote threshold', required, 1, signals);
  const falseAlarms = [], injectedAlarmTimes = [];
  for (let i = 0; i < trials; i += 1) {
    falseAlarms.push(alarmTrial({ threshold, persistence, signals, vote: required, correlation, shift, seed: (seed + i * 3253) >>> 0, horizon, inject: false }));
    injectedAlarmTimes.push(alarmTrial({ threshold, persistence, signals, vote: required, correlation, shift, seed: (seed + 0x35415927 + i * 7919) >>> 0, horizon, inject: true }));
  }
  const changeAt = Math.floor(horizon / 2);
  const preEventCount = injectedAlarmTimes.filter(time => time !== null && time < changeAt).length;
  const valid = injectedAlarmTimes.filter(time => time !== null && time >= changeAt);
  const noAlarmCount = trials - preEventCount - valid.length;
  const delays = valid.map(time => time - changeAt + 1);
  const falseAlarmCount = falseAlarms.filter(time => time !== null).length;
  return {
    falseAlarmRate: falseAlarmCount / trials,
    falseAlarmCI95: wilsonInterval(falseAlarmCount, trials),
    injectedPreEventAlarmCount: preEventCount,
    injectedPreEventAlarmRate: preEventCount / trials,
    postEventDetectedCount: valid.length,
    detectionRate: valid.length / trials,
    detectionCI95: wilsonInterval(valid.length, trials),
    noFirstAlarmCount: noAlarmCount,
    noFirstAlarmRate: noAlarmCount / trials,
    medianDelay: median(delays),
    meanDelay: delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null,
    trials, vote: required, changeAt
  };
}
