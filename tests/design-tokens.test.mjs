import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Guarda da identidade visual. A paleta oficial vem do manual em
// docs/identidade visual/ e é documentada em docs/DESIGN_SYSTEM.md.
// Estes testes impedem: trocar os valores de marca, introduzir cor nova fora
// dos tokens, voltar a usar texto abaixo de 12px, referenciar token
// inexistente e montar `var(--x)26` (alfa colado em var() é inválido).
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

const brand = {
  deep: '#023859',
  primary: '#0367A6',
  medium: '#0379A6',
  cyan: '#049DBF',
  neutral: '#F2F2F2',
};

// Dívida visual registrada: cores que ainda existem em src/app/globals.css e
// não são tokens. A lista só pode encolher. Ao migrar um valor para token,
// remova-o daqui.
const legacyAllowlist = new Set([
  '#000', '#00000024', '#00000038', '#00000059',
  '#0367a633', '#049dbf26',
  '#081a33', '#0b2448', '#0d2344d9', '#0d2a57', '#163761', '#173c78',
  '#1c4d95', '#2f5aa8', '#3e5c8c', '#4f74bc', '#5b79b4', '#5b7fc7',
  '#749876', '#74a4ff', '#74a4ff00', '#74a4ff26', '#74a4ff59',
  '#7e9bc9', '#7f92ab', '#7fa8ff', '#8aa3c6', '#8db4ff', '#8db6ff',
  '#8ea4c4', '#8eaa9b', '#8eb4f5', '#8fa7c9', '#9db3d4', '#9db4d8',
  '#9dc0ff', '#9fb9e6', '#a4b8d6', '#a8bcd8', '#a9bedd', '#a9bfdd',
  '#a9bfdf', '#b4c7e3', '#b7c7de', '#b7c9e4', '#b9cbe6', '#b9cbea',
  '#b9cdef', '#bcd4ff', '#c6d6ee', '#c7d6ef', '#c7d7ef', '#cfdcf1',
  '#cfe0ff', '#d3e2ff', '#d5e0f1', '#d5e2f7', '#d6e2f5', '#d6e4fb',
  '#d9e2f0', '#dbe5f5', '#dce7f7', '#e4edff', '#e7edf8',
  '#e9f0fd', '#eaf1ff', '#eef2fa',
  '#ffffff0a', '#ffffff0d', '#ffffff0f', '#ffffff10',
  '#ffffff12', '#ffffff14', '#ffffff17', '#ffffff1a', '#ffffff1c',
  '#ffffff1f', '#ffffff24', '#ffffff26', '#ffffff2b', '#ffffff2e',
  '#ffffff52', '#ffffff8c', '#ffffffeb', '#ffffffed',
]);

function luminance(hex) {
  const normalized = hex.replace('#', '');
  const channels = [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255);
  const linear = channels.map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}

function tokenValue(css, name) {
  const match = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

function resolve(css, value, depth = 0) {
  const reference = value && value.match(/^var\((--[a-z0-9-]+)\)$/i);
  if (!reference || depth > 4) return value;
  return resolve(css, tokenValue(css, reference[1]), depth + 1);
}


test('tokens definem a paleta exata do manual de identidade', async () => {
  const tokens = await read('src/styles/tokens.css');
  const pairs = [
    ['--brand-deep', brand.deep],
    ['--brand-primary', brand.primary],
    ['--brand-medium', brand.medium],
    ['--brand-cyan', brand.cyan],
    ['--brand-neutral', brand.neutral],
    ['--color-primary', brand.primary],
    ['--color-bg', brand.neutral],
  ];
  for (const [token, expected] of pairs) {
    const value = resolve(tokens, tokenValue(tokens, token));
    assert.equal(String(value).toUpperCase(), expected.toUpperCase(), `${token} deveria ser ${expected}`);
  }
});

test('nenhuma cor nova entra no CSS fora dos tokens', async () => {
  const css = await read('src/app/globals.css');
  const found = new Set((css.match(/#[0-9a-fA-F]{3,8}/g) ?? []).map(value => value.toLowerCase()));
  const unexpected = [...found].filter(value => !legacyAllowlist.has(value));
  assert.deepEqual(unexpected, [], `cores fora da identidade: ${unexpected.join(', ')}`);
});

test('a paleta navy anterior não volta para o CSS global', async () => {
  const css = (await read('src/app/globals.css')).toLowerCase();
  for (const retired of ['#0a1f44', '#07162b', '#1d4ed8', '#2f6fed']) {
    assert.equal(css.includes(retired), false, `${retired} foi substituído pela paleta da marca`);
  }
});

test('a dívida de cor só encolhe: nada na lista pode ficar sem uso', async () => {
  const css = (await read('src/app/globals.css')).toLowerCase();
  const stale = [...legacyAllowlist].filter(value => !css.includes(value));
  assert.deepEqual(
    stale,
    [],
    `remova da legacyAllowlist os valores já migrados para token: ${stale.join(', ')}`,
  );
});

test('a serifa aposentada em 09/11/2026 não volta ao CSS global', async () => {
  const css = await read('src/app/globals.css');
  assert.doesNotMatch(
    css,
    /georgia|times new roman/i,
    'a identidade usa a sans definida em --font-display; a serifa foi retirada do produto',
  );
});

test('legibilidade: piso de 12px para texto e alvos de toque no menu', async () => {
  const [tokens, css] = await Promise.all([
    read('src/styles/tokens.css'),
    read('src/app/globals.css'),
  ]);
  const small = [...css.matchAll(/font-size:([0-9.]+)px/g)]
    .map(match => Number(match[1]))
    .filter(value => value < 12);
  assert.deepEqual(small, [], `font-size abaixo de 12px: ${small.join(', ')}`);
  assert.match(tokens, /--text-2xs:\s*12px/);
  assert.match(css, /\.mobile-navigation nav a\{[^}]*min-height:44px/, 'item do menu mobile precisa de 44px de altura');
  assert.match(css, /\.mobile-navigation summary\{[^}]*min-height:44px/, 'acionador do menu mobile precisa de 44px de altura');
});

test('tokens referenciados existem e alfa não é colado em var()', async () => {
  const [tokens, globals] = await Promise.all([
    read('src/styles/tokens.css'),
    read('src/app/globals.css'),
  ]);
  const declared = new Set(
    [...`${tokens}${globals}`.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(match => match[1].toLowerCase()),
  );
  const referenced = new Set(
    [...`${tokens}${globals}`.matchAll(/var\((--[a-z0-9-]+)/gi)].map(match => match[1].toLowerCase()),
  );
  const missing = [...referenced].filter(name => !declared.has(name));
  assert.deepEqual(missing, [], `tokens inexistentes: ${missing.join(', ')}`);
  assert.doesNotMatch(globals, /var\(--[a-z0-9-]+\)[0-9a-fA-F]{2}/, 'alfa não pode ser colado em var()');
});

test('contraste AA nos pares de texto da identidade', async () => {
  const tokens = await read('src/styles/tokens.css');
  const pairs = [
    ['--color-ink', '--color-bg'],
    ['--color-ink', '--color-surface'],
    ['--color-muted', '--color-bg'],
    ['--color-primary', '--color-bg'],
    ['--color-primary', '--color-surface'],
    ['--color-on-brand', '--color-primary'],
    ['--color-info', '--color-bg'],
    ['--color-success', '--color-success-soft'],
    ['--color-warning-text', '--color-warning-soft'],
    ['--color-neutral-strong', '--color-neutral-soft'],
    ['--color-danger', '--color-bg'],
  ];
  for (const [foreground, background] of pairs) {
    const ratio = contrast(
      resolve(tokens, tokenValue(tokens, foreground)),
      resolve(tokens, tokenValue(tokens, background)),
    );
    assert.ok(ratio >= 4.5, `${foreground} sobre ${background} tem ${ratio}:1 (mínimo 4,5)`);
  }
  assert.ok(contrast(brand.deep, brand.neutral) >= 7, 'azul profundo precisa de contraste AAA sobre o fundo');
  assert.ok(contrast('#FFFFFF', brand.primary) >= 4.5, 'texto branco sobre o azul principal precisa de AA');
});
