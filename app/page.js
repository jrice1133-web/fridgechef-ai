"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [meals, setMeals] = useState([]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(URL.createObjectURL(file));
    setLoading(true);
    setShowResults(false);
    setError(null);
    setDetectedIngredients([]);
    setMeals([]);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI scan failed.");
      }

      setDetectedIngredients(data.ingredients || []);
      setMeals(data.meals || []);
      setShowResults(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "AI scan failed. Please try again.");
    } finally {
      setLoading(false);
      event.target.value = "";
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
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {image && (
          <img
            src={image}
            alt="Uploaded ingredients"
            className="mt-10 rounded-3xl max-w-md w-full border border-zinc-800"
          />
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

        {error && (
          <div className="mt-10 bg-red-950/50 border border-red-800 text-red-200 p-6 rounded-3xl max-w-md">
            <p className="font-semibold mb-2">Scan failed</p>
            <p className="text-red-300/90">{error}</p>
          </div>
        )}

        {showResults && (
          <div className="mt-14">
            <h2 className="text-3xl font-bold mb-5">Ingredients Detected</h2>

            {detectedIngredients.length === 0 ? (
              <p className="text-zinc-400 mb-10">
                No ingredients were detected. Try a clearer photo of your
                fridge or pantry.
              </p>
            ) : (
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
            )}

            <h2 className="text-3xl font-bold mb-5">Meal Ideas</h2>

            {meals.length === 0 ? (
              <p className="text-zinc-400">
                No meal ideas were generated. Try another photo.
              </p>
            ) : (
              <div className="grid gap-4">
                {meals.map((meal, index) => (
                  <div
                    key={`${meal.name}-${index}`}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
                  >
                    <h3 className="text-2xl font-bold">{meal.name}</h3>
                    <p className="text-zinc-400">{meal.time}</p>
                    <p className="text-zinc-300 mt-3">{meal.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
