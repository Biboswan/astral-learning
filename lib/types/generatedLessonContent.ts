export interface GeneratedLessonContent {
    title: string;
    blocks: GeneratedLessonBlock[];
}

export type GeneratedLessonBlock =
    | ExplanationBlock
    | QuizBlock
    | CodeBlock
    | ImageBlock;
  
export interface ExplanationBlock {
    kind: "explanation";
    heading?: string;
    body: string;
    svgDiagram?: string;
}

export interface QuizBlock {
    kind: "quiz";
    description?: string;
    questions: {
      question: string;
      options: string[];
      answer: number;
      explanation?: string;
    }[];
}
  
export interface CodeBlock {
    kind: "code";
    language: "ts" | "js" | "python";
    code: string;
    output?: string;
}

export interface ImageBlock {
    kind: "image";
    alt: string;
    url: string;
}