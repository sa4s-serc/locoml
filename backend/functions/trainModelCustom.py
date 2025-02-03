from ClassificationUtility import ClassificationUtility
from RegressionUtility import RegressionUtility
import pandas as pd
import datetime
import pickle
import nanoid
import os
import sys
import json

project_path = os.getenv('PROJECT_PATH')
sys.path.append(project_path)
from mongo_db import db
sys.path.append('../Enums/')
from Enums.enums import ClassificationMetrics, RegressionMetrics


def trainModelCustom(dataset_id, model_name, model_type, hyperparameters, target_column, metric_mode, metric_type, objective, model_id=None, isUpdate=False):

    dataset_path = os.getenv('PROJECT_PATH') + 'Datasets/'+dataset_id+'.csv'
    df = pd.read_csv(dataset_path)

    if metric_mode.lower() == 'autoselect':
        if objective.lower() == 'classification':

            class_dist = df[target_column].value_counts()
            is_balanced = class_dist.min() / class_dist.max() > 0.5

            if is_balanced:
                metric_type = ClassificationMetrics.Accuracy.value
            else:
                metric_type = ClassificationMetrics.AUC.value

        elif objective.lower() == 'regression':
            metric_type = RegressionMetrics.R2.value

    if hyperparameters != 'None':
        hyperparameters = json.loads(hyperparameters)

    print("Here are the hyper: ", hyperparameters)

    if objective.lower() == 'classification':
        clf_util = ClassificationUtility(
            df, target_column, 'Custom', hyperparameters, metric_type)
    elif objective.lower() == 'regression':
        clf_util = RegressionUtility(
            df, target_column, 'Custom', hyperparameters, metric_type)

    clf_util.trainCustom(model_type)
    results = clf_util.results

    if objective.lower() == 'classification':
        best_model_name = clf_util.best_model
        model_parameters = clf_util.best_estimator.named_steps['classifier'].get_params(
        )
    else:
        best_model_name = clf_util.best_model
        model_parameters = clf_util.best_estimator.named_steps['regressor'].get_params(
        )

    metrics = []
    for metric in results.columns:
        if metric == 'Classifier' or metric.lower() == 'regressor':
            continue
        metrics.append({
            'metric_name': metric,
            'metric_value': results.iloc[0][metric],
        })

    parameters = []
    for key, value in model_parameters.items():
        if value == None:
            value = 'None'
        parameters.append({
            'parameter_name': key,
            'parameter_value': value
        })

    print("Status: Saving Model and Pipeline in file system", file=sys.stderr)
    new_model_id = nanoid.generate(
        alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', size=6)
    save_path = os.getenv('PROJECT_PATH') + 'Models/' + new_model_id + '.pkl'
    clf_util.saveModel(best_model_name, save_path)
    # print("Transformation Pipeline and Model Successfully Saved", file=sys.stderr)

    input_schema = clf_util.get_input_schema()
    output_schema = clf_util.get_output_schema()
    output_mapping = clf_util.get_output_mapping()

    print("Status: Generating Visualization data", file=sys.stderr)

    graph_data = {}
    if objective.lower() == 'classification':
        print("Status: Generating Confusion Matrix", file=sys.stderr)
        cm = clf_util.get_confusion_matrix()
        print("Status: Generating Feature Importance", file=sys.stderr)
        feature_importance = clf_util.get_feature_importance()
        print("Status: Generating Precision-Recall Curve", file=sys.stderr)
        pr_data = clf_util.get_precision_recall_data()
        print("Status: Generating ROC Curve", file=sys.stderr)
        auc_data = clf_util.get_auc_data()
        graph_data = {
            'confusion_matrix': cm,
            'feature_importance': feature_importance,
            'precision_recall_data': pr_data,
            'auc_data': auc_data
        }
    else:
        print("Status: Generating Feature Importance", file=sys.stderr)
        feature_importance = clf_util.get_feature_importance()
        print("Status: Generating Scatter Plot", file=sys.stderr)
        scatter_plot_data = clf_util.get_scatter_plot_data()
        print("Status: Generating Residual Plot", file=sys.stderr)
        residual_plot_data = clf_util.get_residual_plot_data()
        graph_data = {
            'feature_importance': feature_importance,
            'scatter_plot_data': scatter_plot_data,
            'residual_plot_data': residual_plot_data
        }

    print("Status: Saving Model Metadata in database", file=sys.stderr)

    collection = db['Model_Zoo']

    if isUpdate.lower() != 'true':
        details = {
            'time': datetime.datetime.now(),
            'model_id': new_model_id,
            'model_name': model_name,
            'training_mode': 'Custom',
            'estimator_type': best_model_name,
            'metric_mode': metric_mode,
            'metric_type': metric_type,
            'saved_model_path': save_path,
            'dataset_id': dataset_id,
            'objective': objective,
            'target_column': target_column,
            'parameters': parameters,
            'evaluation_metrics': metrics,
            'all_models_results': results.to_dict('records'),
            'input_schema': input_schema,
            'output_schema': output_schema,
            'output_mapping': output_mapping,
            'graph_data': graph_data,
            'versions': [{
                'time': datetime.datetime.now(),
                'model_id': model_id,
                'model_name': model_name,
                'estimator_type': best_model_name,
                'saved_model_path': save_path,
                'parameters': parameters,
                'evaluation_metrics': metrics,
                'output_mapping': output_mapping,
                'graph_data': graph_data,
                'version_number': 1
            }]
        }
        # print(details)
        collection.insert_one(details)
        details.pop('_id')

    else:
        base_model = collection.find_one({'model_id': model_id})
        n_versions = len(base_model['versions'])
        details = {
            'time': datetime.datetime.now(),
            'model_id': new_model_id,
            'model_name': model_name,
            'estimator_type': best_model_name,
            'saved_model_path': save_path,
            'parameters': parameters,
            'evaluation_metrics': metrics,
            'output_mapping': output_mapping,
            'graph_data': graph_data,
            'version_number': n_versions + 1
        }
        # find model in database and update the "versions" array
        collection.update_one({'model_id': model_id}, {
                              '$push': {'versions': details}})

    # print(details)

    return details


dataset_id = sys.argv[1]
model_name = sys.argv[2]
model_type = sys.argv[3]  # not needed in automl
hyperparameters = sys.argv[4]  # not needed when training for the first time
target_column = sys.argv[5]
metric_mode = sys.argv[6]
metric_type = sys.argv[7]
objective = sys.argv[8]
model_id = sys.argv[9]  # not needed when training for the first time
isUpdate = sys.argv[10] # whether to update the model or not
from icecream import ic
ic(dataset_id, model_name, model_type, hyperparameters,
   target_column, metric_mode, metric_type, objective, model_id, isUpdate)

details = trainModelCustom(dataset_id, model_name, model_type, hyperparameters,
                           target_column, metric_mode, metric_type, objective, model_id, isUpdate)
details_path = os.getenv('PROJECT_PATH') + 'Usage/details.pkl'
with open(details_path, 'wb') as f:
    pickle.dump(details, f)
