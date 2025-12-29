import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPDFPath } from '@/lib/content';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subject = searchParams.get('subject');
  const file = searchParams.get('file');

  if (!subject || !file) {
    return new NextResponse('Missing subject or file parameter', { status: 400 });
  }

  // Basic security check
  // Stricter security check
  const safePattern = /^[a-zA-Z0-9_\-\.\s]+$/;
  if (!safePattern.test(subject) || !safePattern.test(file) || subject.includes('..') || file.includes('..')) {
    return new NextResponse('Invalid path parameters', { status: 403 });
  }

  const filePath = getPDFPath(subject, file);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${file}"`,
    },
  });
}
