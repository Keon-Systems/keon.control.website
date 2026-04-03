import { Suspense } from "react";
import { ReceiptExplorerClient } from "./receipts-client";

export default function ReceiptExplorerPage() {
  return (
    <Suspense>
      <ReceiptExplorerClient />
    </Suspense>
  );
}
