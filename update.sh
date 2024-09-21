#!/bin/bash

# Step 1: Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed, but is required to run this script."
    echo "Please download it from: https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Step 2: Check if node_modules directory exists
if [ ! -d "node_modules" ]; then
    echo "Loading dependencies..."
    npm install
fi

# Step 3: Run npm run update
echo "Running the repository update..."
npm run update

exit 0
