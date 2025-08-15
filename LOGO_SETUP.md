# Logo Setup Instructions

## Adding Your Logo to the App

### 1. App Icon (Home Screen)
- Replace `/assets/images/icon.png` with your logo
- Requirements: 1024x1024 pixels, PNG format
- This will show on device home screen

### 2. Local Logo Assets
Add your logo files to the assets folder:

```
/assets/images/
├── icon.png          (1024x1024 - App icon)
├── logo.png          (For login screen - 320x80 recommended)
├── logo-small.png    (For headers - 120x30 recommended)
└── logo-square.png   (Square version - 200x200 recommended)
```

### 3. Update Login Screen to Use Local Logo
Replace the remote URL with local asset in the auth screen.

### 4. Logo Component
Create a reusable logo component for consistency across the app.
