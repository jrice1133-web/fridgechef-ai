import OpenAI from "openai";

function getMimeType(file) {
  if (file.type) return file.type;

  const name = file.name?.toLowerCase() ?? "";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server." },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey });

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return Response.json({ error: "No image uploaded." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const mimeType = getMimeType(image);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this kitchen, fridge, or pantry photo. List only food ingredients you can clearly see. Then suggest exactly 3 realistic meals the user can make mostly from those ingredients.

Return JSON in this exact shape:
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
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: "No response from the vision model." },
        { status: 500 }
      );
    }

    const parsed = parseModelJson(content);

    return Response.json({
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
    });
  } catch (error) {
    console.error("Analyze error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to analyze image.";

    return Response.json({ error: message }, { status: 500 });
  }
}
