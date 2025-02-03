"""Responsible for all the inference pipeline saving, retrieval, traversal etc., API calls. Separate inference
microservice, running on port 5005.
NOTE: The modelRouter.py is responsible for everything else, like the actual
inference part of the inference pipeline."""
from flask import request, Flask, jsonify, Response, make_response
import requests
import bson.json_util as json_util
import nanoid
import os
import sys
import datetime
from dotenv import load_dotenv
from flask_cors import CORS
from ModelAPIs.utils import uploadSavedFileHandler
import json

load_dotenv(dotenv_path="../../.env")
sys.path.append(os.getenv('PROJECT_PATH'))
from mongo_db import db

load_dotenv(dotenv_path="../../.env")
env_path = os.getenv("PROJECT_PATH")
MASTER_SERVER_GETFILE_URL = os.getenv("MASTER_SERVER_GETFILE_URL")
INFERENCE_PIPELINE_RETRIEVE_PIPELINE_DETAILS_URL = os.getenv("INFERENCE_PIPELINE_RETRIEVE_PIPELINE_DETAILS_URL")
RUN_INFERENCE_PIPELINE_URL = os.getenv("RUN_INFERENCE_PIPELINE_URL")
DOWNLOAD_FILE_FROM_LINK_URL = os.getenv("DOWNLOAD_FILE_FROM_LINK")

sys.path.append(env_path)

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=["GET"])
def health():
    return "OK"


@app.route('/savePipeline', methods=['POST'])
def save_pipeline():
    data = request.get_json()
    nodes = data['nodes']
    edges = data['edges']
    pipeline_name = data['pipeline_name']

    # remove the input data, if present. we don't want to save the dataset used in inference.
    for node in nodes:
        if node['type'] == 'inputData':
            node['data']['entity'] = None

    pipeline_id = nanoid.generate(alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', size=6)

    collection = db['Inference_Pipelines']

    collection.insert_one({
        'time': datetime.datetime.now(),
        'pipeline_id': pipeline_id,
        'pipeline_name': pipeline_name,
        'nodes': nodes,
        'edges': edges,
    })

    return json_util.dumps({'status': 'success', 'dataset_id': pipeline_id})


@app.route('/saveEditedPipeline', methods=['POST'])
def save_edited_pipeline():
    data = request.get_json()
    pipeline_id = data['pipeline_id']
    nodes = data['nodes']
    edges = data['edges']

    collection = db['Inference_Pipelines']
    collection.update_one({'pipeline_id': pipeline_id},
                                     {'$set': {'time': datetime.datetime.now(), 'nodes': nodes, 'edges': edges}})

    return json_util.dumps({'status': 'success', 'dataset_id': pipeline_id}), 200


@app.route('/getPipelinesList/', methods=['GET'])
def get_pipelines_list():
    # defaulting to page 1 and limit 10 unless specified otherwise in the request args.
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))

    offset = (page - 1) * limit

    collection = db['Inference_Pipelines']
    pipelines_list = []
    total_pipelines = collection.count_documents({})
    for pipeline in collection.find().skip(offset).limit(limit):
        pipeline.pop('_id')
        pipelines_list.append(pipeline)

    return json_util.dumps({
        'page': page,
        'limit': limit,
        'total_items': total_pipelines,
        'total_pages': (total_pipelines + limit - 1) // limit,
        'inference_pipelines': pipelines_list
    })


@app.route('/retrievePipelineDetails/', methods=['GET'])
def retrieve_pipeline_details():
    pipeline_id = request.args.get('pipeline_id')
    if not pipeline_id:
        return json_util.dumps({"message": "Invalid request. Missing pipeline ID."})
    return get_pipeline_details_by_ID(pipeline_id)


def get_pipeline_details_by_ID(pipeline_id):
    collection = db['Inference_Pipelines']
    pipeline_info = list(collection.find({"pipeline_id": pipeline_id}))
    if not pipeline_info:
        return json_util.dumps({"message": "Invalid request. No pipeline is saved with this pipeline ID."})
    return json_util.dumps(pipeline_info[0])  # Ideally, there shouldn't be multiple pipelines with the same ID as
    # the ID must be randomly generated. So, return the first result.


@app.route('/runPipeline/<pipeline_id>', methods=['POST'])
def csv_input(pipeline_id: str) -> Response:
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file part in the request"}), 400

    dataset_path = os.getenv('PROJECT_PATH') + 'Datasets/' + file.filename
    file.save(dataset_path)
    status = uploadSavedFileHandler(dataset_path)

    pipeline_details = requests.get(INFERENCE_PIPELINE_RETRIEVE_PIPELINE_DETAILS_URL + f'/?pipeline_id={pipeline_id}')
    if pipeline_details.status_code != 200:
        return jsonify({"error": "Failed to retrieve pipeline details"}), 404
    pipeline_details.content.decode('utf8')

    # process this data for pipeline execution.
    processed_data = process_data_for_pipeline_execution(pipeline_details.json(), status.get('URL'))

    # tell the master server to run this pipeline.
    output_data = requests.post(RUN_INFERENCE_PIPELINE_URL,
                                json={'nodes': processed_data['nodes'], 'edges': processed_data['edges'], 'mode': "Automatic"})
    if output_data.status_code != 200:
        return jsonify({"error": "Failed to run this pipeline"}), 404

    # download the file contents from the output file URL
    output_URL = json.loads(output_data.content.decode('utf8'))['URL']
    input_router_downloader_endpoint = os.getenv('INPUT_ROUTER_URL') + '/input/downloadAndSaveFileFromLink'
    response = requests.post(json={'URL': output_URL}, url=input_router_downloader_endpoint).json()
    file_path = response.get('file_path')

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    output_file_response = open(file_path, 'r').read()

    return Response(
        output_file_response,
        mimetype='application/octet-stream'
    )


def process_data_for_pipeline_execution(pipeline_details: list, URL: str) -> list:
    for node in pipeline_details['nodes']:
        if node['type'] == "inputData":
            node['data']['link'] = URL

    return pipeline_details


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)
