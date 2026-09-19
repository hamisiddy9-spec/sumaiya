import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as templates from './index';
import { selectProvider, templateProvider } from './index';
import { NativeTemplateProvider, nativeTemplateProvider } from './native-provider';

const indexSource = readFileSync(
  fileURLToPath(new URL('./index.ts', import.meta.url)),
  'utf8'
);

describe('template provider selection', () => {
  it('always selects the native provider', () => {
    expect(selectProvider()).toBe(nativeTemplateProvider);
    expect(selectProvider()).toBeInstanceOf(NativeTemplateProvider);
  });

  it('exposes the native provider as the templateProvider singleton', () => {
    expect(templateProvider).toBe(nativeTemplateProvider);
  });

  // The remote path is gone, so no argument may resurrect it. Offline-first is
  // the product (docs/DECISIONS.md D1): a template fetch over HTTP cannot be
  // part of the APK, not even behind a flag.
  it('cannot be steered to a remote provider by an argument', () => {
    const legacy = selectProvider as unknown as (...args: unknown[]) => unknown;
    expect(legacy('templatehub')).toBe(nativeTemplateProvider);
    expect(
      legacy('remote', {
        templateHubUrl: 'https://templatehub.example.com',
        templateHubApiKey: 'secret',
      })
    ).toBe(nativeTemplateProvider);
  });

  it('exports no remote provider', () => {
    const ns = templates as unknown as Record<string, unknown>;
    expect(ns.TemplateHubProvider).toBeUndefined();
    expect(ns.createTemplateHubProvider).toBeUndefined();
  });

  it('has no remote-provider code and no env selection left in index.ts', () => {
    expect(indexSource.toLowerCase()).not.toContain('templatehub');
    expect(indexSource).not.toContain('TEMPLATE_HUB');
    expect(indexSource).not.toContain('NEXT_PUBLIC_TEMPLATE_PROVIDER');
  });
});
