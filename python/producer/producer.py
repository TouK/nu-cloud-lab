import requests
import json
import time
import random

# API details
URL = "https://mpk-8-gateway.staging-cloud.nussknacker.io/topics/http.example-input"
USERNAME = "publisher"
PASSWORD = "QTbp6MQL1bvn9unVrg0XzsXEfff"

# Example names to choose from
NAMES = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah"]

def take_random_name():
    return {
        "name": random.choice(NAMES)
    }

def send_data():
    data = take_random_name()
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            URL, 
            auth=(USERNAME, PASSWORD), 
            headers=headers, 
            data=json.dumps(data)
        )

        if response.ok:
            print(f"Successfully sent: {data}")
        else:
            print(f"Failed to send: {data}, Response: {response.status_code}, {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    while True:
        send_data()
        time.sleep(1) 