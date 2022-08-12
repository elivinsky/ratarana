import React, { useCallback, useEffect, useRef, useState } from 'react';
import CameraPhoto, { FACING_MODES } from 'jslib-html5-camera-photo';
import * as faceApi from 'face-api.js';
import Icon from '@mdi/react';
import { mdiCamera, mdiCameraFlip, mdiCameraRetake } from '@mdi/js';

import Loader from './Loader';

import rataImg from '../images/rata.jpg';
import ranaImg from '../images/rana.jpg';

const DIF_THRESHOLD = 0.6;

const RESULT = {
  RATA: {
    label: '🐹 Rata 🐹',
    color: '#CFCFC480',
  },
  RANA: {
    label: '🐸 Rana 🐸',
    color: '#C1E1C180',
  },
  ERROR: {
    label: '🐹 DUDOSO 🐸',
    color: '#FF696180',
  },
};

const Camera = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [picture, setPicture] = useState(null);
  const [result, setResult] = useState(null);
  const [facingMode, setFacingMode] = useState(FACING_MODES.USER);

  const videoRef = useRef(null);
  const cameraPhotoRef = useRef(null);
  const pictureRef = useRef(null);
  const rataImgRef = useRef(null);
  const ranaImgRef = useRef(null);

  const analyzeFace = useCallback(async () => {
    const faceDescriptor = await faceApi.computeFaceDescriptor(pictureRef.current);
    const rataDescriptor = await faceApi.computeFaceDescriptor(rataImgRef.current);
    const ranaDescriptor = await faceApi.computeFaceDescriptor(ranaImgRef.current);

    const faceMatcher = new faceApi.FaceMatcher([
      new faceApi.LabeledFaceDescriptors(
        'rata',
        [rataDescriptor],
      ), new faceApi.LabeledFaceDescriptors(
        'rana',
        [ranaDescriptor],
      ),
    ], DIF_THRESHOLD);
    const bestMatch = faceMatcher.findBestMatch(faceDescriptor);

    console.log(bestMatch);

    const newResult = {
      rata: RESULT.RATA,
      rana: RESULT.RANA,
      unknown: RESULT.ERROR,
    }[bestMatch.label];

    setResult(newResult);
    setAnalyzing(false);
  }, []);

  const initFaceApi = useCallback(async () => {
    if (videoRef.current.paused || videoRef.current.ended || !faceApi.nets.faceRecognitionNet.params) {
      requestAnimationFrame(initFaceApi);
      return;
    }

    setLoading(false);
  }, []);

  const takePic = useCallback(() => {
    const uri = cameraPhotoRef.current.getDataUri({});
    setPicture(uri);
    setAnalyzing(true);
    requestAnimationFrame(analyzeFace);
  }, [analyzeFace]);

  const retakePic = useCallback(() => {
    setPicture(null);
    setResult(null);
  }, []);

  const switchCam = useCallback(() => {
    setFacingMode((currentFacingMode) => {
      const newFacingMode = currentFacingMode === FACING_MODES.USER ? FACING_MODES.ENVIRONMENT : FACING_MODES.USER;
      cameraPhotoRef.current.startCamera(newFacingMode);
      return newFacingMode;
    });
  }, []);

  const resizeWindow = useCallback(() => {
    const width = window.innerWidth;
    const height = Math.min(width * 16 / 9, window.innerHeight);
    setSize({ width, height });
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      resizeWindow();
      window.addEventListener('resize', resizeWindow);

      cameraPhotoRef.current = new CameraPhoto(videoRef.current);

      Promise.all([
        cameraPhotoRef.current.startCamera(FACING_MODES.USER),
        faceApi.nets.faceRecognitionNet.loadFromUri(`${process.env.PUBLIC_URL}/models`),
      ]).then(() => {
        requestAnimationFrame(initFaceApi);
      });
    }

    return () => {
      window.removeEventListener('resize', resizeWindow);
    };
  }, [videoRef, initFaceApi, resizeWindow]);

  return (
    <>
      <div className="position-relative" style={size}>
        {loading && <Loader text="Cargando..." />}
        {analyzing && <Loader text="Analizando..." />}
        {picture && (
          <div className="overlay" style={size}>
            <img
              ref={pictureRef}
              src={picture}
              alt="Foto"
              className={facingMode === FACING_MODES.USER ? 'mirrored' : ''}
              style={{ width: size.width, height: 'auto' }}
            />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={size.width}
          height={size.height}
          className={facingMode === FACING_MODES.USER ? 'mirrored' : ''}
        ></video>
        {result && (
          <div className="result" style={{ backgroundColor: result.color }}>
            {result.label}
          </div>
        )}
        <div className="top-actions">
          {!picture && (
            <button className="btn btn-light btn-lg" onClick={switchCam}>
              <Icon path={mdiCameraFlip} size={1} />
            </button>
          )}
        </div>
        <div className="bottom-actions">
          {!picture ? (
            <button className="btn btn-light btn-lg" onClick={takePic}>
              <Icon path={mdiCamera} size={1} />
            </button>
          ) : (
            <button className="btn btn-light btn-lg" onClick={retakePic}>
              <Icon path={mdiCameraRetake} size={1} />
            </button>
          )}
        </div>
      </div>
      <div className="visually-hidden">
        <img ref={rataImgRef} src={rataImg} alt="Rata" width={1} height={1} />
        <img ref={ranaImgRef} src={ranaImg} alt="Rana" width={1} height={1} />
      </div>
    </>
  );
};

export default Camera;
