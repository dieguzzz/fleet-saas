import { redirect } from 'next/navigation';

export default async function FinancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/finance/invoices`);
}
