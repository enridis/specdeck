/**
 * Utility functions for working with Story entities
 */

/**
 * Derives a feature ID from a story ID using standard prefix convention
 *
 * @param storyId - Story ID in format PREFIX-FEATURE-NUMBER (e.g., "CLI-CORE-01")
 * @returns Feature ID in format PREFIX-FEATURE (e.g., "CLI-CORE")
 * @throws Error if story ID doesn't match expected pattern
 *
 * @example
 * deriveFeatureIdFromStoryId("CLI-CORE-01") // Returns "CLI-CORE"
 * deriveFeatureIdFromStoryId("PLT-API-12") // Returns "PLT-API"
 */
export function deriveFeatureIdFromStoryId(storyId: string): string {
  const match = storyId.match(/^([A-Z]+-[A-Z0-9]+)-\d+$/);

  if (!match) {
    throw new Error(
      `Invalid story ID format: ${storyId}. Expected pattern: PREFIX-FEATURE-NUMBER (e.g., CLI-CORE-01)`
    );
  }

  return match[1];
}

/**
 * Validates that a story ID follows the expected pattern
 *
 * @param storyId - Story ID to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidStoryId("CLI-CORE-01") // Returns true
 * isValidStoryId("INVALID") // Returns false
 */
export function isValidStoryId(storyId: string): boolean {
  return /^[A-Z]+-[A-Z0-9]+-\d+$/.test(storyId);
}
