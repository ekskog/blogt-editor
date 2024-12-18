require('dotenv').config();
var express = require('express');
var router = express.Router();

const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { FaceClient } = require('@azure/cognitiveservices-face');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

// Computer Vision credentials
const azkey = '8egnbOy4cmBKTtVWFlKFz0Nsj5c4muen0DmiZYA075AV802X7QJUJQQJ99ALACi5YpzXJ3w3AAAFACOG9cDi';
const endpoint = 'https://blogt-eye.cognitiveservices.azure.com/';

// Face API credentials
const faceKey = '33PxLl50btDRbU99fdJwBpdNJpVzIMxhd48B9NQRDI9QJObxjWzPJQQJ99ALACi5YpzXJ3w3AAAKACOGvSJF';
const faceEndpoint = 'https://blogt-faces.cognitiveservices.azure.com/';

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': azkey } }),
  endpoint
);

const faceClient = new FaceClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': faceKey } }),
  faceEndpoint
);

const azAnalyzer = async (imageUrl) => {
  try {
    // Analyze image features
    const features = ['Description', 'Tags', 'Objects'];
    const azResult = await computerVisionClient.analyzeImage(imageUrl, { visualFeatures: features });

    // Use the read API for text extraction
    const textResult = await computerVisionClient.read(imageUrl);
    const operationId = textResult.operationLocation.split('/').pop();

    let readResults;
    let status;
    // Polling the read result until it's done
    do {
      readResults = await computerVisionClient.getReadResult(operationId);
      status = readResults.status;
      if (status === 'notStarted' || status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } while (status === 'notStarted' || status === 'running');

    // Extract text content
    if (status === 'succeeded') {
      azResult.extractedText = readResults.analyzeResult.readResults
        .flatMap(page => page.lines)
        .map(line => line.text)
        .join(' ');
    }

    // Analyze faces using the Face API client
    const faceResults = await faceClient.face.detectWithUrl(imageUrl, {
      returnFaceId: false,
      returnFaceLandmarks: false,
      recognitionModel: 'recognition_01',
      detectionModel: 'detection_01'
    });

    azResult.faces = faceResults.map(face => ({
      faceRectangle: face.faceRectangle
    }));

    return azResult;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Updated route to handle the analysis and render the results
router.post('/', async (req, res) => {
  const imageUrl = req.body.imageUrl;
  const analysisResult = await azAnalyzer(imageUrl);
  console.log(analysisResult.extractedText);
  res.render('vision_results', { analysisResult });
});

module.exports = router;
