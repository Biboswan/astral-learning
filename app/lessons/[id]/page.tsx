import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { GeneratedLessonBlock, GeneratedLessonContent } from '@/lib/types/generatedLessonContent';
import { notFound } from 'next/navigation';
import InteractiveQuiz from '@/components/InteractiveQuiz';

function evaluateLessonCode(jsCode: string): GeneratedLessonContent | null{
  try {
    // Wrap the code in a function to create a controlled scope
    const wrappedCode = `
      (function() {
        ${jsCode}
        return typeof lesson !== 'undefined' ? lesson : null;
      })()
    `;

    // Evaluate the code safely
    const result = eval(wrappedCode);
    return result;
  } catch (evalError) {
    console.error('Error evaluating lesson code:', evalError);
    return null;
  }
}

export default async function ViewLesson({ params }: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !lesson) {
    notFound();
  }

  // Evaluate JavaScript code if available
  let evaluatedLesson = null;
  if (lesson.js_code) {
    evaluatedLesson = evaluateLessonCode(lesson.js_code);
    console.log('evaluatedLesson', evaluatedLesson);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Lesson Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Status: {lesson.status}</span>
            <span>Created: {new Date(lesson.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Lesson Outline */}
        {lesson.outline && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Lesson Outline</h2>
            <p className="text-gray-700">{lesson.outline}</p>
          </div>
        )}

        {/* Evaluated Lesson Content */}
        {evaluatedLesson && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Lesson Content</h2>
            
            {/* Lesson Title */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900">{evaluatedLesson.title}</h3>
            </div>

            {/* Lesson Blocks */}
            {evaluatedLesson.blocks && evaluatedLesson.blocks.map((block: GeneratedLessonBlock, index: number) => (
              <div key={index} className="mb-6 p-6 border rounded-lg">
                {block.kind === 'explanation' && (
                  <div>
                    {block.heading && (
                      <h4 className="text-lg font-semibold mb-3">{block.heading}</h4>
                    )}
                    <p className="text-gray-700 mb-3">{block.body}</p>
                    {block.svgDiagram && (
                      <div 
                        className="mt-4"
                        dangerouslySetInnerHTML={{ __html: block.svgDiagram }}
                      />
                    )}
                  </div>
                )}

                {block.kind === 'code' && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">
                      Code Example ({block.language?.toUpperCase()})
                    </h4>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                      <code>{block.code}</code>
                    </pre>
                    {block.output && (
                      <div className="mt-3 p-3 bg-gray-100 rounded">
                        <strong>Output:</strong>
                        <pre className="mt-1">{block.output}</pre>
                      </div>
                    )}
                  </div>
                )}

                {block.kind === 'quiz' && (
                  <InteractiveQuiz
                    description={block.description}
                    questions={block.questions || []}
                  />
                )}

                {block.kind === 'image' && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">{block.alt}</h4>
                    <img 
                      src={block.url} 
                      alt={block.alt}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
  