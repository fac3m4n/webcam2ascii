"use client";
import type React from "react";
import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

export default function WebcamAscii() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [charSize, setCharSize] = useState(10);
  const [contrast, setContrast] = useState(1.2);

  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      captureAndProcess();
      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isVideoReady) {
      processFrame();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVideoReady, charSize, contrast]);

  const captureAndProcess = () => {
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;

    if (webcam && canvas) {
      const video = webcam.video;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
          processImageData(imageData, ctx);
        }
      }
    }
  };

  const processImageData = (
    imageData: ImageData,
    ctx: CanvasRenderingContext2D
  ) => {
    const { width, height, data } = imageData;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const asciiChars =
      ' .`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'.split(
        ""
      );

    const charWidth = charSize;
    const charHeight = charSize;

    ctx.fillStyle = "white";
    ctx.font = `bold ${charHeight}px "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.textRendering = "geometricPrecision";

    for (let y = 0; y < height; y += charHeight) {
      for (let x = 0; x < width; x += charWidth) {
        let totalBrightness = 0;
        let sampleCount = 0;

        for (let sy = 0; sy < charHeight && y + sy < height; sy += 2) {
          for (let sx = 0; sx < charWidth && x + sx < width; sx += 2) {
            const i = ((y + sy) * width + (x + sx)) * 4;
            const r = data[i] * contrast;
            const g = data[i + 1] * contrast;
            const b = data[i + 2] * contrast;
            const pixelBrightness = (r + g + b) / 3;
            totalBrightness += pixelBrightness;
            sampleCount++;
          }
        }

        const avgBrightness =
          sampleCount > 0 ? totalBrightness / sampleCount : 0;

        const charIndex = Math.floor(
          (Math.min(255, avgBrightness) / 255) * (asciiChars.length - 1)
        );
        const char = asciiChars[charIndex];

        ctx.fillText(char, x, y);
      }
    }
  };

  const captureAndSaveImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const saveCanvas = document.createElement("canvas");
      const ctx = saveCanvas.getContext("2d");

      saveCanvas.width = canvas.width * 2;
      saveCanvas.height = canvas.height * 2;

      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);

        ctx.drawImage(canvas, 0, 0, saveCanvas.width, saveCanvas.height);

        const dataUrl = saveCanvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `ascii-webcam-${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-")}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

  const increaseCharSize = () => setCharSize((prev) => Math.min(prev + 1, 20));
  const decreaseCharSize = () => setCharSize((prev) => Math.max(prev - 1, 4));
  const increaseContrast = () =>
    setContrast((prev) => Math.min(prev + 0.1, 2.0));
  const decreaseContrast = () =>
    setContrast((prev) => Math.max(prev - 0.1, 0.5));

  return (
    <div className="relative w-screen h-screen">
      <Webcam
        ref={webcamRef}
        audio={false}
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={handleVideoReady}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute top-4 right-4 bg-black/70 p-3 rounded-lg z-10 text-white">
        <div className="mb-2">
          <span className="mr-2">Character Size: {charSize}</span>
          <button
            onClick={decreaseCharSize}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded mr-1"
          >
            -
          </button>
          <button
            onClick={increaseCharSize}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          >
            +
          </button>
        </div>
        <div>
          <span className="mr-2">Contrast: {contrast.toFixed(1)}</span>
          <button
            onClick={decreaseContrast}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded mr-1"
          >
            -
          </button>
          <button
            onClick={increaseContrast}
            className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={captureAndSaveImage}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full z-10"
      >
        Take Picture
      </button>
    </div>
  );
}
