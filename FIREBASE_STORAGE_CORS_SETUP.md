# Firebase Storage CORS Configuration

## Problem
When uploading files to Firebase Storage from a web browser, you may encounter CORS errors like:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Solution

### Option 1: Configure CORS using gsutil (Recommended)

1. Install Google Cloud SDK if you haven't already:
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `npm install -g firebase-tools`

2. Create a CORS configuration file named `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization"]
  }
]
```

3. Apply the CORS configuration:
```bash
gsutil cors set cors.json gs://ite183-project.firebasestorage.app
```

### Option 2: Configure via Firebase Console

1. Go to Firebase Console → Storage
2. Click on the "Rules" tab
3. Update your storage rules to allow uploads:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. For CORS, you'll still need to use gsutil (Option 1) as the Firebase Console doesn't provide CORS configuration UI.

### Option 3: Temporary Workaround (Already Implemented)

The code now includes a fallback mechanism:
- If Firebase Storage upload fails, files smaller than ~900KB will be stored as base64 in Firestore
- This allows regeneration to work even without Storage CORS configuration
- Note: Larger files will not support regeneration until CORS is configured

## Verify CORS Configuration

After configuring CORS, you can verify it works by checking the response headers:
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://firebasestorage.googleapis.com/v0/b/ite183-project.firebasestorage.app/o
```

You should see `Access-Control-Allow-Origin` in the response headers.



