import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasValidPaymentSession } from "@/lib/paymentSession";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const hasAccess = hasValidPaymentSession();

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="text-6xl">🔒</div>

              <div>
                <h2 className="text-3xl font-bold text-red-700">Access Restricted</h2>
                <p className="text-sm text-green-700 mt-2">
                  You need to purchase a call to access Santa.
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
                <p className="text-white text-sm font-bold">🎅 Santa's Offer:</p>
                <p className="text-white text-lg font-bold mt-2">$2.99</p>
                <p className="text-white text-xs mt-1">For unlimited Santa conversation</p>
              </div>

              <Link to="/payment?returnUrl=/appelle">
                <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-12 text-base text-white font-bold">
                  💳 Buy Call Now
                </Button>
              </Link>

              <Link to="/">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 h-12 text-base font-bold"
                >
                  Back to Home
                </Button>
              </Link>

              <p className="text-xs text-gray-600">
                Secure payment powered by Stripe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
