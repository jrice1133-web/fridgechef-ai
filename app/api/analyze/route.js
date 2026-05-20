import OpenAI from "openai";
import { ANALYZE_VISION_PROMPT } from "@/lib/prompts/analyze";
import { parseModelJson } from "@/lib/analysis/parse-json";
import { normalizeAnalysisResponse } from "@/lib/analysis/normalize";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Scanning is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || typeof image.arrayBuffer !== "function") {
      return Response.json(
        { error: "Please upload a photo of your fridge or pantry." },
        { status: 400 }
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json(
        {
          error:
            "That photo is too large. Try a closer shot or allow the app to compress it and scan again.",
        },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: ANALYZE_VISION_PROMPT,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const text = response.output_text;
    const parsed = parseModelJson(text);
    const data = normalizeAnalysisResponse(parsed);

    return Response.json(data);
  } catch (error) {
    console.error("Analyze error:", error);

    return Response.json(
      {
        error:
          "We couldn't scan this photo. Try a brighter, closer shot with labels facing the camera.",
      },
      { status: 500 }
    );
  }
}
