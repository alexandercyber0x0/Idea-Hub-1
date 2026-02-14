import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptObject, encryptObject } from '@/lib/encryption';
import { isPasswordSet, verifyStoredPassword } from '@/lib/passwordManager';
import { webSearch } from '@/lib/tavily';
import { createChatCompletion } from '@/lib/groq';

// GET all AI tools
export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-encryption-key');
    
    const tools = await db.aITool.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Decrypt if password provided
    let decryptedTools = tools;
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      decryptedTools = tools.map(tool => decryptObject(tool, password));
    }
    
    return NextResponse.json(decryptedTools);
  } catch (error) {
    console.error('Error fetching AI tools:', error);
    return NextResponse.json({ error: 'Failed to fetch AI tools' }, { status: 500 });
  }
}

// POST - Create new AI tool with web search
export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-encryption-key');
    const body = await request.json();
    const { name, reelLink, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    // Search the web for AI tool information
    let toolInfo = {
      description: null as string | null,
      website: null as string | null,
      pricing: null as string | null,
      useCases: [] as string[],
      features: [] as string[],
      category: null as string | null,
      logoUrl: null as string | null,
    };

    try {
      const searchQuery = `${name} AI tool pricing features use cases official website`;
      const searchResults = await webSearch(searchQuery, 10);

      const searchContext = searchResults
        .slice(0, 5)
        .map((r, i) => 
          `${i + 1}. ${r.name}\n${r.snippet}\nURL: ${r.url}`
        )
        .join('\n\n');

      const completionText = await createChatCompletion([
        {
          role: 'system',
          content: `You are an AI tool researcher. Extract information about AI tools from search results. 
          Return ONLY valid JSON with this structure (no markdown, no code blocks):
          {
            "description": "ONE concise sentence (max 15 words) describing what the tool does",
            "website": "Official website URL",
            "pricing": "Pricing model (free/freemium/paid/subscription with prices)",
            "useCases": ["use case 1", "use case 2"],
            "features": ["feature 1", "feature 2"],
            "category": "Category (e.g., Image Generation, Text AI, Video, Audio, etc.)",
            "logoUrl": "Logo URL if found or null"
          }
          IMPORTANT: Keep description to ONE short sentence max 15 words. If information is not found, use null for that field.`
        },
        {
          role: 'user',
          content: `Tool Name: ${name}\n\nSearch Results:\n${searchContext}\n\nExtract the tool information.`
        }
      ]);

      const cleanedResponse = completionText.replace(/```json\n?|\n?```/g, '').trim();
      toolInfo = JSON.parse(cleanedResponse);
    } catch (searchError) {
      console.log('Web search failed, using defaults:', searchError);
    }

    // Prepare data
    let toolData: Record<string, unknown> = {
      name,
      description: toolInfo.description || notes || null,
      reelLink: reelLink || null,
      website: toolInfo.website || null,
      pricing: toolInfo.pricing || null,
      useCases: toolInfo.useCases ? JSON.stringify(toolInfo.useCases) : null,
      features: toolInfo.features ? JSON.stringify(toolInfo.features) : null,
      category: toolInfo.category || null,
      logoUrl: toolInfo.logoUrl || null,
      notes: notes || null,
    };

    // Encrypt if password provided and encryption is set up
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      toolData = encryptObject(toolData, password);
    }

    // Create the AI tool in database
    const tool = await db.aITool.create({
      data: toolData,
    });

    // Decrypt for response
    const responseTool = password && isPasswordSet() ? decryptObject(tool, password) : tool;

    return NextResponse.json(responseTool);
  } catch (error) {
    console.error('Error creating AI tool:', error);
    return NextResponse.json({ error: 'Failed to create AI tool' }, { status: 500 });
  }
}