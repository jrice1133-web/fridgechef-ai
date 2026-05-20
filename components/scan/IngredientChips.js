export default function IngredientChips({ ingredients = [], possibleIngredients = [] }) {
  const hasAny = ingredients.length > 0 || possibleIngredients.length > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-zinc-500">
        No ingredients detected. Try a brighter, closer photo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {ingredients.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400/90">
            Confirmed
          </p>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <span
                key={`confirmed-${item}`}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-100"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {possibleIngredients.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-400/90">
            Possible
          </p>
          <div className="flex flex-wrap gap-2">
            {possibleIngredients.map((item) => (
              <span
                key={`possible-${item}`}
                className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-100"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
