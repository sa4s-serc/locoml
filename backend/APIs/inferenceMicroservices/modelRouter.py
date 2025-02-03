from flask import Flask, Blueprint, request
import sys
import os
from flask_cors import CORS
from dotenv import load_dotenv
from ModelAPIs.ASR_API_Handler import ASR_API_Handler, ASR_handlers
from ModelAPIs.MT_API_Handler import MT_API_Handler, MT_handlers
from ModelAPIs.TTS_API_Handler import TTS_API_Handler, TTS_handlers
from ModelAPIs.OCR_API_Handler import OCR_API_Handler, OCR_handlers

load_dotenv(dotenv_path="../../.env")
env_path = os.getenv("PROJECT_PATH")
sys.path.append(env_path)
from mongo_db import db

app = Flask(__name__)
CORS(app)

trainModelAPIs = Blueprint('trainModel', __name__)
app.register_blueprint(ASR_API_Handler)
app.register_blueprint(MT_API_Handler)
app.register_blueprint(TTS_API_Handler)
app.register_blueprint(OCR_API_Handler)


@app.route('/health', methods=["GET"])
def health():
    return "OK"


@app.route('/inference/batchAPI', methods=['POST'])
def inference_batchAPI():
    inp = request.json['input']
    model_id = request.json['model_id']
    source_lang = request.json['source_lang']
    dest_lang = request.json['destination_lang']

    collection = db['Model_Zoo']
    model_info = collection.find_one({'model_id': model_id})
    objective = model_info['objective']
    index = model_info['index']

    response = None
    if objective == "ASR":
        if len(ASR_handlers) <= index:
            return {"error": "could not find the requested ASR model API."}, 404
        response = ASR_handlers[index](inp, source_lang, dest_lang, model_info)
    elif objective == "MT":
        if len(MT_handlers) <= index:
            return {"error": "could not find the requested MT model API."}, 404
        response = MT_handlers[index](inp, source_lang, dest_lang, model_info)
    elif objective == "TTS":
        if len(TTS_handlers) <= index:
            return {"error": "could not find the requested TTS model API."}, 404
        response = TTS_handlers[index](inp, source_lang, dest_lang, model_info)
    elif objective == "OCR":
        if len(OCR_handlers) <= index:
            return {"error": "could not find the requested OCR model API."}, 404
        response = OCR_handlers[index](inp, source_lang, dest_lang, model_info)

    return response, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)
