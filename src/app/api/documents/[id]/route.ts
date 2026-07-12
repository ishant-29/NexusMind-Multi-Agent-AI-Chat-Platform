import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const FILE_SERVICE_URL = process.env.FILE_SERVICE_URL || 'http://localhost:4003';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'dev-service-key';

const serviceHeaders = (userId: string) => ({
  'x-service-key': SERVICE_API_KEY,
  'x-user-id': userId,
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${FILE_SERVICE_URL}/api/documents/${id}`, {
      headers: serviceHeaders(session.user.id),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${FILE_SERVICE_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: serviceHeaders(session.user.id),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
