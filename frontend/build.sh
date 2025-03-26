#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Installing vite globally..."
npm install -g vite

echo "Building project..."
npm run build 