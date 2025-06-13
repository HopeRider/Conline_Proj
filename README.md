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
```bash
  cd App/conline
  yarn start
```

2️⃣ Start AI Model Server:
```bash
  cd Model/Video
  python app.py
```

# 📝 Text Emotion Detection Model

In addition to our main real-time video emotion detection, we have also developed a **Text Emotion Prediction Model**.

## 🚀 About

- This model is designed to predict the emotion expressed in a given text (by analyzing comments sent during meetings).
- Although it is not yet integrated into the main **Conline** application, we plan to add this feature in future versions to provide multi-modal emotion analysis (both video & text).
- The model was developed and tested using **Streamlit**, providing a simple and interactive interface for experimentation.

## ⚙️ How to Run

1️⃣ Navigate to the model directory:

```bash
cd Model/Text
run app.py
```

# ⚠️ Important Setup Instructions Before Running the Application

Before running the **Conline** application, you need to configure both **Firebase** and **ZeGocloud** credentials to make sure the app can properly connect to the backend services.

---

## 🔑 1️⃣ Firebase Configuration

You will need to modify the Firebase configuration object inside your frontend code.

### Path:

```bash
Conline_Proj\App\conline\src\utils\firebaseConfig.ts
```

## 🔑 2️⃣ ZeGocloud Configuration

You need to provide your appId and serverSecret.

### Path:

```bash
Conline_Proj\App\conline\src\pages\joinMeeting.ts
```

