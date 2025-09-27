# Firebase Setup Instructions for Mobile zkETHer

## 🔥 Firebase Phone Authentication Setup

Your mobile zkETHer app now has **Firebase Phone Authentication** integrated! Here's how to set it up for **FREE** (perfect for hackathons):

## 📱 What's Already Done

✅ **Firebase packages installed** (`@react-native-firebase/app`, `@react-native-firebase/auth`)  
✅ **OTP verification screen** with real Firebase integration  
✅ **Configuration files** created (demo values)  
✅ **Firebase service** class for easy OTP handling  

## 🚀 Quick Setup (5 minutes)

### 1. Create Firebase Project (FREE)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it `mobile-zkether-demo` (or anything you like)
4. **Skip Google Analytics** (not needed for phone auth)

### 2. Enable Phone Authentication
1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Phone** → **Enable** → **Save**
3. No credit card required! 🎉

### 3. Add Your Apps
**For Android:**
1. Click **Add app** → **Android**
2. Package name: `com.mobilezketherapp`
3. Download `google-services.json`
4. Replace `/android/app/google-services.json` with your downloaded file

**For iOS:**
1. Click **Add app** → **iOS**
2. Bundle ID: `com.mobilezketherapp`
3. Download `GoogleService-Info.plist`
4. Replace `/ios/GoogleService-Info.plist` with your downloaded file

### 4. Update App Configuration
Update `app.json` with your package name:
```json
{
  "expo": {
    "android": {
      "package": "com.mobilezketherapp"
    },
    "ios": {
      "bundleIdentifier": "com.mobilezketherapp"
    }
  }
}
```

## 🎯 How It Works

1. **User enters phone number** → Firebase sends real SMS
2. **User enters OTP** → Firebase verifies automatically
3. **Success** → User proceeds to document upload

## 💰 Pricing (FREE for Hackathons!)

- **10,000 SMS/month FREE** 
- **No credit card required**
- **Perfect for demos and hackathons**

## 🔧 Testing

For testing, you can add test phone numbers in Firebase Console:
1. **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. Add: `+91 9876543210` with OTP: `123456`

## 🚨 Important Notes

- The current config files have **demo values**
- Replace them with your actual Firebase project config
- Phone auth works on **real devices only** (not simulators)
- For production, you'll need to verify your domain

## 🎉 Ready to Test!

Your OTP flow is now fully functional with Firebase! Just replace the config files with your real Firebase project settings and you're good to go.

**Need help?** The Firebase documentation is excellent: https://rnfirebase.io/auth/phone-auth
