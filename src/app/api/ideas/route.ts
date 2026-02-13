import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptObject, encryptObject, isEncrypted } from '@/lib/encryption';
import { isPasswordSet, verifyStoredPassword } from '@/lib/passwordManager';

// GET all ideas
export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-encryption-key');
    
    const ideas = await db.idea.findMany({
      include: {
        subtasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Decrypt if password provided
    let decryptedIdeas = ideas;
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      decryptedIdeas = ideas.map(idea => decryptObject(idea, password));
    }
    
    return NextResponse.json(decryptedIdeas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

// POST - Create new idea
export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-encryption-key');
    const body = await request.json();
    const { 
      title, 
      description, 
      category, 
      status, 
      priority, 
      color, 
      transcript, 
      summary,
      reelLinks,
      subtasks 
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Prepare data
    let ideaData: Record<string, unknown> = {
      title,
      description: description || null,
      category: category || 'other',
      status: status || 'bank',
      priority: priority || 'medium',
      color: color || null,
      transcript: transcript || null,
      summary: summary || null,
      reelLinks: reelLinks ? JSON.stringify(reelLinks) : null,
    };

    // Encrypt if password provided and encryption is set up
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      ideaData = encryptObject(ideaData, password);
    }

    const idea = await db.idea.create({
      data: {
        ...ideaData,
        subtasks: subtasks ? {
          create: subtasks.map((st: string) => ({ title: st }))
        } : undefined,
      },
      include: {
        subtasks: true,
      },
    });

    // Decrypt for response
    const responseIdea = password ? decryptObject(idea, password) : idea;

    return NextResponse.json(responseIdea);
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}
