# Conline

Conline is a video conferencing application similar to Zoom, with an additional AI-powered emotion detection system that analyzes participants' emotions in real-time during meetings.

## 🚀 Features

- Video meetings via **ZeGcloud**
- Real-time emotion detection with AI integration
- Secure authentication using **Firebase Auth**
- Emotion data stored in **Firebase Storage**


## 🧠 AI Emotion Detection

The emotion detection system uses a pre-trained machine learning model (`.h5`) served via **Flask**. Every 3 seconds, the user's camera frame is sent to the Flask server for prediction. The detected emotion is then sent back to the main application and displayed in real-time during the meeting.

## 🛠 Technologies Used

### Frontend:
- **React.js**
- **Elastic UI (EUI)**

### Backend:
- **Firebase Auth** - for user authentication
- **Firebase Storage** - for storing meeting data and emotion analysis
- **ZeGcloud** - for video meeting interface
- **Flask** - serving the AI model
- **TensorFlow / Keras** - for AI emotion detection model

## ⚙️ How to Run

### Simple One-Click Startup

- **For Windows users:**

  Just double-click on `start.bat`.

- **For Mac/Linux users:**

  ```bash
  chmod +x start.sh
  ./start.sh

### Manual Startup (run components separately)
1️⃣ Start Frontend:
bash
Copy
Edit
cd App/conline
yarn install
yarn start
2️⃣ Start AI Model Server:
bash
Copy
Edit
cd Model/Video
pip install -r requirements.txt
python app.py
