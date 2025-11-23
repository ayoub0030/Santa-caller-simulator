import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const ReservationList = () => {
  // Mock data - will be replaced with real data from Lovable Cloud
  const reservations = [
    {
      id: "1",
      guestName: "John Smith",
      room: "101",
      checkIn: "2024-01-15",
      checkOut: "2024-01-18",
      status: "confirmed",
      nights: 3,
      total: 360,
    },
    {
      id: "2",
      guestName: "Sarah Johnson",
      room: "205",
      checkIn: "2024-01-16",
      checkOut: "2024-01-20",
      status: "pending",
      nights: 4,
      total: 720,
    },
    {
      id: "3",
      guestName: "Michael Brown",
      room: "302",
      checkIn: "2024-01-14",
      checkOut: "2024-01-17",
      status: "checked-in",
      nights: 3,
      total: 840,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-status-available">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-status-cleaning">Pending</Badge>;
      case "checked-in":
        return <Badge className="bg-status-occupied">Checked In</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reservations</CardTitle>
              <CardDescription>Manage all property reservations</CardDescription>
            </div>
            <Button className="bg-accent hover:bg-accent/90">
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
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">{reservation.guestName}</TableCell>
                  <TableCell>{reservation.room}</TableCell>
                  <TableCell>{new Date(reservation.checkIn).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(reservation.checkOut).toLocaleDateString()}</TableCell>
                  <TableCell>{reservation.nights}</TableCell>
                  <TableCell>${reservation.total}</TableCell>
                  <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationList;
