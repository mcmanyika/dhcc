import Link from "next/link";
import { XCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Payment Cancelled — DHCC",
};

export default function PaymentCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <Card className="text-center">
        <CardHeader>
          <XCircle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-base">
            Your payment was not completed. No charges have been made. You can
            try again from your dashboard.
          </CardDescription>
        </CardHeader>
        <div className="flex justify-center gap-4 pb-6">
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
