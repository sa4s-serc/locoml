import time

from flask import Blueprint, jsonify
import requests
from .utils import uploadFileHandler
import os

OCR_API_Handler = Blueprint('OCR_API_Handler', __name__)


# ============
def IIIT_OCR(inp_url: str, source_lang: str, dest_lang: str, model_info: dict):
    model_endpoint = model_info['API']
    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    response = requests.post(json={'URL': inp_url}, url=input_router_downloader_endpoint).json()
    file_path = response.get('file_path')
    file_name = response.get('file_name')

    OCR_file = {'file': open(file_path, 'rb')}
    model_execution_time_start = time.time_ns()
    response = requests.post(model_endpoint, files=OCR_file)
    model_execution_time = time.time_ns() - model_execution_time_start
    result = response.json()
    print("Raw JSON response:", result)

    decoded_text = result.get('decoded_text', 'Could not find the "decoded_text" key!')
    print("Decoded Text:", decoded_text)
    return jsonify(
        {'URL': uploadFileHandler(decoded_text, file_name, False)['URL'], 'model_execution_time': model_execution_time})


# ===========

OCR_handlers = [IIIT_OCR]
