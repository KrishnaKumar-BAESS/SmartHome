import { expect, test, type Page } from '@playwright/test';

// Measured design floors: WCAG AA contrast for derived tones and model text,
// no visible text under 11 px, and 40 px touch targets on coarse pointers.

const PALETTE = [
  '#7b83f6',
  '#4b8cf5',
  '#f2b33d',
  '#22b8a5',
  '#a374f2',
  '#f0644d',
  '#3ab0e6',
  '#e3679f',
  '#3dba7e',
  '#ec9a35',
  '#ef5b4b',
  '#8d97a6',
];
const PANEL = { light: [251, 252, 253], dark: [20, 24, 32] } as const;
const STAGE = { light: [237, 241, 245], dark: [17, 21, 28] } as const;
type Theme = keyof typeof PANEL;
type RGB = number[];
type Colour = { rgb: RGB; a: number };

const gam = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const lin = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

function oklab(L: number, a: number, b: number): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(Math.min(1, Math.max(0, gam(v))) * 255));
}

function parse(str: string): Colour {
  const [, fn, body] = str.match(/^(rgba?|oklab|color)\((.*)\)$/) ?? [];
  if (!fn) throw new Error(`Unparsed colour ${str}`);
  const [main, alpha] = body.replace('srgb ', '').split('/');
  const p = main.split(/[ ,]+/).filter(Boolean).map(Number);
  const a = alpha ? Number(alpha) : (p[3] ?? 1);
  if (fn === 'oklab') return { rgb: oklab(p[0], p[1], p[2]), a };
  if (fn === 'color') return { rgb: p.slice(0, 3).map((v) => v * 255), a };
  return { rgb: p.slice(0, 3), a };
}

const over = (fg: Colour, bg: readonly number[], op = 1): RGB =>
  fg.rgb.map((c, i) => c * fg.a * op + bg[i] * (1 - fg.a * op));
const lum = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => lin(c / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

async function open(page: Page, theme: Theme, hash: string) {
  await page.addInitScript((t) => {
    localStorage.setItem('housedocs-theme', t);
    localStorage.setItem('housedocs-hint', '1');
  }, theme);
  await page.goto(`/${hash}`);
  await expect(page.locator('main:not([data-intro])')).toHaveCount(1);
  // Let entrance fades finish so measured opacity is the resting value.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.timeline instanceof DocumentTimeline &&
            a.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

for (const theme of ['light', 'dark'] as const) {
  test(`derived text tones meet AA in ${theme}`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'Theme tokens do not depend on the viewport');
    await open(page, theme, '#m=overview');
    const samples = await page.evaluate(
      ({ palette, panel }) => {
        const box = document.createElement('div');
        box.className = 'app';
        box.style.cssText = `position:fixed;inset:0;z-index:999;background:rgb(${panel})`;
        document.querySelector('main')!.appendChild(box);
        const out: { name: string; fg: string; bg: string }[] = [];
        const probe = (name: string, html: string) => {
          box.innerHTML = html;
          const el = box.querySelector('[data-probe]') as HTMLElement;
          const cs = getComputedStyle(el);
          out.push({ name, fg: cs.color, bg: cs.backgroundColor });
        };
        for (const c of palette) {
          probe(
            `tag ${c}`,
            `<span data-probe class="tag" style="--c:${c}">X</span>`,
          );
          probe(
            `callout ${c}`,
            `<div data-probe class="callout" style="--c:${c}">X</div>`,
          );
          probe(
            `metric ${c}`,
            `<div class="metric" style="--c:${c}"><div data-probe class="metric-value">1</div></div>`,
          );
          probe(
            `chip ${c}`,
            `<div class="app" style="--accent:${c}"><button data-probe class="chip" aria-pressed="true">X</button></div>`,
          );
        }
        for (const t of ['t1', 't2', 't3', 't4', 't5', 't6'])
          probe(
            `text ${t}`,
            `<span data-probe style="color:var(--${t})">X</span>`,
          );
        box.remove();
        return out;
      },
      { palette: PALETTE, panel: PANEL[theme].join(',') },
    );
    const failing = samples
      .map((s) => {
        const bg = over(parse(s.bg), PANEL[theme]);
        return { name: s.name, ratio: ratio(over(parse(s.fg), bg), bg) };
      })
      .filter((s) => s.ratio < 4.5);
    expect(failing).toEqual([]);
  });

  test(`model text meets AA in ${theme}`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'Covered at the desktop layout');
    const failing: string[] = [];
    for (const hash of [
      '#m=overview&s=kitchen_breakfast_room',
      '#m=electrical&s=m10',
      '#m=upkeep&s=u6',
    ]) {
      await open(page, theme, hash);
      const texts = await page.evaluate(() =>
        [...document.querySelectorAll('#house-stage svg text')].map((t) => {
          const cs = getComputedStyle(t);
          let op = 1;
          for (
            let el: Element | null = t;
            el && el.tagName !== 'svg';
            el = el.parentElement
          )
            op *= parseFloat(getComputedStyle(el).opacity || '1');
          const sib = t.previousElementSibling;
          const halo = cs.stroke !== 'none' && parseFloat(cs.strokeWidth) >= 2;
          return {
            text: t.textContent ?? '',
            size: parseFloat(cs.fontSize),
            fill: cs.fill,
            op,
            bg: halo
              ? cs.stroke
              : sib && /rect|circle/.test(sib.tagName)
                ? getComputedStyle(sib).fill
                : null,
          };
        }),
      );
      for (const t of texts) {
        const bg = t.bg ? over(parse(t.bg), STAGE[theme]) : [...STAGE[theme]];
        const r = ratio(over(parse(t.fill), bg, t.op), bg);
        if (t.size < 11 || r < 4.5)
          failing.push(`${hash} "${t.text}" ${t.size}px ${r.toFixed(2)}:1`);
      }
    }
    expect(failing).toEqual([]);
  });
}

test('no visible text is smaller than 11 px', async ({ page }) => {
  const small = new Set<string>();
  for (const hash of ['#m=overview', '#m=lighting&s=l3', '#m=security&s=c1']) {
    await open(page, 'light', hash);
    for (const s of await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll('main *:not(svg *)')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || el.closest('[inert],[hidden]')) continue;
        const own = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent?.trim(),
        );
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (own && fs < 11) out.push(`${el.className} ${fs}px`);
      }
      return out;
    }))
      small.add(s);
  }
  expect([...small]).toEqual([]);
});

test('touch targets are at least 40 px on coarse pointers', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Applies to coarse pointers');
  const small = new Set<string>();
  for (const hash of ['#m=lighting&s=l3', '#m=security&s=c1']) {
    await open(page, 'light', hash);
    for (const listOpen of [false, true]) {
      if (listOpen)
        await page.getByRole('button', { name: 'List', exact: true }).click();
      for (const s of await page.evaluate(() => {
        const out: string[] = [];
        const sel =
          'main button, main [role=option], main a, main select, main input';
        for (const el of document.querySelectorAll(sel)) {
          if (el.closest('svg,[inert],[data-hidden="true"]')) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          if (r.bottom < 0 || r.top > innerHeight) continue;
          if (Math.round(r.width) < 40 || Math.round(r.height) < 40)
            out.push(
              `${el.getAttribute('aria-label') || el.textContent?.trim()} ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
        }
        return out;
      }))
        small.add(s);
    }
  }
  expect([...small]).toEqual([]);
});

test('panel header items never overlap at compact widths', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones stack the panels');
  await page.setViewportSize({ width: 1024, height: 768 });
  const overlaps: string[] = [];
  for (const mode of [
    'overview',
    'electrical',
    'lighting',
    'network',
    'sound',
    'security',
    'climate',
    'upkeep',
  ]) {
    await open(page, 'light', `#m=${mode}`);
    for (const o of await page.evaluate(() => {
      const out: string[] = [];
      for (const row of document.querySelectorAll('.panel-head-row')) {
        const kids = [...row.querySelectorAll('*')].filter(
          (el) => el.children.length === 0 && el.getBoundingClientRect().width,
        );
        for (let i = 0; i < kids.length; i++)
          for (let j = i + 1; j < kids.length; j++) {
            const a = kids[i].getBoundingClientRect(),
              b = kids[j].getBoundingClientRect();
            if (
              a.left < b.right - 1 &&
              b.left < a.right - 1 &&
              a.top < b.bottom - 1 &&
              b.top < a.bottom - 1
            )
              out.push(`${kids[i].textContent} / ${kids[j].textContent}`);
          }
      }
      return out;
    }))
      overlaps.push(`${mode}: ${o}`);
  }
  expect(overlaps).toEqual([]);
});

test('model labels and callouts never overlap', async ({ page, isMobile }) => {
  const sizes = isMobile
    ? [null]
    : [
        { width: 1440, height: 900 },
        { width: 1280, height: 720 },
        { width: 1024, height: 768 },
      ];
  const hits: string[] = [];
  for (const size of sizes) {
    if (size) await page.setViewportSize(size);
    for (const hash of [
      '#m=overview&s=kitchen_breakfast_room',
      '#m=electrical&s=m10',
      '#m=lighting&s=l3',
      '#m=network&s=n1',
      '#m=security&s=c5',
      '#m=climate&s=ts3',
      '#m=upkeep&s=u6',
    ]) {
      await open(page, 'light', hash);
      for (const h of await page.evaluate(() => {
        const boxes: { name: string; r: DOMRect }[] = [];
        for (const t of document.querySelectorAll('#house-stage svg text')) {
          if (t.closest('.callout-pin')) continue;
          boxes.push({
            name: t.textContent ?? '',
            r: t.getBoundingClientRect(),
          });
        }
        for (const c of document.querySelectorAll(
          '#house-stage .callout-pin rect',
        ))
          boxes.push({
            name: `callout ${c.parentElement?.textContent}`,
            r: c.getBoundingClientRect(),
          });
        const out: string[] = [];
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].r,
              b = boxes[j].r;
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (ox > 2 && oy > 2)
              out.push(`${boxes[i].name} × ${boxes[j].name}`);
          }
        return out;
      }))
        hits.push(`${size ? size.width : 'phone'} ${hash}: ${h}`);
    }
  }
  expect(hits).toEqual([]);
});

test('model translucency survives entrance fades', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Same renderer on every layout');
  const wrong: string[] = [];
  for (const hash of [
    '#m=overview&s=kitchen_breakfast_room',
    '#m=lighting',
    '#m=network&s=n1',
  ]) {
    await open(page, 'dark', hash);
    for (const w of await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll(
        '#house-stage svg [opacity]',
      )) {
        const cs = getComputedStyle(el);
        // Pulsing halos animate their own opacity on purpose.
        if (cs.animationName.includes('nodePulse')) continue;
        const want = parseFloat(el.getAttribute('opacity') || '1');
        const got = parseFloat(cs.opacity);
        if (got > want + 0.02)
          out.push(`${el.tagName}.${el.getAttribute('class')} ${want}→${got}`);
      }
      return out;
    }))
      wrong.push(`${hash}: ${w}`);
  }
  expect(wrong).toEqual([]);
});

test('help shortcut descriptions keep a readable width on phones', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Phone layout only.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Help and keyboard shortcuts' })
    .click();
  const widths = await page
    .locator('.keys')
    .first()
    .evaluate((table) => {
      const tw = table.getBoundingClientRect().width;
      return [...table.querySelectorAll('td')].map(
        (td) => td.getBoundingClientRect().width / tw,
      );
    });
  expect(widths.length).toBeGreaterThan(3);
  expect(Math.min(...widths)).toBeGreaterThan(0.9);
});

test('the search placeholder fits its field from tablet to desktop widths', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones use the one-word placeholder.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const width of [768, 834, 899, 900, 1024, 1180, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(
        () =>
          page.locator('.search-input').evaluate((input: HTMLInputElement) => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            ctx.font = getComputedStyle(input).font;
            return (
              ctx.measureText(input.placeholder).width <= input.clientWidth
            );
          }),
        { message: `placeholder fits at ${width}px` },
      )
      .toBe(true);
  }
});

test('printed inventory keeps short columns on one line', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Print layout is device-independent.');
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.print-only')).toBeVisible();
  const wrapped = await page.locator('.print-only td.nw').evaluateAll((cells) =>
    cells
      .filter((td) => {
        const range = document.createRange();
        range.selectNodeContents(td);
        const tops = new Set(
          [...range.getClientRects()].map((r) => Math.round(r.top)),
        );
        return tops.size > 1;
      })
      .map((td) => td.textContent),
  );
  expect(wrapped).toEqual([]);
  expect(await page.locator('.print-only td.nw').count()).toBeGreaterThan(50);
});

test('the active mode tab on phones sits clear of the scroll edge fade', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Phone mode row only.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const mode of ['upkeep', 'overview', 'sound']) {
    await page.goto(`/#m=${mode}`);
    const nav = page.getByRole('navigation', { name: 'Documentation views' });
    await expect
      .poll(
        () =>
          nav.evaluate((n) => {
            const a = n.querySelector('.is-active')!.getBoundingClientRect();
            const r = n.getBoundingClientRect();
            return a.left >= r.left + 10 && a.right <= r.right - 10;
          }),
        { message: mode },
      )
      .toBe(true);
  }
});

const ariaAudit = (page: Page) =>
  page.evaluate(() => {
    const shown = (e: Element) =>
      !e.closest('[inert],[hidden],[aria-hidden="true"]') &&
      (e as HTMLElement).getClientRects().length > 0;
    const named = (e: Element) =>
      !!(
        e.getAttribute('aria-label') ||
        (e.getAttribute('aria-labelledby') ?? '')
          .split(/\s+/)
          .some((id) => document.getElementById(id)?.textContent?.trim()) ||
        e.textContent?.trim() ||
        (e as HTMLElement).title ||
        (e as HTMLInputElement).labels?.length
      );
    const controls = [
      ...document.querySelectorAll(
        'button,a[href],[role=button],[role=option],input,select,[tabindex]:not([tabindex="-1"])',
      ),
    ].filter(shown);
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    const problems: string[] = [];
    for (const e of controls)
      if (!named(e)) problems.push(`unnamed ${e.outerHTML.slice(0, 80)}`);
    for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i)))
      problems.push(`duplicate id ${id}`);
    for (const attr of [
      'aria-controls',
      'aria-labelledby',
      'aria-describedby',
      'aria-activedescendant',
    ])
      document.querySelectorAll(`[${attr}]`).forEach((e) =>
        e
          .getAttribute(attr)!
          .split(/\s+/)
          .filter(Boolean)
          .forEach((id) => {
            if (!document.getElementById(id))
              problems.push(`${attr}=${id} missing`);
          }),
      );
    return [...new Set(problems)];
  });

test('every view keeps controls named and ARIA references valid', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const mode of [
    'overview',
    'electrical',
    'lighting',
    'network',
    'sound',
    'security',
    'climate',
    'upkeep',
  ]) {
    await page.goto(`/#m=${mode}`);
    expect(await ariaAudit(page), mode).toEqual([]);
  }
  await page.getByRole('combobox', { name: 'Search home inventory' }).focus();
  await expect(page.locator('#search-listbox')).toBeVisible();
  expect(await ariaAudit(page), 'search open').toEqual([]);
  await page.keyboard.press('Escape');
  if (!isMobile) {
    await page.getByRole('button', { name: 'View options' }).click();
    await expect(page.locator('#view-options')).toBeVisible();
    expect(await ariaAudit(page), 'view options open').toEqual([]);
  }
});

test('the full-height phone sheet is opaque', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone sheet only.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.sheet-grip-hit').click();
  const sheet = page.locator('#panel-right');
  await expect(sheet).toHaveAttribute('data-full', 'true');
  const layers = await sheet.evaluate(
    (el) => getComputedStyle(el).backgroundImage,
  );
  expect(layers).toContain('linear-gradient');
  const base = await sheet.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(base).toMatch(/^rgb\(/);
});

test('speaker markers sit centred on their schematic positions', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Same layout on every device.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#m=sound');
  await page.locator('#panel-left [role=option]').first().click();
  const map = page.locator('.speaker-map');
  await expect(map).toBeVisible();
  await page.waitForTimeout(600);
  const off = await map.evaluate((m) => {
    const box = m.getBoundingClientRect();
    return [...m.querySelectorAll<HTMLElement>('.speaker')].map((el) => {
      const r = el.getBoundingClientRect();
      const x = box.left + (parseFloat(el.style.left) / 100) * box.width;
      const y = box.top + (parseFloat(el.style.top) / 100) * box.height;
      return Math.max(
        Math.abs(r.left + r.width / 2 - x),
        Math.abs(r.top + r.height / 2 - y),
      );
    });
  });
  expect(off.length).toBeGreaterThan(10);
  expect(Math.max(...off)).toBeLessThan(1.5);
});

test('detail specs never repeat the title or subtitle', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Same content on every device.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const repeats: string[] = [];
  for (const mode of [
    'electrical',
    'lighting',
    'network',
    'sound',
    'security',
    'climate',
    'upkeep',
  ]) {
    await page.goto(`/#m=${mode}`);
    const rows = page.locator('#panel-left [role=option]');
    const n = Math.min(await rows.count(), 6);
    for (let i = 0; i < n; i++) {
      await rows.nth(i).click();
      repeats.push(
        ...(await page.locator('#panel-right').evaluate((panel, m) => {
          const head = [
            panel.querySelector('.det-title')?.textContent,
            panel.querySelector('.det-sub')?.textContent,
          ]
            .map((t) => t?.trim())
            .filter(Boolean);
          return [...panel.querySelectorAll('.kv-row')]
            .filter((row) => {
              const dd = row.querySelector('dd');
              const value = (
                dd?.firstChild?.textContent ??
                dd?.textContent ??
                ''
              ).trim();
              return head.includes(value);
            })
            .map(
              (row) =>
                `${m}: ${head[0]} → ${row.querySelector('dt')?.textContent}`,
            );
        }, mode)),
      );
    }
  }
  expect(repeats).toEqual([]);
});
