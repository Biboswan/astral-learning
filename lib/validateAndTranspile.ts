import * as ts from "typescript";
import * as path from "path";

/**
 * Validate and transpile AI-generated TypeScript lesson using TypeScript compiler API
 * @param tsCode AI-generated TypeScript code string
 * @returns { isValid: boolean, jsCode?: string, errors?: string[] }
 */
export async function validateAndTranspile(tsCode: string) {
  // Validate input first
  if (!tsCode || typeof tsCode !== 'string') {
    return { isValid: false, errors: ['Invalid TypeScript code provided'] };
  }

  // Check for invalid UTF-8 characters
  try {
    Buffer.from(tsCode, 'utf8').toString('utf8');
  } catch {
    return { isValid: false, errors: ['Invalid UTF-8 encoding in TypeScript code'] };
  }

  // Basic syntax validation
  if (!tsCode.includes('const lesson') || !tsCode.includes('GeneratedLessonContent')) {
    return { isValid: false, errors: ['Code must contain "const lesson: GeneratedLessonContent"'] };
  }

  try {
    // Include the GeneratedLessonContent type definition for validation
    const typeDefinitions = `
interface GeneratedLessonContent {
  title: string;
  blocks: GeneratedLessonBlock[];
}

type GeneratedLessonBlock =
  | ExplanationBlock
  | QuizBlock
  | CodeBlock
  | ImageBlock;

interface ExplanationBlock {
  kind: "explanation";
  heading?: string;
  body: string;
  svgDiagram?: string;
}

interface QuizBlock {
  kind: "quiz";
  description?: string;
  questions: {
    question: string;
    options: string[];
    answer: number;
    explanation?: string;
  }[];
}

interface CodeBlock {
  kind: "code";
  language: "ts" | "js" | "python";
  code: string;
  output?: string;
}

interface ImageBlock {
  kind: "image";
  alt: string;
  url: string;
}
`;

    // Combine type definitions with generated code
    const fullCode = typeDefinitions + '\n' + tsCode;

    // Create a TypeScript program for full type checking
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2017,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noImplicitAny: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true, // We need lib checking for global types
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      types: ["node"],
      lib: ["lib.esnext.d.ts", "lib.dom.d.ts"], // Include necessary libraries
    };

    // Create source files for type checking
    const currentDir = process.cwd();
    const fileName = path.join(currentDir, 'generated-lesson.ts');
    const sourceFile = ts.createSourceFile(
      fileName,
      fullCode,
      ts.ScriptTarget.ES2017,
      true
    );
    // Create host and override for in-memory file (delegate to original for libs/other files)
    const host = ts.createCompilerHost(compilerOptions);
    const customHostConfig = {
      getSourceFile: (name: string, languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions, onError?: (message: string) => void) => {
        if (path.resolve(name) === path.resolve(fileName)) {
          return sourceFile;
        }
        return host.getSourceFile(name, languageVersion, onError);
      },
      readFile: (name: string) => {
        if (path.resolve(name) === path.resolve(fileName)) {
          return fullCode;
        }
        return host.readFile(name);
      },
      fileExists: (name: string) => {
        if (path.resolve(name) === path.resolve(fileName)) return true;
        return host.fileExists(name);
      },
      directoryExists: (name: string) => (host.directoryExists?.(name) ?? false),
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: host.getCanonicalFileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      writeFile: () => {},
    };

    // Create a program for type checking
    const program = ts.createProgram([fileName], compilerOptions, {...host, ...customHostConfig});
    // Check for type errors
    const diagnostics = ts.getPreEmitDiagnostics(program);
    
    if (diagnostics.length > 0) {
      const errors = diagnostics.map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        return message;
      });
      return { isValid: false, errors };
    }

    // If no type errors, transpile to JavaScript (only the original code)
    const transpileResult = ts.transpileModule(tsCode, {
      compilerOptions,
      fileName: 'generated-lesson.ts',
    });

    // Check for transpile errors (basic syntax)
    if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
      const errors = transpileResult.diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      return { isValid: false, errors };
    }

    return { isValid: true, jsCode: transpileResult.outputText };

  } catch (err: unknown) {
    // TypeScript compiler throws on syntax or type errors
    const errorMessage = err instanceof Error ? err.message : 'TypeScript compilation failed';
    const errors = [errorMessage];
    return { isValid: false, errors };
  }
}
