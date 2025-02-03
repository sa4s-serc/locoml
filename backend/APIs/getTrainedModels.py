from flask import Blueprint, request
import sys

sys.path.append('../')
from mongo_db import db
import os
import bson.json_util as json_util
from flask import send_file

getTrainedModels = Blueprint('getTrainedModels', __name__)


@getTrainedModels.route('/getTrainedModels/all', methods=['GET'])
def getTrainedModelListAll():
    return getTrainedModelList()


@getTrainedModels.route('/getTrainedModels', methods=['GET'])
def getTrainedModelList():
    collection = db['Model_Zoo']
    trained_model_list = []

    for model in collection.find():
        print(type(model))
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    # return {'trained_models': trained_model_list}
    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/classification', methods=['GET'])
def getTrainedModelListClassification():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'classification'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/regression', methods=['GET'])
def getTrainedModelListRegression():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'regression'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    # return {'trained_models': trained_model_list}
    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/sentiment', methods=['GET'])
def getTrainedModelListSentiment():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'sentiment'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/ASR', methods=['GET'])
def getTrainedModelListASR():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'ASR'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/MT', methods=['GET'])
def getTrainedModelListMT():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'MT'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/TTS', methods=['GET'])
def getTrainedModelListTTS():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'TTS'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})

@getTrainedModels.route('/getTrainedModels/OCR', methods=['GET'])
def getTrainedModelListOCR():
    collection = db['Model_Zoo']
    trained_model_list = []

    query = {'objective': 'OCR'}
    results = collection.find(query)

    for model in results:
        model.pop('_id')
        trained_model_list.append(json_util.dumps(model))

    return json_util.dumps({'trained_models': trained_model_list})


@getTrainedModels.route('/getTrainedModels/<model_id>', methods=['GET'])
def getTrainedModel(model_id):
    # get model_id from endpoint
    # model_id = request.view_args['model_id']
    print(model_id)
    collection = db['Model_Zoo']
    trained_model = collection.find_one({'model_id': model_id})
    # sort version array according to the date
    trained_model['versions'].sort(key=lambda x: x['time'], reverse=True)
    return json_util.dumps(trained_model)


@getTrainedModels.route('/getTrainedModelFile/<model_id>/<version>', methods=['GET'])
def getTrainedModelFile(model_id, version):
    version = int(version)
    collection = db['Model_Zoo']
    trained_model = collection.find_one({'model_id': model_id})
    # sort version array according to the date
    model_path = trained_model['versions'][version - 1]['saved_model_path']
    relative_path = model_path[model_path.find('Models'):]
    cur_path = os.getenv('PROJECT_PATH') + relative_path
    return send_file(cur_path)
