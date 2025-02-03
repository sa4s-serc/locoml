import requests

url = "http://localhost:5001/nodeInfo"

def generate_asr_tts_pipeline(num_pairs: int) -> dict:
    base_asr_entity = {
        'objective': 'ASR',
        # 'destination_languages': [
        #     'Assamese', 'Bengali', 'Bodo', 'Dogri', 'Goan Konkani', 'Gujarati',
        #     'Hindi', 'Kannada', 'Kashmiri', 'Maithili', 'Malayalam', 'Manipuri',
        #     'Marathi', 'Nepali', 'Oriya', 'Punjabi', 'Sanskrit', 'Santali',
        #     'Sindhi', 'Tamil', 'Telugu', 'Urdu', 'English'
        # ],
        'model_id': 'ASR_2',
        'model_name': 'AI4Bharat Indic Trans V2',
        'index': 2,
        'API': 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
        'serviceId': 'ai4bharat/whisper-medium-en--gpu--t4'
    }

    base_tts_entity = {
        'objective': 'TTS',
        # 'destination_languages': [
        #     'Assamese', 'Bengali', 'Bodo', 'Dogri', 'Goan Konkani', 'Gujarati',
        #     'Hindi', 'Kannada', 'Kashmiri', 'Maithili', 'Malayalam', 'Manipuri',
        #     'Marathi', 'Nepali', 'Oriya', 'Punjabi', 'Sanskrit', 'Santali',
        #     'Sindhi', 'Tamil', 'Telugu', 'Urdu', 'English'
        # ],
        'model_id': 'TTS_1',
        'model_name': 'AI4Bharat Indic Trans V2',
        'index': 0,
        'API': 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
        'serviceId': 'ai4bharat/indic-tts-coqui-dravidian-gpu--t4'
    }

    nodes = [{
        'id': 'dndnode_0',
        # 'position': {'x': 307.51141357421875, 'y': -42.22442626953125},
        'data': {
            'label': 'Inputs',
            'entity': {},
            'link': 'https://bahubhashak-iiit.s3.us-east-2.amazonaws.com/translation/0O7RC7DGA5.wav',
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

    for i in range(num_pairs * 2):
        node_id = f'dndnode_{i + 1}'

        is_asr = i % 2 == 0

        node = {
            'id': node_id,
            'data': {
                'label': 'ASR' if is_asr else 'TTS',
                'entity': base_asr_entity if is_asr else base_tts_entity,
                'destinationLanguage': 'Telugu'
            },
            # 'style': {
            #     'backgroundColor': '#b0f2b4' if is_asr else '#ffef9f'
            # },
            'type': 'ASR' if is_asr else 'TTS'
        }
        nodes.append(node)

    edges = []
    for i in range(num_pairs * 2):
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
    num_pairs = int(input("Enter the number of ASR-TTS pairs you'd like to have in your pipeline: "))
    pipeline_data = generate_asr_tts_pipeline(num_pairs)
    # print(pipeline_data)
    response = requests.post(url, json=pipeline_data, verify=False)
    print("Successfully executed." if response.status_code == 200 else "Failed to execute.")
    pipeline_total_execution_time = response.json()['pipeline_total_execution_time']
    models_cumulative_execution_time = response.json()['models_cumulative_execution_time']
    print(f"Pipeline total execution time: {pipeline_total_execution_time}, Cumulative model execution time: {models_cumulative_execution_time}")
