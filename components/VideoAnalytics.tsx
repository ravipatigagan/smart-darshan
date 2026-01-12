
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, ShieldCheck, Eye, Loader2, RefreshCw } from 'lucide-react';
import { CrowdMetric } from '../types';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const FEED_SOURCES = [
  { 
    id: 'kalyan', 
    name: 'Kalyanotsavam (Special Feed)', 
    zone: 'Main Temple Area', 
    videoUrl: 'input_file_0.mp4' 
  },
  { id: '1', name: 'South Raja Gopuram (Live)', zone: 'Main Entry' },
  { id: '2', name: 'Kesakandana Sala', zone: 'Tonsuring Area' },
  { id: '3', name: 'Annadanam Hall', zone: 'Dining Area' },
  { id: '4', name: 'Prasadam Preparation', zone: 'Kitchen' },
  { id: '6', name: 'Darshan Queue Complex', zone: 'Internal' },
];

interface VideoAnalyticsProps {
  isOffline?: boolean;
}

export const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ isOffline = false }) => {
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [realTimePersonCount, setRealTimePersonCount] = useState<number>(0);
  const [kalyanPersonCount, setKalyanPersonCount] = useState<number>(0);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState<Record<string, 'loading' | 'playing' | 'error'>>({});
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const kalyanVideoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const kalyanCanvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const requestRef = useRef<number>();

  // Ensure canvas size matches display size precisely
  const syncCanvasSize = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (video && canvas) {
      const { clientWidth, clientHeight } = video;
      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        canvas.width = clientWidth;
        canvas.height = clientHeight;
      }
    }
  };

  const drawPredictions = (video: HTMLVideoElement, canvas: HTMLCanvasElement, predictions: cocoSsd.DetectedObject[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState < 2) return;
    
    syncCanvasSize(video, canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledW = width * scaleX;
      const scaledH = height * scaleY;

      // Draw bounding box
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

      // Draw label background
      ctx.fillStyle = '#f97316';
      const label = `PILGRIM ${Math.round(prediction.score * 100)}%`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      
      // Label tag
      ctx.fillRect(scaledX, scaledY - 22, textWidth + 10, 22);

      // Label text
      ctx.fillStyle = 'white';
      ctx.fillText(label, scaledX + 5, scaledY - 7);
      
      // Corner accents for high-tech look
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaledX, scaledY + 20);
      ctx.lineTo(scaledX, scaledY);
      ctx.lineTo(scaledX + 20, scaledY);
      ctx.stroke();
    });
  };

  const detect = useCallback(async () => {
    if (modelRef.current) {
      // 1. Live Webcam Feed Detection
      if (webcamRef.current && webcamCanvasRef.current && webcamRef.current.readyState >= 2) {
        try {
          const predictions = await modelRef.current.detect(webcamRef.current);
          const persons = predictions.filter(p => p.class === 'person');
          setRealTimePersonCount(persons.length);
          drawPredictions(webcamRef.current, webcamCanvasRef.current, persons);
        } catch (err) {
          console.warn("Detection error on webcam:", err);
        }
      }

      // 2. Kalyanotsavam Video Feed Detection (Stable Overlay)
      if (kalyanVideoRef.current && kalyanCanvasRef.current && kalyanVideoRef.current.readyState >= 2) {
        // Recovery: if for some reason it's stuck, force play
        if (kalyanVideoRef.current.paused && kalyanVideoRef.current.readyState >= 2) {
          kalyanVideoRef.current.play().catch(() => {});
        }
        
        try {
          const predictions = await modelRef.current.detect(kalyanVideoRef.current);
          const persons = predictions.filter(p => p.class === 'person');
          setKalyanPersonCount(persons.length);
          drawPredictions(kalyanVideoRef.current, kalyanCanvasRef.current, persons);
        } catch (err) {
          console.warn("Detection error on kalyan video:", err);
        }
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    const setup = async () => {
      try {
        // Pre-warm the AI model
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelRef.current = model;
        setIsModelLoading(false);
        
        // Setup Webcam for South Gate Feed
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } 
          });
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            webcamRef.current.onloadedmetadata = () => {
              webcamRef.current?.play().catch(e => console.warn("Webcam play failed", e));
            };
          }
        } catch (mediaError) {
          console.warn("Webcam access denied or unavailable:", mediaError);
        }

        // Start Detection Loop
        requestRef.current = requestAnimationFrame(detect);
      } catch (e) { 
        console.error("CV Setup Error:", e); 
      }
    };
    setup();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (webcamRef.current?.srcObject) {
        (webcamRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [detect]);

  // Update Metrics based on AI Counts
  useEffect(() => {
    const update = () => {
      const m = FEED_SOURCES.map((f, i) => {
        let density = 0;
        if (f.id === 'kalyan') {
          // Base density from AI count + organic noise
          density = Math.min(100, (kalyanPersonCount * 6) + (Math.random() * 5) + 20); 
        }
        else if (f.id === '1') {
          density = Math.min(100, (realTimePersonCount * 10) + (Math.random() * 10) + 10);
        }
        else {
          density = Math.floor(Math.random() * 25) + 30;
        }

        return {
          zoneId: f.id,
          zoneName: f.name,
          density: Math.round(density),
          status: density > 80 ? 'CRITICAL' : density > 55 ? 'MODERATE' : 'SAFE',
          flowRate: Math.floor(Math.random() * 20) + 15,
          trend: Math.random() > 0.6 ? 'UP' : Math.random() > 0.3 ? 'STABLE' : 'DOWN'
        } as CrowdMetric;
      });
      setMetrics(m);
    };
    const interval = setInterval(update, 2500);
    return () => clearInterval(interval);
  }, [realTimePersonCount, kalyanPersonCount]);

  const handleVideoRetry = (id: string) => {
    if (id === 'kalyan' && kalyanVideoRef.current) {
      kalyanVideoRef.current.load();
      kalyanVideoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="space-y-4">
      {/* Global AI Status Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border-l-4 border-orange-500 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-orange-600/20 p-3 rounded-xl border border-orange-500/30">
                {isModelLoading ? <Loader2 className="text-orange-500 animate-spin" size={28} /> : <Eye className="text-orange-500" size={28} />}
            </div>
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 mb-0.5 uppercase tracking-[0.2em]">
                    <Activity size={14} className="animate-pulse" /> 
                    {isModelLoading ? 'Neural Kernel Loading...' : 'AI Vision Core: Online'}
                </div>
                <p className="text-xs font-mono text-slate-400">Telemetry: Processing Standard & Kalyanotsavam Hubs</p>
            </div>
         </div>
         <div className="flex gap-10 w-full md:w-auto justify-between md:justify-end px-2">
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kalyanotsavam Area</p>
                <p className="text-2xl font-black text-white">{kalyanPersonCount} <span className="text-[10px] text-slate-500">Live</span></p>
            </div>
            <div className="text-right border-l border-slate-700 pl-10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">South Entrance</p>
                <p className="text-2xl font-black text-white">{realTimePersonCount} <span className="text-[10px] text-slate-500">Live</span></p>
            </div>
         </div>
      </div>

      {/* Video Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEED_SOURCES.map((f, i) => (
          <div key={f.id} className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 group shadow-2xl">
             {f.id === 'kalyan' ? (
                 <>
                    <video 
                        ref={kalyanVideoRef} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        src={f.videoUrl} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        preload="auto"
                        crossOrigin="anonymous"
                        onPlay={() => setVideoStatus(prev => ({...prev, kalyan: 'playing'}))}
                        onError={() => setVideoStatus(prev => ({...prev, kalyan: 'error'}))}
                    />
                    <canvas ref={kalyanCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                    {videoStatus.kalyan === 'error' && (
                      <div className="absolute inset-0 z-30 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <RefreshCw size={24} className="text-slate-500" />
                        <p className="text-[10px] text-white font-black uppercase tracking-widest">Feed Connection Lost</p>
                        <button onClick={() => handleVideoRetry('kalyan')} className="px-4 py-2 bg-orange-600 text-white text-[8px] font-black uppercase rounded-lg">Reconnect</button>
                      </div>
                    )}
                 </>
             ) : f.id === '1' ? (
                 <>
                    <video 
                      ref={webcamRef} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      muted 
                      playsInline 
                    />
                    <canvas ref={webcamCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                 </>
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-800 bg-slate-950">
                    <div className="text-center">
                        <Activity size={32} className="mx-auto mb-3 opacity-10" />
                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Encrypted Relay: SVSD_CAM_{f.id}</p>
                    </div>
                 </div>
             )}
             
             {isModelLoading && (
                 <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
                     <div className="text-center space-y-3">
                        <Loader2 className="text-orange-500 animate-spin mx-auto" size={32} />
                        <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Synchronizing Neural Map...</p>
                     </div>
                 </div>
             )}

             {/* UI Overlay on Video */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 p-4 flex flex-col justify-between z-20 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] bg-orange-600 text-white px-3 py-1 rounded-full shadow-lg font-black uppercase tracking-widest self-start">{f.name}</span>
                      <span className="text-[8px] font-black text-white/50 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-start">ZONE: {f.zone}</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/40 bg-black/20 px-2 py-1 rounded-md">{new Date().toLocaleTimeString([], {hour12: false})}</span>
                </div>
                
                <div className="flex justify-between items-end">
                    <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] text-white/50 uppercase font-black tracking-widest mb-1">Live Crowd Index</p>
                        <div className="flex items-end gap-1">
                          <p className="text-2xl text-white font-black leading-none">{metrics[i]?.density || 0}</p>
                          <span className="text-[10px] font-black text-white/40 mb-0.5">%</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                           <div className={`w-2 h-2 rounded-full ${(metrics[i]?.density || 0) > 80 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                           <span className="text-[8px] font-black text-white uppercase tracking-tighter">Status: {metrics[i]?.status}</span>
                        </div>
                        <ShieldCheck size={20} className="text-indigo-400 drop-shadow-lg" />
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
