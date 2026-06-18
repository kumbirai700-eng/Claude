# Firebase setup — get trial customers on

The app now ships with **Firebase wired in** (Auth + Firestore). It runs on
`localStorage` until you paste a config, then it switches to **real accounts**
automatically — no code changes needed.

## 1. Create the project (~5 min)
1. Go to [console.firebase.google.com](https://console.firebase.google.com) →
   **Add project** → name it `creative-collective`.
2. **Build → Authentication → Get started → Sign-in method → Email/Password →
   Enable.**
3. **Build → Firestore Database → Create database** → start in **production
   mode** → pick the `australia-southeast1` (Sydney) region.

## 2. Paste your config
Firebase console → **Project settings (gear) → Your apps → Web app `</>`** →
register the app → copy the `firebaseConfig` object. In **`web/index.html`**
replace the placeholder:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza…",
  authDomain: "creative-collective.firebaseapp.com",
  projectId: "creative-collective",
  appId: "1:…:web:…"
};
```
That's it — the app detects the key and turns on real sign-up / log-in. The
account chip, profile editor and connections start writing to your project.

## 3. Firestore security rules
Firestore → **Rules** → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /profiles/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == id;
    }
    match /connections/{id} {
      allow read: if true;
      allow create, delete: if request.auth != null;
    }
    match /{coll}/{id} {                // spaces, gear, jobs, posts
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 4. Deploy & invite testers
```bash
npm i -g firebase-tools
firebase login
firebase init hosting     # public dir: web
firebase deploy
```
You'll get a live `https://creative-collective.web.app` URL. Send it to your
trial customers — they hit **Join free**, create a real account, build a
profile, and connect. (Or host `web/` on Netlify/Vercel; Firebase still
handles auth + data.)

## What's wired already
- **Auth** — sign up / log in use `firebase.auth()` when configured.
- **Profile edits** — the account editor writes to `profiles/{uid}` via
  `set(..., {merge:true})`.
- **Fallback** — empty config = the localStorage demo, so nothing breaks.

## Still to wire (say the word and I'll do it)
- Read creators/spaces/jobs from Firestore instead of the seed arrays.
- Persist connections to the `connections` collection.
- Image uploads to Firebase Storage (replaces the placeholder photos).
