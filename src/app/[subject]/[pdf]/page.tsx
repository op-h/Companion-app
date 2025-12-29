import PDFPageClient from '@/components/PDFPageClient';

export default async function PDFPage(props: { params: Promise<{ subject: string; pdf: string }> }) {
  const params = await props.params;
  const subjectName = decodeURIComponent(params.subject);
  const pdfName = decodeURIComponent(params.pdf);

  // Construct the API URL for the PDF
  const pdfUrl = `/api/pdf?subject=${encodeURIComponent(subjectName)}&file=${encodeURIComponent(pdfName)}`;

  return <PDFPageClient subjectName={subjectName} pdfName={pdfName} pdfUrl={pdfUrl} />;
}
