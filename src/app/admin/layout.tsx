import { exigirAdmin } from '@/lib/sessao';

export const metadata = { title: 'Administração', robots: { index: false } };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return <>{children}</>;
}
