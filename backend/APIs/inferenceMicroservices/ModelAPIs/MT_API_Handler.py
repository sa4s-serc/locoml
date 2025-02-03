"""Each handler function here is supposed to return a URL to the file that it outputs. So, simply upload the file to
S3 or some other file repository. Each of the functions should store the file returned from the model on the disk,
and pass it to a function in uploadFiles.py, then, finally return the URL to the uploaded file.

Remember to define an entry in the MongoDB database, in Model_Zoo following the same format as the other entries!"""
import time

from flask import Blueprint, jsonify
import os
import requests
import json
from .utils import uploadFileHandler

MT_API_Handler = Blueprint('MT_API_Handler', __name__)


# ================================================================================================

def APIM_getAuthToken() -> str:
    endpoint = os.getenv('APIM_TOKEN_ENDPOINT')
    basic_token = os.getenv('APIM_BASIC_TOKEN')

    if not endpoint or not basic_token:
        raise ValueError(
            "Missing required environment variables. Please create .env.credentials in the backend directory and set "
            "them.")

    headers = {'Authorization': 'Basic ' + basic_token, "Content-Type": "application/x-www-form-urlencoded"}
    body = 'grant_type=client_credentials'

    try:
        response = requests.post(endpoint, headers=headers, data=body)
        response.raise_for_status()  # raise an HTTPError if the response was an HTTP error
        token = response.json().get('access_token')
        return token

    except requests.exceptions.RequestException as e:
        raise SystemError(f"Request to {endpoint} failed: {e}")
    except ValueError as ve:
        raise ve


# This standard MT template works for IIITH and most other MTs.
def standard_MT(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
    endpoint = model_info['API']

    translation_matrix = {'english': 'eng', 'telugu': 'tel', 'gujarati': 'guj', 'hindi': 'hin', 'marathi': 'mar'}
    if source_lang.lower() not in translation_matrix or dest_lang.lower() not in translation_matrix:
        return jsonify({"URL": "Invalid source & destination combination chosen for this model!"})

    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    auth_token = APIM_getAuthToken()
    headers = {'Authorization': 'Bearer ' + auth_token, 'accept': "*/*", 'Content-Type': 'application/json'}

    response = requests.post(json={'URL': inp_URL}, url=input_router_downloader_endpoint).json()
    file_name = response.get('file_name')
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    input_text = open(file_path, 'r').read()
    MT_formData = {'text': input_text, 'source_language': translation_matrix[source_lang.lower()],
                   'target_language': translation_matrix[dest_lang.lower()]}
    MT_textBody = json.dumps(MT_formData)
    print(MT_textBody)

    model_execution_time_start = time.time_ns()
    MT_response = requests.post(endpoint, headers=headers, data=MT_textBody,
                                 verify=False)  # TODO: FIX SSL CERTIFICATES
    model_execution_time = time.time_ns() - model_execution_time_start

    try:
        message = MT_response.json().get('data')
        return jsonify(
            {'URL': uploadFileHandler(message, file_name, False)['URL'], 'model_execution_time': model_execution_time})
    except ValueError as ve:
        print(ve, MT_response.status_code)
        return jsonify({"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})


def bhashini_MT(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
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
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": translation_matrix[source_lang.lower()],
                        "targetLanguage": translation_matrix[dest_lang.lower()],
                    },
                    "serviceId": serviceId
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
    MT_textBody = json.dumps(raw_body)

    model_execution_time_start = time.time_ns()
    MT_response = requests.post(endpoint, headers=headers, data=MT_textBody,
                                 verify=False)  # TODO: FIX SSL CERTIFICATES
    model_execution_time = time.time_ns() - model_execution_time_start

    print(MT_response.json())

    try:
        message = MT_response.json().get('pipelineResponse')[0].get('output')[0].get('target')
        return jsonify(
            {'URL': uploadFileHandler(message, file_name, False)['URL'], 'model_execution_time': model_execution_time})
    except ValueError as ve:
        print(ve, MT_response.status_code)
        return jsonify({"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})


# ================================================================================================

# List of all the handler functions. Indexing matters, store them in same order as their
# {index: <index>} as defined in the MongoDB Model_Zoo
MT_handlers = [standard_MT, bhashini_MT]
