import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

export default function EmotionDetector() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [emotion, setEmotion] = useState<string>("");

  useEffect(() => {
    // Access webcam
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start periodic image capture
      const interval = setInterval(captureAndSend, 5000); // every 5s
      return () => clearInterval(interval);
    });
  }, []);

  const captureAndSend = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = 224; // resize to reduce size
    canvas.height = 224;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const formData = new FormData();
        formData.append("file", blob, "frame.png");

        try {
          const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setEmotion(response.data.emotion);
        } catch (error) {
          console.error("Prediction failed", error);
        }
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl mb-4">Live Emotion Detection</h2>
      {emotion && (
        <p className="mt-4 text-lg font-semibold">Detected Emotion: {emotion}</p>
      )}
      <video ref={videoRef} autoPlay muted className="rounded-xl shadow-md" />
      
    </div>
  );
}
