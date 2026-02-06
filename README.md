# Sticky.io Full-Stack Test

Complete test environment with React frontend and Node.js backend matching production setup.

## Features

✅ **Frontend (React + Vite)**
- Payment form matching `StickyPaymentStep.tsx`
- Sticky SDK V2 integration
- Real-time card validation
- Customer data form

✅ **Backend (Node.js + Express)**
- `/api/sticky/config` - Get app key
- `/api/sticky/new-order` - Create order with token
- Matches production API structure

✅ **Configuration**
- App key: `sunsetcommercelimited`
- API credentials from production `.env`

## Setup

```bash
# Install dependencies
npm install

# Run both frontend and backend
npm run dev

# Or run separately:
npm run server  # Backend on :3000
npm run client  # Frontend on :5173
```

## Deploy to Railway

1. Push to GitHub
2. Connect to Railway
3. Railway will auto-detect and deploy
4. Set environment variables in Railway dashboard

## Test Card

- **Card**: 4111 1111 1111 1111
- **Expiry**: 12/25
- **CVV**: 123

## What This Tests

1. ✅ SDK loading (without `?appkey=` parameter)
2. ✅ SDK initialization with app key
3. ✅ Card tokenization
4. ✅ Backend order creation
5. ✅ Full payment flow end-to-end

## Expected Results

- SDK should load successfully
- Card fields should render
- Token should be generated
- Order should be created via backend API
- Full response should be displayed
