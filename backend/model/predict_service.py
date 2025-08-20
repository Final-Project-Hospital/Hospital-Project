import joblib
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

# โหลดโมเดลที่เทรนด้วย Random Forest
try:
    model = joblib.load("ph_predict_model_rf.pkl")
except FileNotFoundError:
    print("Error: ph_predict_model_rf.pkl not found. Please check file path.")
    exit()

@app.route("/predict", methods=["POST"])
def predict():
    """
    รับค่า month_number จาก Golang Backend และใช้ในการทำนาย
    Expected JSON input: {"month_number": 1234}
    """
    if not request.json or 'month_number' not in request.json:
        return jsonify({"error": "Invalid input format. Expected a 'month_number' field."}), 400

    month_number = request.get_json()['month_number']

    try:
        input_data = np.array([[month_number]])
        
        # ใช้โมเดลทำนายผลลัพธ์
        prediction = model.predict(input_data)[0]
        
        # ส่งค่าทำนายกลับเป็น JSON
        return jsonify({"prediction": prediction})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)