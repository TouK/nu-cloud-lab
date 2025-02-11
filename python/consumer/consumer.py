from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def receive_message():
    try:
        data = request.json  
        
        print(f"✅ Received message: {data}")

        return jsonify({"status": "success", "received": data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6555)