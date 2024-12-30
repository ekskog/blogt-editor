const express = require('express');
const router = express.Router();

const path = require('path');
const keyDir = path.join(__dirname, '..');

// Imports the Vision library
const {ImageAnnotatorClient} = require('@google-cloud/vision').v1;

// Instantiates a client
const visionClient = new ImageAnnotatorClient({
  keyFilename: keyDir + '/gcp-vision.json'
});


router.post('/', async (req, res) => {
  const imageUrl = req.body.imageUrl; // Assuming you're sending the image URL in the request body

  try {
    const [labelDetectionResult] = await visionClient.labelDetection(imageUrl);
    const [landmarkDetectionResult] = await visionClient.landmarkDetection(imageUrl);
    const [faceDetectionResult] = await visionClient.faceDetection(imageUrl);
    const [textDetectionResult] = await visionClient.textDetection(imageUrl);

    const labels = labelDetectionResult.labelAnnotations;
    const landmarks = landmarkDetectionResult.landmarkAnnotations;
    const faces = faceDetectionResult.faceAnnotations;
    const text = textDetectionResult.fullTextAnnotation;
  
    // Process the results as needed
    debug('Labels:', labels);
    debug('Landmarks:', landmarks);
    debug('Faces:', faces);
    debug('Text:', text);
  } catch (error) {
    console.error('Error:', error);
  }
});

module.exports = router;