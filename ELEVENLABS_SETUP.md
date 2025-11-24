# ElevenLabs AI Voice Agent Setup Guide

This guide will help you set up the ElevenLabs AI Voice Agent for the HotelHub PMS to handle room reservations via voice.

---

## Step 1: Create an Agent in ElevenLabs Dashboard

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Click **"Create Agent"**
3. Name it: `HotelHub Reservation Agent`
4. Choose a voice (e.g., "Aria" or your preferred voice)
5. Save the **Agent ID** (you'll need this for the `.env` file)

---

## Step 2: Configure the Agent System Prompt

In the ElevenLabs agent settings, set the **System Prompt** to:

```
You are a professional hotel reservation assistant for HotelHub, a luxury boutique hotel. Your role is to help guests check room availability, get pricing information, and complete reservations.

IMPORTANT INSTRUCTIONS:
1. You have access to real-time hotel data including available rooms, prices, and policies
2. Always be friendly, professional, and helpful
3. When a guest wants to book a room:
   - Confirm their name, email (if available), and phone number
   - Ask for check-in and check-out dates
   - Show available room types and prices
   - Ask about special requests (accessibility, preferences, etc.)
   - Confirm the total price for their stay
   - Once confirmed, return a JSON reservation object

4. If a room is not available for the requested dates, suggest alternative dates or room types
5. Always mention the hotel policies: check-in at 2:00 PM, check-out at 11:00 AM, 24-hour cancellation policy

HOTEL POLICIES:
- Check-in: 2:00 PM (14:00)
- Check-out: 11:00 AM (11:00)
- Cancellation: Free cancellation up to 24 hours before check-in
- Minimum stay: 1 night

When a reservation is confirmed, respond with ONLY this JSON format (no other text):
{
  "reservation": {
    "guestName": "Full Name",
    "guestEmail": "email@example.com",
    "guestPhone": "+1234567890",
    "roomId": "room-uuid-here",
    "checkInDate": "YYYY-MM-DD",
    "checkOutDate": "YYYY-MM-DD",
    "specialRequests": "Any special requests or notes",
    "totalAmount": 500.00
  }
}

IMPORTANT: Only return the JSON when the guest explicitly confirms they want to book. Do not return JSON for inquiries or questions.
```

---

## Step 3: Configure Knowledge Base / Context

In the agent settings, add this as **Knowledge Base** or **System Context**:

```json
{
  "hotelName": "HotelHub PMS",
  "location": "Downtown",
  "checkInTime": "14:00",
  "checkOutTime": "11:00",
  "policies": {
    "cancellationDeadline": "24 hours before check-in",
    "minStay": 1,
    "currency": "USD"
  },
  "roomTypes": [
    {
      "type": "standard",
      "description": "Comfortable room with queen bed, en-suite bathroom, and city view",
      "amenities": ["WiFi", "AC", "TV", "Mini-bar"]
    },
    {
      "type": "deluxe",
      "description": "Spacious room with king bed, luxury bathroom, and premium amenities",
      "amenities": ["WiFi", "AC", "Smart TV", "Mini-bar", "Jacuzzi tub", "Premium toiletries"]
    },
    {
      "type": "suite",
      "description": "Luxury suite with separate living area, bedroom, and premium services",
      "amenities": ["WiFi", "AC", "Smart TV", "Full kitchen", "Jacuzzi", "Concierge service", "Premium toiletries"]
    }
  ]
}
```

---

## Step 4: Set Up Conversation Starters (Optional)

Add these as conversation starters to help guests:

- "I'd like to check room availability"
- "What are your room types and prices?"
- "I want to make a reservation"
- "Tell me about your cancellation policy"
- "Do you have accessible rooms?"

---

## Step 5: Configure the Agent ID in Your App

1. Copy your **Agent ID** from the ElevenLabs dashboard
2. Open `.env` file in your project
3. Replace the placeholder:
   ```
   VITE_ELEVENLABS_AGENT_ID="your-actual-agent-id-here"
   ```
4. Restart your dev server

---

## Step 6: Test the Integration

1. Start your dev server: `npm run dev`
2. Navigate to the PMS dashboard
3. Click the **"Call Agent"** button in the top-right
4. Click **"Start Call"**
5. Speak naturally to the agent:
   - "Hi, I'd like to check availability for a deluxe room"
   - "I need a room for 2 nights starting tomorrow"
   - "Can I book that room?"

---

## Expected Conversation Flow

### Guest: "Hi, I'd like to book a room"
**Agent:** "Welcome to HotelHub! I'd be happy to help you find the perfect room. What dates are you looking to stay with us?"

### Guest: "Check-in on December 25th, check-out on December 27th"
**Agent:** "Great! A 2-night stay from December 25th to 27th. What type of room interests you? We have Standard rooms at $99/night, Deluxe rooms at $149/night, and Suites at $249/night."

### Guest: "I'll take a deluxe room"
**Agent:** "Perfect! A Deluxe room for 2 nights comes to $298 total. Before I confirm, could I get your name, email, and phone number?"

### Guest: "John Doe, john@example.com, 555-1234"
**Agent:** "Thank you, John! Just to confirm: 1 Deluxe room, December 25-27, total $298. Any special requests?"

### Guest: "No, that's all"
**Agent:** [Returns JSON with reservation data]

---

## JSON Response Format

When the guest confirms their reservation, the agent will return:

```json
{
  "reservation": {
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "guestPhone": "+1-555-1234",
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "checkInDate": "2024-12-25",
    "checkOutDate": "2024-12-27",
    "specialRequests": "None",
    "totalAmount": 298.00
  }
}
```

The PMS will automatically:
1. ✅ Create a guest record (or update if exists)
2. ✅ Create a reservation in the database
3. ✅ Update room status if needed
4. ✅ Show confirmation to the user

---

## Troubleshooting

### Agent doesn't respond
- Check that the Agent ID is correct in `.env`
- Ensure your ElevenLabs account has active credits
- Check browser console for errors

### Reservation not created
- Verify the JSON format matches exactly
- Check that room IDs exist in your database
- Look at browser console for validation errors

### Agent returns wrong information
- Update the system prompt with correct hotel details
- Ensure knowledge base is up-to-date
- Test with specific questions

---

## Advanced: Custom Validation Rules

You can add custom validation in `src/lib/reservationHandler.ts`:

```typescript
// Example: Add minimum stay validation
if (nights < hotelData.policies.minStay) {
  return {
    success: false,
    error: `Minimum stay is ${hotelData.policies.minStay} night(s)`,
  };
}
```

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` with real Agent IDs to public repositories
- Use environment variables for production
- Validate all guest data before creating reservations
- Implement rate limiting for API calls
- Add authentication if needed

---

## Next Steps

1. ✅ Create the agent in ElevenLabs
2. ✅ Copy the system prompt above
3. ✅ Add your Agent ID to `.env`
4. ✅ Test the integration
5. ✅ Monitor reservations in the PMS dashboard
6. ✅ Refine the system prompt based on feedback

---

## Support

For ElevenLabs documentation, visit: https://docs.elevenlabs.io/conversational-ai/overview

For PMS issues, check the Call page component: `src/pages/Call.tsx`
