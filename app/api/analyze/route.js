import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are FridgeChef AI, a practical home-cooking assistant.

Analyze ALL attached kitchen, fridge, and pantry photos together as ONE combined inventory. Each extra photo should add more detected ingredients and more meal detail—never shorten or simplify because there are multiple images.

Your tasks:
1. List every visible food ingredient you can identify across all photos. Merge duplicates (e.g. "eggs" and "egg" → one entry). Use clear, specific names.
2. Propose exactly 5 realistic meals a home cook would actually make. Avoid weird fusion, impractical combos, or meals that ignore what's visible. Prioritize dishes that use mostly ingredients on hand.

Return ONLY valid JSON (no markdown fences) in this exact shape:
{
  "ingredients": ["ingredient 1", "ingredient 2"],
  "meals": [
    {
      "name": "Meal name",
      "description": "Two or three appetizing sentences about the dish.",
      "cookTime": "25 min",
      "difficulty": "Easy",
      "matchScore": 92,
      "ingredientsUsed": ["items from the detected inventory used in this recipe"],
      "missingOptional": ["optional extras that improve the dish but are not required—pantry staples like salt, oil, butter are fine"],
      "steps": ["Clear step 1.", "Clear step 2.", "Include 5–8 steps total with concrete actions, times, and heat levels where helpful."]
    }
  ]
}

Rules:
- "difficulty" must be exactly one of: "Easy", "Medium", "Hard"
- "matchScore" is an integer 0–100 for how well the meal fits the combined inventory
- "ingredientsUsed" must only reference items from your ingredients list
- "missingOptional" must be truly optional nice-to-haves, not core ingredients
- "steps" must be detailed, actionable cooking instructions (5–8 steps)
- With multiple photos, return a longer ingredients list and richer steps—not fewer
- All 5 meals must be distinct and appealing`;

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function normalizeMeals(meals) {
  if (!Array.isArray(meals)) return [];

  return meals.slice(0, 5).map((meal) => ({
    name: meal.name || "Untitled meal",
    description: meal.description || "",
    cookTime: meal.cookTime || meal.time || "—",
    difficulty: ["Easy", "Medium", "Hard"].includes(meal.difficulty)
      ? meal.difficulty
      : "Medium",
    matchScore:
      typeof meal.matchScore === "number"
        ? Math.min(100, Math.max(0, Math.round(meal.matchScore)))
        : 0,
    ingredientsUsed: Array.isArray(meal.ingredientsUsed)
      ? meal.ingredientsUsed
      : [],
    missingOptional: Array.isArray(meal.missingOptional)
      ? meal.missingOptional
      : [],
    steps: Array.isArray(meal.steps) ? meal.steps : [],
  }));
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    let images = formData.getAll("images").filter((item) => item instanceof Blob);

    if (images.length === 0) {
      const single = formData.get("image");
      if (single instanceof Blob) images = [single];
    }

    if (images.length === 0) {
      return Response.json({ error: "No images uploaded." }, { status: 400 });
    }

    const imageParts = await Promise.all(
      images.map(async (image) => {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString("base64");
        const mime = image.type || "image/jpeg";

        return {
          type: "input_image",
          image_url: `data:${mime};base64,${base64Image}`,
        };
      })
    );

    const photoNote =
      images.length === 1
        ? "There is 1 photo attached."
        : `There are ${images.length} photos attached—treat them as one combined kitchen.`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `${ANALYSIS_PROMPT}\n\n${photoNote}`,
            },
            ...imageParts,
          ],
        },
      ],
    });

    const data = parseModelJson(response.output_text);

    return Response.json({
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      meals: normalizeMeals(data.meals),
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to analyze images." },
      { status: 500 }
    );
  }
}
