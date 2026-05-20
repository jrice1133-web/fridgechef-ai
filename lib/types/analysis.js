/**
 * @typedef {Object} MealSuggestion
 * @property {string} name
 * @property {string} description
 * @property {string} cookTime
 * @property {"Easy"|"Medium"|"Hard"} difficulty
 * @property {number} matchScore
 * @property {string[]} ingredientsUsed
 * @property {string[]} missingOptional
 * @property {string[]} steps
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string[]} ingredients
 * @property {string[]} possibleIngredients
 * @property {MealSuggestion[]} meals
 */

export {};
