
import React, { useRef, useState, useCallback } from 'react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        onCapture(base64);
        stopCamera();
        onClose();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 flex justify-center">
          <button 
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="w-16 h-16 rounded-full bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center active:scale-95 transition-transform disabled:bg-slate-300"
          >
            <i className="fa-solid fa-camera text-white text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
