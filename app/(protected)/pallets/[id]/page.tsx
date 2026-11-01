import { PalletDetails } from "./pallet-details";

export default async function PalletPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PalletDetails palletId={id} />;
}
