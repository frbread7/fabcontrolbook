import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRandom, simulateAlarm, simulateFdc, simulateR2r, simulateSpc } from '../assets/js/models.mjs';

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function wilson(successes, trials) {
  const z = 1.96, p = successes / trials, z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denominator;
  const half = z * Math.sqrt(p * (1 - p) / trials + z2 / (4 * trials * trials)) / denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

function referenceSpcRun({ shift, noise, lambda, horizon, seed, mode, inject }) {
  const rng = makeRandom(seed);
  const changeAt = Math.max(10, Math.floor(horizon / 6));
  let ewma = 0, positive = 0, negative = 0;
  const signalTimes = { Shewhart: null, EWMA: null, CUSUM: null };
  for (let i = 0; i < horizon; i += 1) {
    const postChange = inject && i >= changeAt;
    const mean = postChange ? (mode === 'drift' ? shift * Math.min(1, (i - changeAt + 1) / 20) : shift) : 0;
    const value = mean + noise * rng.normal();
    ewma = lambda * value + (1 - lambda) * ewma;
    const t = i + 1;
    const limit = 3 * Math.sqrt(lambda / (2 - lambda) * (1 - (1 - lambda) ** (2 * t)));
    positive = Math.max(0, positive + value - 0.5);
    negative = Math.max(0, negative - value - 0.5);
    const signals = { Shewhart: Math.abs(value) > 3, EWMA: Math.abs(ewma) > limit, CUSUM: positive > 5 || negative > 5 };
    for (const name of Object.keys(signals)) if (signals[name] && signalTimes[name] === null) signalTimes[name] = i;
  }
  return { changeAt, signalTimes };
}

function referenceSpcSummary(args) {
  const names = ['Shewhart', 'EWMA', 'CUSUM'];
  const baseline = [], shifted = [];
  for (let i = 0; i < args.trials; i += 1) {
    baseline.push(referenceSpcRun({ ...args, seed: (args.seed + i * 7919) >>> 0, inject: false }));
    shifted.push(referenceSpcRun({ ...args, seed: (args.seed + 0x51ed270b + i * 104729) >>> 0, inject: true }));
  }
  return names.map(name => {
    const falseAlarms = baseline.filter(run => run.signalTimes[name] !== null).length;
    const prechange = shifted.filter(run => run.signalTimes[name] !== null && run.signalTimes[name] < run.changeAt).length;
    const detected = shifted.filter(run => run.signalTimes[name] !== null && run.signalTimes[name] >= run.changeAt);
    const noSignal = args.trials - prechange - detected.length;
    const delays = detected.map(run => run.signalTimes[name] - run.changeAt + 1);
    return {
      name,
      falseAlarmRate: falseAlarms / args.trials,
      falseAlarmCI95: wilson(falseAlarms, args.trials),
      shiftedPrechangeFirstAlarmCount: prechange,
      shiftedPrechangeFirstAlarmRate: prechange / args.trials,
      shiftedPostchangeFirstAlarmCount: detected.length,
      shiftedPostchangeFirstAlarmRate: detected.length / args.trials,
      shiftedNoSignalCount: noSignal,
      shiftedNoSignalRate: noSignal / args.trials,
      detectionRate: detected.length / args.trials,
      detectionCI95: wilson(detected.length, args.trials),
      medianDelay: median(delays)
    };
  });
}

function referenceAlarmTrial({ threshold, persistence, signals, vote, correlation, shift, seed, horizon, inject }) {
  const rng = makeRandom(seed);
  const changeAt = Math.floor(horizon / 2);
  let consecutive = 0, resets = 0;
  for (let t = 0; t < horizon; t += 1) {
    const common = rng.normal();
    let qualifying = 0;
    for (let channel = 0; channel < signals; channel += 1) {
      const independent = rng.normal();
      const x = Math.sqrt(correlation) * common + Math.sqrt(1 - correlation) * independent +
        (inject && t >= changeAt && channel === 0 ? shift : 0);
      if (x > threshold) qualifying += 1;
    }
    if (qualifying >= vote) consecutive += 1;
    else {
      if (consecutive > 0) resets += 1;
      consecutive = 0;
    }
    if (consecutive >= persistence) return { alarmAt: t, resets };
  }
  return { alarmAt: null, resets };
}

function referenceAlarmSummary(args) {
  const vote = args.vote === 'majority' ? Math.floor(args.signals / 2) + 1 : args.vote === 'all' ? args.signals : Number(args.vote);
  const baseline = [], injected = [];
  for (let i = 0; i < args.trials; i += 1) {
    baseline.push(referenceAlarmTrial({ ...args, vote, seed: (args.seed + i * 3253) >>> 0, inject: false }));
    injected.push(referenceAlarmTrial({ ...args, vote, seed: (args.seed + 0x35415927 + i * 7919) >>> 0, inject: true }));
  }
  const changeAt = Math.floor(args.horizon / 2);
  const detected = injected.filter(run => run.alarmAt !== null && run.alarmAt >= changeAt);
  const preEvent = injected.filter(run => run.alarmAt !== null && run.alarmAt < changeAt).length;
  const noAlarm = args.trials - preEvent - detected.length;
  const delays = detected.map(run => run.alarmAt - changeAt + 1);
  return {
    result: {
      falseAlarmRate: baseline.filter(run => run.alarmAt !== null).length / args.trials,
      falseAlarmCI95: wilson(baseline.filter(run => run.alarmAt !== null).length, args.trials),
      injectedPreEventAlarmCount: preEvent,
      injectedPreEventAlarmRate: preEvent / args.trials,
      postEventDetectedCount: detected.length,
      detectionRate: detected.length / args.trials,
      detectionCI95: wilson(detected.length, args.trials),
      noFirstAlarmCount: noAlarm,
      noFirstAlarmRate: noAlarm / args.trials,
      medianDelay: median(delays),
      meanDelay: delays.length ? delays.reduce((sum, value) => sum + value, 0) / delays.length : null,
      trials: args.trials, vote, changeAt
    },
    resetCount: [...baseline, ...injected].reduce((sum, run) => sum + run.resets, 0)
  };
}

test('seeded random source is reproducible and finite', () => {
  const a = makeRandom(20261014);
  const b = makeRandom(20261014);
  assert.deepEqual(Array.from({ length: 8 }, () => a.normal()), Array.from({ length: 8 }, () => b.normal()));
  assert.throws(() => makeRandom(-1), RangeError);
});

test('SPC results are deterministic and match independent EWMA/CUSUM recurrences', () => {
  const args = { shift: 0.8, noise: 1, lambda: 0.25, horizon: 60, seed: 314159, trials: 50 };
  const first = simulateSpc(args);
  assert.deepEqual(first, simulateSpc(args));
  assert.equal(first.observations.length, 60);
  let ewma = 0, cp = 0, cm = 0;
  const expectedEwma = [], expectedCusum = [];
  for (const observation of first.observations) {
    ewma = args.lambda * observation + (1 - args.lambda) * ewma;
    cp = Math.max(0, cp + observation - 0.5);
    cm = Math.max(0, cm - observation - 0.5);
    expectedEwma.push(ewma);
    expectedCusum.push(cp - cm);
  }
  first.ewma.forEach((value, index) => assert.ok(Math.abs(value - expectedEwma[index]) < 1e-12));
  first.cusum.forEach((value, index) => assert.ok(Math.abs(value - expectedCusum[index]) < 1e-12));
  for (const chart of first.series) {
    assert.ok(chart.falseAlarmRate >= 0 && chart.falseAlarmRate <= 1);
    assert.ok(chart.detectionRate >= 0 && chart.detectionRate <= 1);
  }
  assert.deepEqual(first.series, referenceSpcSummary(args), 'signal-time rates and delay summary should match a direct finite-horizon calculation');
});

test('SPC rejects invalid ranges and modes', () => {
  assert.throws(() => simulateSpc({ lambda: 0 }), RangeError);
  assert.throws(() => simulateSpc({ horizon: 39 }), RangeError);
  assert.throws(() => simulateSpc({ trials: 49 }), RangeError);
  assert.throws(() => simulateSpc({ mode: 'oscillatory' }), RangeError);
});

test('FDC phase statistics expose expected deterministic injected signatures', () => {
  const normal = simulateFdc({ fault: 'normal', seed: 4107 });
  assert.deepEqual(normal, simulateFdc({ fault: 'normal', seed: 4107 }));
  assert.ok(normal.phaseMetrics.every(metric => !metric.flagged), 'the fixed nominal teaching seed should not flag');
  for (const fault of ['pressure-bias', 'flow-ripple', 'process-drift', 'dropout', 'phase-skip']) {
    const result = simulateFdc({ fault, seed: 4107 });
    assert.ok(result.phaseMetrics.some(metric => metric.flagged), `${fault} should raise a toy-baseline flag`);
  }
  const ripple = simulateFdc({ fault: 'flow-ripple', seed: 4107 }).phaseMetrics.find(metric => metric.phase === 'steady');
  assert.ok(Math.max(...ripple.channelFeatures.map(feature => Math.abs(feature.dispersionZ))) > 2.5);
  const skipped = simulateFdc({ fault: 'phase-skip', seed: 4107 }).phaseMetrics.find(metric => metric.phase === 'steady');
  assert.equal(skipped.contextMismatch, 1);
  const dropout = simulateFdc({ fault: 'dropout', seed: 4107 }).phaseMetrics.find(metric => metric.phase === 'steady');
  assert.equal(dropout.missingByChannel[1], 6 / 20);
  assert.equal(dropout.missingRate, 6 / 60);
  assert.throws(() => simulateFdc({ fault: 'unknown' }), RangeError);
  assert.throws(() => simulateFdc({ threshold: 5.1 }), RangeError);
});

test('FDC mean, dispersion, and slope statistics match direct reference calculations', () => {
  const result = simulateFdc({ fault: 'normal', seed: 9 });
  const phase = 'steady', channel = 1, center = 0.65, referenceSd = 0.08;
  const metric = result.phaseMetrics.find(item => item.phase === phase).channelFeatures[channel];
  const values = result.rows.filter(row => row.actualPhase === phase).map(row => row.values[channel]);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const expectedMeanZ = (mean - center) / (referenceSd / Math.sqrt(values.length));
  const sampleSd = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
  const expectedDispersionZ = (sampleSd - referenceSd) / (referenceSd / Math.sqrt(2 * (values.length - 1)));
  const indices = values.map((_, index) => index);
  const indexMean = indices.reduce((sum, value) => sum + value, 0) / indices.length;
  const sxx = indices.reduce((sum, value) => sum + (value - indexMean) ** 2, 0);
  const slope = indices.reduce((sum, value, index) => sum + (value - indexMean) * (values[index] - mean), 0) / sxx;
  const expectedSlopeZ = slope / (referenceSd / Math.sqrt(sxx));
  assert.ok(Math.abs(metric.meanZ - expectedMeanZ) < 1e-12);
  assert.ok(Math.abs(metric.dispersionZ - expectedDispersionZ) < 1e-12);
  assert.ok(Math.abs(metric.slopeZ - expectedSlopeZ) < 1e-12);
});

test('R2R recurrence matches a zero-noise/no-gain analytical case and delay order', () => {
  const staticPlant = simulateR2r({ gain: 0, lag: 0, delay: 0, lambda: 1, noise: 0, disturbance: 1, limit: 1.5, seed: 1, runs: 30 });
  assert.ok(staticPlant.output.slice(0, staticPlant.disturbanceAt).every(value => value === 0));
  assert.ok(staticPlant.output.slice(staticPlant.disturbanceAt).every(value => value === 1));
  assert.ok(staticPlant.control.every(value => value === 0));
  const delayed = simulateR2r({ gain: 0.5, lag: 0, delay: 1, lambda: 1, noise: 0, disturbance: 1, limit: 2, seed: 1, runs: 30 });
  assert.equal(delayed.output[delayed.disturbanceAt], 1);
  assert.equal(delayed.output[delayed.disturbanceAt + 1], 1);
  assert.ok(delayed.output[delayed.disturbanceAt + 2] < 1);
  assert.ok(Number.isFinite(delayed.rmse));
  const undisturbed = simulateR2r({ gain: 0.4, lag: 0, delay: 0, lambda: 1, noise: 0, disturbance: 0, limit: 1.5, seed: 1, runs: 30 });
  assert.ok(undisturbed.output.every(value => value === 0));
  assert.ok(undisturbed.control.every(value => value === 0));
  assert.throws(() => simulateR2r({ delay: 6 }), RangeError);
  assert.throws(() => simulateR2r({ gain: Number.NaN }), RangeError);
});

test('R2R nonzero-gain recurrence and actuator saturation match direct calculations', () => {
  const args = { gain: 0.4, lag: 0.2, delay: 0, lambda: 0.5, noise: 0, disturbance: 0.8, limit: 3, seed: 7, runs: 30 };
  const result = simulateR2r(args);
  let x = 0, estimate = 0, previous = 0;
  const output = [], controls = [];
  const disturbanceAt = Math.floor(args.runs * 0.3);
  for (let k = 0; k < args.runs; k += 1) {
    const applied = k - 1 - args.delay >= 0 ? controls[k - 1 - args.delay] : 0;
    const disturbance = k >= disturbanceAt ? args.disturbance : 0;
    x = args.lag * x + (1 - args.lag) * (disturbance + applied);
    estimate = args.lambda * x + (1 - args.lambda) * estimate;
    const action = Math.min(args.limit, Math.max(-args.limit, previous - args.gain * estimate));
    output.push(x); controls.push(action); previous = action;
  }
  assert.deepEqual(result.output, output);
  assert.deepEqual(result.control, controls);
  assert.ok(result.control[disturbanceAt] < 0, 'positive output disturbance must produce a negative corrective actuator action for positive unit gain');
  assert.ok(result.output[disturbanceAt + 2] < result.output[disturbanceAt + 1], 'the delayed plant response should recover after the corrective action is applied');

  const saturated = simulateR2r({ gain: 2, lag: 0, delay: 0, lambda: 1, noise: 0, disturbance: 2, limit: 0.2, seed: 1, runs: 30 });
  assert.equal(saturated.control[saturated.disturbanceAt], -0.2);
  assert.ok(saturated.control.every(value => Math.abs(value) <= 0.2));
  assert.ok(saturated.saturationFraction > 0);
});

test('R2R metrology delay is distinct from actuation delay and follows source-run recurrence', () => {
  const args = { gain: 0.5, lag: 0, delay: 0, metrologyDelay: 1, lambda: 1, noise: 0, disturbance: 1, limit: 3, seed: 1, runs: 30 };
  const result = simulateR2r(args);
  assert.equal(result.metrologySourceRun[0], null);
  assert.deepEqual(result.metrologySourceRun.slice(1), Array.from({ length: 29 }, (_, i) => i));
  assert.equal(result.control[0], 0, 'no metrology result means hold the prior command');
  assert.equal(result.control[result.disturbanceAt], 0, 'run k uses y[k−1], before current run result arrives');
  assert.ok(result.control[result.disturbanceAt + 1] < 0);
  const actuationOnly = simulateR2r({ ...args, metrologyDelay: 0, delay: 1 });
  assert.equal(actuationOnly.metrologySourceRun[0], 0, 'zero metrology delay reports current run result');
  assert.notDeepEqual(actuationOnly.control, result.control, 'actuation delay and measurement delay affect different recurrence stages');
  const prior = simulateR2r({ ...args, metrologyDelay: 0 });
  assert.deepEqual(prior.output, simulateR2r({ ...args, metrologyDelay: 0 }).output, 'm=0 stays deterministic');
  assert.throws(() => simulateR2r({ metrologyDelay: 6 }), RangeError);
});

test('R2R zero gain and actuator saturation retain their expected constraints', () => {
  const zeroGain = simulateR2r({ gain: 0, metrologyDelay: 3, noise: 0, seed: 1 });
  assert.ok(zeroGain.control.every(value => value === 0));
  const saturated = simulateR2r({ gain: 2, lag: 0, delay: 0, metrologyDelay: 0, lambda: 1, noise: 0, disturbance: 2, limit: 0.2, seed: 1, runs: 30 });
  assert.ok(saturated.control.every(value => Math.abs(value) <= 0.2));
  assert.ok(saturated.saturationFraction > 0);
});

test('alarm Monte Carlo is deterministic, bounded, and validates vote rules', () => {
  const args = { threshold: 2.2, persistence: 2, signals: 4, vote: 'majority', correlation: 0.3, shift: 2, seed: 123, horizon: 60, trials: 50 };
  const result = simulateAlarm(args);
  assert.deepEqual(result, simulateAlarm(args));
  for (const rate of [result.falseAlarmRate, result.detectionRate]) assert.ok(rate >= 0 && rate <= 1);
  assert.equal(result.vote, 3);
  assert.throws(() => simulateAlarm({ signals: 2, vote: '3' }), RangeError);
  assert.throws(() => simulateAlarm({ persistence: 0 }), RangeError);
});

test('alarm finite-horizon summaries match independent voting, persistence, and threshold calculations', () => {
  const args = { threshold: 1.3, persistence: 3, signals: 1, vote: 'all', correlation: 0, shift: 1.2, seed: 65, horizon: 60, trials: 50 };
  const expected = referenceAlarmSummary(args);
  const result = simulateAlarm(args);
  assert.equal(result.vote, 1, 'all-of-one is the 1-of-1 voting case');
  assert.deepEqual(result, expected.result);
  assert.ok(expected.resetCount > 0, 'the seeded reference traces must exercise persistence reset');

  const correlatedArgs = { threshold: 2.2, persistence: 2, signals: 4, vote: 'majority', correlation: 0.4, shift: 2, seed: 123, horizon: 60, trials: 50 };
  assert.deepEqual(simulateAlarm(correlatedArgs), referenceAlarmSummary(correlatedArgs).result);
  const strictThreshold = simulateAlarm({ ...correlatedArgs, threshold: 3.5 });
  const permissiveThreshold = simulateAlarm(correlatedArgs);
  assert.ok(strictThreshold.falseAlarmRate <= permissiveThreshold.falseAlarmRate);
  assert.ok(strictThreshold.detectionRate <= permissiveThreshold.detectionRate);
});
