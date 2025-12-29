import fs from 'fs';
import path from 'path';

// Define the root content directory (inside the app for deployment)
const CONTENT_ROOT = path.resolve(process.cwd(), 'content');
const IGNORED_FOLDERS = ['node_modules', '.git', '.next'];

export interface Subject {
  name: string;
  pdfCount: number;
}

export interface PDFFile {
  name: string;
  path: string; // Relative to content root or absolute? Let's use relative for ID
}

export async function getSubjects(): Promise<Subject[]> {
  try {
    const entries = await fs.promises.readdir(CONTENT_ROOT, { withFileTypes: true });

    const subjects = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !IGNORED_FOLDERS.includes(entry.name) && !entry.name.startsWith('.')) {
        // Count PDFs inside
        const subjectPath = path.join(CONTENT_ROOT, entry.name);
        const files = await fs.promises.readdir(subjectPath);
        const pdfCount = files.filter(f => f.toLowerCase().endsWith('.pdf')).length;

        subjects.push({
          name: entry.name,
          pdfCount
        });
      }
    }

    return subjects;
  } catch (error) {
    console.error('Error reading subjects:', error);
    return [];
  }
}

export async function getSubjectPDFs(subjectName: string): Promise<string[]> {
  const subjectPath = path.join(CONTENT_ROOT, subjectName);
  try {
    const files = await fs.promises.readdir(subjectPath);
    return files.filter(f => f.toLowerCase().endsWith('.pdf'));
  } catch (error) {
    // If folder doesn't exist or error
    return [];
  }
}

export function getPDFPath(subjectName: string, pdfName: string): string {
  return path.join(CONTENT_ROOT, subjectName, pdfName);
}
