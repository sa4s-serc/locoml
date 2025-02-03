import requests

url = "http://localhost:5001/nodeInfo"

def generate_mt_pipeline(num_mt_nodes: int) -> dict:
    base_mt_entity = {
        'objective': 'MT',
        # 'destination_languages': [
        #     'Assamese', 'Bengali', 'Bodo', 'Dogri', 'Goan Konkani', 'Gujarati',
        #     'Hindi', 'Kannada', 'Kashmiri', 'Maithili', 'Malayalam', 'Manipuri',
        #     'Marathi', 'Nepali', 'Oriya', 'Punjabi', 'Sanskrit', 'Santali',
        #     'Sindhi', 'Tamil', 'Telugu', 'Urdu'
        # ],
        'model_id': 'MT_2',
        'model_name': 'AI4Bharat Indic Trans V2',
        'index': 1,
        'API': 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
        'serviceId': 'ai4bharat/indictrans-v2-all-gpu--t4'
    }

    nodes = [{
        'id': 'dndnode_0',
        # 'position': {'x': 307.51141357421875, 'y': -42.22442626953125},
        'data': {
            'label': 'Inputs',
            'entity': {},
            'link': 'https://bahubhashak-iiit.s3.us-east-2.amazonaws.com/translation/FB34LNHF7R.txt',
            'language': 'telugu',
        },
        # 'style': {'backgroundColor': '#d7e3fc'},
        'type': 'inputData',
        # 'width': 100,
        # 'height': 30,
        # 'selected': False,
        # 'positionAbsolute': {'x': 307.51141357421875, 'y': -42.22442626953125},
        # 'dragging': False
    }]

    for i in range(num_mt_nodes):
        mt_node = {
            'id': f'dndnode_{i + 1}',
            # 'position': {'x': 308.0171203613281, 'y': 12.913360595703125},
            'data': {
                'label': 'MT',
                'entity': base_mt_entity,
                'destinationLanguage': 'Hindi' if i % 2 == 0 else 'Telugu'
            },
            # 'style': {'backgroundColor': 'lightgrey'},
            'type': 'MT',
            # 'width': 100,
            # 'height': 30,
            # 'selected': False,
            # 'positionAbsolute': {'x': 308.0171203613281, 'y': 12.913360595703125},
            # 'dragging': False
        }
        nodes.append(mt_node)

    edges = []
    for i in range(num_mt_nodes):
        source_id = f'dndnode_{i}'
        target_id = f'dndnode_{i + 1}'
        edge = {
            'source': source_id,
            'sourceHandle': 'b',
            'target': target_id,
            'targetHandle': None,
            'id': f'reactflow__edge-{source_id}b-{target_id}'
        }
        edges.append(edge)

    return {
        'nodes': nodes,
        'edges': edges,
        'mode': 'Automatic'
    }


if __name__ == "__main__":
    num_repetitions = int(input("Enter the number of MT nodes you'd like to have in your pipeline: "))
    pipeline_data = generate_mt_pipeline(num_repetitions)
    # print(pipeline_data)
    response = requests.post(url, json=pipeline_data, verify=False)
    print("Successfully executed." if response.status_code == 200 else "Failed to execute.")
    pipeline_total_execution_time = response.json()['pipeline_total_execution_time']
    models_cumulative_execution_time = response.json()['models_cumulative_execution_time']
    print(f"Pipeline total execution time: {pipeline_total_execution_time}, Cumulative model execution time: {models_cumulative_execution_time}")