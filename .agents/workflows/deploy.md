---
description: How to deploy the Lumina Inventory application to production
---

Follow these steps to deploy your application to a production environment (like Vercel or Netlify).

### 1. Firebase Production Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (or use your existing one).
3. **Authentication**: Enable `Email/Password` and `Google` sign-in providers in the **Authentication > Sign-in method** tab.
4. **Firestore Database**: 
   - Initialize Firestore in **Production Mode**.
   - Choose a location closest to your users.
5. **Security Rules**: Deploy the following rules in the **Rules** tab:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 2. Environment Configuration
1. Create a `.env.production` file in the project root.
2. Add your Firebase credentials (found in Project Settings > General):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_ID
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. Build and Deploy
#### Option A: Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Add the environment variables from your `.env.production` file into Vercel's **Environment Variables** setting.
4. Deploy.

#### Option B: Manual Build
1. Run the build command:
   ```bash
   npm run build
   ```
2. The production-ready files will be in the `/dist` folder. You can upload these to any static hosting provider.

### 4. Final Verification
1. Access your live URL.
2. Log in with `demo@lumina.com` / `password123`.
3. Verify that the Dashboard loads data and that you can access the User Management section.
