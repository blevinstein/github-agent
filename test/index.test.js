import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getInstructions } from '../src/index.js';

describe('getInstructions', () => {
  it('returns the input string if not a file:// path', async () => {
    const input = 'Do something cool!';
    const result = await getInstructions(input);
    expect(result).toBe(input);
  });

  it('loads instructions from a file if input starts with file://', async () => {
    const tempFile = path.join(process.cwd(), 'temp-instructions.txt');
    fs.writeFileSync(tempFile, 'File-based instructions!');
    const input = `file://${tempFile}`;
    const result = await getInstructions(input);
    expect(result).toBe('File-based instructions!');
    fs.unlinkSync(tempFile);
  });

  it('throws if the file does not exist', async () => {
    const input = 'file://nonexistent-file.txt';
    expect(() => getInstructions(input)).toThrow();
  });
}); 