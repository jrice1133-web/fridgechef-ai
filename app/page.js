"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      alert("No photo selected.");
      return;
    }

    alert("Photo received. Starting scan.");

    setImage(URL.createObjectURL(file));
    setLoading(true);
    setShowResults(false);

    setTimeout(() => {
      setLoading(false);
      setShowResults(true);
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-16">
      <section className="max-w-5xl mx-auto">
        <p className="text-green-400 font-semibold mb-4">
          AI Cooking Assistant
        </p>

        <h1 className="text-5xl font-bold mb-6">
          Turn random ingredients into dinner.
        </h1>

        <p className="text-zinc-400 text-xl mb-8">
          Take a photo of your fridge or pantry and get meal ideas based on what you already have.
        </p>

        <label className="bg-green-500 text-black font-bold px-6 py-4 rounded-2xl inline-block cursor-pointer">
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
            <p className="text-2xl font-semibold">
              AI is analyzing your ingredients...
            </p>
            <p className="text-zinc-400 mt-2">
              Detecting foods and creating meal ideas.
            </p>
          </div>
        )}

        {showResults && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-4">Ingredients Detected</h2>

            <div className="flex flex-wrap gap-3 mb-8">
              {["🥚 Eggs", "🍗 Chicken", "🧀 Cheese", "🥬 Spinach", "🌮 Tortillas"].map((item) => (
                <div key={item} className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl">
                  {item}
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold mb-4">Meal Ideas</h2>

            <div className="grid gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="text-2xl font-bold">Chicken Quesadilla</h3>
                <p className="text-zinc-400">High protein • 15 minutes</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                <h3 className="text-2xl font-bold">Spinach Omelette</h3>
                <p className="text-zinc-400">Quick breakfast • 10 minutes</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}