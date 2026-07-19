import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/app/middlewares/authSeller";
import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function analyzeProductImage(base64Image, mimeType = "image/jpeg") {
    const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                                content: `You are a product listing assistant for an e-commerce store.

Your job is to analyze an image of a product and generate structured data.

Respond ONLY with raw JSON (no code block, no markdown, no explanation).
The JSON must strictly follow this schema:

{
    "name": "string",
    "description": "string"
}`,
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "What is in this image?",
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
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("OpenAI returned an empty response");
    }

    return JSON.parse(content);
}

export async function POST(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json(
                { error: "Not Authorized" },
                { status: 401 }
            );
        }

        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json(
                { error: "Not Authorized" },
                { status: 401 }
            );
        }

        const { base64Image, mimeType } = await req.json();

        if (!base64Image) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        const product = await analyzeProductImage(base64Image, mimeType);

        return NextResponse.json(
            {
                success: true,
                product,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating product details:", error);

        return NextResponse.json(
            {
                error: error?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
