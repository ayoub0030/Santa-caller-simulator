import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Loader2, AlertCircle, Mic, MicOff } from "lucide-react";
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
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string>("Ready to call");
  const [isMuted, setIsMuted] = useState(false);
  const conversationRef = useRef<any>(null);
  const { toast } = useToast();

  // Fetch hotel data on component mount
  useEffect(() => {
    fetchHotelData();
  }, []);

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

  const startCall = async () => {
    if (!hotelData) {
      setError("Hotel data not loaded");
      return;
    }

    try {
      setIsCallActive(true);
      setCallStatus("Connecting to agent...");
      setError(null);

      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

      if (!agentId || !apiKey) {
        setError("Missing ElevenLabs configuration (Agent ID or API Key)");
        setIsCallActive(false);
        return;
      }

      // Load ElevenLabs SDK from CDN
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@11labs/convai@latest/dist/index.js";
      script.async = true;

      script.onload = async () => {
        try {
          // @ts-ignore - ElevenLabsConvAI is loaded from CDN
          const ConvAI = (window as any).ElevenLabsConvAI;
          
          if (!ConvAI) {
            throw new Error("ElevenLabsConvAI not found on window");
          }
          
          const { Conversation } = ConvAI;

          if (!Conversation) {
            setError("Failed to load ElevenLabs SDK");
            setIsCallActive(false);
            return;
          }

          // Initialize conversation with proper authentication
          const conversation = new Conversation({
            onMessage: (message: any) => {
              console.log("Agent message:", message);
              if (message.text) {
                setCallStatus(`Agent: ${message.text}`);
              }
            },
            onError: (error: any) => {
              console.error("Conversation error:", error);
              setError(error?.message || "Call error occurred");
              setIsCallActive(false);
              toast({
                title: "Call Error",
                description: error?.message || "An error occurred during the call",
                variant: "destructive",
              });
            },
            onStatusChange: (status: string) => {
              console.log("Call status:", status);
              setCallStatus(`Status: ${status}`);
            },
          });

          // Start session with agent
          await conversation.startSession({
            agentId: agentId,
            clientData: {
              hotelData: hotelData,
            },
          });

          // Listen for agent responses (reservation data)
          conversation.on("agent_response", async (response: any) => {
            console.log("Agent response received:", response);

            // Check if response contains reservation data
            if (response?.data?.reservation) {
              await handleReservationFromAgent(response.data.reservation);
            } else if (response?.reservation) {
              await handleReservationFromAgent(response.reservation);
            }
          });

          // Store conversation reference
          conversationRef.current = conversation;
          setCallStatus("Connected! Speak now...");
        } catch (err: any) {
          console.error("Error initializing conversation:", err);
          setError(err?.message || "Failed to initialize conversation");
          setIsCallActive(false);
          toast({
            title: "Error",
            description: err?.message || "Failed to initialize conversation",
            variant: "destructive",
          });
        }
      };

      script.onerror = (error) => {
        console.error("Failed to load ElevenLabs SDK from CDN:", error);
        console.error("Script src was:", script.src);
        setError("Failed to load ElevenLabs SDK. Trying alternative CDN...");
        setIsCallActive(false);
        
        // Try alternative CDN
        const altScript = document.createElement("script");
        altScript.src = "https://cdn.jsdelivr.net/npm/@11labs/convai/dist/index.js";
        altScript.async = true;
        
        altScript.onload = () => {
          console.log("Alternative CDN loaded successfully");
          setError(null);
          // Retry the call
          setTimeout(() => startCall(), 500);
        };
        
        altScript.onerror = () => {
          console.error("Both CDN URLs failed");
          setError("Failed to load ElevenLabs SDK from both CDNs. Check your internet connection.");
          toast({
            title: "SDK Load Error",
            description: "Failed to load ElevenLabs SDK. Please check your internet connection.",
            variant: "destructive",
          });
        };
        
        document.body.appendChild(altScript);
      };

      document.body.appendChild(script);
    } catch (err: any) {
      console.error("Error starting call:", err);
      setError(err?.message || "Failed to start call. Check console for details.");
      setIsCallActive(false);
      toast({
        title: "Error starting call",
        description: err?.message || "Failed to start call",
        variant: "destructive",
      });
    }
  };

  const handleReservationFromAgent = async (reservationData: any) => {
    try {
      setCallStatus("Processing reservation...");

      const result = await createReservationFromAgent(reservationData);

      if (result.success) {
        toast({
          title: "Reservation created!",
          description: `Reservation ID: ${result.reservationId}`,
        });
        setCallStatus("Reservation confirmed! Ending call...");
        setTimeout(() => {
          endCall();
        }, 2000);
      } else {
        setError(result.error || "Failed to create reservation");
        toast({
          title: "Reservation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error processing reservation",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    try {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
      setIsCallActive(false);
      setCallStatus("Call ended");
      conversationRef.current = null;
    } catch (err: any) {
      console.error("Error ending call:", err);
      setIsCallActive(false);
    }
  };

  const toggleMute = () => {
    try {
      if (conversationRef.current) {
        if (isMuted) {
          conversationRef.current.unmute();
        } else {
          conversationRef.current.mute();
        }
        setIsMuted(!isMuted);
      }
    } catch (err: any) {
      console.error("Error toggling mute:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              {/* Call Status */}
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <p className="font-medium text-foreground">{callStatus}</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Call Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={startCall}
                  disabled={isCallActive || isLoading || !hotelData}
                  className="flex-1 bg-status-available hover:bg-status-available/90"
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

                {isCallActive && (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant="outline"
                      className="flex-1"
                    >
                      {isMuted ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Mute
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={endCall}
                      variant="destructive"
                      className="flex-1"
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      End Call
                    </Button>
                  </>
                )}
              </div>

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
