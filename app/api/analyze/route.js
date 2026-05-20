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
    throw new Error("No JSON found in AI response.");
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
        { error: "No kitchen photos uploaded." },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      return Response.json(
        { error: "Please analyze 4 photos or fewer at a time." },
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
        image_url: `data:image/jpeg;base64,${base64Image}`,
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
You are FridgeChef AI, a practical cooking assistant.

These images are from the SAME kitchen. Combine all visible food items into one kitchen inventory.

Analyze every uploaded image together:
- fridge
- pantry
- freezer
- counter
- cabinets

Detection rules:
- read labels on packages, jars, cans, cartons, bags, bottles, and containers
- detect produce, meat, dairy, bread, sauces, drinks, snacks, and leftovers
- return many items if visible
- separate confirmed ingredients from possible ingredients
- do not invent ingredients that are not likely visible

Meal rules:
- generate 5 realistic meal ideas
- rank best meals first
- avoid weird combinations
- do not force random ingredients together
- prioritize normal food someone would actually cook
- use mostly confirmed ingredients
- optional missing ingredients should be common basics only
- include clear cooking steps

Return ONLY valid JSON in this format:

{
  "ingredients": ["confirmed ingredient"],
  "possibleIngredients": ["possible ingredient"],
  "meals": [
    {
      "name": "Meal name",
      "description": "Short practical description",
      "cookTime": "15 min",
      "difficulty": "Easy",
      "matchScore": 95,
      "ingredientsUsed": ["ingredient"],
      "missingOptional": ["optional ingredient"],
      "steps": ["step one", "step two", "step three"]
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
      {
        error:
          "Scan failed. Try fewer photos, brighter lighting, or clearer labels.",
      },
      { status: 500 }
    );
  }
}