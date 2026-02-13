import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptObject, encryptObject } from '@/lib/encryption';
import { isPasswordSet, verifyStoredPassword } from '@/lib/passwordManager';

// GET single idea
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const password = request.headers.get('x-encryption-key');
    
    const idea = await db.idea.findUnique({
      where: { id },
      include: {
        subtasks: true,
      },
    });
    
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    
    // Decrypt if password provided
    const responseIdea = password && isPasswordSet() ? decryptObject(idea, password) : idea;
    
    return NextResponse.json(responseIdea);
  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json({ error: 'Failed to fetch idea' }, { status: 500 });
  }
}

// PUT - Update idea
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const password = request.headers.get('x-encryption-key');
    const body = await request.json();
    const { subtasks, reelLinks, ...data } = body;
    
    // Handle reel links serialization
    if (reelLinks !== undefined) {
      data.reelLinks = reelLinks ? JSON.stringify(reelLinks) : null;
    }
    
    // Encrypt if password provided and encryption is set up
    let encryptedData = data;
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      encryptedData = encryptObject(data, password);
    }
    
    const idea = await db.idea.update({
      where: { id },
      data: {
        ...encryptedData,
        updatedAt: new Date(),
      },
      include: {
        subtasks: true,
      },
    });
    
    // Decrypt for response
    const responseIdea = password && isPasswordSet() ? decryptObject(idea, password) : idea;
    
    return NextResponse.json(responseIdea);
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

// DELETE idea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.idea.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
