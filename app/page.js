"use client";

import { useEffect, useRef, useState } from "react";

const LOADING_MESSAGES = [
  "Reading labels...",
  "Finding ingredients...",
  "Building meal ideas...",
  "Ranking best matches...",
];

function normalizeIngredients(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      return { name: item, confidence: "high" };
    }
    return {
      name: item.name || item.ingredient || String(item),
      confidence: (item.confidence || "medium").toLowerCase(),
    };
  });
}

function normalizeMeals(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((meal, index) => ({
    name: meal.name || `Meal ${index + 1}`,
    time: meal.time || meal.cookTime || "—",
    difficulty: meal.difficulty || "Easy",
    matchScore:
      typeof meal.matchScore === "number"
        ? meal.matchScore
        : typeof meal.match === "number"
          ? meal.match
          : null,
    description: meal.description || "",
    ingredientsUsed: Array.isArray(meal.ingredientsUsed)
      ? meal.ingredientsUsed
      : [],
    missingOptional: Array.isArray(meal.missingOptional)
      ? meal.missingOptional
      : Array.isArray(meal.missing)
        ? meal.missing
        : [],
    steps: Array.isArray(meal.steps)
      ? meal.steps
      : meal.instructions
        ? [meal.instructions]
        : [],
  }));
}

function chipClass(confidence) {
  if (confidence === "high") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  if (confidence === "medium") {
    return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  }
  return "bg-zinc-800/80 text-zinc-400 border-zinc-600/50";
}

function difficultyClass(difficulty) {
  const d = (difficulty || "").toLowerCase();
  if (d === "hard") return "bg-red-500/15 text-red-300 border-red-500/25";
  if (d === "medium") return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-sky-500/15 text-sky-200 border-sky-500/30";
}

function CardSection({ title, children, className = "" }) {
  return (
    <div className={`mt-4 ${className}`}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function MealCard({ meal }) {
  const [expanded, setExpanded] = useState(false);
  const hasSteps = meal.steps.length > 0;

  return (
    <article className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-lg shadow-black/20 transition hover:border-zinc-700/80 hover:shadow-xl hover:shadow-black/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          {meal.name}
        </h3>
        {meal.matchScore != null ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="text-emerald-500/80">★</span>
            {meal.matchScore}% match
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-zinc-700/60 bg-zinc-800/50 px-3 py-1 text-xs text-zinc-300">
          ⏱ {meal.time}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyClass(meal.difficulty)}`}
        >
          {meal.difficulty}
        </span>
      </div>

      {meal.description ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {meal.description}
        </p>
      ) : null}

      {meal.ingredientsUsed.length > 0 ? (
        <CardSection title="Uses from your scan">
          <ul className="flex flex-wrap gap-1.5">
            {meal.ingredientsUsed.map((ing) => (
              <li
                key={ing}
                className="rounded-lg bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300"
              >
                {ing}
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}

      {meal.missingOptional.length > 0 ? (
        <CardSection title="Nice to have (optional)">
          <ul className="flex flex-wrap gap-1.5">
            {meal.missingOptional.map((ing) => (
              <li
                key={ing}
                className="rounded-lg border border-dashed border-zinc-600/60 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-500"
              >
                {ing}
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}

      {hasSteps ? (
        <CardSection title="Cooking steps" className="mb-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-3 text-left text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800/70"
          >
            <span>{expanded ? "Hide steps" : "Show cooking steps"}</span>
            <span
              className={`text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▼
            </span>
          </button>
          {expanded ? (
            <ol className="mt-3 space-y-2 border-t border-zinc-800/80 pt-3">
              {meal.steps.map((step, i) => (
                <li
                  key={`${meal.name}-step-${i}`}
                  className="flex gap-3 text-sm text-zinc-400"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </CardSection>
      ) : null}
    </article>
  );
}

export default function Home() {
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    if (!loading) return;
    let index = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[index]);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const resetScan = () => {
    setError(null);
    setShowResults(false);
    setImage(null);
    setDetectedIngredients([]);
    setMeals([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImage(URL.createObjectURL(file));
    setLoading(true);
    setShowResults(false);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze image.");
      }

      setDetectedIngredients(normalizeIngredients(data.ingredients));
      setMeals(normalizeMeals(data.meals));
      setShowResults(true);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "We couldn't read your photo. Try a brighter, closer shot of your ingredients."
      );
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const triggerRescan = () => {
    resetScan();
    fileInputRef.current?.click();
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <header className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-400">
            <span aria-hidden>✨</span> AI Pantry Scanner
          </span>
          <h1 className="bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            FridgeChef AI
          </h1>
          <p className="mt-2 text-base text-zinc-400 sm:text-lg">
            Turn your fridge into dinner.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-6">
          <p className="mb-4 text-center text-sm leading-relaxed text-zinc-400">
            Take a clear photo of your fridge, pantry, or ingredients.
          </p>

          <label className="group flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500 to-emerald-600 px-6 py-5 text-center font-semibold text-zinc-950 shadow-lg shadow-emerald-900/40 transition hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-800/50 active:scale-[0.98]">
            <span className="text-3xl" aria-hidden>
              📷
            </span>
            <span className="text-lg">Scan Ingredients</span>
            <span className="text-sm font-normal text-emerald-950/70">
              Tap to open camera or gallery
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {image ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950 p-1.5 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Uploaded ingredients"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            </div>
          ) : null}
        </section>

        {loading ? (
          <div
            className="mt-6 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-lg shadow-black/20"
            role="status"
            aria-live="polite"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="loading-pulse-ring absolute h-10 w-10 rounded-full bg-emerald-500/20" />
                <span className="relative h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Analyzing your photo</p>
                <p
                  key={loadingMessage}
                  className="message-fade text-sm text-emerald-400/90"
                >
                  {loadingMessage}
                </p>
              </div>
            </div>
            <div className="loading-shimmer h-2 rounded-full" />
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-5 shadow-lg shadow-red-950/20">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                ⚠️
              </span>
              <h2 className="font-semibold text-red-300">Scan failed</h2>
            </div>
            <p className="text-sm leading-relaxed text-red-200/80">{error}</p>
            <p className="mt-2 text-xs text-red-300/60">
              Use good lighting and keep labels visible. Avoid blurry or dark
              photos.
            </p>
            <button
              type="button"
              onClick={triggerRescan}
              className="mt-4 w-full rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/25 active:scale-[0.98]"
            >
              Try another photo
            </button>
          </div>
        ) : null}

        {showResults && !loading ? (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-1 text-lg font-semibold text-white">
                Ingredients detected
              </h2>
              <p className="mb-3 text-xs text-zinc-500">
                Green = confident · Amber = likely · Gray = uncertain
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedIngredients.map((item) => (
                  <span
                    key={item.name}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${chipClass(item.confidence)}`}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-1 text-lg font-semibold text-white">
                Meal ideas
              </h2>
              <p className="mb-4 text-xs text-zinc-500">
                {meals.length} recipes matched to your scan
              </p>
              <div className="grid gap-4">
                {meals.map((meal) => (
                  <MealCard key={meal.name} meal={meal} />
                ))}
              </div>
            </section>
          </div>
        ) : null}

        <footer className="mt-auto pt-10 text-center text-xs text-zinc-600">
          FridgeChef AI · Powered by vision AI
        </footer>
      </div>
    </main>
  );
}
