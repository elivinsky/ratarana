import React, { useCallback, useEffect, useRef, useState } from 'react';
import CameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';
import * as faceApi from 'face-api.js';

import rataImg from '../images/rata.jpg';
import ranaImg from '../images/rana.jpg';

const RESULT = {
  RATA: {
    label: 'Rata',
    boxColor: '#ff0000',
  },
  RANA: {
    label: 'Rana',
    boxColor: '#00ff00',
  },
};

const Camera = () => {
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rataImgRef = useRef(null);
  const ranaImgRef = useRef(null);

  const faceFound = useCallback(async (faceDetection) => {
    const faceDescriptor = await faceApi.computeFaceDescriptor(videoRef.current);
    const rataDescriptor = await faceApi.computeFaceDescriptor(rataImgRef.current);
    const ranaDescriptor = await faceApi.computeFaceDescriptor(ranaImgRef.current);

    const distanceRata = faceApi.euclideanDistance(faceDescriptor, rataDescriptor);
    const distanceRana = faceApi.euclideanDistance(faceDescriptor, ranaDescriptor);

    const result = distanceRata < distanceRana ? RESULT.RATA : RESULT.RANA;

    const dims = faceApi.matchDimensions(canvasRef.current, videoRef.current, true);
    const detection = faceApi.resizeResults(faceDetection, dims);
    new faceApi.draw.DrawBox(detection.box, result).draw(canvasRef.current);
  }, []);

  const initFaceApi = useCallback(async () => {
    if (videoRef.current.paused || videoRef.current.ended || !faceApi.nets.ssdMobilenetv1.params) {
      setTimeout(initFaceApi);
      return;
    }

    setLoading(false);
    const faceDetection = await faceApi.detectSingleFace(videoRef.current, new faceApi.SsdMobilenetv1Options());
    faceFound(faceDetection);

    requestAnimationFrame(initFaceApi);
  }, [faceFound]);

  useEffect(() => {
    if (videoRef.current) {
      const cameraPhoto = new CameraPhoto(videoRef.current);
      cameraPhoto.startCamera(FACING_MODES.USER);

      Promise.all([
        faceApi.nets.ssdMobilenetv1.loadFromUri(`${process.env.PUBLIC_URL}/models`),
        faceApi.nets.faceRecognitionNet.loadFromUri(`${process.env.PUBLIC_URL}/models`),
      ]).then(() => {
        initFaceApi();
      });
    }
  }, [videoRef, initFaceApi]);

  return (
    <>
      <div className="videoContainer">
        {loading && <div className="videoOverlay videoLoader">Loading...</div>}
        <canvas className="videoOverlay" ref={canvasRef}></canvas>
        <video className="video" ref={videoRef} autoPlay></video>
      </div>
      <div style={{ visibility: 'hidden' }}>
        <img ref={rataImgRef} src={rataImg} alt="Rata" width={1} height={1} />
        <img ref={ranaImgRef} src={ranaImg} alt="Rana" width={1} height={1} />
      </div>
    </>
  );
};

export default Camera;
