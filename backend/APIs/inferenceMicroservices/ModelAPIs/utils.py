"""
A file containing all the utility functions for all the API handlers.
"""
import time

from flask import jsonify
import os
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import random
import string
import base64


def uploadToS3Helper(file_path: str):
    """
    To upload a file to an S3 bucket and return the file URL.

    :param file_path: Path to the file to upload
    :return: URL of the uploaded file if successful, else None
    """

    # AWS credentials
    AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY')
    AWS_SECRET_KEY = os.getenv('AWS_SECRET_KEY')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')
    AWS_REGION = os.getenv('AWS_REGION')
    AWS_STORAGE_DIR = os.getenv('AWS_STORAGE_DIR')
    AWS_ACL = os.getenv('AWS_ACL')

    s3_client = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY,
                             aws_secret_access_key=AWS_SECRET_KEY, region_name=AWS_REGION)
    object_name = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in
                          range(10))  # generate a random string 10 chars in length.
    file_format = file_path.split('/')[-1].split('.')[-1]

    try:
        # Upload the file
        s3_client.upload_file(file_path, AWS_BUCKET_NAME, f"{AWS_STORAGE_DIR}/{object_name}.{file_format}",
                              ExtraArgs={'ACL': AWS_ACL})

        file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{AWS_STORAGE_DIR}/{object_name}.{file_format}"

        print(f"File '{file_path}' uploaded successfully to bucket '{AWS_BUCKET_NAME}'")
        print(f"File URL: {file_url}")
        return file_url

    except FileNotFoundError:
        print(f"The file {file_path} was not found")
    except NoCredentialsError:
        print("Credentials not available")
    except PartialCredentialsError:
        print("Incomplete credentials provided")
    except Exception as e:
        print(f"An error occurred: {e}")

    return "An error has occurred."


def uploadFileHandler(message: str, file_name: str, isBinary: bool) -> dict:
    start_time = time.time_ns()
    output_path = os.getenv('PROJECT_PATH') + 'Datasets/' + file_name + '.txt'
    open(output_path, 'w' if not isBinary else 'wb').write(message)
    message = uploadToS3Helper(output_path)
    os.remove(output_path)
    print(f"Time elapsed to upload data to AWS: {time.time_ns() - start_time} ns")

    return {"URL": message}

def uploadFileHandler_TTS(audio_content_base64: str, file_name: str, isBinary: bool) -> dict:
    start_time = time.time_ns()
    audio_data = base64.b64decode(audio_content_base64)
    output_path = os.getenv('PROJECT_PATH') + 'Datasets/' + file_name + '.wav'
    with open(output_path, 'wb' if isBinary else 'w') as audio_file:
        audio_file.write(audio_data)
    message = uploadToS3Helper(output_path)
    os.remove(output_path)
    print(f"Time elapsed to upload TTS byte data to AWS: {time.time_ns() - start_time} ns")

    return {"URL": message}

def uploadSavedFileHandler(file_path: str) -> dict:
    message = uploadToS3Helper(file_path)

    return {"URL": message}
