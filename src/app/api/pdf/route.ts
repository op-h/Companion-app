import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { Readable } from 'stream';
import { getPDFPath } from '@/lib/content';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subject = searchParams.get('subject');
  const file = searchParams.get('file');

  if (!subject || !file) {
    return new NextResponse('Missing subject or file parameter', { status: 400 });
  }

  // Basic security check
  // Stricter security check - allowed characters: alphanumeric, _, -, ., space, (), [], ,, &
  const safePattern = /^[a-zA-Z0-9_\-\.\s\(\)\[\]\,&]+$/;
  if (!safePattern.test(subject) || !safePattern.test(file) || subject.includes('..') || file.includes('..')) {
    return new NextResponse('Invalid path parameters', { status: 403 });
  }

  const filePath = getPDFPath(subject, file);

  let fileStats: fs.Stats;
  try {
    fileStats = await fs.promises.stat(filePath);
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }

  if (!fileStats.isFile()) {
    return new NextResponse('File not found', { status: 404 });
  }

  const fileSize = fileStats.size;
  const range = request.headers.get('range');
  const baseHeaders = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
    'Content-Disposition': `inline; filename="${file}"`,
    'Content-Type': 'application/pdf',
  };

  if (range) {
    const parsedRange = parseRange(range, fileSize);

    if (!parsedRange) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }

    const { start, end } = parsedRange;
    const stream = fs.createReadStream(filePath, { start, end });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      },
    });
  }

  const stream = fs.createReadStream(filePath);

  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      ...baseHeaders,
      'Content-Length': String(fileSize),
    },
  });
}

function parseRange(rangeHeader: string, fileSize: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) return null;

  const [, startValue, endValue] = match;
  let start = startValue ? Number(startValue) : 0;
  let end = endValue ? Number(endValue) : fileSize - 1;

  if (!startValue && endValue) {
    const suffixLength = Number(endValue);
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1),
  };
}
