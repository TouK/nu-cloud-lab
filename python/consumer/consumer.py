from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def receive_message():
    try:
        data = request.json  # Parse JSON payload

        if not data or "message" not in data:
            return jsonify({"error": "Invalid format. Expected {'message': 'your text'}"}), 400
        
        print(f"✅ Received message: {data['message']}")

        return jsonify({"status": "success", "received": data["message"]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6555)