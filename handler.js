'use strict';

const  { TranslateClient, TranslateTextCommand } = require( "@aws-sdk/client-translate");
const { DynamoDBClient } = require( "@aws-sdk/client-dynamodb");
const { PutCommand, ScanCommand, DynamoDBDocumentClient } = require( "@aws-sdk/lib-dynamodb");

const uuidv1 = require('uuid').v1;


//Cliente traductor
const translateClient = new TranslateClient({region: process.env.REGION});
//Cliente DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);


module.exports.transformarApi = async (event) => {
const translated={}

const evtBodyObj = JSON.parse(event.body);
const urlInput = (evtBodyObj.url); 

  if (!!urlInput) {
    const response = await fetch(urlInput);
    const data = await response.json();

    console.log(JSON.stringify(data))

    if (response.status === 200) {

      for (let key in data) {
        const command = new TranslateTextCommand({
          SourceLanguageCode: 'en',
          TargetLanguageCode: 'es',
          Text: key
        });

        const translatedKey = await translateClient.send(command);
        const normalizedKey = translatedKey.TranslatedText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(' ', '_');
        translated[normalizedKey] = data[key];
      }

      translated.userId = uuidv1();

      const params = {
        TableName: process.env.USER_DATA_TRSLT_TABLE,
        Item: translated
      };
    
      const command = new PutCommand(params)
    
      const response = await docClient.send(command);
      console.log(response);

      return {
        statusCode: 200,
        body: JSON.stringify({
            data: data,
            keysTranslated: translated,
            response: response
          }),
      };

    } else {
      console.log('error');
    }

  }else{
    return {
      statusCode: 500,
      body: 'Error: Invalid URL parameter on body request, must be like this: { "url":"https://swapi.dev/api/people/1/" }'
    };
  }

};

module.exports.consultarUsuarios = async () => {
  const command = new ScanCommand({
    TableName: process.env.USER_DATA_TRSLT_TABLE,
  });

  try {
    const response = await docClient.send(command);
    console.log(response);

    return {
      statusCode: 200,
      body: '<pre>'+ JSON.stringify({ items: response.Items, ScannedCount: response.ScannedCount },null,'\t')+'</pre>',
      headers: {
        'Content-Type': 'text/html'
      }
    };

  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify(err)
    };
  }

};
