import time
from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import os
from ModelAPIs.utils import uploadSavedFileHandler

app = Flask(__name__)
CORS(app)

nodeDetails = []
nodes_dict = dict()
edgeDetails = []
inputFiles = dict()
mode = None

INPUT_ROUTER_URL = os.getenv('INPUT_ROUTER_URL')
PREPROCESS_ROUTER_URL = os.getenv('PREPROCESS_ROUTER_URL')
MODEL_ROUTER_URL = os.getenv('MODEL_ROUTER_URL')


def create_query_string(url, args):
    # args is an immutable dictionary
    query_string = ""
    for key, value in args.items():
        query_string += f"{key}={value}&"
    query_string = query_string[:-1]  # remove the last '&'
    return f"{url}?{query_string}"


@app.route("/nodeInfo", methods=["POST"])
def node_info():
    pipeline_total_exec_start_time = time.time_ns()
    print(request.json)
    global nodeDetails
    nodeDetails = request.json['nodes']
    global mode
    mode = request.json['mode']
    global edgeDetails
    edgeDetails = request.json['edges']
    global nodes_dict
    for n in nodeDetails:
        nodes_dict[n['id']] = n

    for n in nodeDetails:
        for id in inputFiles:
            if n['id'] == id:
                n['data']['entity'] = inputFiles[id]

    print(nodeDetails)
    print(edgeDetails)
    predictions, nextNodeID, time_elapsed = delegate_work()
    
    if nextNodeID == "error":
        response = {
            'error': predictions,
            'nextNodeID': nextNodeID
        }
        return jsonify(response), 200
    
    if mode == "Automatic":
        nextNodeID = None
        
    print(predictions)
    response = {
        'URL': predictions,
        'nextNodeID': nextNodeID,
        'pipeline_total_execution_time': f'{time.time_ns() - pipeline_total_exec_start_time} ns',
        'models_cumulative_execution_time': f'{time_elapsed} ns'
    }
    return jsonify(response), 200


@app.route("/getFile", methods=["POST"])
def get_file():
    dataset_file = request.files['file']
    dataset_name = request.form['filename']

    dataset_path = os.getenv('PROJECT_PATH') + 'Datasets/' + dataset_name
    dataset_file.save(dataset_path)
    status = uploadSavedFileHandler(dataset_path)

    return jsonify({"status": status.get('URL')}), 200


def get_next_ids(source_id):
    next_ids = []
    for edge in edgeDetails:
        if edge['source'] == source_id:
            next_ids.append(edge['target'])
    return next_ids


def execute(node, ip, ipLang):
    print("Executing ...", end='')
    print(node['id'])
    op = None
    opLang = None
    if node['data']['label'] == 'Inputs' and node['data']['entity']:
        op, opLang, time_taken = callInputRouter(node['data']['entity']), node['data']['language'], 0
    elif node['data']['label'] == 'Inputs' and node['data']['link']:
        op, opLang, time_taken = node['data']['link'], node['data']['language'], 0  # op is now the URL to the dataset.
    elif node['data']['label'] == 'Preprocessing':
        op, opLang, time_taken = callPreprocessRouter(node['data']['entity'], ip), ipLang, 0
    elif node['data']['label'] == 'Classification' or node['data']['label'] == 'Regression' or node['data'][
        'label'] == 'Sentiment':
        op, opLang, time_taken = callModelRouter(node['data']['entity']['model_id'], ip), ipLang, 0
    elif node['data']['label'] == 'TTS' or node['data']['label'] == 'MT' or node['data'][
        'label'] == 'ASR' or node['data']['label'] == 'OCR':
        response = callAPIModelRouter(node['data']['entity']['model_id'], node['data']['destinationLanguage'], ip, ipLang)
        op, opLang, time_taken = response['URL'], node['data']['destinationLanguage'], response['model_execution_time']

    return op, opLang, time_taken

def validate(id, prev_model):
    node = nodes_dict[id]
    
    if node['data']['label'] == 'Inputs':
        file_type = "text" #default

        file_name = node['data']['link'].split('/')[-1]
        _, extension = os.path.splitext(file_name)
        if extension in [".wav", ".mp3"]:
            file_type = "audio"

        next_ids = get_next_ids(node['id'])
        for next_id in next_ids:
            next_node = nodes_dict[next_id]
            if file_type == "text" and next_node['data']['label'] == "ASR" or \
                file_type == "audio" and next_node['data']['label'] != "ASR":
                    return f"{next_node['data']['label']} node doesn't take {file_type} file as input."
        
    # The below is handled already in Front-end
                 
    # if node['data']['label'] == 'TTS' or node['data']['label'] == 'MT' or node['data'][
    #     'label'] == 'ASR':
    #     if prev_model == 'TTS' and node['data']['label'] != 'ASR':
    #         return f"TTS can't be connected to {node['data']['label']}"
    #     if prev_model == 'MT' and node['data']['label'] == 'ASR':
    #         return "MT can't be connected to ASR"
    #     if prev_model == 'ASR' and node['data']['label'] == 'ASR':
    #         return "ASR can't be connected to ASR"
        
    # prev_model = node['data']['label']
    # next_ids = get_next_ids(id)
    # if not next_ids:
    #     return "No error"
    # return validate(next_ids[0],prev_model)
    
    return "No error"

def run_manual(id,ip,lang):
    total_time_elapsed = 0
    op, lang, time_elapsed = execute(nodes_dict[id], ip, lang)
    total_time_elapsed += time_elapsed
    next_id = next_ids[0] if (next_ids := get_next_ids(id)) else None
    if not next_id:
        return op,None
    predictions, predLang, time_elapsed = execute(nodes_dict[next_id], op, lang)
    total_time_elapsed += time_elapsed
    next_id = next_ids[0] if (next_ids := get_next_ids(next_id)) else None
    return predictions, next_id, total_time_elapsed

def run(id, ip, lang):
    total_time_elapsed = 0
    op, lang, time_elapsed = execute(nodes_dict[id], ip, lang)
    total_time_elapsed += time_elapsed
    next_ids = get_next_ids(id)
    predictions = None
    predLang = None
    for nxt_id in next_ids:
        predictions, predLang, time_elapsed = run(nxt_id, op, lang)
        total_time_elapsed += time_elapsed
    if predictions:
        op = predictions
        lang = predLang
    return op, lang, total_time_elapsed


# @app.route("/delegate_work", methods=["GET"])
def delegate_work():
    if not nodeDetails:
        return jsonify({"status": "error", "message": "No nodes found"})

    # predictions = run('1',None)
    time_elapsed = 0
    lang = None
    predictions = None
    for node in nodeDetails:
        if node['data']['label'] == 'Inputs':
            val = validate(node['id'],"None")
            if val != "No error":
                return val,"error"
            if mode == "Automatic":
                predictions, lang, time_elapsed = run(node['id'], None, None)
            else:
                predictions, lang, time_elapsed = run_manual(node['id'], None, None)

    return predictions, lang, time_elapsed


def callInputRouter(dataset_id):
    try:
        input_health_url = f"{INPUT_ROUTER_URL}/health"
        response = requests.get(input_health_url)
        if response.text == "OK":
            pass
    except Exception as e:
        print("Input server not responding : ", e)

    input_url = f"{INPUT_ROUTER_URL}/input/getInferenceDataset"
    try:
        response = requests.post(input_url, json={
            'dataset_id': dataset_id
        })
        dataset = response.json()
        return dataset
    except Exception as e:
        print("Error in receiving input: ", e)


def callPreprocessRouter(task, dataset):
    try:
        preprocess_health_url = f"{PREPROCESS_ROUTER_URL}/health"
        response = requests.get(preprocess_health_url)
        if response.text == "OK":
            pass
    except Exception as e:
        print("Preprocess server not responding : ", e)

    preprocess_url = f"{PREPROCESS_ROUTER_URL}/preprocess"
    try:
        response = requests.post(preprocess_url, json={
            'dataset': dataset,
            'task': task
        })
        preProcessedDataset = response.json()
        return preProcessedDataset
    except Exception as e:
        print(e)


def callModelRouter(model_id, dataset):
    try:
        model_health_url = f"{MODEL_ROUTER_URL}/health"
        response = requests.get(model_health_url)
        if response.text == "OK":
            pass
    except Exception as e:
        print("Model server not responding : ", e)

    model_url = f"{MODEL_ROUTER_URL}/inference/batch"
    try:
        response = requests.post(model_url, json={
            'dataset': dataset,
            'model_id': model_id
        })
        return response.json()
    except Exception as e:
        print(e)


def callAPIModelRouter(model_id, dest_lang, inp, source_lang):
    try:
        model_health_url = f"{MODEL_ROUTER_URL}/health"
        response = requests.get(model_health_url)
        if response.text == "OK":
            pass
    except Exception as e:
        print("Model server not responding : ", e)

    model_router_url = f"{MODEL_ROUTER_URL}/inference/batchAPI"
    try:
        response = requests.post(model_router_url, json={
            'input': inp,
            'model_id': model_id,
            'source_lang': source_lang,
            'destination_lang': dest_lang,
        })
        return response.json()
    except Exception as e:
        print(e)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
