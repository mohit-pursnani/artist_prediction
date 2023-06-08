import json
import boto3
import requests
import inflect
inflect = inflect.engine()

dynamodb = boto3.client('dynamodb')

def unmarshal_dynamodb_json(node):
    data = dict({})
    data['M'] = node
    return _unmarshal_value(data)

def _unmarshal_value(node):
    if type(node) is not dict:
        return node
    for key, value in node.items():
        # S – String - return string
        # N – Number - return int or float (if includes '.')
        # B – Binary - not handled
        # BOOL – Boolean - return Bool
        # NULL – Null - return None
        # M – Map - return a dict
        # L – List - return a list
        # SS – String Set - not handled
        # NN – Number Set - not handled
        # BB – Binary Set - not handled
        key = key.lower()
        if key == 'bool':
            return value
        if key == 'null':
            return None
        if key == 's':
            return value
        if key == 'n':
            if '.' in str(value):
                return float(value)
            return int(value)
        if key in ['m', 'l']:
            if key == 'm':
                data = {}
                for key1, value1 in value.items():
                    if key1.lower() == 'l':
                        data = [_unmarshal_value(n) for n in value1]
                    else:
                        if type(value1) is not dict:
                            return _unmarshal_value(value)
                        data[key1] = _unmarshal_value(value1)
                return data
            data = []
            for item in value:
                data.append(_unmarshal_value(item))
            return data

def push_to_lex(query):
    lex = boto3.client('lex-runtime')
    response = lex.post_text(
        botName='GetArtPieces',                 
        botAlias='prod',
        userId="root",           
        inputText=query
    )
    print("lex-response", response)
    labels = []
    if 'slots' not in response:
        print("No photo collection for query {}".format(query))
    else:
        print ("slot: ",response['slots'])
        slot_val = response['slots']
        for key,value in slot_val.items():
            if value!=None:
                labels.append(value)
    return labels


def search_elastic_search(label):
    region = 'us-east-1' 
    service = 'es'
    url = 'https://search-artpieces-cqdhcvbb4lifsdef5ow2evcpfi.us-east-1.es.amazonaws.com/artpieces/_search?q='
    resp = []
    url2 = url+label
    resp.append(requests.get(url2, auth=('sa', 'Newuser@543')).json())            
    
    print ("RESPONSE" , resp)
    return resp

def getFileName(searchRespone):
    output = []
    print("searchRespone: ",searchRespone)
    for r in searchRespone:
        if 'hits' in r:
             for val in r['hits']['hits']:
                key = val['_source']['objectKey']
                if key not in output:
                    output.append(key)
    print("output: ",output)
    
    return output


def form_s3_url(searchRespone):
    output = []
    print("searchRespone: ",searchRespone)
    for r in searchRespone:
        if 'hits' in r:
             for val in r['hits']['hits']:
                key = val['_source']['objectKey']
                if key not in output:
                    output.append("https://artpiecesstorage.s3.amazonaws.com/"+key)
    print("output: ",output)
    
    return output


def lambda_handler(event, context):
    q = event['queryStringParameters']['q']
    print(q)
    img_paths = []
    outputArray= []
    labels = push_to_lex(q)
    print("labels", labels)
    if len(labels) != 0:
        for label in labels:
            if (label is not None) and label != '':
                response = search_elastic_search(label)
                print("response: ",response)
                img_paths += getFileName(response)
                    
    img_paths = list(set(img_paths))

    product_json_list = []

    for product in img_paths:
        dynamodb_response = dynamodb.get_item(TableName='product_details', Key={'file_name':{'S':product}})
        print("dynamodb_response: ",dynamodb_response)
        if "Item" in dynamodb_response:
            unmarshalled_data = unmarshal_dynamodb_json(dynamodb_response['Item'])
            if unmarshalled_data:
                s1 = json.dumps(unmarshalled_data)
                d2 = json.loads(s1)
                print("unmarshalled_data: ",d2)
                d2['file_name'] = "https://artpiecesstorage.s3.amazonaws.com/"+d2['file_name']
                product_json_list.append(d2)
    print("product_json_list: ",product_json_list)
    if not product_json_list:
        return{
            'statusCode':404,
            'headers': {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"*","Access-Control-Allow-Headers": "*"},
            'body': json.dumps('No Results found')
        }
    else:  
        return{
            'statusCode': 200,
            'headers': {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"*","Access-Control-Allow-Headers": "*"},
            'body': json.dumps(product_json_list)
        }