import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    
    const { outline } = body;

    if (!outline) {
      return NextResponse.json(
        { error: 'Outline is required' },
        { status: 400 }
      );
    }

    // Create the lesson
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        title: outline.slice(0,10),
        outline,
        status: "generating"
      })
      .select()
      .single();

    // Call the generate lesson API route
    if (data) {
      try {
        fetch(`${request.nextUrl.origin}/api/generate-lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lesson_id: data.id, outline: outline }),
        });
        console.log('Lesson generation triggered for:', data.id);
      } catch (functionError) {
        console.error('Error calling generate lesson function:', functionError);
        // Don't fail the request if function call fails
      }
    }

    if (error) {
      console.error('Error creating lesson:', error);
      return NextResponse.json(
        { error: 'Failed to create lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
