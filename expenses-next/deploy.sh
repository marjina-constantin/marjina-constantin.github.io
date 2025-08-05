#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create .nojekyll file for GitHub Pages
echo "Creating .nojekyll file..."
touch out/.nojekyll

# Copy the built files to the parent directory for GitHub Pages
echo "Copying files to parent directory..."
cp -r out/* ../

echo "Deployment ready! Files copied to parent directory."
echo "You can now commit and push to deploy to GitHub Pages." 