import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, Settings } from "lucide-react";

const RoomGrid = () => {
  // Mock data - will be replaced with real data from Lovable Cloud
  const rooms = [
    { number: "101", type: "Standard", status: "available", price: 120 },
    { number: "102", type: "Standard", status: "occupied", price: 120, guest: "John Doe" },
    { number: "103", type: "Standard", status: "cleaning", price: 120 },
    { number: "201", type: "Deluxe", status: "available", price: 180 },
    { number: "202", type: "Deluxe", status: "occupied", price: 180, guest: "Jane Smith" },
    { number: "203", type: "Deluxe", status: "maintenance", price: 180 },
    { number: "301", type: "Suite", status: "available", price: 280 },
    { number: "302", type: "Suite", status: "occupied", price: 280, guest: "Bob Johnson" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-status-available text-white";
      case "occupied":
        return "bg-status-occupied text-white";
      case "cleaning":
        return "bg-status-cleaning text-white";
      case "maintenance":
        return "bg-status-maintenance text-white";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Management</h2>
          <p className="text-muted-foreground">View and manage all rooms</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Settings className="mr-2 h-4 w-4" />
          Room Settings
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rooms.map((room) => (
          <Card key={room.number} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.number}</CardTitle>
                <BedDouble className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{room.type}</span>
                <span className="font-medium">${room.price}/night</span>
              </div>
              <Badge className={getStatusColor(room.status)}>
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </Badge>
              {room.guest && (
                <p className="text-sm text-muted-foreground">Guest: {room.guest}</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={room.status === "maintenance"}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomGrid;
