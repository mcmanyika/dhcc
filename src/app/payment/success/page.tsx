import { Suspense } from "react";
import { PaymentSuccessContent } from "./PaymentSuccessContent";

export const metadata = {
  title: "Payment Successful — DHCC",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
