"use client";
import type React from "react";
import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

// Define color schemes
type ColorScheme = {
  name: string;
  process: (r: number, g: number, b: number, contrast: number) => string;
};

export default function WebcamAscii() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [charSize, setCharSize] = useState(10);
  const [contrast, setContrast] = useState(1.2);
  const [colorMode, setColorMode] = useState<string>("monochrome");

  // Define color schemes
  const colorSchemes: Record<string, ColorScheme> = {
    monochrome: {
      name: "Monochrome",
      process: () => {
        // Standard monochrome processing
        return "white";
      },
    },
    fullColor: {
      name: "Full Color",
      process: (r, g, b, contrast) => {
        // Apply contrast
        r = Math.min(255, r * contrast);
        g = Math.min(255, g * contrast);
        b = Math.min(255, b * contrast);
        return `rgb(${r}, ${g}, ${b})`;
      },
    },
    sepia: {
      name: "Sepia",
      process: (r, g, b, contrast) => {
        // Apply sepia tone
        const tr = Math.min(
          255,
          (r * 0.393 + g * 0.769 + b * 0.189) * contrast
        );
        const tg = Math.min(
          255,
          (r * 0.349 + g * 0.686 + b * 0.168) * contrast
        );
        const tb = Math.min(
          255,
          (r * 0.272 + g * 0.534 + b * 0.131) * contrast
        );
        return `rgb(${tr}, ${tg}, ${tb})`;
      },
    },
    neon: {
      name: "Neon",
      process: (r, g, b, contrast) => {
        // Create a neon effect by enhancing the dominant color
        const max = Math.max(r, g, b);
        let nr = r,
          ng = g,
          nb = b;

        if (max === r) nr = Math.min(255, r * 1.5 * contrast);
        if (max === g) ng = Math.min(255, g * 1.5 * contrast);
        if (max === b) nb = Math.min(255, b * 1.5 * contrast);

        return `rgb(${nr}, ${ng}, ${nb})`;
      },
    },
    matrix: {
      name: "Matrix",
      process: (r, g, b, contrast) => {
        // Matrix green effect
        const brightness = (r + g + b) / 3;
        const green = Math.min(255, brightness * contrast);
        return `rgb(0, ${green}, 0)`;
      },
    },
  };

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
  }, [isVideoReady, charSize, contrast, colorMode]);

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

    const asciiChars = " .:-=+*#%@".split("");

    const charWidth = charSize;
    const charHeight = charSize;

    ctx.textBaseline = "top";
    ctx.font = `bold ${charHeight}px "Courier New", monospace`;
    ctx.textRendering = "geometricPrecision";

    const colorScheme = colorSchemes[colorMode] || colorSchemes.monochrome;

    for (let y = 0; y < height; y += charHeight) {
      for (let x = 0; x < width; x += charWidth) {
        let totalR = 0,
          totalG = 0,
          totalB = 0;
        let totalBrightness = 0;
        let sampleCount = 0;

        for (let sy = 0; sy < charHeight && y + sy < height; sy += 2) {
          for (let sx = 0; sx < charWidth && x + sx < width; sx += 2) {
            const i = ((y + sy) * width + (x + sx)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            totalR += r;
            totalG += g;
            totalB += b;

            const pixelBrightness = (r + g + b) / 3;
            totalBrightness += pixelBrightness;
            sampleCount++;
          }
        }

        if (sampleCount > 0) {
          const avgBrightness = totalBrightness / sampleCount;
          const avgR = totalR / sampleCount;
          const avgG = totalG / sampleCount;
          const avgB = totalB / sampleCount;

          const charIndex = Math.floor(
            (Math.min(255, avgBrightness) / 255) * (asciiChars.length - 1)
          );
          const char = asciiChars[charIndex];

          // Apply color based on selected color scheme
          ctx.fillStyle = colorScheme.process(avgR, avgG, avgB, contrast);
          ctx.fillText(char, x, y);
        }
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
        <div className="mb-2">
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
        <div>
          <span className="mr-2">Color Mode:</span>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded"
          >
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <option key={key} value={key}>
                {scheme.name}
              </option>
            ))}
          </select>
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
