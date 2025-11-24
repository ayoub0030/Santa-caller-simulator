import { useState } from "react";
import { Calendar, Users, BedDouble, DoorOpen, BarChart3, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/pms/Dashboard";
import RoomGrid from "@/components/pms/RoomGrid";
import ReservationList from "@/components/pms/ReservationList";
import GuestList from "@/components/pms/GuestList";
import CheckInOut from "@/components/pms/CheckInOut";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">HotelHub PMS</h1>
              <p className="text-sm text-muted-foreground">Property Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Link to="/call">
                <Button className="bg-status-available hover:bg-status-available/90">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Agent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-card">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="rooms" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BedDouble className="mr-2 h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="reservations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="guests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="mr-2 h-4 w-4" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="checkinout" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DoorOpen className="mr-2 h-4 w-4" />
              Check-In/Out
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Dashboard />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <RoomGrid />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            <ReservationList />
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <GuestList />
          </TabsContent>

          <TabsContent value="checkinout" className="space-y-4">
            <CheckInOut />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
