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
        {/* Hidden ElevenLabs Widget */}
        {showWidget && (
          <div ref={widgetContainerRef} className="hidden">
            <elevenlabs-convai
              agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
            ></elevenlabs-convai>
          </div>
        )}

        {/* Phone Call UI */}
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
      </div>
    );
  }

  // If call ended, show summary
  if (callEnded) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />

              <div>
                <h2 className="text-2xl font-bold">Call Ended</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Duration: {formatTime(callDuration)}
                </p>
              </div>

              {reservationSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-100">
                    ✅ Reservation created! ID: {reservationId}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => {
                  setCallEnded(false);
                  setCallDuration(0);
                }}
                className="w-full"
              >
                Make Another Call
              </Button>

              <Link to="/" className="block">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Default view - before call
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Voice Agent</h1>
              <p className="text-sm text-muted-foreground">
                Call our AI assistant to check availability and make reservations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Call Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Start a Call</CardTitle>
              <CardDescription>
                Speak with our AI agent to book a room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Call Button */}
              <Button
                onClick={startCall}
                disabled={isLoading || !hotelData}
                className="w-full bg-status-available hover:bg-status-available/90 h-12 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Start Call
                  </>
                )}
              </Button>

              {/* Phone Number Display */}
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Call this number:</p>
                <p className="text-xl font-bold text-foreground">+212 (0) 5 24 43 93 23</p>
                <p className="text-xs text-muted-foreground mt-1">Morocco</p>
              </div>

              {/* Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> Tell the agent which room type you're interested in,
                  your check-in and check-out dates, and any special requests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hotel Info */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>
                Rooms the agent can help you book
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hotelData ? (
                <div className="space-y-3">
                  {hotelData.rooms.length > 0 ? (
                    hotelData.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="rounded-lg border p-3 hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">Room {room.room_number}</p>
                          <p className="text-sm font-semibold text-primary">
                            ${room.price_per_night}/night
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {room.room_type}
                        </p>
                        {room.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No rooms available at the moment
                    </p>
                  )}

                  {/* Hotel Policies */}
                  <div className="mt-6 pt-4 border-t">
                    <p className="font-semibold text-sm mb-2">Hotel Policies</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>
                        <strong>Check-in:</strong> {hotelData.checkInTime}
                      </li>
                      <li>
                        <strong>Check-out:</strong> {hotelData.checkOutTime}
                      </li>
                      <li>
                        <strong>Cancellation:</strong>{" "}
                        {hotelData.policies.cancellationDeadline}
                      </li>
                      <li>
                        <strong>Min Stay:</strong> {hotelData.policies.minStay} night(s)
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading hotel data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Call;
