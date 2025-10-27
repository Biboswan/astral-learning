import { NextRequest, NextResponse } from 'next/server';
import * as vm from 'node:vm';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';
import { GeneratedLessonBlock } from '@/lib/types/generatedLessonContent';
import { Visual } from '@/lib/types/lesson';

async function updateLessonWithVisuals(lesson_id: string, visualBase64s: Visual[], status: string) {
    try {
        const supabase = await createServerSupabaseClient();
        await supabase
            .from("lessons")
            .update({ visuals: visualBase64s, status })
            .eq("id", lesson_id);
    }
    catch (error) {
        console.error("Error updating lesson with visuals:", error);
    }
}

async function updateLessonStatus(lesson_id: string, status: string) {
    try {
        const supabase = await createServerSupabaseClient();
        await supabase
            .from("lessons")
            .update({ status })
            .eq("id", lesson_id);
    }
    catch (error) {
        console.error("Error updating lesson status:", error);
    }
}

function getAllVisualPrompts(block: GeneratedLessonBlock, index: number) {
    if (block.kind === 'explanation' && block.svgGenerationPrompt) {
        return { prompt: `Generate a simple **svg** for the following: ${block.svgGenerationPrompt}`, block_id: index };
    }
    if (block.kind === 'image') {
        return { prompt: `Generate a png for the following image: ${block.imageGenerationPrompt}`, block_id: index };
    }
    return null;
};


export async function POST(request: NextRequest) {
    console.log("Generating visuals...");
    const body = await request.json();
    const { lesson_id, js_code } = body;

    if (!lesson_id || !js_code) {
        console.error("Lesson ID and JavaScript code are required");
        return NextResponse.json({ error: 'Lesson ID and JavaScript code are required' }, { status: 400 });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = openai.image('dall-e-3');

    const context = vm.createContext({});
    const lesson = vm.runInContext(`(function() { ${js_code} return typeof lesson !== 'undefined' ? lesson : null; })()`, context);
    if (!lesson) {
        console.error("Lesson not found");
        return NextResponse.json({ error: 'Lesson not found' }, { status: 400 });
    }

    const visualPrompts = lesson.blocks.map(getAllVisualPrompts).filter((prompt: { prompt: string; block_id: number; } | null) => prompt !== null);
    console.log("Visual prompts:", visualPrompts);

    if (visualPrompts.length === 0) {
        await updateLessonStatus(lesson_id, "generated");
        return NextResponse.json({ message: "No visuals to generate" }, { status: 200 });
    }

    const generateAIVisual = async ({prompt, block_id}: {prompt: string, block_id: number}) => {
        const { image } = await generateImage({
            model: model,
            prompt: prompt,
            size: '1024x1024',
            n: 1
        });
        
        return { imageData: image.base64, type: image.mediaType, block_id };
    }


    try {
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled(visualPrompts.map(generateAIVisual));

        // Filter successful results and check for failures
        const visualBase64s = results
            .map((result, index) => {
                if (result.status === 'fulfilled') {
                    const { imageData, block_id, type } = result.value;
                    return { imageData, block_id, type };
                } 
                if (result.status === 'rejected') {
                    console.error(`Image generation failed for block ${visualPrompts[index]?.block_id}:`, result.reason);
                }
                return null;
            })
            .filter((item:Visual | null) => item !== null);

        // Check if all promises succeeded
        const failedCount = results.length - visualBase64s.length;

        await updateLessonWithVisuals(lesson_id, visualBase64s,failedCount > 0 ? "failed" : "generated");
       
        return NextResponse.json({ message: "Visuals generated", count: visualBase64s.length, failedCount: failedCount }, { status: 200 });

    } catch (error) {
        console.error("Error in visual generation:", error);
        await updateLessonStatus(lesson_id, "failed");
        return NextResponse.json({ error: "Failed to generate visuals" }, { status: 500 });
    }
}