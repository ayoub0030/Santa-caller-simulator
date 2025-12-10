# Reservation Flow: ElevenLabs Agent → Supabase

## Overview

When a guest completes a call with the ElevenLabs AI agent and confirms a reservation, the agent returns a JSON object. This flow automatically captures that JSON and saves it as a reservation in Supabase.

---

## Flow Diagram

```
1. Guest clicks "Start Call"
   ↓
2. ElevenLabs widget opens (full-screen voice UI)
   ↓
3. Guest speaks to AI agent about booking
   ↓
4. Agent confirms reservation details
   ↓
5. Agent returns JSON with reservation data
   ↓
6. Call.tsx listens for the JSON message
   ↓
7. Calls createReservationFromAgent() with the data
   ↓
8. Reservation is created in Supabase
   ↓
9. Success toast + confirmation shown to user
```

---

## JSON Format from Agent

The agent should return JSON in this format (as configured in your ElevenLabs system prompt):

```json
{
  "reservation": {
    "guestName": "Ayoub El Mouden",
    "guestEmail": "ayou@gmail.com",
    "guestPhone": "+212723493230",
    "roomId": "junior-suite-001",
    "checkInDate": "2023-10-27",
    "checkOutDate": "2023-10-30",
    "specialRequests": "No special requests",
    "totalAmount": 1050.00
  }
}
```

---

## How It Works (Code)

### 1. **Message Listener** (`Call.tsx` useEffect)

```tsx
useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    // Check if message contains reservation data
    if (event.data?.type === "agent_message" || event.data?.reservation) {
      let reservationData = event.data.reservation;
      
      // If not directly in reservation field, try to parse from text
      if (!reservationData && event.data.text) {
        const jsonMatch = event.data.text.match(/\{[\s\S]*"reservation"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reservationData = parsed.reservation;
        }
      }
      
      // Save to Supabase
      if (reservationData) {
        const result = await createReservationFromAgent(reservationData);
        // ... show success/error
      }
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [toast]);
```

### 2. **Reservation Handler** (`reservationHandler.ts`)

The `createReservationFromAgent()` function:
- ✅ Validates all required fields
- ✅ Checks date validity (checkout > checkin)
- ✅ Checks room availability (no conflicts)
- ✅ Creates or finds guest in `guests` table
- ✅ Calculates total amount if not provided
- ✅ Inserts reservation into `reservations` table
- ✅ Updates room status if needed

### 3. **UI Feedback** (`Call.tsx` JSX)

When reservation is created:
- Green success alert appears with reservation ID
- Toast notification shows confirmation
- User can see the confirmation on the page

---

## Required Fields

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `guestName` | string | ✅ Yes | "John Doe" |
| `guestEmail` | string | ❌ Optional | "john@example.com" |
| `guestPhone` | string | ❌ Optional | "+1-555-1234" |
| `roomId` | string | ✅ Yes | "room-uuid-or-id" |
| `checkInDate` | string (YYYY-MM-DD) | ✅ Yes | "2024-12-25" |
| `checkOutDate` | string (YYYY-MM-DD) | ✅ Yes | "2024-12-27" |
| `specialRequests` | string | ❌ Optional | "High floor, non-smoking" |
| `totalAmount` | number | ❌ Optional | 500.00 |

---

## Error Handling

If the reservation fails, the user sees:
- Red error alert with reason
- Toast notification with error details
- Possible reasons:
  - Missing required fields
  - Invalid dates (checkout ≤ checkin)
  - Room not available for those dates
  - Database error

---

## Testing

### Manual Test

1. Start dev server: `npm run dev`
2. Navigate to `/call`
3. Click "Start Call"
4. In the console, manually trigger a message:
   ```javascript
   window.postMessage({
     type: "agent_message",
     reservation: {
       guestName: "Test Guest",
       guestEmail: "test@example.com",
       guestPhone: "+1-555-1234",
       roomId: "101",
       checkInDate: "2024-12-25",
       checkOutDate: "2024-12-27",
       specialRequests: "None",
       totalAmount: 250.00
     }
   }, "*");
   ```
5. Check that:
   - Success alert appears
   - Toast shows reservation ID
   - Reservation appears in Supabase `reservations` table

### Live Test with Agent

1. Call the agent
2. Ask to book a room
3. Confirm the booking
4. Agent returns JSON
5. Reservation should auto-save to Supabase

---

## Next Steps (Optional)

To enhance this further:

1. **Webhook from ElevenLabs**: Configure ElevenLabs to send a webhook with the reservation JSON instead of relying on postMessage
2. **Email Confirmation**: Send confirmation email to guest after reservation is created
3. **SMS Notification**: Send SMS to guest phone number
4. **Conversation History**: Store the full conversation transcript in Supabase
5. **Agent Feedback**: Collect user feedback about the call experience

---

## Troubleshooting

### Reservation not saving

**Check:**
1. Browser console for errors
2. Network tab to see if Supabase request succeeded
3. Supabase dashboard to see if reservation was inserted
4. Room ID exists in `rooms` table
5. Dates are valid (checkout > checkin)

### Agent not returning JSON

**Check:**
1. Agent system prompt includes the JSON format instruction
2. Agent is configured to return JSON only when booking is confirmed
3. JSON format matches exactly what the code expects

### Message listener not triggering

**Check:**
1. Browser console for listener registration
2. ElevenLabs widget is sending postMessage events
3. Message format matches what the listener expects

---

## Files Involved

- `src/pages/Call.tsx` - Listens for messages, shows UI feedback
- `src/lib/reservationHandler.ts` - Creates reservation in Supabase
- `ELEVENLABS_SETUP.md` - Agent configuration with JSON format
- `.env` - ElevenLabs Agent ID and API key
