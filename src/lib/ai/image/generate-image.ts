"use server";
import {
  GoogleGenAI,
  Part as GeminiPart,
  Content as GeminiMessage,
} from "@google/genai";
import { safe, watchError } from "ts-safe";
import { getBase64Data } from "lib/file-storage/storage-utils";
import { serverFileStorage } from "lib/file-storage";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import OpenAI from "openai";

import {
  FilePart,
  ImagePart,
  ModelMessage,
  TextPart,
  experimental_generateImage,
} from "ai";
import { isString } from "lib/utils";
import logger from "logger";

type GenerateImageOptions = {
  messages?: ModelMessage[];
  prompt: string;
  abortSignal?: AbortSignal;
};

type GeneratedImage = {
  base64: string;
  mimeType?: string;
};

export type GeneratedImageResult = {
  images: GeneratedImage[];
};

export async function generateImageWithOpenAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return experimental_generateImage({
    model: openai.image("gpt-image-1-mini"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => {
        const item: GeneratedImage = {
          base64: Buffer.from(v.uint8Array).toString("base64"),
          mimeType: v.mediaType,
        };
        return item;
      }),
    };
  });
}

export async function generateImageWithXAI(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  return experimental_generateImage({
    model: xai.image("grok-2-image"),
    abortSignal: options.abortSignal,
    prompt: options.prompt,
  }).then((res) => {
    return {
      images: res.images.map((v) => ({
        base64: Buffer.from(v.uint8Array).toString("base64"),
        mimeType: v.mediaType,
      })),
    };
  });
}

export async function generateImageWithOpenRouter(
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://hello-its.vercel.app",
      "X-Title": "AJ STUDIOZ",
    },
  });

  // Convert messages to OpenRouter format
  const messages: Array<{
    role: string;
    content: Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [];

  // Add conversation history
  if (options.messages && options.messages.length > 0) {
    for (const message of options.messages.slice(-6)) {
      if (isString(message.content)) {
        messages.push({
          role: message.role === "user" ? "user" : "assistant",
          content: [{ type: "text", text: message.content }],
        });
      } else {
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
        
        for (const part of message.content) {
          if (part.type === "text") {
            contentParts.push({ type: "text", text: (part as TextPart).text });
          } else if (part.type === "image") {
            const imagePart = part as ImagePart;
            let imageUrl = "";
            
            if (typeof imagePart.image === "string") {
              imageUrl = imagePart.image;
            } else {
              // Convert to base64 data URL
              const base64Data = await getBase64Data({
                data: imagePart.image,
                mimeType: imagePart.mediaType || "image/png",
              });
              imageUrl = `data:${base64Data.mimeType};base64,${base64Data.data}`;
            }
            
            contentParts.push({
              type: "image_url",
              image_url: { url: imageUrl },
            });
          }
        }
        
        messages.push({
          role: message.role === "user" ? "user" : "assistant",
          content: contentParts,
        });
      }
    }
  }

  // Add the prompt
  messages.push({
    role: "user",
    content: [{ type: "text", text: options.prompt }],
  });

  const completion = await openrouter.chat.completions.create({
    model: "google/gemini-2.5-flash-image",
    messages: messages as any,
  });

  // Extract images from response
  const responseContent = completion.choices[0]?.message?.content;
  
  if (!responseContent) {
    throw new Error("No response from OpenRouter");
  }

  // OpenRouter returns image URLs in the response
  // Parse the response to extract image URLs
  const images: GeneratedImage[] = [];
  
  // For now, return empty as OpenRouter's image generation might return differently
  // This is a placeholder - adjust based on actual OpenRouter response format
  logger.info("OpenRouter response:", responseContent);
  
  return { images };
}

export const generateImageWithPollinations = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  // Pollinations.ai - Completely FREE, no API key needed!
  // https://pollinations.ai/
  
  const prompt = encodeURIComponent(options.prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&nologo=true&enhance=true`;
  
  try {
    const response = await fetch(imageUrl, {
      signal: options.abortSignal,
    });
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    return {
      images: [{
        base64,
        mimeType: "image/jpeg",
      }],
    };
  } catch (error) {
    logger.error("Pollinations image generation error:", error);
    throw error;
  }
};

export const generateImageWithHuggingFace = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  // HuggingFace Inference API - FREE tier available
  // Uses Stable Diffusion models
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    // Fallback to Pollinations if no API key
    logger.info("No HuggingFace API key, using Pollinations instead");
    return generateImageWithPollinations(options);
  }
  
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: options.prompt,
        }),
        signal: options.abortSignal,
      }
    );
    
    if (!response.ok) {
      // If HuggingFace fails, fallback to Pollinations
      logger.warn(`HuggingFace API error: ${response.statusText}, falling back to Pollinations`);
      return generateImageWithPollinations(options);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    return {
      images: [{
        base64,
        mimeType: "image/jpeg",
      }],
    };
  } catch (error) {
    logger.error("HuggingFace image generation error:", error);
    // Fallback to Pollinations on any error
    logger.info("Falling back to Pollinations.ai");
    return generateImageWithPollinations(options);
  }
};

export const generateImageWithNanoBanana = async (
  options: GenerateImageOptions,
): Promise<GeneratedImageResult> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const geminiMessages: GeminiMessage[] = await safe(options.messages || [])
    .map((messages) => Promise.all(messages.map(convertToGeminiMessage)))
    .watch(watchError(logger.error))
    .unwrap();
  if (options.prompt) {
    geminiMessages.push({
      role: "user",
      parts: [{ text: options.prompt }],
    });
  }
  const response = await ai.models
    .generateContent({
      model: "gemini-2.5-flash-image",
      config: {
        abortSignal: options.abortSignal,
        responseModalities: ["IMAGE"],
      },
      contents: geminiMessages,
    })
    .catch((err) => {
      logger.error(err);
      throw err;
    });
  return (
    response.candidates?.reduce(
      (acc, candidate) => {
        const images =
          candidate.content?.parts
            ?.filter((part) => part.inlineData)
            .map((p) => ({
              base64: p.inlineData!.data!,
              mimeType: p.inlineData!.mimeType,
            })) ?? [];
        acc.images.push(...images);
        return acc;
      },
      { images: [] as GeneratedImage[] },
    ) || { images: [] as GeneratedImage[] }
  );
};

async function convertToGeminiMessage(
  message: ModelMessage,
): Promise<GeminiMessage> {
  const getBase64DataSmart = async (input: {
    data: string | Uint8Array | ArrayBuffer | Buffer | URL;
    mimeType: string;
  }): Promise<{ data: string; mimeType: string }> => {
    if (
      typeof input.data === "string" &&
      (input.data.startsWith("http://") || input.data.startsWith("https://"))
    ) {
      // Try fetching directly (public URLs)
      try {
        const resp = await fetch(input.data);
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          return { data: buf.toString("base64"), mimeType: input.mimeType };
        }
      } catch {
        // fall through to storage fallback
      }

      // Fallback: derive key and download via storage backend (works for private buckets)
      try {
        const u = new URL(input.data as string);
        const key = decodeURIComponent(u.pathname.replace(/^\//, ""));
        const buf = await serverFileStorage.download(key);
        return { data: buf.toString("base64"), mimeType: input.mimeType };
      } catch {
        // Ignore and fall back to generic helper below
      }
    }

    // Default fallback: use generic helper (handles base64, buffers, blobs, etc.)
    return getBase64Data(input);
  };
  const parts = isString(message.content)
    ? ([{ text: message.content }] as GeminiPart[])
    : await Promise.all(
        message.content.map(async (content) => {
          if (content.type == "file") {
            const part = content as FilePart;
            const data = await getBase64DataSmart({
              data: part.data,
              mimeType: part.mediaType!,
            });
            return {
              inlineData: data,
            } as GeminiPart;
          }
          if (content.type == "text") {
            const part = content as TextPart;
            return {
              text: part.text,
            };
          }
          if (content.type == "image") {
            const part = content as ImagePart;
            const data = await getBase64DataSmart({
              data: part.image,
              mimeType: part.mediaType!,
            });
            return {
              inlineData: data,
            };
          }
          return null;
        }),
      )
        .then((parts) => parts.filter(Boolean) as GeminiPart[])
        .catch((err) => {
          logger.withTag("convertToGeminiMessage").error(err);
          throw err;
        });

  return {
    role: message.role == "user" ? "user" : "model",
    parts,
  };
}
