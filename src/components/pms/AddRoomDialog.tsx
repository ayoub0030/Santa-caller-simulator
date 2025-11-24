import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddRoomDialog = ({ open, onOpenChange, onSuccess }: AddRoomDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState<'standard' | 'deluxe' | 'suite'>('standard');
  const [pricePerNight, setPricePerNight] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomNumber || !pricePerNight) {
      toast({
        title: "Missing information",
        description: "Room number and price are required",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(pricePerNight);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          room_number: roomNumber,
          room_type: roomType,
          price_per_night: price,
          description: description || null,
          status: 'available',
        });

      if (error) throw error;

      toast({
        title: "Room added",
        description: "The room has been successfully added",
      });

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error adding room",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoomNumber("");
    setRoomType('standard');
    setPricePerNight("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Add a new room to the property
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number *</Label>
            <Input
              id="roomNumber"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type *</Label>
            <Select value={roomType} onValueChange={(value: any) => setRoomType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricePerNight">Price Per Night ($) *</Label>
            <Input
              id="pricePerNight"
              type="number"
              step="0.01"
              min="0"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              placeholder="99.99"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Room amenities and features..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
