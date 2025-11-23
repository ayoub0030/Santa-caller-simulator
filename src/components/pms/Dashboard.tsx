import { BedDouble, Users, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  // Mock data - will be replaced with real data from Lovable Cloud
  const stats = [
    { title: "Available Rooms", value: "8", icon: BedDouble, color: "text-status-available" },
    { title: "Occupied Rooms", value: "12", icon: BedDouble, color: "text-status-occupied" },
    { title: "Today's Check-ins", value: "5", icon: Calendar, color: "text-accent" },
    { title: "Today's Check-outs", value: "3", icon: Calendar, color: "text-muted-foreground" },
  ];

  const todaysArrivals = [
    { name: "John Smith", room: "101", time: "2:00 PM" },
    { name: "Sarah Johnson", room: "205", time: "3:30 PM" },
    { name: "Michael Brown", room: "303", time: "4:00 PM" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Arrivals</CardTitle>
            <CardDescription>Guests checking in today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysArrivals.map((guest) => (
                <div key={guest.room} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-sm text-muted-foreground">Room {guest.room}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{guest.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Status Overview</CardTitle>
            <CardDescription>Current room occupancy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-available"></div>
                  <span className="text-sm">Available</span>
                </div>
                <span className="font-medium">8 rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-occupied"></div>
                  <span className="text-sm">Occupied</span>
                </div>
                <span className="font-medium">12 rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-cleaning"></div>
                  <span className="text-sm">Cleaning</span>
                </div>
                <span className="font-medium">2 rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-maintenance"></div>
                  <span className="text-sm">Maintenance</span>
                </div>
                <span className="font-medium">1 room</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
