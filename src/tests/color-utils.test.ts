import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, getContrastingTextColor } from '../color-utils';

describe('Color Utilities', () => {
	describe('hexToHsl', () => {
		it('should convert pure red hex to correct HSL', () => {
			const hsl = hexToHsl('#ff0000');
			expect(hsl.h).toBe(0);
			expect(hsl.s).toBe(100);
			expect(hsl.l).toBe(50);
		});

		it('should handle hex strings without the # symbol', () => {
			const hsl = hexToHsl('00ff00');
			expect(hsl.h).toBe(120);
			expect(hsl.s).toBe(100);
			expect(hsl.l).toBe(50);
		});
	});

	describe('Achromatic and Edge Case Hue Math', () => {
		it('should handle pure mid-gray color conversions correctly', () => {
			const hsl = hexToHsl('#808080');
			expect(hsl.h).toBe(0);
			expect(hsl.s).toBe(0);
			expect(hsl.l).toBeCloseTo(50, 0);
		});

		it('should handle alternative channel variations for hue calculation', () => {
			// Test where green is the max channel to trigger alternative hue branches
			const hslGreenMax = hexToHsl('#00ff00');
			expect(hslGreenMax.h).toBe(120);

			// Test where blue is the max channel to trigger alternative hue branches
			const hslBlueMax = hexToHsl('#0000ff');
			expect(hslBlueMax.h).toBe(240);
		});
	});

	describe('hslToHex', () => {
        it('should correctly convert secondary color hues (hitting all RGB quadrant branches)', () => {
            // Cyan pushes the 't > 2/3' branch (return p)
            expect(hslToHex(180, 100, 50)).toBe('#00ffff'); 
            // Magenta pushes the 't > 1' branch (t -= 1)
            expect(hslToHex(300, 100, 50)).toBe('#ff00ff'); 
            // Yellow pushes the 't < 1/6' branch
            expect(hslToHex(60, 100, 50)).toBe('#ffff00');  
        });

		it('should handle achromatic colors (grayscale)', () => {
			const hex = hslToHex(0, 0, 50);
			expect(hex).toBe('#808080'); // 50% lightness gray
		});
	});

	describe('getContrastingTextColor', () => {
		it('should return a dark text color for a light background', () => {
			// Light pink background
			const darkText = getContrastingTextColor('#ffb6c1');
			const textHsl = hexToHsl(darkText);
			expect(Math.round(textHsl.l)).toBeLessThanOrEqual(26); 
		});

		it('should return a light text color for a dark background', () => {
			// Dark blue background
			const lightText = getContrastingTextColor('#00008b');
			const textHsl = hexToHsl(lightText);
			expect(textHsl.l).toBeGreaterThanOrEqual(75); 
		});

		it('should handle extreme boundary: pure white', () => {
			const darkText = getContrastingTextColor('#ffffff');
			const textHsl = hexToHsl(darkText);
			expect(Math.round(textHsl.l)).toBeLessThanOrEqual(25); 
		});

		it('should handle extreme boundary: pure black', () => {
			const lightText = getContrastingTextColor('#000000');
			const textHsl = hexToHsl(lightText);
			expect(Math.round(textHsl.l)).toBeGreaterThanOrEqual(60); 
		});
	});
});