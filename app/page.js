"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImageForUpload } from "@/lib/client/compress-image";
import LoadingScanner from "@/components/scan/LoadingScanner";
import IngredientChips from "@/components/scan/IngredientChips";
import MealCard from "@/components/scan/MealCard";
import ScanErrorCard from "@/components/scan/ScanErrorCard";

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  const [ingredients, setIngredients] = useState([]);
  const [possibleIngredients, setPossibleIngredients] = useState([]);
  const [meals, setMeals] = useState([]);

  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokePreview();
  }, [revokePreview]);

  const resetScan = () => {
    setShowResults(false);
    setError(null);
    setIngredients([]);
    setPossibleIngredients([]);
    setMeals([]);
    revokePreview();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setShowResults(false);
    setLoading(true);

    revokePreview();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);

    try {
      const compressed = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append("image", compressed);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "We couldn't scan this photo. Try a brighter, closer shot with labels facing the camera."
        );
        return;
      }

      setIngredients(data.ingredients || []);
      setPossibleIngredients(data.possibleIngredients || []);
      setMeals(data.meals || []);
      setShowResults(true);
    } catch {
      setError(
        "We couldn't reach the server. Check your connection and try again."
      );
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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />

      <section className="relative mx-auto max-w-2xl px-4 py-10 sm:max-w-3xl sm:px-6 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          FridgeChef AI
        </p>

        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl sm:leading-tight">
          Turn what&apos;s in your fridge into real dinners
        </h1>

        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
          Snap your fridge or pantry. We read labels, spot ingredients, and rank
          meals that use what you already have.
        </p>

        <label className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]">
          Scan ingredients
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {previewUrl && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-800/80 shadow-2xl shadow-black/30">
            <img
              src={previewUrl}
              alt="Uploaded fridge or pantry"
              className="max-h-80 w-full object-cover sm:max-h-96"
            />
          </div>
        )}

        {loading && <LoadingScanner />}

        {error && !loading && (
          <ScanErrorCard message={error} onRetry={triggerRescan} />
        )}

        {showResults && !loading && (
          <div className="mt-12 space-y-10 animate-fade-in">
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Ingredients detected
                </h2>
                <span className="shrink-0 text-sm text-zinc-500">
                  {ingredients.length + possibleIngredients.length} items
                </span>
              </div>
              <IngredientChips
                ingredients={ingredients}
                possibleIngredients={possibleIngredients}
              />
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Meal ideas
              </h2>
              <p className="mb-6 text-sm text-zinc-400">
                Ranked by how well they match your kitchen — best picks first.
              </p>

              {meals.length === 0 ? (
                <p className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-400">
                  No meals generated this time. Try scanning again with more
                  food visible.
                </p>
              ) : (
                <div className="grid gap-4 sm:gap-5">
                  {meals.map((meal, index) => (
                    <MealCard key={`${meal.name}-${index}`} meal={meal} rank={index + 1} />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={triggerRescan}
                className="mt-8 w-full rounded-2xl border border-zinc-700 bg-zinc-900/50 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800/80 sm:w-auto sm:px-8"
              >
                Scan another photo
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
