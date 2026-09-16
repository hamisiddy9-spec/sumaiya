import { describe, it, expect } from 'vitest';

import { selectProvider } from './index';
import { nativeTemplateProvider } from './native-provider';
import { TemplateHubProvider } from './templatehub-provider';

describe('selectProvider', () => {
  it('defaults to the native provider when no type is given', () => {
    expect(selectProvider(undefined)).toBe(nativeTemplateProvider);
  });

  it('returns native for "native"', () => {
    expect(selectProvider('native')).toBe(nativeTemplateProvider);
  });

  it('returns native for an unknown provider type', () => {
    expect(selectProvider('bogus')).toBe(nativeTemplateProvider);
  });

  it('falls back to native when remote is requested without credentials', () => {
    expect(selectProvider('templatehub', {})).toBe(nativeTemplateProvider);
    expect(
      selectProvider('remote', { templateHubUrl: 'https://th.example', templateHubApiKey: '' })
    ).toBe(nativeTemplateProvider);
  });

  it('returns a TemplateHubProvider when remote is requested with credentials', () => {
    const provider = selectProvider('templatehub', {
      templateHubUrl: 'https://templatehub.example.com',
      templateHubApiKey: 'sk_test',
    });
    expect(provider).toBeInstanceOf(TemplateHubProvider);
    expect(provider).not.toBe(nativeTemplateProvider);
  });

  it('accepts the "remote" alias and trims whitespace', () => {
    const provider = selectProvider('  REMOTE ', {
      templateHubUrl: 'https://templatehub.example.com',
      templateHubApiKey: 'sk_test',
    });
    expect(provider).toBeInstanceOf(TemplateHubProvider);
  });
});
