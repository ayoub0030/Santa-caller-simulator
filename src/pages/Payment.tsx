import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPaymentSession } from "@/lib/paymentSession";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const sessionId = searchParams.get("sessionId");
  const returnUrl = searchParams.get("returnUrl") || "/appelle";

  useEffect(() => {
    // Check if returning from Stripe
    const checkoutSessionId = searchParams.get("session_id");
    if (checkoutSessionId) {
      verifyPayment(checkoutSessionId);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      const data = await response.json();
      
      if (data.success) {
        // Create payment session to grant access
        createPaymentSession(sessionId);
        
        setPaymentStatus("success");
        toast({
          title: "Payment Successful! 🎉",
          description: "Thank you! Enjoy your Santa call.",
        });
        
        // Redirect back to call after 2 seconds
        setTimeout(() => {
          navigate(returnUrl);
        }, 2000);
      } else {
        throw new Error(data.error || "Payment verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Payment verification failed");
      setPaymentStatus("error");
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          returnUrl: window.location.origin + returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      setError(err.message || "Failed to start payment");
      setPaymentStatus("error");
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
              
              <div>
                <h2 className="text-3xl font-bold text-red-700">Payment Successful! 🎉</h2>
                <p className="text-sm text-green-700 mt-2">
                  Thank you for supporting Santa's North Pole!
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
                <p className="text-white text-sm font-bold">🎅 Santa says:</p>
                <p className="text-white text-xs mt-2">"Thank you for your generosity! Let's continue our magical conversation!"</p>
              </div>

              <p className="text-sm text-gray-600">Redirecting you back to Santa...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center space-y-8">
            <div className="text-6xl">💳</div>

            <div>
              <h2 className="text-3xl font-bold text-red-700">Continue Your Call</h2>
              <p className="text-sm text-green-700 mt-2">
                You've enjoyed 1 minute free! Continue talking to Santa.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
              <p className="text-white text-sm font-bold">🎅 Santa's Offer:</p>
              <p className="text-white text-lg font-bold mt-2">$2.99</p>
              <p className="text-white text-xs mt-1">For unlimited Santa conversation</p>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-100 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-700" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-12 text-base text-white font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue with Payment 💳
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50 h-12 text-base font-bold"
            >
              Back to Home
            </Button>

            <p className="text-xs text-gray-600">
              Secure payment powered by Stripe. Your information is safe.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payment;
