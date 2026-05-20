"use client";

import { useState } from "react";

function matchScoreColor(score) {
  if (score >= 85) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  if (score >= 70) return "text-lime-300 bg-lime-500/15 border-lime-500/30";
  if (score >= 50) return "text-amber-300 bg-amber-500/15 border-amber-500/30";
  return "text-zinc-300 bg-zinc-500/15 border-zinc-500/30";
}

function difficultyColor(level) {
  if (level === "Easy") return "text-emerald-300";
  if (level === "Hard") return "text-rose-300";
  return "text-amber-300";
}

export default function MealCard({ meal, rank }) {
  const [expanded, setExpanded] = useState(false);
  const score = meal.matchScore ?? 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-900/80 shadow-lg shadow-black/10 transition hover:border-zinc-700">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {rank != null && (
              <span className="mb-1 inline-block text-xs font-medium uppercase tracking-wider text-zinc-500">
                #{rank} pick
              </span>
            )}
            <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {meal.name}
            </h3>
            {meal.description && (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
                {meal.description}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-sm font-bold ${matchScoreColor(score)}`}
          >
            {score}% match
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {meal.cookTime && (
            <span className="rounded-lg bg-zinc-800/80 px-2.5 py-1 text-zinc-300">
              {meal.cookTime}
            </span>
          )}
          {meal.difficulty && (
            <span
              className={`rounded-lg bg-zinc-800/80 px-2.5 py-1 font-medium ${difficultyColor(meal.difficulty)}`}
            >
              {meal.difficulty}
            </span>
          )}
        </div>

        {meal.ingredientsUsed?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Uses from your kitchen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meal.ingredientsUsed.map((item) => (
                <span
                  key={`used-${meal.name}-${item}`}
                  className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {meal.missingOptional?.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Nice to have
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meal.missingOptional.map((item) => (
                <span
                  key={`optional-${meal.name}-${item}`}
                  className="rounded-md border border-dashed border-zinc-700 px-2 py-1 text-xs text-zinc-500"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {meal.steps?.length > 0 && (
          <div className="mt-5 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
              aria-expanded={expanded}
            >
              {expanded ? "Hide steps" : "Show cooking steps"}
              <span className="text-lg leading-none" aria-hidden>
                {expanded ? "−" : "+"}
              </span>
            </button>

            {expanded && (
              <ol className="mt-4 space-y-3">
                {meal.steps.map((step, index) => (
                  <li key={`${meal.name}-step-${index}`} className="flex gap-3 text-sm text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
