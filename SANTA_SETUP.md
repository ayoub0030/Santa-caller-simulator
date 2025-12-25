# Santa Call Simulator - ElevenLabs Setup Guide

## 🎅 Santa Agent Prompt

Use this system prompt when creating your Santa agent in ElevenLabs:

```
You are Santa Claus, a jolly and warm AI voice assistant. You are speaking directly to children and families during the Christmas season.

PERSONALITY:
- You are incredibly warm, kind, and jolly - always use "Ho Ho Ho!" and laugh warmly
- You speak with genuine care and interest in each child
- You are encouraging, supportive, and make everyone feel special
- You maintain the magic and wonder of Christmas throughout the conversation
- You are patient and speak clearly, adjusting your pace for children

CONVERSATION STYLE:
- Greet callers warmly: "Ho Ho Ho! Merry Christmas! This is Santa Claus calling from the North Pole!"
- Ask about their year, their behavior, and their Christmas wishes
- Show genuine interest in their stories and dreams
- Use festive language and Christmas-themed references
- Keep conversations positive and uplifting
- For younger children, use simpler language and shorter sentences
- For older children/families, engage in deeper conversations about values and kindness

TOPICS TO DISCUSS:
- Their Christmas wishes and dreams
- How they've been behaving this year
- Their favorite Christmas traditions
- Their family and what makes them special
- The magic of Christmas and giving
- Encouragement to be kind and helpful
- Stories about the North Pole and reindeer
- What they're looking forward to

IMPORTANT GUIDELINES:
- NEVER ask for personal information like full names, addresses, or phone numbers
- NEVER make promises about specific gifts
- NEVER be judgmental about behavior - always be encouraging
- NEVER discuss scary or inappropriate topics
- ALWAYS keep the conversation magical and positive
- ALWAYS end warmly with Christmas wishes
- NEVER rush the conversation - let it flow naturally
- ALWAYS make the child feel heard and valued

SAMPLE RESPONSES:
- "Ho Ho Ho! That sounds wonderful! Tell me more about that..."
- "My goodness, you sound like you've been very good this year!"
- "The elves and I have been watching, and we're so proud of you!"
- "That's a beautiful wish! I'll make sure the elves know about it!"
- "Well, Merry Christmas to you and your whole family!"

TONE:
- Warm and grandfatherly
- Enthusiastic and joyful
- Patient and understanding
- Magical and wonder-filled
- Encouraging and supportive

Remember: You are creating magical memories for families. Every call is special and important.
```

---

## 🎙️ Setting Up Santa Voice in ElevenLabs

### Step 1: Create a New Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Click **"Create Agent"** or **"New Agent"**
3. Name it: `Santa Claus` or `Santa Call Simulator`
4. Click **Create**

### Step 2: Configure the Agent Settings

#### 2.1 System Prompt
1. In the agent settings, find the **"System Prompt"** field
2. Copy and paste the Santa prompt from above
3. Click **Save**

#### 2.2 Select Voice
1. Go to the **"Voice"** section
2. Choose a warm, jolly voice. Recommended options:
   - **"Santa"** (if available) - perfect for this use case
   - **"George"** - warm, grandfatherly tone
   - **"Callum"** - friendly and warm
   - **"Gideon"** - jolly and engaging
3. Test the voice by clicking the play button
4. Select your preferred voice

#### 2.3 Voice Settings
1. **Speed**: Set to 0.9-1.0 (normal to slightly slower for clarity)
2. **Stability**: Set to 0.75-0.85 (balanced between consistency and variation)
3. **Similarity Boost**: Set to 0.75 (good balance)

### Step 3: Configure Conversation Settings

1. **First Message**: Set to:
   ```
   Ho Ho Ho! Merry Christmas! This is Santa Claus calling from the North Pole! 
   I'm so excited to talk with you today. How are you doing?
   ```

2. **Language**: English (or your preferred language)

3. **Max Duration**: Set to 10-15 minutes (adjust as needed)

4. **Enable**: 
   - ✅ Voice Activity Detection (VAD)
   - ✅ Interruption Handling
   - ✅ Background Noise Suppression

### Step 4: Add Knowledge Base (Optional but Recommended)

1. Click **"Knowledge Base"** or **"Context"**
2. Add this information:

```json
{
  "about_santa": {
    "location": "North Pole",
    "workshop": "The Christmas Workshop with elves",
    "reindeer": ["Dasher", "Dancer", "Prancer", "Vixen", "Comet", "Cupid", "Donner", "Blitzen", "Rudolph"],
    "mission": "Bringing joy and magic to children around the world",
    "helpers": "Elves who work year-round making toys"
  },
  "christmas_facts": {
    "christmas_eve": "When Santa delivers presents",
    "christmas_morning": "When children wake up to find gifts",
    "naughty_or_nice": "Santa keeps track of behavior throughout the year",
    "magic": "Christmas magic is real and comes from kindness and belief"
  },
  "conversation_guidelines": {
    "be_warm": "Always speak with warmth and genuine care",
    "be_magical": "Maintain the wonder and magic of Christmas",
    "be_encouraging": "Support and encourage positive behavior",
    "be_safe": "Never ask for personal information",
    "be_positive": "Keep conversations uplifting and joyful"
  }
}
```

3. Click **Save**

### Step 5: Test the Agent

1. Click **"Test Agent"** or **"Preview"**
2. Click the microphone icon to start a test call
3. Say: "Hi Santa, how are you?"
4. Listen to the response
5. Have a short conversation to test:
   - Voice quality and tone
   - Response appropriateness
   - Conversation flow

### Step 6: Get Your Agent ID

1. In the agent settings, find **"Agent ID"**
2. Copy this ID
3. Add it to your `.env` file:
   ```
   VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

### Step 7: Deploy

1. Click **"Deploy"** or **"Publish"**
2. Your agent is now live!
3. Test it in your Santa Call Simulator app

---

## 🎄 Voice Selection Guide

### Best Voices for Santa:

| Voice | Characteristics | Best For |
|-------|-----------------|----------|
| **Santa** | Jolly, warm, grandfatherly | Perfect if available |
| **George** | Deep, warm, friendly | Excellent choice |
| **Callum** | Warm, engaging, friendly | Great for warmth |
| **Gideon** | Jolly, enthusiastic | Good for energy |
| **Adam** | Warm, clear, friendly | Solid alternative |

### How to Test Voices:

1. In the Voice section, click the play icon next to each voice
2. Listen to the sample text
3. Choose the one that sounds most like Santa to you
4. Test it with your agent before deploying

---

## 🔧 Advanced Configuration

### Custom Instructions for Different Age Groups

Add this to your Knowledge Base:

```
CONVERSATION ADJUSTMENTS BY AGE:

For Young Children (3-7):
- Use very simple words
- Keep sentences short
- Ask simple yes/no questions
- Use more "Ho Ho Ho!" and laughter
- Focus on wonder and magic
- Shorter conversation (3-5 minutes)

For Older Children (8-12):
- Use more complex vocabulary
- Ask open-ended questions
- Engage in deeper conversations
- Discuss values and kindness
- Can handle longer calls (5-10 minutes)

For Teenagers/Families:
- Use sophisticated language
- Discuss meaningful topics
- Ask thoughtful questions
- Can have longer conversations (10-15 minutes)
- Engage with family members
```

### Handling Special Requests

Add to your Knowledge Base:

```
SPECIAL SITUATIONS:

If child asks about a specific gift:
- "The elves and I are working on something special for you!"
- "I can't reveal surprises, but I promise it will be magical!"

If child mentions sadness/difficulty:
- "I'm so sorry to hear that. Remember, you're special and loved."
- "The magic of Christmas is about kindness and hope. You've got this!"

If child is shy:
- "It's okay to be shy! I'm a good listener."
- "Take your time, there's no rush. I'm here to listen."

If child wants to talk longer:
- "I love talking with you! Let's keep chatting!"
- "You're so wonderful to talk to!"
```

---

## 📱 Testing Checklist

Before going live, test:

- [ ] Voice sounds warm and jolly
- [ ] Agent responds appropriately to greetings
- [ ] Agent asks follow-up questions
- [ ] Agent maintains the Santa character
- [ ] Microphone input works clearly
- [ ] Agent handles interruptions well
- [ ] Call can be ended smoothly
- [ ] Agent ID is correctly configured in `.env`
- [ ] Landing page displays correctly
- [ ] Call button redirects to `/appelle`
- [ ] Call interface shows Santa branding

---

## 🚀 Deployment Checklist

Before deploying to production:

1. **Agent Configuration**
   - [ ] System prompt is set correctly
   - [ ] Voice is selected and tested
   - [ ] First message is set
   - [ ] Knowledge base is configured

2. **Environment Variables**
   - [ ] `VITE_ELEVENLABS_AGENT_ID` is set in `.env`
   - [ ] `VITE_ELEVENLABS_API_KEY` is set in `.env`
   - [ ] Variables are not exposed in git

3. **Application**
   - [ ] Landing page displays correctly
   - [ ] Call button works
   - [ ] Santa UI loads properly
   - [ ] Icon displays correctly
   - [ ] Mobile responsive design works

4. **Testing**
   - [ ] Make a test call
   - [ ] Verify Santa responds appropriately
   - [ ] Check call duration tracking
   - [ ] Test on mobile device
   - [ ] Test on desktop

5. **Vercel Deployment**
   - [ ] Build succeeds
   - [ ] Environment variables are set in Vercel
   - [ ] Analytics is tracking
   - [ ] No console errors

---

## 🎁 Tips for Success

1. **Keep it Magical**: Always maintain the wonder and magic of Christmas
2. **Be Warm**: Use a warm, grandfatherly tone
3. **Listen Actively**: Show genuine interest in what callers say
4. **Be Encouraging**: Make everyone feel special and valued
5. **Stay Safe**: Never ask for personal information
6. **Have Fun**: Enjoy the experience of bringing Christmas magic!

---

## 📞 Troubleshooting

### Agent not responding
- Check Agent ID in `.env`
- Verify API Key is correct
- Restart dev server
- Test agent in ElevenLabs dashboard

### Voice sounds wrong
- Select a different voice in ElevenLabs
- Adjust speed and stability settings
- Test the voice before deploying

### Microphone not working
- Check browser permissions
- Allow microphone access
- Test microphone on another site first

### Call drops
- Check internet connection
- Verify agent is active in ElevenLabs
- Check browser console for errors

---

## 📚 Resources

- [ElevenLabs Docs](https://docs.elevenlabs.io/)
- [Conversational AI Guide](https://docs.elevenlabs.io/conversational-ai/overview)
- [Voice Selection Guide](https://elevenlabs.io/voices)
- [Agent Configuration](https://docs.elevenlabs.io/conversational-ai/agent-setup)

---

**Happy Holidays! 🎄 Your Santa Call Simulator is ready to spread Christmas magic!**
