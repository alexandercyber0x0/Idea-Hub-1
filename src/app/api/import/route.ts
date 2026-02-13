import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/encryption';
import { isPasswordSet, setupPassword, verifyStoredPassword } from '@/lib/passwordManager';

// POST - Import data from encrypted backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, backup } = body;

    if (!backup || !backup.data) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }

    // Check if this is a fresh install
    const freshInstall = !isPasswordSet();
    
    if (!freshInstall) {
      // Verify password against stored hash
      if (!verifyStoredPassword(password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Parse the backup data
    let importData;
    try {
      importData = JSON.parse(backup.data);
    } catch {
      return NextResponse.json({ error: 'Corrupted backup file' }, { status: 400 });
    }

    // Validate structure
    if (!importData.data || !importData.data.ideas || !importData.data.aiTools) {
      return NextResponse.json({ error: 'Invalid backup structure' }, { status: 400 });
    }

    // If fresh install, set up the password from backup
    if (freshInstall && backup.verification) {
      // We need the user to provide a new password for fresh install
      return NextResponse.json({ 
        error: 'Fresh install detected. Please set a password first.', 
        requiresSetup: true 
      }, { status: 400 });
    }

    // Start transaction-like import
    const results = {
      ideas: { imported: 0, skipped: 0 },
      aiTools: { imported: 0, skipped: 0 },
    };

    // Import ideas
    for (const idea of importData.data.ideas) {
      try {
        // Check if idea already exists
        const existing = await db.idea.findUnique({ where: { id: idea.id } });
        if (existing) {
          results.ideas.skipped++;
          continue;
        }

        // Create idea without subtasks first
        const { subtasks, ...ideaData } = idea;
        await db.idea.create({
          data: {
            ...ideaData,
            subtasks: subtasks ? {
              create: subtasks.map((st: { id: string; title: string; completed: boolean }) => ({
                id: st.id,
                title: st.title,
                completed: st.completed,
              }))
            } : undefined,
          },
        });
        results.ideas.imported++;
      } catch (err) {
        console.error('Failed to import idea:', err);
        results.ideas.skipped++;
      }
    }

    // Import AI tools
    for (const tool of importData.data.aiTools) {
      try {
        const existing = await db.aITool.findUnique({ where: { id: tool.id } });
        if (existing) {
          results.aiTools.skipped++;
          continue;
        }

        await db.aITool.create({ data: tool });
        results.aiTools.imported++;
      } catch (err) {
        console.error('Failed to import AI tool:', err);
        results.aiTools.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import completed',
      results,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
