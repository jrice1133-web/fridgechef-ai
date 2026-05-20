function toStringList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
}

function normalizeIngredient(name) {
  return name.toLowerCase().trim();
}

function ingredientMatches(detected, used) {
  const d = normalizeIngredient(detected);
  const u = normalizeIngredient(used);
  if (d === u) return true;
  if (d.includes(u) || u.includes(d)) return true;
  const dWords = d.split(/\s+/);
  const uWords = u.split(/\s+/);
  return dWords.some((w) => w.length > 2 && u.includes(w)) || uWords.some((w) => w.length > 2 && d.includes(w));
}

function countMatchedIngredients(usedList, inventory) {
  let matched = 0;
  for (const used of usedList) {
    if (inventory.some((inv) => ingredientMatches(inv, used))) {
      matched += 1;
    }
  }
  return matched;
}

/**
 * Recompute match score from inventory when model score is missing or unreliable.
 */
export function computeMatchScore(meal, inventory) {
  const used = toStringList(meal.ingredientsUsed);
  const optional = toStringList(meal.missingOptional);

  if (used.length === 0) {
    return typeof meal.matchScore === "number" ? Math.round(meal.matchScore) : 0;
  }

  const matched = countMatchedIngredients(used, inventory);
  const ownedRatio = matched / used.length;
  const penalty = optional.length > 0 ? Math.min(optional.length * 4, 25) : 0;
  const computed = Math.round(ownedRatio * 100 - penalty);

  const modelScore =
    typeof meal.matchScore === "number" && !Number.isNaN(meal.matchScore)
      ? Math.round(meal.matchScore)
      : null;

  if (modelScore === null) {
    return Math.max(0, Math.min(100, computed));
  }

  // Blend model intent with inventory math for stability
  const blended = Math.round(modelScore * 0.55 + computed * 0.45);
  return Math.max(0, Math.min(100, blended));
}

function normalizeMeal(meal, inventory) {
  const ingredientsUsed = toStringList(meal.ingredientsUsed);
  const missingOptional = toStringList(meal.missingOptional ?? meal.missing);
  const steps = toStringList(meal.steps);

  const normalized = {
    name: typeof meal.name === "string" ? meal.name.trim() : "Untitled meal",
    description:
      typeof meal.description === "string"
        ? meal.description.trim()
        : "",
    cookTime:
      typeof meal.cookTime === "string"
        ? meal.cookTime.trim()
        : typeof meal.time === "string"
          ? meal.time.trim()
          : "",
    difficulty: ["Easy", "Medium", "Hard"].includes(meal.difficulty)
      ? meal.difficulty
      : "Easy",
    ingredientsUsed,
    missingOptional,
    steps: steps.length > 0 ? steps : toStringList(meal.instructions),
    matchScore: 0,
  };

  normalized.matchScore = computeMatchScore(
    { ...meal, ingredientsUsed, missingOptional },
    inventory
  );

  return normalized;
}

/**
 * Normalize and validate analyze API response; sort meals by match score.
 */
export function normalizeAnalysisResponse(raw) {
  const ingredients = toStringList(raw.ingredients);
  const possibleIngredients = toStringList(
    raw.possibleIngredients ?? raw.possible
  );
  const inventory = [...ingredients, ...possibleIngredients];

  const meals = (Array.isArray(raw.meals) ? raw.meals : [])
    .map((meal) => normalizeMeal(meal, inventory))
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    ingredients,
    possibleIngredients,
    meals,
  };
}
