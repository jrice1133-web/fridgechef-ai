import OpenAI from "openai";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

function normalizeAnalysis(data) {
  const ingredients = Array.isArray(data?.ingredients)
    ? data.ingredients.filter((item) => typeof item === "string" && item.trim())
    : [];

  const meals = Array.isArray(data?.meals)
    ? data.meals
        .filter(
          (meal) =>
            meal &&
            typeof meal.name === "string" &&
            typeof meal.time === "string" &&
            typeof meal.description === "string"
        )
        .map((meal) => ({
          name: meal.name.trim(),
          time: meal.time.trim(),
          description: meal.description.trim(),
        }))
    : [];

  return { ingredients, meals };
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 }
    );
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return Response.json(
        { error: "No image uploaded." },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
      return Response.json(
        { error: "Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json(
        { error: "Image must be 10 MB or smaller." },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Look at this kitchen/fridge/pantry photo. Identify visible food ingredients only. Then suggest 3 realistic meals the user can make mostly from those ingredients.

Return ONLY valid JSON in this exact format:
{
  "ingredients": ["ingredient 1", "ingredient 2"],
  "meals": [
    {
      "name": "Meal name",
      "time": "15 minutes",
      "description": "Short description"
    }
  ]
}`,
            },
            {
              type: "input_image",
              image_url: `data:${image.type};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const parsed = parseModelJson(response.output_text);
    const data = normalizeAnalysis(parsed);

    if (data.ingredients.length === 0 && data.meals.length === 0) {
      return Response.json(
        { error: "Could not detect ingredients or meals from this image." },
        { status: 422 }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to analyze image." },
      { status: 500 }
    );
  }
}
