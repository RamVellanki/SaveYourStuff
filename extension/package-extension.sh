#!/bin/bash

# SaveYourStuff Extension Packaging Script

echo "🔨 Building SaveYourStuff Extension..."

# Build the extension
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Create package directory
    mkdir -p packages
    
    # Create zip package
    cd dist
    zip -r ../packages/SaveYourStuff-extension-v$(node -p "require('../package.json').version").zip .
    cd ..
    
    echo "📦 Extension packaged successfully!"
    echo "📁 Package location: packages/SaveYourStuff-extension-v$(node -p "require('./package.json').version").zip"
    echo ""
    echo "🚀 Distribution options:"
    echo "1. Share the zip file for users to extract and load unpacked"
    echo "2. Share the dist/ folder directly"
    echo "3. Upload to GitHub releases"
    echo ""
    echo "📖 Installation instructions: See INSTALL.md"
else
    echo "❌ Build failed!"
    exit 1
fi