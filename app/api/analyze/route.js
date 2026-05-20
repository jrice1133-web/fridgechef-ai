import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return Response.json(
        { error: "No image uploaded." },
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
  "ingredients": [
    { "name": "ingredient name", "confidence": "high" },
    { "name": "possible ingredient", "confidence": "low" }
  ],
  "meals": [
    {
      "name": "Meal name",
      "time": "15 min",
      "difficulty": "Easy",
      "matchScore": 85,
      "description": "Short appetizing description",
      "ingredientsUsed": ["ingredient 1", "ingredient 2"],
      "missingOptional": ["salt", "pepper"],
      "steps": ["Step 1 instruction", "Step 2 instruction"]
    }
  ]
}

Use confidence "high" for clearly visible items, "medium" for likely items, "low" for uncertain guesses. matchScore is 0-100 for how well the meal fits detected ingredients. difficulty is Easy, Medium, or Hard.`
            },
            {
              type: "input_image",
              image_url: `data:${image.type};base64,${base64Image}`
            }
          ]
        }
      ]
    });

    const text = response.output_text;
    const data = JSON.parse(text);

    return Response.json(data);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to analyze image." },
      { status: 500 }
    );
  }
}