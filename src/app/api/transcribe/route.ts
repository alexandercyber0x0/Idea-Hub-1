import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioChunks } = body;

    if (!audioChunks || !Array.isArray(audioChunks) || audioChunks.length === 0) {
      return NextResponse.json({ error: 'Audio chunks are required' }, { status: 400 });
    }

    const transcriptions: string[] = [];
    
    // Process each audio chunk
    for (let i = 0; i < audioChunks.length; i++) {
      const chunk = audioChunks[i];
      
      try {
        const text = await transcribeAudio(chunk);
        
        if (text && text.trim()) {
          transcriptions.push(text.trim());
        }
      } catch (chunkError) {
        console.error(`Error transcribing chunk ${i + 1}:`, chunkError);
        // Continue with other chunks even if one fails
      }
    }

    // Combine all transcriptions
    const fullTranscription = transcriptions.join(' ').trim();
    
    if (!fullTranscription) {
      return NextResponse.json({ 
        error: 'No transcription produced. The audio may be empty or unclear.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      transcription: fullTranscription,
      chunksProcessed: transcriptions.length,
      totalChunks: audioChunks.length,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}