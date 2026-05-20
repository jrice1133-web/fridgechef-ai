"use client";

import { useState } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [possibleIngredients, setPossibleIngredients] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);

    const updatedImages = [
      ...images,
      {
        file,
        preview,
      },
    ];

    setImages(updatedImages);

    setLoading(true);
    setError("");

    const formData = new FormData();

    updatedImages.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setIngredients(data.ingredients || []);
      setPossibleIngredients(data.possibleIngredients || []);
      setMeals(data.meals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const clearKitchen = () => {
    setImages([]);
    setIngredients([]);
    setPossibleIngredients([]);
    setMeals([]);
    setError("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white px-5 py-10">
      <section className="max-w-4xl mx-auto">

        <div className="mb-10">

          <div className="inline-block bg-green-500/20 border border-green-500 text-green-300 px-4 py-2 rounded-full text-sm font-bold mb-5">
            AI Pantry Scanner
          </div>

          <h1 className="text-5xl font-black mb-5 leading-tight">
            FridgeChef AI
          </h1>

          <p className="text-zinc-300 text-xl leading-relaxed max-w-2xl">
            Turn your fridge, pantry, and kitchen into personalized meals using AI.
          </p>

        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 mb-10 shadow-2xl">

          <h2 className="text-2xl font-bold mb-3">
            Kitchen scans
          </h2>

          <p className="text-zinc-400 mb-6">
            Add multiple scans. Every photo stays saved and combines into one kitchen inventory.
          </p>

          <div className="flex gap-3 flex-wrap mb-6">

            <label className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-4 rounded-2xl cursor-pointer transition shadow-lg shadow-green-500/20">
              {images.length === 0 ? "Scan kitchen" : "Add another scan"}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleUpload}
              />
            </label>

            {images.length > 0 && (
              <button
                onClick={clearKitchen}
                className="bg-red-500/20 border border-red-500 text-red-300 px-6 py-4 rounded-2xl font-bold"
              >
                Clear kitchen
              </button>
            )}

          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              {images.map((img, index) => (
                <div
                  key={index}
                  className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden"
                >

                  <img
                    src={img.preview}
                    alt={`Scan ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  <div className="p-3">

                    <p className="font-bold text-zinc-300">
                      Scan {index + 1}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {loading && (
          <div className="bg-green-500/10 border border-green-500 rounded-3xl p-6 mb-10">

            <div className="flex items-center gap-4 mb-3">

              <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>

              <h2 className="text-2xl font-bold">
                Building your kitchen inventory...
              </h2>

            </div>

            <p className="text-zinc-300">
              Combining scans, detecting ingredients, and generating meals.
            </p>

          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-3xl p-6 mb-10">

            <h2 className="text-2xl font-bold text-red-300 mb-2">
              Scan failed
            </h2>

            <p className="text-red-200">
              {error}
            </p>

          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mb-12">

            <h2 className="text-4xl font-black mb-5">
              Confirmed ingredients
            </h2>

            <div className="flex flex-wrap gap-3">

              {ingredients.map((item) => (
                <div
                  key={item}
                  className="bg-green-500/15 border border-green-500 text-green-200 px-4 py-3 rounded-full"
                >
                  {item}
                </div>
              ))}

            </div>

          </div>
        )}

        {possibleIngredients.length > 0 && (
          <div className="mb-12">

            <h2 className="text-4xl font-black mb-5 text-yellow-300">
              Possible ingredients
            </h2>

            <div className="flex flex-wrap gap-3">

              {possibleIngredients.map((item) => (
                <div
                  key={item}
                  className="bg-yellow-500/10 border border-yellow-500 text-yellow-100 px-4 py-3 rounded-full"
                >
                  {item}
                </div>
              ))}

            </div>

          </div>
        )}

        {meals.length > 0 && (
          <div>

            <h2 className="text-5xl font-black mb-6">
              Meal ideas
            </h2>

            <div className="space-y-6">

              {meals.map((meal, index) => (
                <div
                  key={meal.name}
                  className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-7 shadow-2xl"
                >

                  <div className="flex justify-between items-center mb-5">

                    <div className="bg-green-500/15 border border-green-500 text-green-300 px-4 py-2 rounded-full font-bold">
                      {meal.matchScore || 90}% Match
                    </div>

                    <div className="text-zinc-500 font-bold">
                      #{index + 1}
                    </div>

                  </div>

                  <h3 className="text-3xl font-black mb-4">
                    {meal.name}
                  </h3>

                  <p className="text-zinc-300 text-lg mb-5 leading-relaxed">
                    {meal.description}
                  </p>

                  <div className="flex gap-3 flex-wrap mb-5">

                    <div className="bg-zinc-800 px-4 py-2 rounded-xl">
                      ⏱ {meal.cookTime}
                    </div>

                    <div className="bg-orange-500/15 border border-orange-500 text-orange-200 px-4 py-2 rounded-xl">
                      {meal.difficulty}
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

      </section>
    </main>
  );
}