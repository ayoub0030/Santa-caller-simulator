import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Loader2, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
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
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch hotel data on component mount
  useEffect(() => {
    fetchHotelData();
  }, []);

  // Listen for agent messages and process reservation JSON
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      try {
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

  const openElevenLabsWidget = () => {
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

    // Show the widget container - the <elevenlabs-convai> element will render
    setShowWidget(true);
    setError(null);
    
    toast({
      title: "Call Started",
      description: "Initializing voice connection...",
    });
  };

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

      {/* ElevenLabs Widget Container */}
      {showWidget && (
        <div ref={widgetContainerRef} className="fixed inset-0 z-50">
          <elevenlabs-convai
            agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
          ></elevenlabs-convai>
        </div>
      )}

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
              {/* Success Alert */}
              {reservationSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-100">
                    ✅ Reservation created successfully! ID: {reservationId}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && !reservationSuccess && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Call Button */}
              <Button
                onClick={openElevenLabsWidget}
                disabled={isLoading || !hotelData}
                className="w-full bg-status-available hover:bg-status-available/90"
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

              {/* Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> Tell the agent which room type you're interested in,
                  your check-in and check-out dates, and any special requests. The agent will
                  help you complete your reservation.
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
