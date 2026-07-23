# EcoCash Investment Mobile (Native)

A standalone React Native mobile app for the EcoCash Investment platform.

## Features
- Native login/register screens
- Dashboard with balance overview
- Investment plans selection
- Deposit with EcoCash payment
- Withdrawal to TRC20 wallet
- KYC verification
- Profile management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL in `.env`:
```
EXPO_PUBLIC_API_URL=https://my-project-server-xo9x.onrender.com/api
```

3. Start development server:
```bash
npm run start
```

4. Run on device:
```bash
npm run android
# or
npm run ios
```

## Build for Production

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Build Android:
```bash
eas build --platform android
```

4. Build iOS:
```bash
eas build --platform ios
```

## API Endpoints
The app communicates directly with the backend API:
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- GET `/auth/profile` - Get user profile
- PUT `/auth/profile` - Update profile
- POST `/auth/kyc` - Submit KYC documents
- GET `/investments` - Get user investments
- GET `/investments/plans` - Get available plans
- POST `/investments` - Create investment
- POST `/deposits/submit` - Submit deposit
- POST `/withdrawals` - Request withdrawal