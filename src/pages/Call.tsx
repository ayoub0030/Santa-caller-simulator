import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Loader2, AlertCircle, ArrowLeft, CheckCircle, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createReservationFromAgent } from "@/lib/reservationHandler";

interface HotelData {
  hotelName: string;
  rooms: Array<{
    id: string;
    room_number: string;
    room_type: string;
    price_per_night: number;
    status: string;
    description?: string;
  }>;
  checkInTime: string;
  checkOutTime: string;
  policies: {
    cancellationDeadline: string;
    minStay: number;
  };
}

const Call = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch hotel data on component mount
  useEffect(() => {
    fetchHotelData();
  }, []);

  // Call duration timer
  useEffect(() => {
    if (isCalling) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCalling]);

  // Hide widget after 5 seconds and show phone UI
  useEffect(() => {
    if (showWidget && isCalling) {
      const timer = setTimeout(() => {
        setShowWidget(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showWidget, isCalling]);

  // Listen for agent messages and process reservation JSON
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      try {
        // Detect call end
        if (event.data?.type === "call_ended" || event.data?.status === "ended") {
          setIsCalling(false);
          setShowWidget(false);
          setCallEnded(true);
          return;
        }

        // Check if message contains reservation data from the agent
        if (event.data?.type === "agent_message" || event.data?.reservation) {
          const messageData = event.data;
          
          // Try to extract reservation JSON from the message
          let reservationData = messageData.reservation;
          
          // If not directly in reservation field, try to parse from text
          if (!reservationData && messageData.text) {
            const jsonMatch = messageData.text.match(/\{[\s\S]*"reservation"[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                reservationData = parsed.reservation;
              } catch (e) {
                console.log("Could not parse JSON from message");
              }
            }
          }

          // If we found reservation data, save it
          if (reservationData) {
            console.log("Reservation data received:", reservationData);
            
            const result = await createReservationFromAgent({
              guestName: reservationData.guestName,
              guestEmail: reservationData.guestEmail,
              guestPhone: reservationData.guestPhone,
              roomId: reservationData.roomId,
              checkInDate: reservationData.checkInDate,
              checkOutDate: reservationData.checkOutDate,
              specialRequests: reservationData.specialRequests,
              totalAmount: reservationData.totalAmount,
            });

            if (result.success) {
              setReservationSuccess(true);
              setReservationId(result.reservationId || null);
              toast({
                title: "Reservation Confirmed! ✅",
                description: `Reservation ID: ${result.reservationId}`,
              });
            } else {
              toast({
                title: "Reservation Error",
                description: result.error || "Failed to create reservation",
                variant: "destructive",
              });
            }
          }
        }
      } catch (err: any) {
        console.error("Error processing agent message:", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast]);

  const fetchHotelData = async () => {
    try {
      setIsLoading(true);
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "available");

      if (roomsError) throw roomsError;

      const hotelInfo: HotelData = {
        hotelName: "HotelHub PMS",
        rooms: rooms || [],
        checkInTime: "14:00",
        checkOutTime: "11:00",
        policies: {
          cancellationDeadline: "24 hours before check-in",
          minStay: 1,
        },
      };

      setHotelData(hotelInfo);
    } catch (err: any) {
      setError("Failed to load hotel data");
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = () => {
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

    if (!agentId) {
      setError("Missing ElevenLabs Agent ID. Please configure it in .env");
      toast({
        title: "Configuration Error",
        description: "ElevenLabs Agent ID is not configured",
        variant: "destructive",
      });
      return;
    }

    // Start the call - show widget in background, show custom UI
    setShowWidget(true);
    setIsCalling(true);
    setCallDuration(0);
    setCallEnded(false);
    setError(null);
    setReservationSuccess(false);
  };

  const endCall = () => {
    setIsCalling(false);
    setShowWidget(false);
    setCallEnded(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // If call is active, show phone call UI
  if (isCalling) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        {/* ElevenLabs Widget */}
        {showWidget && (
          <div ref={widgetContainerRef} className="fixed inset-0 z-50">
            <elevenlabs-convai
              agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
            ></elevenlabs-convai>
          </div>
        )}

        {/* Phone Call UI - Only show if widget not active */}
        {!showWidget && (
          <div className="w-full max-w-sm">
            <Card className="bg-slate-800 border-slate-700 shadow-2xl">
              <CardContent className="pt-8 pb-8 text-center space-y-8">
                {/* Agent Avatar */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Phone className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Agent Name */}
                <div>
                  <h2 className="text-2xl font-bold text-white">HotelHub Agent</h2>
                  <p className="text-sm text-slate-400 mt-1">AI Voice Assistant</p>
                </div>

                {/* Call Duration */}
                <div className="text-4xl font-mono font-bold text-green-400">
                  {formatTime(callDuration)}
                </div>

                {/* Phone Number */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Calling</p>
                  <p className="text-2xl font-bold text-white tracking-wider">
                    +212 (0) 5 24 43 93 23
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Morocco</p>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center gap-4 pt-4">
                  {/* Mute Button */}
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant="outline"
                    size="lg"
                    className="rounded-full w-16 h-16 p-0 bg-slate-700 border-slate-600 hover:bg-slate-600"
                  >
                    {isMuted ? (
                      <MicOff className="w-6 h-6 text-red-400" />
                    ) : (
                      <Mic className="w-6 h-6 text-white" />
                    )}
                  </Button>

                  {/* End Call Button */}
                  <Button
                    onClick={endCall}
                    size="lg"
                    className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </Button>
                </div>

                {/* Status */}
                <p className="text-sm text-slate-400">
                  {isMuted ? "🔴 Muted" : "🟢 Connected"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // If call ended, show summary
  if (callEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto" />

              <div>
                <h2 className="text-2xl font-bold text-white">Call Ended</h2>
                <p className="text-sm text-slate-400 mt-2">
                  Duration: {formatTime(callDuration)}
                </p>
              </div>

              {reservationSuccess && (
                <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                  <p className="text-green-100 text-sm">
                    ✅ Reservation created!
                  </p>
                  <p className="text-green-200 text-xs mt-1">
                    ID: {reservationId}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <p className="text-red-100 text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={() => {
                  setCallEnded(false);
                  setCallDuration(0);
                  setReservationSuccess(false);
                  setReservationId(null);
                  setError(null);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 h-12 text-base"
              >
                Make Another Call
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default view - before call (full-screen phone UI)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center space-y-12">
            {/* Agent Avatar */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <Phone className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Agent Name */}
            <div>
              <h2 className="text-3xl font-bold text-white">HotelHub</h2>
              <p className="text-sm text-slate-400 mt-2">AI Reservation Agent</p>
            </div>

            {/* Phone Number - Clickable */}
            <Button
              onClick={startCall}
              disabled={isLoading}
              className="w-full h-auto p-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-2xl shadow-lg"
            >
              <div className="text-center">
                <p className="text-xs text-green-100 mb-2">Call this number</p>
                <p className="text-4xl font-bold text-white tracking-wider font-mono">
                  +212 (0) 5 24 43 93 23
                </p>
                <p className="text-xs text-green-100 mt-2">Morocco</p>
              </div>
            </Button>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Connecting...</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-900 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-100">{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Text */}
            <p className="text-xs text-slate-400 px-4">
              Tap the number above to start a voice call with our AI assistant
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Call;
