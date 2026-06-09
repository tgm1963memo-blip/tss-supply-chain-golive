/**
 * Legacy function coverage audit — tgm-supplychain → tss-supply-chain-golive
 * Run: npm run legacy:audit
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEGACY_FUNCTIONS,
  LEGACY_WORKFLOW_FUNCTIONS,
  CRITICAL_HANDLERS,
} from './legacy-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const LEGACY_INDEX = resolve(
  'C:/Users/TSS/OneDrive/เดสก์ท็อป/IT/Code old project/tgm-supplychain/index.html',
);

function readText(relPath) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) return '';
  return readFileSync(abs, 'utf8');
}

function readAllFiles(dir, acc = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return acc;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) readAllFiles(p, acc);
    else acc.push(p.replace(/\\/g, '/'));
  }
  return acc;
}

function extractPgFunctions(html) {
  const re = /function\s+(pg[A-Za-z0-9_]+)\s*\(/g;
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set].sort();
}

function extractMenuMap(html) {
  const match = html.match(
    /\(\{dash:pgDash[^}]+\}\)\[page\]/,
  );
  if (!match) return {};
  const pairs = [...match[0].matchAll(/(\w+):pg[A-Za-z0-9_]+/g)];
  const map = {};
  for (const p of pairs) map[p[1]] = true;
  return map;
}

function extractLegacyConstants(html) {
  const found = {};
  if (html.includes('CR_DOC_SLOTS')) found.CR_DOC_SLOTS = true;
  if (html.includes('custreg_subs')) found.custreg_subs = true;
  if (html.includes('function _crSave')) found._crSave = true;
  if (html.includes('function crConfirmApproval')) found.crConfirmApproval = true;
  return found;
}

function isPlaceholderPage(content) {
  if (!content) return true;
  if (content.includes('PlaceholderCard')) return true;
  const trimmed = content.replace(/\s+/g, ' ');
  if (/return\s*<OperationsPreviewPage/.test(trimmed) && trimmed.length < 800) return true;
  return false;
}

function hasRealUi(content) {
  if (!content || isPlaceholderPage(content)) return false;
  const fieldSignals = [
    'tgm-input',
    'tgm-table',
    'FormCard',
    'custreg-form-grid',
    'filter',
    'onChange',
    'useState',
  ];
  return fieldSignals.some((s) => content.includes(s));
}

function searchPattern(text, pattern) {
  if (!pattern) return false;
  const parts = pattern.split('|');
  return parts.some((p) => text.includes(p));
}

function collectTestContent() {
  const files = readAllFiles('tests');
  return files
    .filter((f) => /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(f))
    .map((f) => readText(f))
    .join('\n');
}

function collectMigrationContent() {
  const files = readAllFiles('supabase/migrations');
  return files.map((f) => readText(f)).join('\n');
}

function collectFeatureContent() {
  const files = readAllFiles('src/features');
  return files
    .filter((f) => /\.(js|jsx)$/.test(f))
    .map((f) => ({ path: f, content: readText(f) }))
    .reduce((acc, { path, content }) => {
      acc.all += content + '\n';
      acc.byPath[path] = content;
      return acc;
    }, { all: '', byPath: {} });
}

function collectServiceContent() {
  const files = readAllFiles('src/services');
  return files.map((f) => readText(f)).join('\n');
}

function evaluateEntry(entry, ctx) {
  const {
    routesContent,
    navContent,
    featureByPath,
    servicesContent,
    migrationsContent,
    testsContent,
  } = ctx;

  if (entry.blockedReason) {
    return {
      legacyFunction: entry.handler || entry.menuKey,
      menuKey: entry.menuKey,
      label: entry.label,
      routeFound: Boolean(entry.route && routesContent.includes(entry.route)),
      pageFound: Boolean(entry.pageFile && existsSync(join(ROOT, entry.pageFile))),
      serviceFound: Boolean(entry.serviceFile && existsSync(join(ROOT, entry.serviceFile))),
      migrationFound: entry.migrationPattern
        ? searchPattern(migrationsContent, entry.migrationPattern)
        : !entry.dataEntry,
      testsFound: entry.testPattern ? searchPattern(testsContent, entry.testPattern) : false,
      status: 'BLOCKED_BY_GOVERNANCE',
      gap: entry.blockedReason,
      evidence: entry.blockedReason,
    };
  }

  const routeFound = entry.route
    ? routesContent.includes(entry.route) || navContent.includes(entry.route)
    : false;
  const pagePath = entry.pageFile;
  const pageContent = pagePath ? readText(pagePath) : '';
  const pageExists = Boolean(pagePath && existsSync(join(ROOT, pagePath)));
  const placeholder = isPlaceholderPage(pageContent);
  const realUi = hasRealUi(pageContent);

  const serviceFound = entry.serviceFile
    ? existsSync(join(ROOT, entry.serviceFile)) || searchPattern(servicesContent, entry.serviceFile.replace('src/services/', ''))
    : !entry.dataEntry;

  const migrationFound = entry.migrationPattern
    ? searchPattern(migrationsContent, entry.migrationPattern)
    : !entry.dataEntry;

  const testsFound = entry.testPattern
    ? searchPattern(testsContent, entry.testPattern)
    : false;

  let status = 'MISSING';
  const gaps = [];

  if (!routeFound) gaps.push('Route missing in routes.jsx / navigation.js');
  if (!pageExists) gaps.push('Page file missing');
  else if (placeholder) gaps.push('Page is PlaceholderCard or OperationsPreviewPage shell only');
  else if (!realUi) gaps.push('Page lacks real form/table UI structure');

  if (entry.dataEntry && !serviceFound) gaps.push('Service layer missing');
  if (entry.dataEntry && !migrationFound) gaps.push('Supabase migration/table/view missing');
  if (!testsFound) gaps.push('No dedicated test coverage found');

  if (!routeFound || !pageExists) {
    status = 'MISSING';
  } else if (gaps.length === 0) {
    status = 'COMPLETE';
  } else if (placeholder || !realUi || (entry.dataEntry && (!serviceFound || !migrationFound))) {
    status = 'PARTIAL';
  } else if (!testsFound) {
    status = 'PARTIAL';
  } else {
    status = 'PARTIAL';
  }

  return {
    legacyFunction: entry.handler || entry.menuKey,
    menuKey: entry.menuKey,
    module: entry.module,
    label: entry.label,
    route: entry.route,
    pageFile: entry.pageFile,
    serviceFile: entry.serviceFile,
    routeFound,
    pageFound: pageExists && !placeholder && realUi,
    pageExists,
    placeholder,
    realUi,
    serviceFound,
    migrationFound,
    testsFound,
    status,
    gap: gaps.join('; ') || 'None',
    evidence: [
      routeFound ? 'route ok' : 'no route',
      pageExists ? (placeholder ? 'placeholder page' : realUi ? 'real UI' : 'weak UI') : 'no page',
      serviceFound ? 'service ok' : 'no service',
      migrationFound ? 'migration ok' : 'no migration',
      testsFound ? 'tests ok' : 'no tests',
    ].join(', '),
    critical: entry.critical,
    subFunctions: entry.subFunctions || [],
  };
}

function evaluateWorkflowFunctions(ctx) {
  const { legacyHtml, testsContent, servicesContent, featureContent } = ctx;
  const constants = extractLegacyConstants(legacyHtml);

  return LEGACY_WORKFLOW_FUNCTIONS.map((wf) => {
    const inLegacy = constants[wf.name] || legacyHtml.includes(wf.name);
    let mapped = false;
    let gap = '';

    if (wf.name === '_crSave') {
      mapped = servicesContent.includes('createCustomerRegistrationDraft')
        && servicesContent.includes('updateCustomerRegistrationDraft');
      gap = mapped ? '' : 'Save draft service functions missing';
    } else if (wf.name === 'crConfirmApproval') {
      mapped = servicesContent.includes('submitCustomerRegistration')
        && servicesContent.includes('approveCustomerRegistration');
      gap = mapped ? '' : 'Submit/approve workflow missing in service';
    } else if (wf.name === 'CR_DOC_SLOTS') {
      mapped = featureContent.includes('CR_DOC_SLOTS')
        || servicesContent.includes('CR_DOC_SLOTS')
        || featureContent.includes('document_slots');
      gap = mapped ? '' : 'CR_DOC_SLOTS not mapped in page/service';
    } else if (wf.name === 'custreg_subs') {
      mapped = servicesContent.includes('sc_customer_registration_requests');
      gap = mapped ? '' : 'custreg_subs → Supabase requests table not wired';
    }

    const testsFound = searchPattern(testsContent, wf.name)
      || searchPattern(testsContent, 'customerRegistration');

    return {
      legacyFunction: wf.name,
      parent: wf.parent,
      kind: wf.kind,
      inLegacy,
      mapped,
      testsFound,
      status: !inLegacy ? 'NOT_IN_SCOPE' : mapped && testsFound ? 'COMPLETE' : mapped ? 'PARTIAL' : 'MISSING',
      gap: gap || (!testsFound ? 'Tests not referencing workflow' : ''),
    };
  });
}

export function runLegacyAudit(options = {}) {
  const legacyHtml = existsSync(LEGACY_INDEX)
    ? readFileSync(LEGACY_INDEX, 'utf8')
    : '';

  const pgFunctions = extractPgFunctions(legacyHtml);
  const menuKeys = extractMenuMap(legacyHtml);
  const routesContent = readText('src/app/routes.jsx');
  const navContent = readText('src/app/navigation.js');
  const featureFiles = collectFeatureContent();
  const servicesContent = collectServiceContent();
  const migrationsContent = collectMigrationContent();
  const testsContent = collectTestContent();

  const ctx = {
    routesContent,
    navContent,
    featureByPath: featureFiles.byPath,
    featureContent: featureFiles.all,
    servicesContent,
    migrationsContent,
    testsContent,
    legacyHtml,
  };

  const entries = LEGACY_FUNCTIONS.map((e) => evaluateEntry(e, ctx));
  const workflowEntries = evaluateWorkflowFunctions(ctx);

  const summary = {
    generatedAt: new Date().toISOString(),
    legacySource: LEGACY_INDEX,
    legacyPgFunctionsFound: pgFunctions.length,
    legacyPgFunctions: pgFunctions,
    legacyMenuKeysFound: Object.keys(menuKeys).length,
    totalRegistryEntries: entries.length,
    totalComplete: entries.filter((e) => e.status === 'COMPLETE').length,
    totalPartial: entries.filter((e) => e.status === 'PARTIAL').length,
    totalMissing: entries.filter((e) => e.status === 'MISSING').length,
    totalBlocked: entries.filter((e) => e.status === 'BLOCKED_BY_GOVERNANCE').length,
    totalNotInScope: entries.filter((e) => e.status === 'NOT_IN_SCOPE').length,
    criticalMissing: entries.filter(
      (e) => e.critical && e.status === 'MISSING',
    ).map((e) => e.legacyFunction),
    criticalHandlers: CRITICAL_HANDLERS,
    workflowEntries,
    entries,
  };

  if (!options.dryRun) {
    writeFileSync(
      join(ROOT, 'docs/legacy-function-coverage-check-result.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    writeFileSync(
      join(ROOT, 'docs/legacy-function-coverage-check-result.md'),
      renderMarkdown(summary),
      'utf8',
    );
  }

  return summary;
}

function renderMarkdown(summary) {
  const lines = [
    '# Legacy Function Coverage Check Result',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    `Legacy source: \`${summary.legacySource}\``,
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '|--------|------:|',
    `| Legacy pg* functions in index.html | ${summary.legacyPgFunctionsFound} |`,
    `| Registry entries audited | ${summary.totalRegistryEntries} |`,
    `| COMPLETE | ${summary.totalComplete} |`,
    `| PARTIAL | ${summary.totalPartial} |`,
    `| MISSING | ${summary.totalMissing} |`,
    `| BLOCKED_BY_GOVERNANCE | ${summary.totalBlocked} |`,
    '',
    '## Critical missing',
    '',
    summary.criticalMissing.length
      ? summary.criticalMissing.map((f) => `- ${f}`).join('\n')
      : '_None — all critical handlers have route + page mapping._',
    '',
    '## Registry entries',
    '',
    '| Module | Menu | Handler | Route | Page | Service | Migration | Tests | Status | Gap |',
    '|--------|------|---------|-------|------|---------|-----------|-------|--------|-----|',
  ];

  for (const e of summary.entries) {
    lines.push(
      `| ${e.module || ''} | ${e.menuKey} | ${e.legacyFunction || '—'} | ${e.routeFound ? '✓' : '✗'} | ${e.pageFound ? '✓' : '✗'} | ${e.serviceFound ? '✓' : '✗'} | ${e.migrationFound ? '✓' : '✗'} | ${e.testsFound ? '✓' : '✗'} | **${e.status}** | ${e.gap || '—'} |`,
    );
  }

  lines.push('', '## Workflow / sub-functions', '', '| Function | Parent | Mapped | Tests | Status | Gap |', '|----------|--------|--------|-------|--------|-----|');
  for (const w of summary.workflowEntries) {
    lines.push(`| ${w.legacyFunction} | ${w.parent} | ${w.mapped ? '✓' : '✗'} | ${w.testsFound ? '✓' : '✗'} | **${w.status}** | ${w.gap || '—'} |`);
  }

  lines.push('', '## All pg* functions found in legacy index.html', '', summary.legacyPgFunctions.map((f) => `- \`${f}\``).join('\n'));
  return lines.join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const summary = runLegacyAudit();
  console.log(`Legacy audit complete: ${summary.totalComplete} COMPLETE, ${summary.totalPartial} PARTIAL, ${summary.totalMissing} MISSING, ${summary.totalBlocked} BLOCKED`);
  if (summary.criticalMissing.length) {
    console.error('Critical MISSING:', summary.criticalMissing.join(', '));
    process.exitCode = 1;
  }
}
