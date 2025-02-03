"""Each handler function here is supposed to return a URL to the file that it outputs. So, simply upload the file to
S3 or some other file repository. Each of the functions should store the file returned from the model on the disk,
and pass it to a function in uploadFiles.py, then, finally return the URL to the uploaded file.

Remember to define an entry in the MongoDB database, in Model_Zoo following the same format as the other entries!"""
import time

from flask import Blueprint, jsonify
import os
import requests
import json
import base64
from .utils import uploadFileHandler_TTS

TTS_API_Handler = Blueprint('TTS_API_Handler', __name__)


# ================================================================================================

def bhashini_TTS(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
    endpoint = model_info['API']
    serviceId = model_info['serviceId']

    # ISO-639 language codes, add more as and when needed
    translation_matrix = {'marathi': 'mr', 'assamese': 'as', 'bengali': 'bn', 'kannada': 'kn', 'kashmiri': 'ks',
                          'maithili': 'mai', 'bodo': 'brx', 'dogri': 'doi', 'english': 'en', 'goan konkani': 'gom',
                          'gujarati': 'gu', 'hindi': 'hi', 'malayalam': 'ml', 'manipuri': 'mni', 'nepali': 'ne',
                          'oriya': 'or', 'punjabi': 'pa', 'sanskrit': 'sa', 'santali': 'sat', 'sindhi': 'sd',
                          'tamil': 'ta', 'telugu': 'te', 'urdu': 'ur'}
    if source_lang.lower() not in translation_matrix or dest_lang.lower() not in translation_matrix:
        return jsonify({"URL": "Invalid source & destination combination chosen for this model!"})

    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    auth_token = os.getenv('BHASHINI_TOKEN')
    headers = {'Authorization': auth_token, 'accept': "*/*", 'Content-Type': 'application/json',
               'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}
    response = requests.post(json={'URL': inp_URL}, url=input_router_downloader_endpoint).json()
    file_name = response.get('file_name')
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    input_text = open(file_path, 'r').read()

    raw_body = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {
                        "sourceLanguage": translation_matrix[source_lang.lower()],
                    },
                    "serviceId": serviceId,
                    "gender": "female",
                    "samplingRate": 8000
                }
            }
        ],
        "inputData": {
            "input": [
                {
                    "source": input_text
                }
            ]
        }
    }

    TTS_textBody = json.dumps(raw_body)

    try:
        model_execution_time_start = time.time_ns()
        TTS_response = requests.post(endpoint, headers=headers, data=TTS_textBody, verify=False)  # TODO: FIX SSL CERTIFICATES
        model_execution_time = time.time_ns() - model_execution_time_start
        TTS_response_json = TTS_response.json()
        audio_content_base64 = TTS_response_json['pipelineResponse'][0]['audio'][0]['audioContent']
        base64.b64decode(audio_content_base64)

        print(model_execution_time)

        try:
            return jsonify(
                {'URL': uploadFileHandler_TTS(audio_content_base64, file_name, True)['URL'],
                 'model_execution_time': model_execution_time})
        except ValueError as ve:
            print(ve, TTS_response.status_code)
            return jsonify(
                {"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})

    except (KeyError, IndexError) as e:
        print(f"Failed to parse TTS response: {e}")
        return jsonify({"URL": "Failed to process TTS response!", 'model_execution_time': 0})


# ================================================================================================

# List of all the handler functions. Indexing matters, store them in same order as their
# {index: <index>} as defined in the MongoDB Model_Zoo
TTS_handlers = [bhashini_TTS]
