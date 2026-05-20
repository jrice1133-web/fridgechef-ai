"use client";

import { useState } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [possibleIngredients, setPossibleIngredients] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    setImages((prev) => [
      ...prev,
      {
        file,
        preview,
      },
    ]);

    event.target.value = "";
  };

  const removePhoto = (indexToRemove) => {
    setImages((prev) => {
      const imageToRemove = prev[indexToRemove];
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const clearKitchen = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setIngredients([]);
    setPossibleIngredients([]);
    setMeals([]);
    setError("");
  };

  const analyzeKitchen = async () => {
    if (images.length === 0) {
      setError("Add at least one kitchen photo first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();

    images.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scan failed.");
      }

      setIngredients(data.ingredients || []);
      setPossibleIngredients(data.possibleIngredients || []);
      setMeals(data.meals || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-emerald-950/40 to-black text-white px-5 py-12">
      <section className="max-w-4xl mx-auto">
        <p className="text-green-400 font-bold tracking-[0.3em] mb-4">
          FRIDGECHEF AI
        </p>

        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Turn random ingredients into dinner.
        </h1>

        <p className="text-zinc-300 text-xl leading-relaxed mb-8">
          Scan your fridge, pantry, freezer, or counter. Save multiple photos,
          then analyze your whole kitchen at once.
        </p>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold">Kitchen scans</h2>
              <p className="text-zinc-400">
                {images.length === 0
                  ? "No scans yet"
                  : `${images.length} scan${images.length > 1 ? "s" : ""} saved`}
              </p>
            </div>

            {images.length > 0 && (
              <button
                onClick={clearKitchen}
                className="text-red-300 border border-red-500/40 bg-red-500/10 px-4 py-2 rounded-xl font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap mb-6">
            <label className="bg-green-500 hover:bg-green-400 text-black font-black px-6 py-4 rounded-2xl cursor-pointer shadow-lg shadow-green-500/20 transition">
              {images.length === 0 ? "Add first scan" : "Add another scan"}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleUpload}
                disabled={loading}
              />
            </label>

            <button
              onClick={analyzeKitchen}
              disabled={loading || images.length === 0}
              className="bg-white text-black font-black px-6 py-4 rounded-2xl disabled:opacity-40"
            >
              {loading ? "Analyzing..." : "Analyze kitchen"}
            </button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
                >
                  <img
                    src={img.preview}
                    alt={`Scan ${index + 1}`}
                    className="w-full h-36 object-cover"
                  />

                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/70 border border-white/20 text-white px-3 py-1 rounded-full text-sm"
                  >
                    ×
                  </button>

                  <div className="p-3 text-center text-zinc-300 font-bold">
                    Scan {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-3xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-2xl font-bold">Analyzing your kitchen...</h2>
            </div>
            <p className="text-zinc-300">
              Combining photos, reading labels, and ranking realistic meal ideas.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-3xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-red-300 mb-2">
              Scan failed
            </h2>
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {(ingredients.length > 0 || possibleIngredients.length > 0) && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-4xl font-black">Your kitchen inventory</h2>
              <p className="text-zinc-500">
                {ingredients.length + possibleIngredients.length} items
              </p>
            </div>

            {ingredients.length > 0 && (
              <>
                <p className="text-green-400 font-bold tracking-widest mb-3">
                  CONFIRMED
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  {ingredients.map((item) => (
                    <span
                      key={item}
                      className="bg-green-500/15 border border-green-500/50 text-green-100 px-4 py-3 rounded-full font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}

            {possibleIngredients.length > 0 && (
              <>
                <p className="text-yellow-400 font-bold tracking-widest mb-3">
                  POSSIBLE
                </p>
                <div className="flex flex-wrap gap-3">
                  {possibleIngredients.map((item) => (
                    <span
                      key={item}
                      className="bg-yellow-500/15 border border-yellow-500/50 text-yellow-100 px-4 py-3 rounded-full font-semibold"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {meals.length > 0 && (
          <section>
            <h2 className="text-5xl font-black mb-3">Meal ideas</h2>
            <p className="text-zinc-400 text-lg mb-6">
              Ranked by how well they match your saved kitchen scans.
            </p>

            <div className="space-y-6">
              {meals.map((meal, index) => (
                <MealCard key={`${meal.name}-${index}`} meal={meal} index={index} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function MealCard({ meal, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-7 shadow-2xl">
      <div className="flex justify-between items-center gap-4 mb-4">
        <p className="text-zinc-500 font-black">#{index + 1} PICK</p>
        <span className="bg-green-500/15 border border-green-500/50 text-green-300 font-black px-4 py-2 rounded-full">
          {meal.matchScore || 80}% match
        </span>
      </div>

      <h3 className="text-3xl font-black mb-4">{meal.name}</h3>

      <div className="flex flex-wrap gap-3 mb-5">
        <span className="bg-zinc-800 px-4 py-2 rounded-xl">
          ⏱ {meal.cookTime || "20 min"}
        </span>
        <span className="bg-orange-500/15 border border-orange-500/50 text-orange-200 px-4 py-2 rounded-xl font-bold">
          {meal.difficulty || "Easy"}
        </span>
      </div>

      <p className="text-zinc-300 text-lg leading-relaxed mb-6">
        {meal.description}
      </p>

      {(meal.ingredientsUsed || []).length > 0 && (
        <>
          <p className="text-zinc-500 font-bold tracking-widest mb-2">
            USES FROM YOUR KITCHEN
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {meal.ingredientsUsed.map((item) => (
              <span
                key={item}
                className="bg-green-500/15 border border-green-500/40 text-green-100 px-3 py-2 rounded-xl text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </>
      )}

      {(meal.missingOptional || []).length > 0 && (
        <>
          <p className="text-zinc-500 font-bold tracking-widest mb-2">
            NICE TO HAVE
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {meal.missingOptional.map((item) => (
              <span
                key={item}
                className="border border-dashed border-zinc-600 text-zinc-400 px-3 py-2 rounded-xl text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </>
      )}

      {(meal.steps || []).length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="w-full border-t border-zinc-800 pt-5 text-left text-green-400 font-black"
          >
            {open ? "Hide cooking steps" : "Show cooking steps"} +
          </button>

          {open && (
            <ol className="mt-5 space-y-4">
              {meal.steps.map((step, i) => (
                <li key={i} className="flex gap-4 text-zinc-300 text-lg">
                  <span className="bg-green-500/20 text-green-300 w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}