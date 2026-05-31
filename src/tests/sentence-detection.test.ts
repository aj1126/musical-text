import { describe, it, expect, vi } from 'vitest';

// Mock the Obsidian runtime API
vi.mock('obsidian', () => ({
	PluginSettingTab: class {},
	Setting: class {},
	Notice: class {},
	App: class {}
}));

import { countWords, detectMarkdownListMarker, getClassForSentence, computeDecorations } from '../sentence-detection';
import { DEFAULT_SETTINGS } from '../settings';

describe('Sentence Detection', () => {
	describe('countWords', () => {
		it('should accurately count standard words', () => {
			expect(countWords("This is a simple test.")).toBe(5);
		});

		it('should treat words with apostrophes as a single word', () => {
			expect(countWords("It's a beautiful day in the neighborhood.")).toBe(7);
		});

		it('should ignore punctuation and numbers when counting words', () => {
			expect(countWords("The year 2026 brings 100 new challenges!!!")).toBe(5);
		});

		it('should return 0 for empty or whitespace-only strings', () => {
			expect(countWords("   ")).toBe(0);
		});

		it('should handle hyphenated phrases by splitting them', () => {
			// Based on the current regex, hyphenated words map as separate elements
			expect(countWords("Self-taught developer")).toBe(3); 
		});
	});

	describe('detectMarkdownListMarker', () => {
		it('should detect and extract content from an unordered list', () => {
			const result = detectMarkdownListMarker("- A short point");
			expect(result?.content).toBe("A short point");
			expect(result?.markerLength).toBe(2);
		});

		it('should detect alternate unordered list markers', () => {
			const asteriskResult = detectMarkdownListMarker("* Point one");
			expect(asteriskResult?.content).toBe("Point one");
			
			const plusResult = detectMarkdownListMarker("+ Point two");
			expect(plusResult?.content).toBe("Point two");
		});

		it('should detect deeply nested/indented lists', () => {
			const result = detectMarkdownListMarker("    - Indented point");
			expect(result?.content).toBe("Indented point");
			expect(result?.markerLength).toBe(6); // 4 spaces + dash + 1 space
		});

		it('should detect unchecked and alternatively cased checkboxes', () => {
			const unchecked = detectMarkdownListMarker("- [ ] Pending task");
			expect(unchecked?.content).toBe("Pending task");

			const upperCase = detectMarkdownListMarker("- [X] Done task");
			expect(upperCase?.content).toBe("Done task");
		});

		it('should return null for malformed lists (no spaces)', () => {
			// Standard markdown requires a space after the dash/bullet
			const result = detectMarkdownListMarker("-Malformed list point");
			expect(result).toBeNull();
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

	describe('computeDecorations (CodeMirror Engine)', () => {
		it('should generate valid CodeMirror decoration ranges for standard prose', () => {
			const text = "Hi. This is short. This is a slightly longer sentence.";
			const decorations = computeDecorations(text, DEFAULT_SETTINGS);
			
			// Extract iteration values to an array for easier assertion
			const ranges = [];
			const iter = decorations.iter();
			while (iter.value) {
				ranges.push({
					from: iter.from,
					to: iter.to,
					class: iter.value.spec.class
				});
				iter.next();
			}

			expect(ranges.length).toBe(3);

			// Sentence 1: "Hi." (1 word -> sh-mini)
			expect(ranges[0].class).toBe('sh-mini');
			expect(ranges[0].from).toBe(0);
			expect(ranges[0].to).toBe(3);

			// Sentence 2: "This is short." (3 words -> sh-mini)
			expect(ranges[1].class).toBe('sh-mini');
			
			// Sentence 3: "This is a slightly longer sentence." (6 words -> sh-short)
			expect(ranges[2].class).toBe('sh-short');
		});

		it('should accurately calculate offsets when ignoring markdown markers', () => {
			const text = "- [x] A list item.";
			const decorations = computeDecorations(text, DEFAULT_SETTINGS);
			
			const iter = decorations.iter();
			
			// The content "A list item." is 3 words (sh-mini)
			expect(iter.value).not.toBeNull();
			expect(iter.value?.spec.class).toBe('sh-mini');
			
			// The marker "- [x] " is 6 characters long, so the highlight must start at index 6
			expect(iter.from).toBe(6);
			expect(iter.to).toBe(18); // length of the entire string
		});
	});

	describe('Edge Case Document Formatting', () => {
		it('should cleanly handle entirely blank lines or empty text inputs', () => {
			const decorations = computeDecorations("", DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0);
		});

		it('should safely process lines containing only newline characters or whitespace loops', () => {
			const text = "\n\n   \n\n";
			const decorations = computeDecorations(text, DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0);
		});

		it('should bypass lines that only contain markdown syntax with zero readable words', () => {
			const text = "- [ ] \n* \n##### ";
			const decorations = computeDecorations(text, DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0);
		});

		it('should skip lines that contain only a markdown list marker and no text content', () => {
			// A checkbox without a trailing space survives trim() and yields a 0-length content string, hitting the exact branch
			const decorations = computeDecorations("- [x]", DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0); 
		});
        it('should handle list markers with whitespace-only content', () => {
			// This string survives trim() but results in a 0-length string after marker extraction,
			// which hits the 'if (processedLine.length === 0) continue;' guard clause (Line 84-86)
			const decorations = computeDecorations("-    ", DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0);
		});
it('should trigger the empty processedLine branch', () => {
			// This specifically targets the branch where the line exists, 
            // the marker is detected, but content is empty.
			const text = "- \n"; 
			const decorations = computeDecorations(text, DEFAULT_SETTINGS);
			expect(decorations.size).toBe(0);
		});
	});
});