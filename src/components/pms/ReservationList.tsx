import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddReservationDialog } from "./AddReservationDialog";

const ReservationList = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          guests (name, email, phone),
          rooms (room_number, room_type)
        `)
        .order('check_in_date', { ascending: false });
      
      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading reservations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-status-available">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-status-cleaning">Pending</Badge>;
      case "checked-in":
        return <Badge className="bg-status-occupied">Checked In</Badge>;
      case "checked-out":
        return <Badge className="bg-muted">Checked Out</Badge>;
      case "cancelled":
        return <Badge className="bg-status-maintenance">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  if (loading) {
    return <div className="text-center py-8">Loading reservations...</div>;
  }

  return (
    <div className="space-y-4">
      <AddReservationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchReservations}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reservations</CardTitle>
              <CardDescription>Manage all property reservations</CardDescription>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.guests?.name || 'N/A'}</TableCell>
                    <TableCell>{reservation.rooms?.room_number || 'N/A'}</TableCell>
                    <TableCell>{new Date(reservation.check_in_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(reservation.check_out_date).toLocaleDateString()}</TableCell>
                    <TableCell>{calculateNights(reservation.check_in_date, reservation.check_out_date)}</TableCell>
                    <TableCell>${reservation.total_amount || 0}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No reservations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationList;
