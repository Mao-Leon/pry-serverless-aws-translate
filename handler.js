'use strict';

const  { TranslateClient, TranslateTextCommand } = require( "@aws-sdk/client-translate");

const translateClient = new TranslateClient({region: process.env.REGION});

module.exports.transformarApi = async (event) => {
const translated={}

const evtBodyObj = JSON.parse(event.body);
const urlInput = (evtBodyObj.url); 

console.log("evtBodyObj ---->" + evtBodyObj);
console.log("urlInput ----> " + urlInput);

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

      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            data: data,
            keysTranslated: translated,
            input: event
          },
        ),
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
      body: JSON.stringify({
        response
      })
    };

  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify(err)
    };
  }

};
