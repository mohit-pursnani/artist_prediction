import sys
import os
import json
import string
import time
import boto3
import io
import numpy as np
# Importing TensorFlow
import tensorflow as tf
from PIL import Image

# Loading model
model_path = './model/'
loaded_model = tf.saved_model.load(model_path)
dynamodb = boto3.client('dynamodb')
detector = loaded_model.signatures['default']
s3 = boto3.resource('s3')

def handler(event, context):
    ENDPOINT_NAME = os.environ['ENDPOINTNAME']

    bucket_name = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    key = key.replace("%CC%88","")

    print("file name: ",key)
    
    raw_img = readImageFromBucket(key, bucket_name).resize((224, 224), Image.NEAREST)

    web_image = tf.keras.utils.img_to_array(raw_img)
    web_image /= 255.
    client = boto3.client('runtime.sagemaker')
    response = client.invoke_endpoint(EndpointName=ENDPOINT_NAME,ContentType='application/json',Body=json.dumps({ "instances": [ web_image.tolist() ] }))
    response_body = response['Body'].read().decode('utf-8')
    result = json.loads(response_body)

    labels = {0: 'Vincent_van_Gogh', 1: 'Edgar_Degas', 2: 'Pablo_Picasso', 3: 'Pierre-Auguste_Renoir', 4: 'Albrecht_Dürer', 5: 'Paul_Gauguin', 6: 'Francisco_Goya', 7: 'Rembrandt', 8: 'Alfred_Sisley', 9: 'Titian', 10: 'Marc_Chagall'}
    print("result: ",result)

    prediction_probability = np.amax(result['predictions'])*100

    prediction_probability = str(round(prediction_probability, 2))+"%"
    prediction_idx = np.argmax(result['predictions'])

    predicted_artist = labels[prediction_idx].replace('_', ' ')

    print("prediction_idx: ",prediction_idx)

    print("Predicted artist =", labels[prediction_idx].replace('_', ' '))

    print("Prediction probability =", prediction_probability)

    response = {
        "prediction" : [{
            "type" : "unstructured",
            "unstructured" : {
              "predicted_artist" : predicted_artist,
              "prediction_probability" : prediction_probability   
            }
            
        }]
    }
    dynamodb.put_item(TableName='prediction_response', Item={'file_name':{'S':key},'predicted_artist':{'S':predicted_artist}, 'prediction_probability':{'S':prediction_probability}})
    print("response: ",response)
    
    return response

def readImageFromBucket(key, bucket_name):
  bucket = s3.Bucket(bucket_name)
  object = bucket.Object(key)
  response = object.get()
  return Image.open(response['Body'])