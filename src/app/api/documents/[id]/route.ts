import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:4003';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${FILE_SERVICE_URL}/api/documents/${params.id}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${FILE_SERVICE_URL}/api/documents/${params.id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
