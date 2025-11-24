import { supabase } from "@/integrations/supabase/client";

interface AgentReservationData {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  specialRequests?: string;
  totalAmount?: number;
}

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  error?: string;
}

/**
 * Creates a reservation from agent data
 * Handles guest creation if needed, validates room availability, and inserts reservation
 */
export const createReservationFromAgent = async (
  agentData: AgentReservationData
): Promise<ReservationResult> => {
  try {
    // Step 1: Validate input
    if (!agentData.guestName || !agentData.roomId || !agentData.checkInDate || !agentData.checkOutDate) {
      return {
        success: false,
        error: "Missing required reservation information",
      };
    }

    // Step 2: Validate dates
    const checkIn = new Date(agentData.checkInDate);
    const checkOut = new Date(agentData.checkOutDate);

    if (checkOut <= checkIn) {
      return {
        success: false,
        error: "Check-out date must be after check-in date",
      };
    }

    // Step 3: Check room availability
    const { data: existingReservations, error: checkError } = await supabase
      .from("reservations")
      .select("*")
      .eq("room_id", agentData.roomId)
      .in("status", ["pending", "confirmed", "checked-in"]);

    if (checkError) throw checkError;

    const hasConflict = existingReservations?.some((res) => {
      const existingStart = new Date(res.check_in_date);
      const existingEnd = new Date(res.check_out_date);
      return checkIn < existingEnd && checkOut > existingStart;
    });

    if (hasConflict) {
      return {
        success: false,
        error: "Room is not available for selected dates",
      };
    }

    // Step 4: Get or create guest
    let guestId: string;

    // Try to find existing guest by email
    if (agentData.guestEmail) {
      const { data: existingGuest } = await supabase
        .from("guests")
        .select("id")
        .eq("email", agentData.guestEmail)
        .single();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Create new guest
        const { data: newGuest, error: guestError } = await supabase
          .from("guests")
          .insert({
            name: agentData.guestName,
            email: agentData.guestEmail || null,
            phone: agentData.guestPhone || null,
          })
          .select("id")
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }
    } else {
      // Create guest without email
      const { data: newGuest, error: guestError } = await supabase
        .from("guests")
        .insert({
          name: agentData.guestName,
          phone: agentData.guestPhone || null,
        })
        .select("id")
        .single();

      if (guestError) throw guestError;
      guestId = newGuest.id;
    }

    // Step 5: Get room price if not provided
    let totalAmount = agentData.totalAmount;
    if (!totalAmount) {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("price_per_night")
        .eq("id", agentData.roomId)
        .single();

      if (roomError) throw roomError;

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalAmount = room.price_per_night * nights;
    }

    // Step 6: Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        room_id: agentData.roomId,
        guest_id: guestId,
        check_in_date: agentData.checkInDate,
        check_out_date: agentData.checkOutDate,
        status: "confirmed",
        total_amount: totalAmount,
        notes: agentData.specialRequests || null,
      })
      .select("id")
      .single();

    if (reservationError) throw reservationError;

    // Step 7: Update room status to occupied (optional - only if checking in today)
    const today = new Date().toISOString().split("T")[0];
    if (agentData.checkInDate === today) {
      await supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", agentData.roomId);
    }

    return {
      success: true,
      reservationId: reservation.id,
    };
  } catch (error: any) {
    console.error("Reservation creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create reservation",
    };
  }
};

/**
 * Parses agent response and extracts reservation data
 * Handles different response formats from ElevenLabs agent
 */
export const parseAgentResponse = (response: any): AgentReservationData | null => {
  try {
    // Handle direct JSON response
    if (response.reservation) {
      return response.reservation;
    }

    // Handle nested data structure
    if (response.data?.reservation) {
      return response.data.reservation;
    }

    // Try to parse if it's a string
    if (typeof response === "string") {
      const parsed = JSON.parse(response);
      return parsed.reservation || parsed;
    }

    return null;
  } catch (error) {
    console.error("Error parsing agent response:", error);
    return null;
  }
};
