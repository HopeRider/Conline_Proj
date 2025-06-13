#!/bin/bash

# Start Flask backend in background
echo "Starting Flask API..."
cd Model/Video
python app.py &

# Wait a bit before starting frontend
sleep 2

# Start React frontend
echo "Starting React App..."
cd ../../App/conline
yarn start
