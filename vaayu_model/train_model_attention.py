# train_model_attention.py

import torch
import torch.nn as nn
import torch.nn.functional as F
import requests
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import joblib

# --- Configuration ---
LATITUDE = 19.0760
LONGITUDE = 72.8777
START_DATE = "2021-01-01"  # Expanded to 3+ years of data
END_DATE = "2023-12-31"

# --- Model Hyperparameters ---
SEQUENCE_LENGTH = 48  # Use 48 hours to give the Attention layer more context
HIDDEN_SIZE = 128
NUM_LAYERS = 3
EPOCHS = 50
LEARNING_RATE = 0.001

# --- Data Fetching (Unchanged) ---
def fetch_historical_data(latitude, longitude, start_date, end_date):
    # ... (This function is the same as in the previous script)
    api_url = "https://archive-api.open-meteo.com/v1/archive"
    params = { "latitude": latitude, "longitude": longitude, "start_date": start_date, "end_date": end_date, "hourly": ["temperature_2m", "relativehumidity_2m", "dewpoint_2m", "apparent_temperature", "pressure_msl", "surface_pressure", "precipitation", "windspeed_10m", "winddirection_10m", "cloudcover", "shortwave_radiation", "direct_radiation", "geopotential_height_1000hPa", "geopotential_height_850hPa", "geopotential_height_500hPa", "temperature_850hPa", "windspeed_850hPa", "relativehumidity_850hPa", "sea_surface_temperature"] }
    print("Fetching comprehensive historical data from ERA5 dataset...")
    response = requests.get(api_url, params=params)
    if response.status_code == 200:
        data = response.json(); df = pd.DataFrame(data['hourly']); df['time'] = pd.to_datetime(df['time']); df.set_index('time', inplace=True)
        df.fillna(method='ffill', inplace=True); df.fillna(method='bfill', inplace=True)
        print("Data fetched and cleaned successfully.")
        return df
    else: raise Exception(f"Error fetching data: {response.status_code}")


# --- Data Preparation (Unchanged) ---
def create_sequences(data, sequence_length):
    xs, ys = [], []
    for i in range(len(data) - sequence_length):
        x = data[i:(i + sequence_length)]; y = data[i + sequence_length]
        xs.append(x); ys.append(y)
    return np.array(xs), np.array(ys)

# --------------------------------------------------------------------------
# 3. UPGRADED MODEL ARCHITECTURE with ATTENTION
# --------------------------------------------------------------------------
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
        self.attention = Attention(hidden_size * 2) # *2 for bidirectional
        self.linear = nn.Linear(hidden_size * 2, output_size)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        attention_weights = self.attention(lstm_out)
        context_vector = torch.bmm(attention_weights.unsqueeze(1), lstm_out).squeeze(1)
        out = self.linear(context_vector)
        return out

# --------------------------------------------------------------------------
# 4. MAIN TRAINING WORKFLOW
# --------------------------------------------------------------------------
if __name__ == "__main__":
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    historical_df = fetch_historical_data(LATITUDE, LONGITUDE, START_DATE, END_DATE)
    
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(historical_df)

    X, y = create_sequences(scaled_data, SEQUENCE_LENGTH)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    X_train = torch.from_numpy(X_train).float().to(device)
    y_train = torch.from_numpy(y_train).float().to(device)
    X_test = torch.from_numpy(X_test).float().to(device)
    y_test = torch.from_numpy(y_test).float().to(device)

    num_features = historical_df.shape[1]
    model = LSTMAttentionForecaster(
        input_size=num_features, hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS, output_size=num_features
    ).to(device)
    
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    # Add a learning rate scheduler to reduce LR over time
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)

    print("Starting ATTENTION model training...")
    for epoch in range(EPOCHS):
        model.train()
        outputs = model(X_train)
        loss = criterion(outputs, y_train)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        scheduler.step() # Update learning rate
        
        if (epoch + 1) % 5 == 0:
            model.eval()
            with torch.no_grad():
                test_outputs = model(X_test)
                test_loss = criterion(test_outputs, y_test)
            print(f'Epoch [{epoch+1}/{EPOCHS}], Train Loss: {loss.item():.6f}, Test Loss: {test_loss.item():.6f}, LR: {scheduler.get_last_lr()[0]:.6f}')

    print("Training complete.")

    # Save the new model and the same scaler
    torch.save(model.state_dict(), "vaayu_model_attention.pth")
    joblib.dump(scaler, "scaler.pkl")
    print("Attention model and scaler saved successfully.")