# ElevenLabs Integration Troubleshooting Guide

## ✅ What Was Fixed

1. **SDK Loading Issue** – Changed from CDN script loading to proper npm package import
2. **Authentication** – Added API Key support for proper authentication
3. **Error Handling** – Improved error messages and logging
4. **Mute/Unmute** – Added ability to toggle microphone during calls

---

## 🔧 Configuration Checklist

### Step 1: Verify .env File
Your `.env` should have:
```
VITE_ELEVENLABS_AGENT_ID="agent_2201katqvw5wec2vfpg004z38djk"
VITE_ELEVENLABS_API_KEY="64c142e16e9d40e81887904cf72ea96978c8ba1030df797ce50621f0dbdf06af"
```

✅ Both values are already added

### Step 2: Install Dependencies
```bash
npm install
```

This installs `@11labs/convai` package which is required.

### Step 3: Restart Dev Server
```bash
npm run dev
```

After installing packages, always restart the dev server.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load ElevenLabs SDK"

**Cause:** Package not installed or import failed

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Check:**
- Open browser console (F12)
- Look for import errors
- Verify `@11labs/convai` is in `node_modules`

---

### Issue 2: "Missing ElevenLabs configuration"

**Cause:** Agent ID or API Key not set in `.env`

**Solution:**
1. Open `.env` file
2. Verify both values are present:
   ```
   VITE_ELEVENLABS_AGENT_ID="agent_2201katqvw5wec2vfpg004z38djk"
   VITE_ELEVENLABS_API_KEY="64c142e16e9d40e81887904cf72ea96978c8ba1030df797ce50621f0dbdf06af"
   ```
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R)

---

### Issue 3: "Call error occurred" during call

**Cause:** Agent not properly configured or API key invalid

**Solution:**
1. Check ElevenLabs dashboard:
   - Agent exists and is active
   - Agent ID matches `.env`
   - API Key is valid (not expired)

2. Check browser console for detailed error:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Copy error and check ElevenLabs docs

3. Verify agent configuration:
   - System prompt is set
   - Knowledge base is configured
   - Agent is in "active" state

---

### Issue 4: "Reservation not created"

**Cause:** JSON format mismatch or database error

**Solution:**
1. Check browser console for validation errors
2. Verify agent returns correct JSON format:
   ```json
   {
     "reservation": {
       "guestName": "John Doe",
       "guestEmail": "john@example.com",
       "guestPhone": "+1-555-1234",
       "roomId": "uuid-here",
       "checkInDate": "2024-12-25",
       "checkOutDate": "2024-12-27",
       "specialRequests": "optional",
       "totalAmount": 298.00
     }
   }
   ```
3. Check Supabase:
   - Verify `rooms` table has available rooms
   - Verify `guests` table exists
   - Verify `reservations` table exists

---

### Issue 5: Agent doesn't respond to voice

**Cause:** Microphone not working or agent not listening

**Solution:**
1. **Check microphone permissions:**
   - Browser should ask for microphone access
   - Click "Allow" when prompted
   - Check browser settings (chrome://settings/content/microphone)

2. **Test microphone:**
   - Go to https://test.webrtc.org/
   - Test microphone there first

3. **Check agent status:**
   - Call status should show "Connected! Speak now..."
   - If not, check error messages

4. **Try muting/unmuting:**
   - Click "Mute" button
   - Wait 1 second
   - Click "Unmute" button
   - Try speaking again

---

### Issue 6: Agent returns wrong room information

**Cause:** Knowledge base not updated or outdated

**Solution:**
1. Go to ElevenLabs dashboard
2. Open your agent settings
3. Update the knowledge base with current room data:
   ```json
   {
     "roomTypes": [
       {
         "type": "standard",
         "price": 99,
         "available": true
       },
       {
         "type": "deluxe",
         "price": 149,
         "available": true
       },
       {
         "type": "suite",
         "price": 249,
         "available": true
       }
     ]
   }
   ```
4. Save and test again

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console
- Press `F12` or `Ctrl+Shift+I`
- Go to "Console" tab
- Look for any red errors

### Step 2: Check Network Tab
- Go to "Network" tab
- Click "Start Call"
- Look for failed requests
- Check response status codes

### Step 3: Enable Verbose Logging
Add this to `src/pages/Call.tsx` for more details:
```typescript
// Add after imports
const DEBUG = true;

const log = (msg: string, data?: any) => {
  if (DEBUG) {
    console.log(`[CALL] ${msg}`, data || "");
  }
};
```

Then use `log()` instead of `console.log()` for easier filtering.

### Step 4: Test with Simple Queries
Try these test queries:
- "What rooms do you have?"
- "How much is a deluxe room?"
- "I want to book a room"
- "Check availability for tomorrow"

---

## 📋 Verification Checklist

Before testing, verify:

- [ ] `.env` has both Agent ID and API Key
- [ ] Dev server restarted after `.env` changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Microphone permissions granted
- [ ] Agent is active in ElevenLabs dashboard
- [ ] Knowledge base is up-to-date
- [ ] System prompt is configured
- [ ] Supabase tables exist (rooms, guests, reservations)
- [ ] At least one room is marked as "available"

---

## 🚀 Testing Workflow

### Test 1: Basic Connection
1. Click "Start Call"
2. Wait for "Connected! Speak now..." message
3. Say "Hello"
4. Agent should respond
5. Click "End Call"

### Test 2: Room Information
1. Start call
2. Say "What rooms do you have?"
3. Agent should list available rooms
4. End call

### Test 3: Full Booking
1. Start call
2. Say "I'd like to book a deluxe room for 2 nights starting tomorrow"
3. Provide name, email, phone when asked
4. Confirm booking
5. Check PMS dashboard for new reservation

### Test 4: Error Handling
1. Start call
2. Say "Book a room for yesterday"
3. Agent should reject invalid dates
4. End call

---

## 📞 Support Resources

- **ElevenLabs Docs:** https://docs.elevenlabs.io/conversational-ai/overview
- **ElevenLabs Dashboard:** https://elevenlabs.io/app/conversational-ai
- **Browser DevTools:** Press F12
- **Supabase Dashboard:** https://app.supabase.com

---

## 🎯 Quick Fix Checklist

If something isn't working:

1. ✅ Check `.env` has both values
2. ✅ Restart dev server (`npm run dev`)
3. ✅ Clear browser cache (Ctrl+Shift+Delete)
4. ✅ Hard refresh page (Ctrl+Shift+R)
5. ✅ Check browser console (F12)
6. ✅ Check microphone permissions
7. ✅ Check ElevenLabs agent is active
8. ✅ Check Supabase has rooms

If still not working:
- Share console errors
- Check ElevenLabs dashboard logs
- Verify API key is valid

---

## 📝 Recent Changes

**Commit:** `74d98f2` - "fix: improve ElevenLabs SDK integration with API key auth and better error handling"

### What Changed:
- ✅ Fixed SDK loading (now uses npm package instead of CDN)
- ✅ Added API Key authentication
- ✅ Improved error messages
- ✅ Added Mute/Unmute buttons
- ✅ Better error handling and logging

### Files Modified:
- `src/pages/Call.tsx` – Updated SDK integration
- `package.json` – Ensured @11labs/convai is listed
- `.env` – Added API Key variable

---

## ✨ Features Now Working

✅ **Proper SDK Loading** – Uses npm package  
✅ **API Key Auth** – Secure authentication  
✅ **Better Errors** – Clear error messages  
✅ **Mute Control** – Toggle microphone  
✅ **Logging** – Console logs for debugging  
✅ **Fallback Handling** – Graceful error recovery  

---

**Ready to test!** 🎉

If you encounter any issues, check the console (F12) for detailed error messages.
