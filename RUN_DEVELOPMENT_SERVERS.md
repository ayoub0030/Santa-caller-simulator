# Running Development Servers for Stripe Payment

## 🚀 Quick Start

Your app now needs **two servers** running for the payment system to work:

1. **API Server** (port 3001) - Handles Stripe payments
2. **Vite Dev Server** (port 8080) - Your React app

---

## 📋 Option 1: Run Both Servers Together (Recommended)

### One Command to Run Everything:

```bash
npm run dev:full
```

This will start:
- ✅ API Server on `http://localhost:3001`
- ✅ Vite Dev Server on `http://localhost:8080`

**That's it!** Both servers will run together.

---

## 📋 Option 2: Run Servers Separately

If you prefer to run them in separate terminals:

### Terminal 1 - API Server:
```bash
npm run dev:server
```

You should see:
```
Development API server running on http://localhost:3001
```

### Terminal 2 - Vite Dev Server:
```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:8080/
```

---

## ✅ Verify Both Servers Are Running

1. Open http://localhost:8080 in your browser
2. Click **"Buy Call Now"** button
3. Should redirect to Stripe checkout (no 404 error)
4. Use test card: `4242 4242 4242 4242`

---

## 🔧 How It Works

```
Your Browser (localhost:8080)
        ↓
Vite Dev Server (port 8080)
        ↓
Proxies /api requests to...
        ↓
API Server (port 3001)
        ↓
Stripe API
```

When you click "Buy Call Now":
1. Frontend sends request to `/api/create-checkout-session`
2. Vite proxies it to `http://localhost:3001/api/create-checkout-session`
3. API Server processes it with Stripe
4. Returns Stripe checkout URL
5. You're redirected to Stripe

---

## 🛑 Stop Servers

Press `Ctrl+C` in the terminal to stop the servers.

---

## 📝 Environment Variables

Make sure your `.env` file has:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
VITE_STRIPE_PRICE_ID=price_YOUR_ID
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
```

---

## 🐛 Troubleshooting

### "Cannot find module 'express'"
- Run: `npm install express cors dotenv --save-dev`

### "Port 3001 already in use"
- Kill the process using port 3001
- Or change port in `server.js` and `vite.config.ts`

### Still getting 404 error
- Make sure both servers are running
- Check that API server started successfully
- Check browser console for errors (F12)

### "STRIPE_SECRET_KEY not configured"
- Add `STRIPE_SECRET_KEY=sk_test_...` to `.env`
- Restart servers

---

## 🎉 You're Ready!

Run `npm run dev:full` and test the payment flow!
