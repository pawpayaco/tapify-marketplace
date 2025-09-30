#!/bin/bash

# Test production build locally
echo "🏗️  Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "🚀 Starting production server..."
  echo "Visit http://localhost:3000 to test"
  echo "Press Ctrl+C to stop"
  npm start
else
  echo "❌ Build failed! Fix errors before deploying."
  exit 1
fi

