"use client";
import type React from "react";
import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

export default function WebcamAscii() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

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
  }, [isVideoReady]);

  const captureAndProcess = () => {
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;

    if (webcam && canvas) {
      const video = webcam.video;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const { videoWidth, videoHeight } = video;
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
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

    // ASCII characters from darkest to lightest
    const asciiChars = " .:-=+*#%@".split("");

    // Adjust these values to change the density of the ASCII art
    const charWidth = 5;
    const charHeight = 5;

    ctx.fillStyle = "white";
    ctx.font = `${charHeight}px monospace`;
    ctx.textBaseline = "top";

    for (let y = 0; y < height; y += charHeight) {
      for (let x = 0; x < width; x += charWidth) {
        // Sample the brightness from the original image
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

        // Map brightness to ASCII character
        const charIndex = Math.floor(
          (brightness / 255) * (asciiChars.length - 1)
        );
        const char = asciiChars[charIndex];

        // Draw the ASCII character
        ctx.fillText(char, x, y);
      }
    }
  };

  const handleVideoReady = () => {
    setIsVideoReady(true);
  };

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
    </div>
  );
}
