from flask import Flask, Blueprint, request, send_file, jsonify, abort
import os
import sys
import pandas as pd
from dotenv import load_dotenv
from flask_cors import CORS
from pandas.api.types import is_numeric_dtype
import requests
import io
import bson.json_util as json_util

load_dotenv(dotenv_path="../../.env")
env_path = os.getenv("PROJECT_PATH")
sys.path.append(env_path)
from mongo_db import db

storeDataset = Blueprint('storeDataset', __name__)

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return "OK"


@app.route("/getInputLanguages", methods=["GET"])
def getInputLanguages():
    collection = db['Input_Languages']
    query_result = collection.find()
    input_languages_list = []

    for query in query_result:
        query.pop('_id')
        input_languages_list.append(json_util.dumps(query))

    return json_util.dumps({'input_languages': input_languages_list})


@app.route('/input/getInferenceDataset', methods=['GET', 'POST'])
def getInferenceFile():
    data = request.get_json()
    dataset_id = data['dataset_id']
    dataset_path = os.getenv('PROJECT_PATH') + 'Datasets/' + dataset_id + '.csv'
    df = pd.read_csv(dataset_path)

    for column in df.columns:
        print(column)
        if not is_numeric_dtype(df[column]) and df[column].dtype != 'bool':
            df[column] = df[column].fillna(df[column].mode()[0])
        else:
            df[column] = df[column].fillna(df[column].mean())

    df_list = [df.columns.tolist()]

    df_list.extend(df.values.tolist())
    JSONP_data = jsonify(df_list)
    return JSONP_data


@app.route('/input/downloadAndSaveFileFromLink', methods=['POST'])
def downloadAndSaveFileFromLink():
    URL = request.json.get('URL')
    if not URL:
        return {"error": "Missing URL parameter in request body"}

    try:
        response = requests.get(URL)
        if response.status_code != 200:
            abort(response.status_code, description="Failed to download file")

        file_content = io.BytesIO(response.content)

        file_name = URL.split("/")[-1] or "downloaded_file"
        file_format = file_name.split('.')[-1]
        file_name = file_name.split('.')[0]
        final_storage_dir = os.path.join(os.getenv('PROJECT_PATH'), 'Datasets')
        if not os.path.exists(final_storage_dir):
            os.makedirs(final_storage_dir)

        file_path = os.path.join(final_storage_dir, file_name)

        with open(file_path, 'wb') as f:
            f.write(file_content.getvalue())

        if os.path.exists(file_path):
            print(f"File saved successfully at: {file_path}")
        else:
            print(f"File not found at: {file_path}")

        return jsonify({"file_name": file_name, "file_format": file_format, "file_path": file_path}), 200

    except requests.RequestException as e:
        abort(500, description=f"An error occurred: {str(e)}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
