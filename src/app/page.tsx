import { getSubjects } from '@/lib/content';
import DashboardClient from '@/components/DashboardClient';

// Ensure this runs on the server
export const revalidate = 0;

export default async function Home() {
  const subjects = await getSubjects();
  return <DashboardClient subjects={subjects} />;
}
