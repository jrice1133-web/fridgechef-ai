"use client";

import { useState } from "react";

export default function Home() {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [possibleIngredients, setPossibleIngredients] = useState([]);
  const [meals, setMeals] = useState([]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setPreviews(files.map((file) => URL.createObjectURL(file)));
    setLoading(true);
    setShowResults(false);

    const formData = new FormData();
    for (const file of files) {
      formData.append("images", file);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setDetectedIngredients(data.ingredients || []);
      setPossibleIngredients(data.possibleIngredients || []);
      setMeals(data.meals || []);

      setLoading(false);
      setShowResults(true);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert(error.message || "AI scan failed.");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-16">
      <section className="max-w-5xl mx-auto">
        <p className="text-green-400 font-semibold mb-4">AI Cooking Assistant</p>

        <h1 className="text-5xl font-bold mb-6">
          Turn random ingredients into dinner.
        </h1>

        <p className="text-zinc-400 text-xl mb-8">
          Scan your pantry, fridge, or kitchen and get AI-generated meal ideas
          instantly.
        </p>

        <label className="bg-green-500 text-black font-bold px-6 py-4 rounded-2xl inline-block cursor-pointer hover:bg-green-400 transition">
          Scan Ingredients
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {previews.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4">
            {previews.map((src) => (
              <img
                key={src}
                src={src}
                alt="Uploaded ingredients"
                className="rounded-3xl max-w-xs w-full border border-zinc-800"
              />
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-10 bg-zinc-900 p-6 rounded-3xl border border-zinc-800 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />
              <p className="text-2xl font-semibold">
                AI is analyzing your ingredients...
              </p>
            </div>
            <p className="text-zinc-400">
              Detecting foods and generating meal ideas.
            </p>
          </div>
        )}

        {showResults && (
          <div className="mt-14">
            <h2 className="text-3xl font-bold mb-5">Ingredients Detected</h2>

            <div className="flex flex-wrap gap-3 mb-10">
              {detectedIngredients.map((item) => (
                <div
                  key={item}
                  className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl"
                >
                  {item}
                </div>
              ))}
            </div>

            {possibleIngredients.length > 0 && (
              <>
                <h2 className="text-3xl font-bold mb-5">Possibly Detected</h2>
                <div className="flex flex-wrap gap-3 mb-10">
                  {possibleIngredients.map((item) => (
                    <div
                      key={item}
                      className="bg-zinc-900/60 border border-zinc-700 border-dashed px-4 py-3 rounded-2xl text-zinc-400"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="text-3xl font-bold mb-5">Meal Ideas</h2>

            <div className="grid gap-4">
              {meals.map((meal) => (
                <div
                  key={meal.name}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-2xl font-bold">{meal.name}</h3>
                    {meal.matchScore != null && (
                      <span className="text-green-400 font-semibold">
                        {meal.matchScore}% match
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-400 mt-1">
                    {[meal.cookTime, meal.difficulty].filter(Boolean).join(" · ")}
                  </p>

                  <p className="text-zinc-300 mt-3">{meal.description}</p>

                  {meal.ingredientsUsed?.length > 0 && (
                    <p className="text-zinc-500 text-sm mt-3">
                      Uses: {meal.ingredientsUsed.join(", ")}
                    </p>
                  )}

                  {meal.missingOptional?.length > 0 && (
                    <p className="text-zinc-500 text-sm mt-1">
                      Optional: {meal.missingOptional.join(", ")}
                    </p>
                  )}

                  {meal.steps?.length > 0 && (
                    <ol className="mt-4 space-y-2 text-zinc-300 list-decimal list-inside">
                      {meal.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
