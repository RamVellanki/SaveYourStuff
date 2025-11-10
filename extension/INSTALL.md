# SaveYourStuff Extension - Manual Installation Guide

## 📋 Requirements
- Google Chrome (or Chromium-based browser like Edge, Brave, etc.)
- SaveYourStuff backend running (see backend setup instructions)

## 🚀 Installation Steps

### Method 1: Using Pre-built Package

1. **Download the extension package**
   - Download `SaveYourStuff-extension.zip` 
   - Extract the zip file to a folder on your computer

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the extracted `dist` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "SaveYourStuff" and click the pin icon to keep it visible

### Method 2: Building from Source

1. **Clone the repository**
   ```bash
   git clone git@github.com:RamVellanki/SaveYourStuff.git
   cd SaveYourStuff/extension
   ```

2. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

3. **Load the extension**
   - Follow steps 2-5 from Method 1
   - Select the `dist` folder that was created

## 🔧 Configuration

### Backend Setup
The extension needs to connect to your SaveYourStuff backend:

1. **Update API URL** (if using custom backend)
   - Edit `extension/src/config.ts`
   - Change `API_URL` to your backend URL
   - Rebuild: `npm run build`

2. **Default Configuration**
   - API URL: `http://localhost:3000/api`
   - User ID: `test-user-123`

## ✅ Verify Installation

1. **Check Extension Icon**
   - You should see the SaveYourStuff icon in your Chrome toolbar

2. **Test the Extension**
   - Click the extension icon on any webpage
   - Fill out the form and click "Save Your Stuff"
   - Check your web app to see if the item was saved

## 🔄 Updates

To update the extension:
1. Download the new version
2. Extract to the same folder (overwrite existing files)
3. Go to `chrome://extensions/`
4. Click the refresh icon on the SaveYourStuff extension

## 🐛 Troubleshooting

**Extension won't load:**
- Make sure you selected the `dist` folder, not the zip file
- Check that Developer mode is enabled
- Try reloading the extension page

**Can't save items:**
- Verify your backend is running
- Check browser console for errors (F12 → Console)
- Ensure the API URL is correct in config

**Extension disappeared:**
- Check `chrome://extensions/` - it may have been disabled
- Re-enable if needed

## 🔒 Permissions

The extension requests these permissions:
- **activeTab**: To read the current page title and URL
- **storage**: To store extension settings (if implemented)
- **Host permissions**: To communicate with your backend API

## 📞 Support

For issues or questions:
- Check the browser console for error messages
- Verify backend is running and accessible
- Ensure you're using a supported browser version