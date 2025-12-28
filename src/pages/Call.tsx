import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Loader2, AlertCircle, ArrowLeft, CheckCircle, PhoneOff, Mic, MicOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createReservationFromAgent } from "@/lib/reservationHandler";

// Export Appelle component for use in /appelle route
import { useConversation } from "@elevenlabs/react";

export const Appelle = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [cachedRooms, setCachedRooms] = useState<any[]>([]);
  const [freeTrialEnded, setFreeTrialEnded] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const { toast } = useToast();

  // Client tool handler for confirming reservations
  const handleConfirmReservation = async (parameters: any) => {
    console.log("Client tool invoked: confirmReservation with parameters:", parameters);
    
    try {
      // Map room type/name to actual room ID from cached rooms
      let roomId = parameters.roomId || parameters.room_id;
      
      // If roomId looks like a room type (not a UUID), try to find matching room
      if (roomId && !roomId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log("Room ID is not a UUID, attempting to match room type:", roomId);
        const roomType = roomId.toLowerCase().replace('_room', '').replace('_', ' ');
        
        // Find first available room matching the type
        const matchingRoom = cachedRooms.find(room => {
          const roomName = (room.room_number || room.name || '').toLowerCase();
          return roomName.includes(roomType) || room.id.toLowerCase().includes(roomType);
        });
        
        if (matchingRoom) {
          console.log("Found matching room:", matchingRoom.id);
          roomId = matchingRoom.id;
        } else {
          console.warn("No matching room found for type:", roomType);
          // Use first available room as fallback
          if (cachedRooms.length > 0) {
            roomId = cachedRooms[0].id;
            console.log("Using first available room as fallback:", roomId);
          }
        }
      }
      
      // Call the reservation handler to create the reservation in Supabase
      const result = await createReservationFromAgent({
        guestName: parameters.customerName || parameters.guest_name,
        guestEmail: parameters.email || parameters.guest_email,
        guestPhone: parameters.phone || parameters.guest_phone,
        roomId: roomId,
        checkInDate: parameters.checkInDate || parameters.check_in_date,
        checkOutDate: parameters.checkOutDate || parameters.check_out_date,
        totalAmount: parameters.totalAmount || parameters.total_amount,
        specialRequests: parameters.specialRequests || parameters.special_requests,
      });

      if (result.success) {
        console.log("Reservation created successfully:", result.reservationId);
        setReservationSuccess(true);
        setReservationId(result.reservationId);
        toast({
          title: "Reservation Created",
          description: `Reservation ID: ${result.reservationId}`,
        });
        
        // Return success message to agent
        return `Reservation for ${parameters.customerName || parameters.guest_name} confirmed successfully. Booking ID: ${result.reservationId}`;
      } else {
        console.error("Reservation creation failed:", result.error);
        toast({
          title: "Reservation Failed",
          description: result.error,
          variant: "destructive",
        });
        
        // Return error message to agent
        return `Failed to confirm reservation: ${result.error}`;
      }
    } catch (err: any) {
      console.error("Error in confirmReservation client tool:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to process reservation",
        variant: "destructive",
      });
      
      return `Error processing reservation: ${err.message}`;
    }
  };

  const conversation = useConversation({
    clientTools: {
      confirmReservation: handleConfirmReservation,
    },
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setError(null);
      setIsCalling(true);
      toast({
        title: "Connected",
        description: "Voice connection established",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs agent");
      setIsCalling(false);
      setCallEnded(true);
    },
    onToolCall: (toolName: string, parameters: any) => {
      console.log(`🔧 Client tool called: ${toolName}`, parameters);
    },
    onError: (error: any) => {
      console.error("❌ Conversation error:", error);
      setError(error?.message || "Connection error");
    },
    onStatusChange: (status: any) => {
      console.log("📊 Status changed:", status);
    },
    onDebug: (message: string) => {
      console.log("🐛 Debug:", message);
    },
    onMessage: async (message: any) => {
      console.log("💬 Message received:", message);
      
      if (message.source === "agent" && message.message) {
        const text = message.message;
        const jsonMatch = text.match(/\{[\s\S]*"reservation"[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            const reservationData = parsed.reservation;
            
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
          } catch (e) {
            console.log("Could not parse JSON from message");
          }
        }
      }
    },
    onError: (error: any) => {
      console.error("Conversation error:", error);
      const errorMsg = error?.message || error?.toString?.() || "Connection failed";
      setError(errorMsg);
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive",
      });
    },
    onStatusChange: (status: any) => {
      console.log("Conversation status changed:", status);
    },
    onDebug: (event: any) => {
      console.debug("Debug event:", event);
    },
  });

  useEffect(() => {
    console.log("Call state effect triggered:", { isCalling, conversationStatus: conversation.status });
    if (isCalling) {
      console.log("Starting call duration timer");
      const timer = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1;
          // Check if 3 minutes (180 seconds) has passed
          if (newDuration >= 300 && !freeTrialEnded) {
            console.log("Free trial ended, showing payment prompt");
            setFreeTrialEnded(true);
            setShowPaymentPrompt(true);
            // Pause the call
            conversation.endSession();
            toast({
              title: "Free Trial Ended",
              description: "Your 5 minute free trial is complete. Please complete payment to continue.",
            });
          }
          return newDuration;
        });
      }, 1000);

      return () => {
        console.log("Clearing call duration timer");
        clearInterval(timer);
      };
    } else {
      setCallDuration(0);
    }
  }, [isCalling, freeTrialEnded, conversation, toast]);

  // Fetch room data on component mount
  useEffect(() => {
    const fetchRoomsOnMount = async () => {
      try {
        console.log("Fetching room data on component mount...");
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("*")
          .eq("status", "available");

        if (roomsError) {
          console.warn("Error fetching rooms on mount:", roomsError);
        } else if (rooms && rooms.length > 0) {
          console.log("Rooms cached successfully:", rooms);
          setCachedRooms(rooms);
        }
      } catch (err) {
        console.error("Error fetching rooms on mount:", err);
      }
    };

    const requestMicrophoneAccess = async () => {
      try {
        console.log("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted");
        // Stop the stream immediately - we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        console.error("Microphone access denied:", err);
        setError("Microphone access is required for voice calls. Please allow microphone access in your browser settings.");
      }
    };

    fetchRoomsOnMount();
    requestMicrophoneAccess();
  }, []);

  // Auto-start call when page loads
  useEffect(() => {
    const autoStartCall = async () => {
      // Small delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 500));
      await startCall();
    };

    autoStartCall();
  }, []);

  const startCall = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCallEnded(false);
      setCallDuration(0);
      setReservationSuccess(false);

      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
      
      if (!agentId) {
        setError("Missing ElevenLabs Agent ID");
        toast({
          title: "Configuration Error",
          description: "ElevenLabs Agent ID is not configured",
          variant: "destructive",
        });
        return;
      }

      console.log("Starting call with agent ID:", agentId);
      console.log("Conversation status before start:", conversation.status);
      
      let sessionConfig: any = { agentId };
      
      console.log("Starting session with config:", sessionConfig);
      const conversationId = await conversation.startSession(sessionConfig);
      
      console.log("Conversation started with ID:", conversationId);
      console.log("Conversation status after start:", conversation.status);
      console.log("Conversation object:", {
        status: conversation.status,
        micMuted: conversation.micMuted,
        isSpeaking: conversation.isSpeaking,
      });

      // Send cached room data as contextual information after connection
      if (cachedRooms && cachedRooms.length > 0) {
        // Format room data for agent with clear structure
        const roomsList = cachedRooms.map(room => ({
          id: room.id,
          room_number: room.room_number,
          type: room.type || room.room_type || 'standard',
          price_per_night: room.price_per_night,
          status: room.status,
          amenities: room.amenities || [],
        }));
        
        const roomsJson = JSON.stringify(roomsList);
        console.log("Room data to send:", roomsJson);
        
        const contextMessage = `Available rooms in the hotel: ${roomsJson}. When confirming a reservation, use the room ID from this list. For example, if a guest wants a deluxe room, find the room with type "deluxe" and use its ID in the confirmReservation tool call.`;
        conversation.sendContextualUpdate(contextMessage);
        console.log("Contextual room data sent to agent");
      } else {
        console.warn("No cached rooms available to send to agent");
      }
    } catch (err: any) {
      console.error("Error starting call:", err);
      console.error("Error details:", {
        message: err?.message,
        code: err?.code,
        toString: err?.toString?.(),
      });
      setError(err?.message || "Failed to start call");
      toast({
        title: "Error",
        description: err?.message || "Failed to start call",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      await conversation.endSession();
      setCallEnded(true);
      toast({
        title: "Call Ended",
        description: "Call has been disconnected",
      });
    } catch (err: any) {
      console.error("Error ending call:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to end call",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (showPaymentPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="text-6xl">💳</div>

              <div>
                <h2 className="text-3xl font-bold text-red-700">Continue Your Call</h2>
                <p className="text-sm text-green-700 mt-2">
                  You've enjoyed 5 minute free! Continue talking to Santa.
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
                <p className="text-white text-sm font-bold">🎅 Santa's Offer:</p>
                <p className="text-white text-lg font-bold mt-2">$2.99</p>
                <p className="text-white text-xs mt-1">For unlimited Santa conversation</p>
              </div>

              <Button
                onClick={() => navigate("/payment?returnUrl=/appelle")}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-12 text-base text-white font-bold"
              >
                Continue with Payment 💳
              </Button>

              <Button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  setCallEnded(true);
                  setIsCalling(false);
                }}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50 h-12 text-base font-bold"
              >
                End Call
              </Button>

              <p className="text-xs text-gray-600">
                Secure payment powered by Stripe. Your information is safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isCalling) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-4 border-white">
                  <img src="/iconsanta.png" alt="Santa" className="w-20 h-20 object-cover rounded-full" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-red-700">Santa clause </h2>
              </div>

              <div className="text-5xl font-mono font-bold text-red-600">
                {formatTime(callDuration)}
              </div>

              {callDuration >= 50 && callDuration < 60 && (
                <Alert className="bg-yellow-100 border-yellow-400">
                  <Clock className="h-4 w-4 text-yellow-700" />
                  <AlertDescription className="text-yellow-700">
                    ⏰ Free trial ending in {60 - callDuration} seconds
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
                <p className="text-xs text-white mb-2 font-bold">🎄 Talking to Santa 🎄</p>
                <p className="text-xl font-bold text-white tracking-wider">
                  🎅 North Pole
                </p>
                <p className="text-xs text-red-100 mt-2">Ho Ho Ho!</p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  onClick={() => conversation.setMicMuted(!conversation.micMuted)}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16 p-0 bg-green-600 border-green-700 hover:bg-green-700"
                >
                  {conversation.micMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </Button>

                <Button
                  onClick={endCall}
                  size="lg"
                  className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </Button>
              </div>

              <p className="text-sm text-red-700 font-semibold">
                {conversation.micMuted ? "🔴 Muted" : "🟢 Listening"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Card className="bg-gradient-to-b from-red-50 to-green-50 border-red-300 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center space-y-8">
              <div className="text-6xl">🎄</div>

              <div>
                <h2 className="text-3xl font-bold text-red-700">Thanks for Calling Santa!</h2>
                <p className="text-sm text-green-700 mt-2">
                  Call Duration: {formatTime(callDuration)}
                </p>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 border-2 border-white">
                <p className="text-white text-sm font-bold">🎅 Santa says:</p>
                <p className="text-white text-xs mt-2">"Merry Christmas! Thank you for visiting the North Pole!"</p>
              </div>

              {error && (
                <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
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
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-12 text-base text-white font-bold"
              >
                Call Santa Again 🎅
              </Button>

              <Link to="/">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 h-12 text-base font-bold"
                >
                  Back to Home
                </Button>
              </Link>
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
          <CardContent className="pt-12 pb-12 text-center space-y-12">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-4 border-white">
                <img src="/iconsanta.png" alt="Santa" className="w-28 h-28 object-cover rounded-full" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-red-700">Santa is calling you</h2>
            </div>

            <Button
              onClick={startCall}
              disabled={isLoading}
              className="w-full h-auto p-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl shadow-lg text-white font-bold"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white tracking-wider font-mono">
                  Click to answer him
                </p>
                <p className="text-xs text-red-100 mt-2">Ho Ho Ho!</p>
              </div>
            </Button>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-red-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">Connecting to Santa...</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-100 border-red-300">
                <AlertCircle className="h-4 w-4 text-red-700" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-green-700 px-4 font-semibold">
              Click above to start a magical voice call with Santa Claus!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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
  const [widgetHidden, setWidgetHidden] = useState(false);
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

  // Handle Escape key to end call
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCalling) {
        endCall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalling]);

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

  // Visually hide widget after 10 seconds but keep call active
  useEffect(() => {
    if (isCalling) {
      const timer = setTimeout(() => {
        setWidgetHidden(true);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      // Reset for next call
      setWidgetHidden(false);
    }
  }, [isCalling]);

  // Listen for agent messages and process reservation JSON
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      try {
        // Detect call end ONLY on explicit call_ended message
        if (event.data?.type === "call_ended") {
          console.log("ElevenLabs call_ended message", event.data);
          setIsCalling(false);
          setShowWidget(false);
          setWidgetHidden(false);
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
    setWidgetHidden(false);
    setIsCalling(true);
    setCallDuration(0);
    setCallEnded(false);
    setError(null);
    setReservationSuccess(false);
  };

  const endCall = () => {
    console.log("End call clicked");

    // Stop the call and widget
    setIsCalling(false);
    setShowWidget(false);
    setWidgetHidden(false);

    // Show the call ended screen
    setCallEnded(true);

    // Show toast
    toast({
      title: "Call Ended",
      description: "Call has been disconnected",
    });
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
        {/* ElevenLabs Widget - fades out after 10 seconds but stays mounted */}
        {showWidget && (
          <div
            ref={widgetContainerRef}
            className={`fixed inset-0 z-50 transition-opacity duration-500 ${
              widgetHidden ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <elevenlabs-convai
              agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID}
            ></elevenlabs-convai>
          </div>
        )}

        {/* Phone Call UI - Always show during call */}
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
                  +212 5 24 43 93 23
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
                <p className="text-2xl font-bold text-white tracking-wider font-mono">
                  +212 5 24 43 93 23
                </p>
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
            <p className="text-xs text-slate-400 px-4">.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Call;
