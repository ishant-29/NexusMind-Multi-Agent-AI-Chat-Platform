import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:4003';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const response = await fetch(`${FILE_SERVICE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
