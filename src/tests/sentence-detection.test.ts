import { describe, it, expect, vi } from 'vitest';

// Mock the Obsidian runtime API
vi.mock('obsidian', () => ({
	PluginSettingTab: class {},
	Setting: class {},
	Notice: class {},
	App: class {}
}));

import { countWords, detectMarkdownListMarker, getClassForSentence } from '../sentence-detection';
import { DEFAULT_SETTINGS } from '../settings';

// ... rest of your tests

describe('Sentence Detection', () => {
	describe('countWords', () => {
		it('should accurately count standard words', () => {
			expect(countWords("This is a simple test.")).toBe(5);
		});

		it('should treat words with apostrophes as a single word', () => {
			expect(countWords("It's a beautiful day in the neighborhood.")).toBe(7);
		});

		it('should ignore punctuation and numbers when counting words', () => {
			// Regex /[A-Za-z]+(?:['’][A-Za-z]+)?/g ignores numbers and symbols
			expect(countWords("The year 2026 brings 100 new challenges!!!")).toBe(5);
		});

		it('should return 0 for empty or whitespace-only strings', () => {
			expect(countWords("   ")).toBe(0);
		});
	});

	describe('detectMarkdownListMarker', () => {
		it('should detect and extract content from an unordered list', () => {
			const result = detectMarkdownListMarker("- A short point");
			expect(result).not.toBeNull();
			expect(result?.content).toBe("A short point");
			expect(result?.markerLength).toBe(2);
		});

		it('should detect and extract content from an ordered list', () => {
			const result = detectMarkdownListMarker("12. A dozen points");
			expect(result).not.toBeNull();
			expect(result?.content).toBe("A dozen points");
			expect(result?.markerLength).toBe(4); // "12. "
		});

		it('should detect checkboxes and extract the remaining content', () => {
			const result = detectMarkdownListMarker("- [x] Completed task");
			expect(result).not.toBeNull();
			expect(result?.content).toBe("Completed task");
		});

		it('should return null for standard text without list markers', () => {
			const result = detectMarkdownListMarker("Just a regular sentence.");
			expect(result).toBeNull();
		});
	});

	describe('getClassForSentence', () => {
		it('should return correct CSS classes based on threshold settings', () => {
			const settings = DEFAULT_SETTINGS;
			
			// Default thresholds: short=4, medium=7, long=12
			expect(getClassForSentence(2, settings)).toBe('sh-mini');
			expect(getClassForSentence(4, settings)).toBe('sh-short');
			expect(getClassForSentence(6, settings)).toBe('sh-short');
			expect(getClassForSentence(7, settings)).toBe('sh-short');
			expect(getClassForSentence(10, settings)).toBe('sh-medium');
			expect(getClassForSentence(15, settings)).toBe('sh-long');
		});
	});
});