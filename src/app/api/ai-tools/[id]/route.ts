import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptObject, encryptObject } from '@/lib/encryption';
import { isPasswordSet, verifyStoredPassword } from '@/lib/passwordManager';

// GET single AI tool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const password = request.headers.get('x-encryption-key');
    
    const tool = await db.aITool.findUnique({
      where: { id },
    });
    
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    
    // Decrypt if password provided
    const responseTool = password && isPasswordSet() ? decryptObject(tool, password) : tool;
    
    return NextResponse.json(responseTool);
  } catch (error) {
    console.error('Error fetching AI tool:', error);
    return NextResponse.json({ error: 'Failed to fetch AI tool' }, { status: 500 });
  }
}

// PUT - Update AI tool
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const password = request.headers.get('x-encryption-key');
    const body = await request.json();
    
    // Encrypt if password provided and encryption is set up
    let encryptedData = body;
    if (password && isPasswordSet()) {
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      encryptedData = encryptObject(body, password);
    }
    
    const tool = await db.aITool.update({
      where: { id },
      data: {
        ...encryptedData,
        updatedAt: new Date(),
      },
    });
    
    // Decrypt for response
    const responseTool = password && isPasswordSet() ? decryptObject(tool, password) : tool;
    
    return NextResponse.json(responseTool);
  } catch (error) {
    console.error('Error updating AI tool:', error);
    return NextResponse.json({ error: 'Failed to update AI tool' }, { status: 500 });
  }
}

// DELETE AI tool
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aITool.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI tool:', error);
    return NextResponse.json({ error: 'Failed to delete AI tool' }, { status: 500 });
  }
}
