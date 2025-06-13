from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
from keras.models import load_model

app = Flask(__name__)
CORS(app)

# Load model and face detector
model = load_model('model_file_30epochs.h5')
faceDetect = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

labels_dict = {
    0: 'Angry',
    1: 'Disgust',
    2: 'Fear',
    3: 'Happy',
    4: 'Neutral',
    5: 'Sad',
    6: 'Surprise'
}

def decode_base64_image(base64_string):
    """
    Convert base64 string to OpenCV BGR image
    """
    base64_string = base64_string.split(",")[-1]  # Remove header
    img_data = base64.b64decode(base64_string)
    img = Image.open(BytesIO(img_data)).convert("RGB")
    open_cv_image = np.array(img)
    return cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2BGR)

@app.route("/predict", methods=["POST"])
def predict_emotion():
    data = request.get_json()
    if "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    try:
        frame = decode_base64_image(data["image"])
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = faceDetect.detectMultiScale(gray, 1.3, 3)

        if len(faces) == 0:
            return jsonify({"emotion": "No face detected"})

        for x, y, w, h in faces:
            sub_face_img = gray[y:y+h, x:x+w]
            resized = cv2.resize(sub_face_img, (48, 48))
            normalized = resized / 255.0
            reshaped = np.reshape(normalized, (1, 48, 48, 1))
            result = model.predict(reshaped)
            label = np.argmax(result, axis=1)[0]
            emotion = labels_dict[label]
            return jsonify({"emotion": emotion})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
