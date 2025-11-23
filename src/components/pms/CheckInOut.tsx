import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CheckInOut = () => {
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [pendingCheckOuts, setPendingCheckOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOperations();
  }, []);

  const fetchPendingOperations = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch pending check-ins
      const { data: checkIns, error: checkInsError } = await supabase
        .from('reservations')
        .select(`
          *,
          guests (name),
          rooms (room_number, room_type)
        `)
        .eq('check_in_date', today)
        .in('status', ['confirmed', 'pending'])
        .order('created_at');
      
      if (checkInsError) throw checkInsError;

      // Fetch pending check-outs
      const { data: checkOuts, error: checkOutsError } = await supabase
        .from('reservations')
        .select(`
          *,
          guests (name),
          rooms (room_number, room_type)
        `)
        .eq('check_out_date', today)
        .eq('status', 'checked-in')
        .order('created_at');
      
      if (checkOutsError) throw checkOutsError;

      setPendingCheckIns(checkIns || []);
      setPendingCheckOuts(checkOuts || []);
    } catch (error: any) {
      toast({
        title: "Error loading operations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (reservationId: string, roomId: string) => {
    try {
      // Update reservation status
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'checked-in' })
        .eq('id', reservationId);
      
      if (reservationError) throw reservationError;

      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId);
      
      if (roomError) throw roomError;

      toast({
        title: "Check-in successful",
        description: "Guest has been checked in",
      });

      fetchPendingOperations();
    } catch (error: any) {
      toast({
        title: "Error during check-in",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (reservationId: string, roomId: string) => {
    try {
      // Update reservation status
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({ status: 'checked-out' })
        .eq('id', reservationId);
      
      if (reservationError) throw reservationError;

      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'cleaning' })
        .eq('id', roomId);
      
      if (roomError) throw roomError;

      toast({
        title: "Check-out successful",
        description: "Guest has been checked out",
      });

      fetchPendingOperations();
    } catch (error: any) {
      toast({
        title: "Error during check-out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatRoomType = (type: string) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || '';
  };

  if (loading) {
    return <div className="text-center py-8">Loading operations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-status-available" />
              Pending Check-Ins
            </CardTitle>
            <CardDescription>Guests expected to arrive today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingCheckIns.length > 0 ? (
              pendingCheckIns.map((reservation) => (
                <Card key={reservation.id} className="border-l-4 border-l-status-available">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{reservation.guests?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Room {reservation.rooms?.room_number} • {formatRoomType(reservation.rooms?.room_type)}
                          </p>
                        </div>
                        <Badge variant="outline">2:00 PM</Badge>
                      </div>
                      <Button 
                        className="w-full bg-status-available hover:bg-status-available/90"
                        onClick={() => handleCheckIn(reservation.id, reservation.room_id)}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Check In
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No pending check-ins</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Check-outs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-accent" />
              Pending Check-Outs
            </CardTitle>
            <CardDescription>Guests expected to depart today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingCheckOuts.length > 0 ? (
              pendingCheckOuts.map((reservation) => (
                <Card key={reservation.id} className="border-l-4 border-l-accent">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{reservation.guests?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Room {reservation.rooms?.room_number} • {formatRoomType(reservation.rooms?.room_type)}
                          </p>
                        </div>
                        <Badge variant="outline">11:00 AM</Badge>
                      </div>
                      <Button 
                        className="w-full bg-accent hover:bg-accent/90"
                        onClick={() => handleCheckOut(reservation.id, reservation.room_id)}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Check Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No pending check-outs</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInOut;
