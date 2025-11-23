import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut } from "lucide-react";

const CheckInOut = () => {
  // Mock data - will be replaced with real data from Lovable Cloud
  const pendingCheckIns = [
    {
      id: "1",
      guestName: "John Smith",
      room: "101",
      expectedTime: "2:00 PM",
      type: "Standard",
    },
    {
      id: "2",
      guestName: "Sarah Johnson",
      room: "205",
      expectedTime: "3:30 PM",
      type: "Deluxe",
    },
  ];

  const pendingCheckOuts = [
    {
      id: "3",
      guestName: "Michael Brown",
      room: "302",
      expectedTime: "11:00 AM",
      type: "Suite",
    },
  ];

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
            {pendingCheckIns.map((guest) => (
              <Card key={guest.id} className="border-l-4 border-l-status-available">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{guest.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {guest.room} • {guest.type}
                        </p>
                      </div>
                      <Badge variant="outline">{guest.expectedTime}</Badge>
                    </div>
                    <Button className="w-full bg-status-available hover:bg-status-available/90">
                      <LogIn className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingCheckIns.length === 0 && (
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
            {pendingCheckOuts.map((guest) => (
              <Card key={guest.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{guest.guestName}</p>
                        <p className="text-sm text-muted-foreground">
                          Room {guest.room} • {guest.type}
                        </p>
                      </div>
                      <Badge variant="outline">{guest.expectedTime}</Badge>
                    </div>
                    <Button className="w-full bg-accent hover:bg-accent/90">
                      <LogOut className="mr-2 h-4 w-4" />
                      Check Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingCheckOuts.length === 0 && (
              <p className="text-center text-muted-foreground">No pending check-outs</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckInOut;
