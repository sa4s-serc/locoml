from flask import Flask
import os
from flask_cors import CORS
from flask_sse import sse
from dotenv import load_dotenv
from APIs.getDatasets import getDatasets
from APIs.trainModel import trainModelAPIs
from APIs.preprocess import preprocess
from APIs.getTrainedModels import getTrainedModels
from APIs.storeDataset import storeDataset
# from APIs.deployModel import deployModel
from APIs.eda import eda
from APIs.utilities import utilityAPIs
from APIs.updateModel import updateModelAPIs

app = Flask(__name__)
CORS(app)
load_dotenv()

app.register_blueprint(sse, url_prefix="/stream")
app.register_blueprint(getDatasets)
app.register_blueprint(trainModelAPIs)
app.register_blueprint(preprocess)
app.register_blueprint(getTrainedModels)
app.register_blueprint(storeDataset)
# app.register_blueprint(deployModel)
app.register_blueprint(eda)
app.register_blueprint(utilityAPIs)
app.register_blueprint(updateModelAPIs)


app.config['REDIS_URL'] = os.getenv('REDIS_URL')

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
