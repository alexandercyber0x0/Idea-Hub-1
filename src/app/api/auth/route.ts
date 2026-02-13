import { NextRequest, NextResponse } from 'next/server';
import { isPasswordSetup, setupPassword, verifyStoredPassword, getSecurityInfo, changePassword, resetPassword } from '@/lib/passwordManager';

// GET - Check if password is set up
export async function GET() {
  try {
    const isSetup = await isPasswordSetup();
    const info = getSecurityInfo();
    return NextResponse.json({ isSetup, ...info });
  } catch (error) {
    console.error('Error checking password status:', error);
    return NextResponse.json({ isSetup: false });
  }
}

// POST - Setup or verify password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password, newPassword } = body;

    if (action === 'setup') {
      const result = setupPassword(password);
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Password set up successfully' });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (action === 'verify') {
      const isValid = verifyStoredPassword(password);
      return NextResponse.json({ valid: isValid });
    }

    if (action === 'change') {
      const result = changePassword(password, newPassword);
      if (result.success) {
        return NextResponse.json({ success: true, message: 'Password changed successfully' });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (action === 'reset') {
      const result = resetPassword();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth operation:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
