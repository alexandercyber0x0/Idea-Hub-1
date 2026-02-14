import { NextRequest, NextResponse } from 'next/server';
import { getZai } from '@/lib/zai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, title } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const zai = await getZai();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert at summarizing voice notes and ideas. 
          Create a clear, concise summary that:
          1. Captures the main points and key ideas
          2. Identifies any action items or next steps
          3. Organizes the information in a readable format
          4. Keeps the summary brief but comprehensive
          
          Format your response with clear sections using markdown.`
        },
        {
          role: 'user',
          content: `${title ? `Title: ${title}\n\n` : ''}Transcript:\n${transcript}\n\nPlease summarize this voice note.`
        }
      ],
      thinking: { type: 'disabled' }
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json({ 
      error: `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
