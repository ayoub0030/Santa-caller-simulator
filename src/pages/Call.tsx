import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Loader2, AlertCircle, ArrowLeft, CheckCircle, PhoneOff, Mic, MicOff, Clock, Sparkles, Video } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-700 to-green-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-white/98 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="pt-10 pb-10 text-center space-y-6">
              {/* Premium Icon */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                </div>
                <div className="relative text-7xl">
                  <Sparkles className="w-20 h-20 mx-auto text-yellow-500 animate-pulse" />
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">Continue Your Magic</h2>
                <p className="text-base text-gray-600 font-medium">
                  You've enjoyed 3 minutes free! Keep the magic alive.
                </p>
              </div>

              {/* Pricing Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur-sm opacity-50"></div>
                <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-white text-lg font-bold">🎅</span>
                    <p className="text-white text-lg font-bold">Santa's Premium Offer</p>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-white/80 text-2xl font-semibold line-through">$4.99</span>
                    <span className="text-white text-5xl font-bold">$2.99</span>
                  </div>
                  <p className="text-red-100 text-sm mt-3 font-medium">Unlimited Santa conversations forever</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-white/90 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>No time limits</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => navigate("/payment?returnUrl=/appelle")}
                  className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:to-green-900 h-14 text-lg text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Unlock Unlimited Access
                </Button>

                <Button
                  onClick={() => {
                    setShowPaymentPrompt(false);
                    setCallEnded(true);
                    setIsCalling(false);
                  }}
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base font-semibold rounded-2xl transition-all duration-200"
                >
                  Maybe Later
                </Button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-500 font-medium">
                  🔒 Secure payment by Stripe • Your data is protected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isCalling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-700 to-green-800 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <Card className="bg-white/98 backdrop-blur-xl border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="pt-10 pb-10 text-center space-y-5">
              {/* Santa Avatar with advanced animations */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer pulse ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-red-600 animate-ping opacity-20"></div>
                  {/* Middle ring */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-300 to-red-500 opacity-30 blur-md animate-pulse"></div>
                  {/* Avatar container */}
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-800 flex items-center justify-center shadow-2xl border-[6px] border-white ring-4 ring-red-200/50">
                    <img src="/iconsanta.png" alt="Santa" className="w-32 h-32 object-cover rounded-full" />
                  </div>
                  {/* Live indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              </div>

              {/* Santa Name with gradient */}
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">Santa Claus</h2>
              </div>

              {/* Call Duration Timer with enhanced styling */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-red-50 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl py-4 px-6">
                  <div className="text-6xl font-mono font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-wider">
                    {formatTime(callDuration)}
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              {callDuration >= 170 && callDuration < 180 && (
                <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 animate-pulse rounded-2xl">
                  <Clock className="h-5 w-5 text-yellow-700" />
                  <AlertDescription className="text-yellow-800 font-bold">
                    ⏰ {180 - callDuration}s remaining in free trial
                  </AlertDescription>
                </Alert>
              )}

              {/* Location Card with modern design */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <p className="text-sm text-white/95 font-bold">Talking to Santa</p>
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">🎅</span>
                    <p className="text-2xl font-bold text-white tracking-wide">North Pole</p>
                  </div>
                  <p className="text-sm text-red-100 mt-3 font-semibold">Ho Ho Ho! 🎄</p>
                </div>
              </div>

              {/* Control Buttons with enhanced styling */}
              <div className="flex justify-center gap-8 pt-4">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={() => conversation.setMicMuted(!conversation.micMuted)}
                    variant="outline"
                    size="lg"
                    className={`rounded-full w-20 h-20 p-0 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
                      conversation.micMuted 
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700' 
                        : 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800'
                    }`}
                  >
                    {conversation.micMuted ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </Button>
                  <span className="text-xs font-semibold text-gray-600">
                    {conversation.micMuted ? 'Unmute' : 'Mute'}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Button
                    onClick={endCall}
                    size="lg"
                    className="rounded-full w-20 h-20 p-0 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                  >
                    <PhoneOff className="w-8 h-8 text-white" />
                  </Button>
                  <span className="text-xs font-semibold text-gray-600">End Call</span>
                </div>
              </div>

              {/* Status Indicator with better design */}
              <div className="flex items-center justify-center gap-3 pt-2 bg-gray-50 rounded-full px-6 py-3 mx-auto w-fit">
                <div className={`w-3 h-3 rounded-full ${conversation.micMuted ? 'bg-red-500' : 'bg-green-500'} animate-pulse shadow-lg`}></div>
                <p className={`text-sm font-bold ${conversation.micMuted ? 'text-red-700' : 'text-green-700'}`}>
                  {conversation.micMuted ? "Microphone Muted" : "Listening..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-700 via-red-600 to-green-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="pt-12 pb-10 text-center space-y-6">
              {/* Christmas Tree Icon */}
              <div className="text-7xl animate-bounce">🎄</div>

              {/* Thank You Message */}
              <div>
                <h2 className="text-3xl font-bold text-red-700">Thanks for Calling Santa!</h2>
                <p className="text-base text-green-700 mt-3 font-medium">
                  Call Duration: {formatTime(callDuration)}
                </p>
              </div>

              {/* Santa's Message Card */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 shadow-lg">
                <p className="text-white text-base font-bold mb-2">🎅 Santa says:</p>
                <p className="text-white text-sm leading-relaxed">"Merry Christmas! Thank you for visiting the North Pole!"</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Call Again Button */}
              <Button
                onClick={() => {
                  setCallEnded(false);
                  setCallDuration(0);
                  setReservationSuccess(false);
                  setReservationId(null);
                  setError(null);
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 text-lg text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                Call Santa Again 🎅
              </Button>

              {/* Back to Home Button */}
              <Link to="/" className="block">
                <Button
                  variant="outline"
                  className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 h-14 text-lg font-bold rounded-2xl transition-all duration-200 hover:scale-[1.02]"
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
      <div className="w-full max-w-md">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="pt-12 pb-10 text-center space-y-8">
            {/* Santa Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-30"></div>
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 flex items-center justify-center shadow-2xl border-4 border-white ring-4 ring-red-200">
                  <img src="/iconsanta.png" alt="Santa" className="w-32 h-32 object-cover rounded-full" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-red-700">Santa is calling you</h2>
            </div>

            {/* Answer Button */}
            <Button
              onClick={startCall}
              disabled={isLoading}
              className="w-full h-auto p-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl shadow-lg hover:shadow-xl text-white font-bold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white tracking-wide">
                  Click to answer him
                </p>
                <p className="text-sm text-red-100 mt-2 font-medium">Ho Ho Ho!</p>
              </div>
            </Button>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center gap-3 text-red-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-base font-semibold">Connecting to Santa...</span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-300 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-red-700" />
                <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Text */}
            <p className="text-sm text-green-700 px-4 font-semibold leading-relaxed">
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
