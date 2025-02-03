"""Each handler function here is supposed to return a URL to the file that it outputs. So, simply upload the file to
S3 or some other file repository. Each of the functions should store the file returned from the model on the disk,
and pass it to a function in uploadFiles.py, then, finally return the URL to the uploaded file.

Remember to define an entry in the MongoDB database, in Model_Zoo following the same format as the other entries!"""
import time
from gettext import translation

from flask import Blueprint, jsonify
import os
import requests
from .utils import uploadFileHandler
from pydub import AudioSegment
import base64
import json

ASR_API_Handler = Blueprint('ASR_API_Handler', __name__)


# ================================================================================================

def IIITH_ASR(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
    endpoint = model_info['API']

    translation_matrix = {'english': 'eng', 'telugu': 'te-500'}
    if source_lang.lower() not in translation_matrix or dest_lang.lower() not in translation_matrix:
        return jsonify(
            {"URL": "Invalid source & destination combination chosen for this model!", 'model_execution_time': 0})

    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'

    response = requests.post(json={'URL': inp_URL}, url=input_router_downloader_endpoint).json()
    file_name = response.get('file_name')
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ASR_formData = {'lang': translation_matrix[dest_lang.lower()]}
    ASR_file = {'file': open(file_path, 'rb')}

    model_execution_time_start = time.time_ns()
    ASR_response = requests.post(endpoint, files=ASR_file, data=ASR_formData,
                                 verify=False)  # TODO: FIX SSL CERTIFICATES
    model_execution_time = time.time_ns() - model_execution_time_start
    print(ASR_response)
    try:
        message = ASR_response.json().get('message')
        return jsonify(
            {'URL': uploadFileHandler(message, file_name, False)['URL'], 'model_execution_time': model_execution_time})
    except ValueError as ve:
        print(ve, ASR_response.status_code)
        return jsonify({"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})


# ================================================================================================

def IITM_ASR_getAuthToken() -> str:
    endpoint = os.getenv('IITM_ASR_TOKEN_ENDPOINT')
    email = os.getenv('IITM_ASR_EMAIL')
    password = os.getenv('IITM_ASR_PASSWORD')

    if not endpoint or not email or not password:
        raise ValueError(
            "Missing required environment variables. Please create .env.credentials in the backend directory and set "
            "them.")

    formData = {
        'email': email,
        'password': password
    }

    try:
        response = requests.post(endpoint, data=formData)
        response.raise_for_status()  # raise an HTTPError if the response was an HTTP error
        token = response.json().get('token')
        return token

    except requests.exceptions.RequestException as e:
        raise SystemError(f"Request to {endpoint} failed: {e}")
    except ValueError as ve:
        raise ve


def IITM_ASR(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
    endpoint = model_info['API']

    translation_matrix = {'english': 'english', 'telugu': 'telugu'}
    if source_lang.lower() not in translation_matrix or dest_lang.lower() not in translation_matrix:
        return jsonify({"URL": "Invalid source & destination combination chosen for this model!"})

    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    auth_token = IITM_ASR_getAuthToken()
    headers = {'Authorization': 'Token ' + auth_token}

    response = requests.post(json={'URL': inp_URL}, url=input_router_downloader_endpoint).json()
    file_name = response.get('file_name')
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    ASR_formData = {"vtt": "true", "language": translation_matrix[source_lang.lower()], 'url': inp_URL}
    ASR_file = {'file': open(file_path, 'rb')}

    model_execution_time_start = time.time_ns()
    ASR_response = requests.post(endpoint, headers=headers, data=ASR_formData, files=ASR_file,
                                 verify=False)  # TODO: FIX SSL CERTIFICATES
    model_execution_time = time.time_ns() - model_execution_time_start

    try:
        message = ASR_response.json().get('message')
        return jsonify(
            {'URL': uploadFileHandler(message, file_name, False)['URL'], 'model_execution_time': model_execution_time})
    except ValueError as ve:
        print(ve, ASR_response.status_code)
        return jsonify({"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})


# ================================================================================================
def bhashini_ASR(inp_URL: str, source_lang: str, dest_lang: str, model_info: dict):
    endpoint = model_info['API']
    serviceId = model_info['serviceId']

    # Translation matrix to map language names to their corresponding language codes
    translation_matrix = {'marathi': 'mr', 'assamese': 'as', 'bengali': 'bn', 'kannada': 'kn', 'kashmiri': 'ks',
                          'maithili': 'mai', 'bodo': 'brx', 'dogri': 'doi', 'english': 'en', 'goan konkani': 'gom',
                          'gujarati': 'gu', 'hindi': 'hi', 'malayalam': 'ml', 'manipuri': 'mni', 'nepali': 'ne',
                          'oriya': 'or', 'punjabi': 'pa', 'sanskrit': 'sa', 'santali': 'sat', 'sindhi': 'sd',
                          'tamil': 'ta', 'telugu': 'te',
                          'urdu': 'ur'}

    # Validate if source and destination languages are supported
    if source_lang.lower() not in translation_matrix or dest_lang.lower() not in translation_matrix:
        return jsonify({"URL": "Invalid source & destination combination chosen for this model!"})

    # Fetch the input file by using an external service(AWS) to download the file from the given URL
    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    auth_token = os.getenv('BHASHINI_TOKEN')

    # Headers required for making API calls to Bhashini services
    headers = {'Authorization': auth_token, 'accept': "*/*", 'Content-Type': 'application/json',
               'User-Agent': 'Thunder Client (https://www.thunderclient.com)'}

    # Send a POST request to download the input file and retrieve the file name and path
    response = requests.post(json={'URL': inp_URL}, url=input_router_downloader_endpoint).json()
    file_name = response.get('file_name')
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "rb") as mp3_file:
        base64_mp3 = base64.b64encode(mp3_file.read()).decode("utf-8")

    # print(f"the base64_mp3 content is : {base64_mp3}")

    print(f"{file_name}")
    print(f"{file_path}")

    # Prepare the request body for the ASR API call
    raw_body = {
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": {
                    "language": {
                        "sourceLanguage": translation_matrix[source_lang.lower()],
                    },
                    "serviceId": serviceId,
                    "audioFormat": "mp3",
                    "samplingRate": 16000
                }
            }
        ],
        "inputData": {
            "audio": [
                {
                    "audioContent": base64_mp3
                }
            ]
        }
    }

    # Send the ASR request
    model_execution_time_start = time.time_ns()
    ASR_response = requests.post(endpoint, headers=headers, data=json.dumps(raw_body),
                                 verify=False)  # TODO: FIX SSL CERTIFICATES
    model_execution_time = time.time_ns() - model_execution_time_start

    print(f"ASR status code: {ASR_response.status_code}")

    print(model_execution_time)

    print(f"Here is the response : ")
    print(ASR_response.json())

    try:
        message = ASR_response.json().get('pipelineResponse')[0].get('output')[0].get('source')
        print(f"This is the message : {message}")
        return jsonify(
            {'URL': uploadFileHandler(message, file_name, False)['URL'], 'model_execution_time': model_execution_time})
    except ValueError as ve:
        print(ve, ASR_response.status_code)
        return jsonify({"URL": "Failed to fetch the required response!", 'model_execution_time': model_execution_time})


# ================================================================================================


# List of all the handler functions. Indexing matters, store them in same order as their
# {index: <index>} as defined in the MongoDB Model_Zoo
ASR_handlers = [IIITH_ASR, IITM_ASR, bhashini_ASR]
