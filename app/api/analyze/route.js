import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON found");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OpenAI API key." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const images = formData.getAll("images");

    if (!images || images.length === 0) {
      return Response.json(
        { error: "No images uploaded." },
        { status: 400 }
      );
    }

    const imageContent = [];

    for (const image of images) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");

      imageContent.push({
        type: "input_image",
        image_url: `data:${image.type};base64,${base64Image}`,
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are FridgeChef AI, a practical home cooking assistant.

Analyze ALL uploaded kitchen, fridge, freezer, pantry, and counter photos together.
Treat them as one combined kitchen inventory.

Your job:
1. Detect as many visible food items as possible.
2. Read labels on jars, cans, cartons, bags, bottles, boxes, and containers.
3. Separate confirmed ingredients from possible ingredients.
4. Suggest NORMAL, realistic meals people would actually want to eat.
5. Do NOT force weird ingredient combinations.
6. Prefer meals using the most confirmed ingredients.
7. Suggest 5 ranked meal ideas.
8. Include optional missing ingredients, but keep them minimal.
9. Give short useful cooking steps.

Avoid strange combinations like yogurt with mustard, orange juice stir fry, or random sauces unless it truly makes sense.

Return ONLY valid JSON in this exact format:

{
  "ingredients": ["ingredient"],
  "possibleIngredients": ["possible ingredient"],
  "meals": [
    {
      "name": "Meal name",
      "description": "Short practical description",
      "cookTime": "20 min",
      "difficulty": "Easy",
      "matchScore": 92,
      "ingredientsUsed": ["ingredient"],
      "missingOptional": ["optional ingredient"],
      "steps": [
        "Step 1",
        "Step 2",
        "Step 3"
      ]
    }
  ]
}
              `,
            },
            ...imageContent,
          ],
        },
      ],
    });

    const data = extractJson(response.output_text);

    return Response.json({
      ingredients: data.ingredients || [],
      possibleIngredients: data.possibleIngredients || [],
      meals: data.meals || [],
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Scan failed. Try a brighter, clearer photo." },
      { status: 500 }
    );
  }
}
