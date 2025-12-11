import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";

interface RoomDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string | null;
  onPhotoAdded?: () => void;
}

export const RoomDetailsDialog = ({ open, onOpenChange, roomId, onPhotoAdded }: RoomDetailsDialogProps) => {
  const [room, setRoom] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && roomId) {
      fetchRoomDetails();
    }
  }, [open, roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      const { data: photosData, error: photosError } = await supabase
        .from('room_photos')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
      setCurrentPhotoIndex(0);
    } catch (error: any) {
      toast({
        title: "Error loading room details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !roomId) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${roomId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `room-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('room-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('room-photos')
          .getPublicUrl(filePath);

        await supabase
          .from('room_photos')
          .insert({
            room_id: roomId,
            photo_url: publicUrlData.publicUrl,
            file_path: filePath,
          });
      }

      toast({
        title: "Photos added",
        description: "Photos have been successfully added to the room",
      });

      fetchRoomDetails();
      onPhotoAdded?.();
    } catch (error: any) {
      toast({
        title: "Error uploading photos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string, filePath: string) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('room-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      await supabase
        .from('room_photos')
        .delete()
        .eq('id', photoId);

      toast({
        title: "Photo deleted",
        description: "The photo has been removed",
      });

      fetchRoomDetails();
    } catch (error: any) {
      toast({
        title: "Error deleting photo",
        description: error.message,
        variant: "destructive",
      });
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

  if (!room && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">Loading room details...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room {room.room_number} Details</DialogTitle>
          <DialogDescription>
            View and manage room information and photos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Gallery */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Photos ({photos.length})</div>
            {photos.length > 0 ? (
              <div className="space-y-3">
                <div className="relative bg-muted rounded-lg overflow-hidden h-80 flex items-center justify-center">
                  <img
                    src={photos[currentPhotoIndex].photo_url}
                    alt={`Room photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                        {currentPhotoIndex + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="relative flex-shrink-0">
                      <img
                        src={photo.photo_url}
                        alt={`Thumbnail ${index + 1}`}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-20 h-20 object-cover rounded cursor-pointer border-2 transition-colors ${
                          index === currentPhotoIndex ? 'border-primary' : 'border-transparent'
                        }`}
                      />
                      <button
                        onClick={() => deletePhoto(photo.id, photo.file_path)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-8 text-center text-muted-foreground">
                No photos yet. Add photos to showcase this room.
              </div>
            )}

            {/* Upload new photos */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
              <input
                id="room-photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
              <label htmlFor="room-photos" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to add more photos"}
                </span>
              </label>
            </div>
          </div>

          {/* Room Information */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Room Type</div>
              <div className="font-medium">{formatRoomType(room.room_type)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Price Per Night</div>
              <div className="font-medium">${room.price_per_night}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
              <Badge className={getStatusColor(room.status)}>
                {formatRoomType(room.status)}
              </Badge>
            </div>
            {room.description && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Description</div>
                <p className="text-sm">{room.description}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
