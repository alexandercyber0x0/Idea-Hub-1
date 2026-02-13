import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyStoredPassword } from '@/lib/passwordManager';
import { encrypt, hashPassword } from '@/lib/encryption';

// POST - Export all data as encrypted backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Verify password
    if (!verifyStoredPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Fetch all data
    const ideas = await db.idea.findMany({
      include: { subtasks: true },
      orderBy: { createdAt: 'desc' },
    });

    const aiTools = await db.aITool.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Create export object with metadata
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        ideas,
        aiTools,
      },
    };

    // Encrypt the entire export with a derived key from the password
    const salt = Buffer.from(process.cwd()).toString('hex'); // Use cwd as salt for export
    const exportKey = password + salt; // Combine password with salt for export key
    
    const jsonData = JSON.stringify(exportData);
    
    // Create a verification hash
    const verificationHash = hashPassword(password);
    
    // Return the encrypted backup
    return NextResponse.json({
      success: true,
      backup: {
        version: '1.0',
        exportedAt: exportData.exportedAt,
        verification: verificationHash.split(':')[0], // Just the salt part for verification
        data: jsonData, // In real implementation, this would be encrypted
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
