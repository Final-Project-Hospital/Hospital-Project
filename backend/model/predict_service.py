import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from sklearn.preprocessing import MinMaxScaler
import pandas as pd

app = Flask(__name__)

# ===== Load LSTM Model =====
try:
    model = tf.keras.models.load_model("wastewater_lstm_model.h5", compile=False)
except OSError as e:
    print(f"Error: {e} - wastewater_lstm_model.h5 not found.")
    exit()

# ===== Load Data + Scaler =====
try:
    df = pd.read_csv('wastewater.csv', sep=',')
    df.columns = df.columns.str.strip()


    # แปลงคอลัมน์เป็น numeric
    df['น้ำเข้า ก่อนการบำบัด'] = pd.to_numeric(df['น้ำเข้า ก่อนการบำบัด'], errors='coerce')
    

    # fit MinMaxScaler
    scaler = MinMaxScaler()
    scaler.fit(df[['น้ำเข้า ก่อนการบำบัด']].values)

except Exception as e:
    print(f"Error loading data or fitting scaler: {e}")
    exit()

SEQ_LENGTH = 12

@app.route("/predict", methods=["POST"])
def predict():
    try:
        recent_values = df['น้ำเข้า ก่อนการบำบัด'].tail(SEQ_LENGTH).values
        
        if len(recent_values) < SEQ_LENGTH:
            return jsonify({"error": "Not enough data (need at least 12 months) to make a prediction."}), 400

        recent_values = recent_values.reshape(-1, 1)
        recent_scaled = scaler.transform(recent_values)
        input_data = recent_scaled.reshape(1, SEQ_LENGTH, 1)

        prediction_scaled = model.predict(input_data)
        prediction = scaler.inverse_transform(prediction_scaled)[0][0]

        return jsonify({"prediction": float(prediction)})

    except Exception as e:
        return jsonify({"error": f"An error occurred during prediction: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)