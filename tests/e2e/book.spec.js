import { expect, test } from '@playwright/test';

const chapters = [
  '01-control-architecture.html', '02-sensor-lineage.html', '03-measurement-data-integrity.html',
  '04-spc-rational-subgroups.html', '05-shewhart-ewma-cusum.html', '06-fdc-trace-segmentation.html',
  '07-fdc-multivariate-false-alarms.html', '08-chamber-matching-tool-health.html',
  '09-run-to-run-apc.html', '10-feedforward-feedback-delays.html',
  '11-constraints-excursions-safe-response.html', '12-alarm-management-disposition.html',
  '13-synthetic-fab-case-studies.html', '14-verification-change-governance.html'
];

async function waitForLayoutFrames(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

test('all English and Korean chapters load with working language entry points', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const language of ['en', 'ko']) {
    const prefix = language === 'en' ? '' : 'ko/';
    for (const chapter of chapters) {
      await page.goto(`${prefix}chapters/${chapter}`);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('main h1')).not.toBeEmpty();
      await expect(page.getByRole('link', { name: language === 'en' ? '한국어' : 'English' })).toHaveAttribute('href', /chapters\//);
    }
  }
  expect(pageErrors).toEqual([]);
});

test('four bilingual laboratories execute and announce results', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  for (const language of ['en', 'ko']) {
    await page.goto(language === 'en' ? 'lab.html' : 'ko/lab.html');
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.locator('#run-spc').click();
    await expect(page.locator('#spc-results')).not.toContainText(language === 'en' ? 'Check the input' : '입력 범위를 확인');
    await expect(page.locator('#spc-chart polyline.signal')).not.toHaveAttribute('points', '');
    await expect(page.locator('#spc-chart line.limit')).toHaveCount(2);
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'Wilson interval' : '윌슨 구간');
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'point estimate' : '점 추정');
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'median detected-run delay (point estimate, samples)' : '검출 시행 중앙 지연(점 추정, 표본)');
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'trials=300' : '반복=300');
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'first alarm before change' : '변화 전 첫 알람');
    await expect(page.locator('#spc-results')).toContainText(language === 'en' ? 'prevents equal-ARL comparison' : '동일 ARL 비교가 아닙니다');

    await page.locator('#fdc-fault').selectOption('dropout');
    await page.locator('#run-fdc').click();
    await expect(page.locator('#fdc-results')).toContainText(language === 'en' ? 'spread z' : '산포 z');
    await expect(page.locator('#fdc-results')).toContainText(language === 'en' ? 'flagged' : '표시');
    await expect(page.locator('#fdc-results')).toContainText(language === 'en' ? 'CH2 30.0%' : 'CH2 30.0%');
    await expect(page.locator('#fdc-results')).toContainText(language === 'en' ? '36 feature comparisons' : '36개 특징 비교');
    await expect(page.locator('#fdc-chart polyline.signal-secondary')).toHaveCount(2);
    await waitForLayoutFrames(page);

    await page.locator('#run-apc').click();
    await expect(page.locator('#apc-results')).toContainText(language === 'en' ? 'RMSE' : 'RMSE');
    await page.locator('#apc-metrology-delay').fill('1');
    await page.locator('#run-apc').click();
    await expect(page.locator('#apc-results')).toContainText(language === 'en' ? 'after run 22 ← result from run 21' : '22번째 런 뒤 ← 21번째 런 결과');
    await expect(page.locator('#apc-results')).toContainText(language === 'en' ? 'Actuation delay dₐ=0' : '액추에이터 추가 지연 dₐ=0');
    await expect(page.locator('#apc-results')).toContainText(language === 'en' ? 'metrology delay m=1' : '계측 지연 m=1회');
    await page.locator('#run-alarm').click();
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'no-shift horizon alarm probability' : '무변화 전체 구간 알람 확률');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'Wilson interval' : '윌슨 구간');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'point estimate' : '점 추정');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'median detected-run delay (point estimate, samples)' : '검출 시행 중앙 지연(점 추정, 표본)');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'mean detected-run delay (point estimate, samples)' : '검출 시행 평균 지연(점 추정, 표본)');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? '300 independent synthetic trials' : '독립 합성 시행 300회');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'first alarm before event' : '사건 전 첫 알람');
    await expect(page.locator('#alarm-results')).toContainText(language === 'en' ? 'temporal correlation is absent' : '시간 상관은 없습니다');
  }
  expect(pageErrors).toEqual([]);
});

test('responsive pages fit their viewport and remain keyboard navigable', async ({ page }) => {
  for (const route of ['index.html', 'ko/index.html', 'lab.html', 'ko/lab.html']) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `${route} horizontal overflow at ${dimensions.viewport}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('class', /skip-link/);
    await expect(page.getByRole('navigation')).toBeVisible();
  }
});

test('new bilingual chapter figures and tables remain readable and scrollable', async ({ page }) => {
  const wideChapters = [chapters[0], chapters[6], ...chapters.slice(8, 14)];
  for (const language of ['en', 'ko']) {
    for (const chapter of wideChapters) {
      const route = `${language === 'en' ? '' : 'ko/'}chapters/${chapter}`;
      await page.goto(route);
      const region = page.locator('main .technical-scroll').first();
      await expect(region, `${route} scroll region`).toHaveCount(1);
      await expect(region).toHaveAttribute('tabindex', '0');
      const label = await region.getAttribute('aria-label');
      expect(label?.trim().length, `${route} region label`).toBeGreaterThan(0);

      if (chapter === chapters[0]) {
        await expect(region.locator('svg title, svg desc')).toHaveCount(2);
        const visual = await region.locator('svg').evaluate(svg => ({
          width: svg.getBoundingClientRect().width,
          textSize: Number.parseFloat(getComputedStyle(svg.querySelector('text')).fontSize)
        }));
        expect(visual.width, `${route} SVG rendered width`).toBeGreaterThanOrEqual(700);
        expect(visual.textSize, `${route} SVG label size`).toBeGreaterThanOrEqual(14);
      } else {
        await expect(region.locator('table caption')).not.toBeEmpty();
        expect(await region.locator('table th').count(), `${route} table headers`).toBeGreaterThan(1);
        const tableWidth = await region.locator('table').evaluate(table => table.getBoundingClientRect().width);
        expect(tableWidth, `${route} table rendered width`).toBeGreaterThanOrEqual(800);
      }

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth
      }));
      expect(dimensions.content, `${route} page horizontal overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
      const isScrollable = await region.evaluate(element => element.scrollWidth > element.clientWidth + 1);
      if (isScrollable) {
        await region.focus();
        await expect(region).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => region.evaluate(element => element.scrollLeft), {
          message: `${route} focused region did not scroll with ArrowRight`, timeout: 2000
        }).toBeGreaterThan(0);
      }
    }
  }
});

test('bilingual lab controls and results have accessible names and roles', async ({ page }) => {
  for (const language of ['en', 'ko']) {
    await page.goto(language === 'en' ? 'lab.html' : 'ko/lab.html');
    const unlabeled = await page.locator('.lab-controls input, .lab-controls select').evaluateAll(elements =>
      elements.filter(element => !element.labels?.length && !element.getAttribute('aria-label')).map(element => element.id)
    );
    expect(unlabeled, `${language} lab controls without an accessible label`).toEqual([]);
    await expect(page.getByRole('button')).toHaveCount(4);
    await expect(page.getByRole('status')).toHaveCount(4);
    await expect(page.locator('svg[role="img"][aria-label]')).toHaveCount(3);
  }
});
