import { useEffect, useState } from "react";
import { BedDouble, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    available: 0,
    occupied: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
  });
  const [todaysArrivals, setTodaysArrivals] = useState<any[]>([]);
  const [roomStatusCounts, setRoomStatusCounts] = useState({
    available: 0,
    occupied: 0,
    cleaning: 0,
    maintenance: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch room stats
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('status');
      
      if (roomsError) throw roomsError;

      const statusCounts = {
        available: rooms?.filter(r => r.status === 'available').length || 0,
        occupied: rooms?.filter(r => r.status === 'occupied').length || 0,
        cleaning: rooms?.filter(r => r.status === 'cleaning').length || 0,
        maintenance: rooms?.filter(r => r.status === 'maintenance').length || 0,
      };
      setRoomStatusCounts(statusCounts);

      // Fetch today's check-ins and check-outs
      const today = new Date().toISOString().split('T')[0];
      
      const { data: checkIns, error: checkInsError } = await supabase
        .from('reservations')
        .select('*, guests(name), rooms(room_number)')
        .eq('check_in_date', today)
        .in('status', ['confirmed', 'pending']);
      
      if (checkInsError) throw checkInsError;

      const { data: checkOuts, error: checkOutsError } = await supabase
        .from('reservations')
        .select('id')
        .eq('check_out_date', today)
        .eq('status', 'checked-in');
      
      if (checkOutsError) throw checkOutsError;

      setStats({
        available: statusCounts.available,
        occupied: statusCounts.occupied,
        todayCheckIns: checkIns?.length || 0,
        todayCheckOuts: checkOuts?.length || 0,
      });

      setTodaysArrivals(checkIns?.map(r => ({
        name: r.guests?.name || 'Unknown',
        room: r.rooms?.room_number || 'N/A',
        time: r.check_in_time || '2:00 PM', // Default to 2:00 PM if not specified
      })) || []);

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const statsData = [
    { title: "Available Rooms", value: stats.available.toString(), icon: BedDouble, color: "text-status-available" },
    { title: "Occupied Rooms", value: stats.occupied.toString(), icon: BedDouble, color: "text-status-occupied" },
    { title: "Today's Check-ins", value: stats.todayCheckIns.toString(), icon: Calendar, color: "text-accent" },
    { title: "Today's Check-outs", value: stats.todayCheckOuts.toString(), icon: Calendar, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
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
              {todaysArrivals.length > 0 ? (
                todaysArrivals.map((guest, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-muted-foreground">Room {guest.room}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{guest.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No arrivals today</p>
              )}
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
                <span className="font-medium">{roomStatusCounts.available} rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-occupied"></div>
                  <span className="text-sm">Occupied</span>
                </div>
                <span className="font-medium">{roomStatusCounts.occupied} rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-cleaning"></div>
                  <span className="text-sm">Cleaning</span>
                </div>
                <span className="font-medium">{roomStatusCounts.cleaning} rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-status-maintenance"></div>
                  <span className="text-sm">Maintenance</span>
                </div>
                <span className="font-medium">{roomStatusCounts.maintenance} rooms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
