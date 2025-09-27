# main.py (Final Version with Error Fixes)

import torch
import torch.nn as nn
import torch.nn.functional as F
import requests
import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timedelta

# --------------------------------------------------------------------------
# 1. CONFIGURATION & MODEL LOADING
# --------------------------------------------------------------------------

# --- Configuration ---
MODEL_PATH = "vaayu_model_attention.pth"
SCALER_PATH = "scaler.pkl"
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
SEQUENCE_LENGTH = 48

# --- Define Advanced Model Architecture (must match training script) ---
class Attention(nn.Module):
    def __init__(self, hidden_size):
        super(Attention, self).__init__()
        self.attn = nn.Linear(hidden_size, hidden_size)
        self.v = nn.Parameter(torch.rand(hidden_size))

    def forward(self, hidden_states):
        energy = torch.tanh(self.attn(hidden_states))
        energy = energy.transpose(1, 2)
        v = self.v.repeat(hidden_states.size(0), 1).unsqueeze(1)
        attention_scores = torch.bmm(v, energy).squeeze(1)
        return F.softmax(attention_scores, dim=1)

class LSTMAttentionForecaster(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, output_size):
        super(LSTMAttentionForecaster, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2, bidirectional=True)
        self.attention = Attention(hidden_size * 2)
        self.linear = nn.Linear(hidden_size * 2, output_size)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        attention_weights = self.attention(lstm_out)
        context_vector = torch.bmm(attention_weights.unsqueeze(1), lstm_out).squeeze(1)
        out = self.linear(context_vector)
        return out

# --- Load the Pre-trained Model and Scaler ---
print("Loading pre-trained ATTENTION model and scaler...")

# --- FIX: Updated FEATURES list to match the 12 features used in actual training ---
FEATURES = [
    "temperature_2m", "relativehumidity_2m", "dewpoint_2m", "apparent_temperature",
    "pressure_msl", "surface_pressure", "precipitation", "windspeed_10m",
    "winddirection_10m", "cloudcover", "shortwave_radiation", "direct_radiation"
]
NUM_FEATURES = len(FEATURES)

model = LSTMAttentionForecaster(
    input_size=NUM_FEATURES,
    hidden_size=128,
    num_layers=3,
    output_size=NUM_FEATURES
).to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()

scaler = joblib.load(SCALER_PATH)
print("Model and scaler loaded successfully.")

# --- RL Agent Placeholder ---
class DQNAgent:
    def get_action(self, state: list) -> str: return "STANDARD_ALERT"
    def learn(self, reward: float): pass
rl_agent = DQNAgent()

# --------------------------------------------------------------------------
# 2. HELPER FUNCTIONS FOR LIVE PREDICTION
# --------------------------------------------------------------------------

def fetch_live_sequence_data(latitude: float, longitude: float):
    """Fetches the last 48 hours of the 12 required features."""
    api_url = "https://archive-api.open-meteo.com/v1/archive"
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=3)
    
    params = {"latitude": latitude, "longitude": longitude, "start_date": start_date.strftime('%Y-%m-%d'), "end_date": end_date.strftime('%Y-%m-%d'), "hourly": FEATURES}
    
    response = requests.get(api_url, params=params)
    if response.status_code == 200:
        data = response.json()
        df = pd.DataFrame(data['hourly'])
        df['time'] = pd.to_datetime(df['time'])
        df.set_index('time', inplace=True)
        df.fillna(method='ffill', inplace=True).fillna(method='bfill', inplace=True)
        return df.iloc[-SEQUENCE_LENGTH:]
    return None

# --------------------------------------------------------------------------
# 3. API DEFINITION
# --------------------------------------------------------------------------

app = FastAPI(title="Vaayu Intelligence Engine", version="3.1 Corrected")

class PredictionInput(BaseModel):
    latitude: float
    longitude: float

# --- API Endpoints ---


@app.get("/")
def read_root():
    return {"message": "Welcome to the Vaayu AI Weather Intelligence Engine!"}


@app.post("/predict")
async def predict(data: PredictionInput):
    sequence_df = fetch_live_sequence_data(data.latitude, data.longitude)
    if sequence_df is None or len(sequence_df) < SEQUENCE_LENGTH:
        return {"status": "error", "message": f"Could not fetch sufficient historical data ({SEQUENCE_LENGTH} hours required)."}

    scaled_sequence = scaler.transform(sequence_df)
    sequence_tensor = torch.from_numpy(scaled_sequence).float().unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        prediction_scaled = model(sequence_tensor)

    prediction = scaler.inverse_transform(prediction_scaled.cpu().numpy())
    prediction_dict = {feature: round(value, 4) for feature, value in zip(FEATURES, prediction[0])}
    
    return {"status": "success", "predicted_next_hour": prediction_dict}

@app.post("/get-alert-action")
async def get_alert_action(data: dict):
    prediction = data.get("predicted_next_hour", {})
    state = [prediction.get('precipitation', 0), 0, 0, 0, 0]
    action = rl_agent.get_action(state)
    return {"action": action, "message": "..."}

@app.post("/update-policy")
async def update_policy(data: dict):
    rl_agent.learn(reward=data.get("feedback_reward", 0))
    return {"status": "policy update initiated"}