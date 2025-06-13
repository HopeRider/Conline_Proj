@echo off
echo Starting Flask API...
start cmd /k "cd Model\\Video && python app.py"

timeout /t 2 > nul

echo Starting React App...
start cmd /k "cd App\\conline && yarn start"

