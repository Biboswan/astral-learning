import { NextRequest, NextResponse } from 'next/server';
import { wrapAISDK } from "langsmith/experimental/vercel";
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';
import { ModelMessage } from 'ai';
import * as ai from 'ai';
import { validateAndTranspile } from '@/lib/validateAndTranspile';

const updateGeneratedLesson = async (lesson_id: string, ts_code: string, js_code: string) => {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase
      .from("lessons")
      .update({ status: "generated", ts_code, js_code })
      .eq("id", lesson_id);
  } catch (error) {
    console.error("Error updating generated lesson:", error);
  }
}

const updateFailedLesson = async (lesson_id: string) => {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase
      .from("lessons")
      .update({ status: "failed" })
      .eq("id", lesson_id);
  } catch (error) {
    console.error("Error updating failed lesson:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { lesson_id, outline } = body;

    if (!lesson_id || !outline) {
      return NextResponse.json(
        { error: 'Lesson ID and outline are required' },
        { status: 400 }
      );
    }

    // 2. Generate lesson using Vercel AI SDK with text generation
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = openai("gpt-4o-mini");

    const systemPrompt = `You are a code generator that produces TypeScript lessons.
    Rules:
    1. Output ONLY a TypeScript variable declaration: const lesson: GeneratedLessonContent = {...}
    2. The object must implement the GeneratedLessonContent interface structure.
    3. Include these properties:
    - title: string
    - blocks: array of GeneratedLessonBlock objects
    4. GeneratedLessonBlock can be of any of the following kinds:
    - "explanation": { heading?: string, body: string, svgDiagram?: string }
    - "quiz": { description?: string, questions: [{ question: string, options: string[], answer: number, explanation?: string }] }
    - "code": { language: "ts" | "js" | "python", code: string, output?: string }
    - "image": { alt: string, url: string }
    5. Content Guidelines:
    - Generate 6-8 blocks total (not 4 of each kind)
    - Use explanation blocks for concepts and theory
    - Use code blocks ONLY when demonstrating actual code examples
    - Use quiz blocks for testing understanding
    - Use image blocks sparingly, only when visual aids are truly helpful
    - Avoid unnecessary code blocks - only include when teaching programming concepts
    - Make content relevant and focused on the specific lesson outline
    6. Follow these strict rules:
    - Start with "const lesson: GeneratedLessonContent = "
    - End with ";"
    - NO Markdown or fenced code blocks
    - NO extra text or comments
    - Output must be valid TypeScript
    - Each block should have meaningful content relevant to the lesson outline

    Your task: given a lesson outline, generate the lesson variable declaration.`

    const MAX_ATTEMPTS = 5;
    let attempts = 0;
    let generatedJsCode: string | undefined = undefined;
    let generatedTsCode: string | undefined = undefined;
    const { generateText } = wrapAISDK(ai);

    const prompt = [{
      role: "system",
      content: systemPrompt
    }, {
      role: "user",
      content: `Lesson outline: "${outline}"`
    }];

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        const { text: generatedCode } = await generateText({
        model,
        prompt: prompt as ModelMessage[]
        });

        console.log("Generated TS code:", generatedCode);

        const { isValid, jsCode, errors } = await validateAndTranspile(generatedCode as string);
        console.log("Validation result:", isValid, errors);
         if (!isValid ) {
             const feedback = errors?.join("\n");
             const retryPrompt = `The previous TypeScript code failed with these errors:\n${feedback}\n\nPrevious generated code:\n\`\`\`typescript\n${generatedCode}\n\`\`\`\n\nPlease regenerate valid code that fixes these issues.`;
             prompt.push({
                role: "user",
                content: retryPrompt
             });
             continue;
         }
        generatedTsCode = generatedCode as string;
        generatedJsCode = jsCode as string;
        break;
  }

  if (generatedTsCode && generatedJsCode) {
    await updateGeneratedLesson(lesson_id, generatedTsCode, generatedJsCode);
    return NextResponse.json("Lesson generated successfully", { status: 200 });
  } else {
    await updateFailedLesson(lesson_id);
    return NextResponse.json("Lesson generation failed", { status: 500 });
  }
  } catch (error) {
    console.error("Error generating lesson:", error);
    return NextResponse.json("Lesson generation failed", { status: 500 });
  }
}
