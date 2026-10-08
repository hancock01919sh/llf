import { describe, expect, it } from 'vitest';

import { promptVersions, systemPrompt } from './prompt';

describe('systemPrompt', () => {
  it('has the default version used by config', () => {
    expect(promptVersions()).toContain('p1');
  });

  it('tells the model the input is untrusted and to call the tool', () => {
    const prompt = systemPrompt('p1');
    expect(prompt).toMatch(/untrusted/);
    expect(prompt).toMatch(/report_ingredients/);
  });

  it('throws on an unknown version', () => {
    expect(() => systemPrompt('nope')).toThrow('Unknown prompt version "nope"');
  });
});
