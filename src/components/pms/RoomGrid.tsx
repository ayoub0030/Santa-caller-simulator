import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddRoomDialog } from "./AddRoomDialog";
import { RoomDetailsDialog } from "./RoomDetailsDialog";

const RoomGrid = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number');
      
      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading rooms",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatRoomType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return <div className="text-center py-8">Loading rooms...</div>;
  }

  return (
    <div className="space-y-4">
      <AddRoomDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchRooms}
      />
      <RoomDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        roomId={selectedRoomId}
        onPhotoAdded={fetchRooms}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Management</h2>
          <p className="text-muted-foreground">View and manage all rooms</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rooms.map((room) => (
          <Card key={room.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                <BedDouble className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{formatRoomType(room.room_type)}</span>
                <span className="font-medium">${room.price_per_night}/night</span>
              </div>
              <Badge className={getStatusColor(room.status)}>
                {formatRoomType(room.status)}
              </Badge>
              {room.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setShowDetailsDialog(true);
                }}
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
