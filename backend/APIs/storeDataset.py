from flask import Blueprint, request, send_file
import nanoid
import os
import sys
import datetime
sys.path.append(os.getenv('PROJECT_PATH'))

storeDataset = Blueprint('storeDataset', __name__)
from mongo_db import db

@storeDataset.route('/storeDataset', methods=['GET', 'POST'])
def storeDatasetFile():

    dataset_file = request.files['file']
    dataset_name = request.form['filename'] 
    dataset_size = request.form['filesize']

    dataset_id = nanoid.generate(alphabet='0123456789', size=5)

    dataset_path = os.getenv('PROJECT_PATH') + 'Datasets/' + dataset_id + '.csv'
    dataset_file.save(dataset_path)

    collection = db['Datasets']

    collection.insert_one({
        'time' : datetime.datetime.now(),
        'dataset_id': dataset_id,
        'dataset_size' : dataset_size,
        'dataset_name': dataset_name,
        'dataset_path': dataset_path,
    })

    return {'status': 'success', 'dataset_id': dataset_id, 'dataset_name': dataset_name}