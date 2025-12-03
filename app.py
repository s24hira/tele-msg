from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import requests
import json

app = Flask(__name__)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/send', methods=['POST'])
def send_messages():
    try:
        data = request.json
        bot_token = data.get('bot_token')
        user_ids_str = data.get('user_ids')
        message = data.get('message')

        if not bot_token or not user_ids_str or not message:
            return jsonify({'error': 'Missing required fields'}), 400

        try:
            user_ids = json.loads(user_ids_str)
            if not isinstance(user_ids, list):
                 return jsonify({'error': 'User IDs must be a JSON list'}), 400
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON format for User IDs'}), 400

        def generate():
            for user_id in user_ids:
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                payload = {
                    'chat_id': user_id,
                    'text': message
                }
                result = {}
                try:
                    response = requests.post(url, json=payload)
                    response_data = response.json()
                    if response.ok:
                        result = {'user_id': user_id, 'status': 'success'}
                    else:
                        result = {'user_id': user_id, 'status': 'failed', 'error': response_data.get('description')}
                except Exception as e:
                    result = {'user_id': user_id, 'status': 'error', 'error': str(e)}
                
                yield json.dumps(result) + '\n'

        return Response(stream_with_context(generate()), mimetype='application/json')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
