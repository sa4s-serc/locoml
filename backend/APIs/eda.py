from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import json

eda = Blueprint('eda', __name__)

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.int64):
            return int(obj)
        return json.JSONEncoder.default(self, obj)

@eda.route('/eda/<dataset_id>', methods=['GET'])
def edaDataset(dataset_id):
    dataset_path = './Datasets/'+dataset_id+'.csv'
    
    # Read the csv file
    df = pd.read_csv(dataset_path)
    
    # Convert DataFrame to dictionary
    data_dict = df.to_dict(orient='records')
    
    # Get column names
    column_names = df.columns.tolist()

    # Initialize an empty dictionary to hold column details
    column_details = {}

    # Iterate over each column
    for column in df.columns:
        # Check if the column is of integer type
        if np.issubdtype(df[column].dtype, np.number):
            # Calculate the required values
            index = int(df.columns.get_loc(column))
            num_unique_values = int(df[column].nunique())
            mean = round(df[column].mean(), 2)
            std_dev = round(df[column].std(), 2)
            median = round(df[column].median(), 2)
            min_value = round(df[column].min(), 2)
            max_value = round(df[column].max(), 2)
            num_missing_values = int(df[column].isnull().sum())
            range_value = round(max_value - min_value, 2)

            # Append the details to the dictionary
            column_details[column] = {
                'index': index,
                'column_type': 'numerical',
                'mean': mean,
                'std_dev': std_dev,
                'median': median,
                'min': min_value,
                'max': max_value,
                'num_missing_values': num_missing_values,
                'range': range_value
            }
        else:
            # The column is categorical
            index = int(df.columns.get_loc(column))
            num_unique_values = int(df[column].nunique())
            num_missing_values = int(df[column].isnull().sum())

            # Append the details to the dictionary
            column_details[column] = {
                'index': index,
                'column_type': 'categorical',
                'num_unique_values': num_unique_values,
                'num_missing_values': num_missing_values,
            }
    
    print(column_details)
    # Use the custom JSON encoder to serialize data_dict
    return json.dumps({'message': 'EDA completed successfully', 
                    'data': data_dict, 
                    'columns': column_names, 
                    'column_details': column_details}, cls=CustomEncoder)
