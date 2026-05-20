"use client";

import { useRef, useState } from "react";

function MatchBadge({ score }) {
  const tier =
    score >= 85
      ? "match-badge match-badge--high"
      : score >= 70
        ? "match-badge match-badge--mid"
        : "match-badge match-badge--low";

  return (
    <span className={tier} title="How well this meal fits your kitchen">
      {score}% match
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const key = difficulty?.toLowerCase() || "medium";
  return <span className={`difficulty-badge difficulty-badge--${key}`}>{difficulty}</span>;
}

function IngredientChip({ children, variant = "inventory" }) {
  return <span className={`chip chip--${variant}`}>{children}</span>;
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function MealCard({ meal }) {
  return (
    <article className="meal-card">
      <header className="meal-card__header">
        <h3 className="meal-card__title">{meal.name}</h3>
        <MatchBadge score={meal.matchScore} />
      </header>

      <div className="meal-card__meta">
        <span className="meal-card__meta-item">
          <ClockIcon />
          {meal.cookTime}
        </span>
        <DifficultyBadge difficulty={meal.difficulty} />
      </div>

      <p className="meal-card__description">{meal.description}</p>

      {meal.ingredientsUsed?.length > 0 && (
        <section className="meal-card__section">
          <h4 className="meal-card__section-title">Uses from your kitchen</h4>
          <div className="meal-card__chips">
            {meal.ingredientsUsed.map((item) => (
              <IngredientChip key={item} variant="used">
                {item}
              </IngredientChip>
            ))}
          </div>
        </section>
      )}

      {meal.missingOptional?.length > 0 && (
        <section className="meal-card__section">
          <h4 className="meal-card__section-title">Nice to have</h4>
          <div className="meal-card__chips">
            {meal.missingOptional.map((item) => (
              <IngredientChip key={item} variant="optional">
                {item}
              </IngredientChip>
            ))}
          </div>
        </section>
      )}

      {meal.steps?.length > 0 && (
        <section className="meal-card__section">
          <h4 className="meal-card__section-title">How to cook</h4>
          <ol className="meal-card__steps">
            {meal.steps.map((step, index) => (
              <li key={`${meal.name}-step-${index}`}>
                <span className="meal-card__step-num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}

export default function Home() {
  const fileInputRef = useRef(null);
  const [scanFiles, setScanFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [meals, setMeals] = useState([]);

  const analyzeImages = async (files) => {
    setLoading(true);
    setShowResults(false);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

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
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextFiles = [...scanFiles, file];
    const nextPreviews = [...previewUrls, URL.createObjectURL(file)];

    setScanFiles(nextFiles);
    setPreviewUrls(nextPreviews);
    event.target.value = "";

    await analyzeImages(nextFiles);
  };

  const handleStartOver = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setScanFiles([]);
    setPreviewUrls([]);
    setDetectedIngredients([]);
    setMeals([]);
    setShowResults(false);
    setError(null);
    setLoading(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const hasScans = previewUrls.length > 0;

  return (
    <main className="app-shell">
      <div className="app-glow app-glow--left" aria-hidden="true" />
      <div className="app-glow app-glow--right" aria-hidden="true" />

      <section className="app-container">
        <header className="hero">
          <p className="hero__eyebrow">FridgeChef AI</p>
          <h1 className="hero__title">Turn random ingredients into dinner.</h1>
          <p className="hero__subtitle">
            Scan your pantry, fridge, or kitchen—add more photos to build a fuller
            inventory and get richer meal ideas.
          </p>
        </header>

        <div className="scan-actions">
          {!hasScans ? (
            <button type="button" className="btn btn--primary" onClick={openFilePicker}>
              Scan ingredients
            </button>
          ) : (
            <div className="scan-actions__row">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={openFilePicker}
                disabled={loading}
              >
                Add another scan
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleStartOver}
                disabled={loading}
              >
                Start over
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleImageUpload}
          />
        </div>

        {hasScans && (
          <div className="scan-gallery">
            <p className="scan-gallery__label">
              {previewUrls.length === 1
                ? "1 scan"
                : `${previewUrls.length} scans — combined kitchen inventory`}
            </p>
            <div className="scan-gallery__grid">
              {previewUrls.map((url, index) => (
                <figure key={url} className="scan-thumb">
                  <img src={url} alt={`Kitchen scan ${index + 1}`} />
                  <figcaption>Scan {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-panel" role="status" aria-live="polite">
            <div className="loading-panel__pulse" />
            <div>
              <p className="loading-panel__title">Analyzing your kitchen…</p>
              <p className="loading-panel__text">
                {previewUrls.length > 1
                  ? `Reviewing ${previewUrls.length} photos together and generating detailed meal ideas.`
                  : "Detecting ingredients and crafting five realistic meal ideas."}
              </p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {showResults && !loading && (
          <div className="results">
            <section className="inventory-panel">
              <div className="section-heading">
                <h2>Your kitchen inventory</h2>
                <p>{detectedIngredients.length} ingredients detected</p>
              </div>
              <div className="inventory-panel__chips">
                {detectedIngredients.map((item) => (
                  <IngredientChip key={item} variant="inventory">
                    {item}
                  </IngredientChip>
                ))}
              </div>
            </section>

            <section className="meals-section">
              <div className="section-heading">
                <h2>Meal ideas</h2>
                <p>Five realistic recipes matched to what you have</p>
              </div>

              <div className="meals-grid">
                {meals.map((meal) => (
                  <MealCard key={meal.name} meal={meal} />
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
