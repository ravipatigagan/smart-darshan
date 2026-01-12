
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Activity, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { CrowdMetric } from '../types';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const FEED_SOURCES = [
  { 
    id: 'kalyan', 
    name: 'Kalyanotsavam Special Feed', 
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
  const [videoState, setVideoState] = useState<Record<string, 'loading' | 'playing' | 'error'>>({});
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const kalyanVideoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const kalyanCanvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const requestRef = useRef<number>();

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

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

      ctx.fillStyle = '#f97316';
      const label = `PILGRIM ${Math.round(prediction.score * 100)}%`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(scaledX, scaledY - 22, textWidth + 10, 22);

      ctx.fillStyle = 'white';
      ctx.fillText(label, scaledX + 5, scaledY - 7);
      
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
          // Suppress
        }
      }

      // 2. Kalyanotsavam Video Feed Detection (Stable Overlay)
      if (kalyanVideoRef.current && kalyanCanvasRef.current && kalyanVideoRef.current.readyState >= 2) {
        try {
          const predictions = await modelRef.current.detect(kalyanVideoRef.current);
          const persons = predictions.filter(p => p.class === 'person');
          setKalyanPersonCount(persons.length);
          drawPredictions(kalyanVideoRef.current, kalyanCanvasRef.current, persons);
        } catch (err) {
          // Suppress
        }
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  }, []);

  // Force Playback Recovery (Specifically for Kalyanotsavam Feed)
  const ensureKalyanPlayback = useCallback(() => {
    const video = kalyanVideoRef.current;
    if (video) {
      if (video.paused || video.ended) {
        video.play().catch(() => {
          // Log internally, retry after delay
          setTimeout(ensureKalyanPlayback, 1000);
        });
      }
    }
  }, []);

  useEffect(() => {
    const setup = async () => {
      try {
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelRef.current = model;
        setIsModelLoading(false);
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } 
          });
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
            webcamRef.current.play().catch(() => {});
          }
        } catch (mediaError) {
          // Silent
        }

        requestRef.current = requestAnimationFrame(detect);
      } catch (e) { 
        console.error("AI Initialization Error:", e); 
      }
    };
    setup();
    
    const checkInterval = setInterval(ensureKalyanPlayback, 2000);

    return () => {
      clearInterval(checkInterval);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (webcamRef.current?.srcObject) {
        (webcamRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [detect, ensureKalyanPlayback]);

  useEffect(() => {
    const update = () => {
      const m = FEED_SOURCES.map((f, i) => {
        let density = 0;
        if (f.id === 'kalyan') {
          density = Math.min(100, (kalyanPersonCount * 8) + (Math.random() * 5) + 30); 
        } else if (f.id === '1') {
          density = Math.min(100, (realTimePersonCount * 12) + (Math.random() * 10) + 10);
        } else {
          density = Math.floor(Math.random() * 30) + 20;
        }

        return {
          zoneId: f.id,
          zoneName: f.name,
          density: Math.round(density),
          status: density > 85 ? 'CRITICAL' : density > 55 ? 'MODERATE' : 'SAFE',
          flowRate: Math.floor(Math.random() * 20) + 15,
          trend: Math.random() > 0.6 ? 'UP' : Math.random() > 0.3 ? 'STABLE' : 'DOWN'
        } as CrowdMetric;
      });
      setMetrics(m);
    };
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, [realTimePersonCount, kalyanPersonCount]);

  return (
    <div className="space-y-4">
      {/* AI Vision Status Hub */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border-l-4 border-orange-500 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-orange-600/20 p-3 rounded-xl border border-orange-500/30">
                {isModelLoading ? <Loader2 className="text-orange-500 animate-spin" size={28} /> : <Eye className="text-orange-500" size={28} />}
            </div>
            <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 mb-0.5 uppercase tracking-[0.2em]">
                    <Activity size={14} className="animate-pulse" /> 
                    {isModelLoading ? 'Neural Kernel Loading...' : 'AI Vision Core: Operational'}
                </div>
                <p className="text-xs font-mono text-slate-400">Integrated Feeds: South Entrance & Kalyanotsavam Special</p>
            </div>
         </div>
         <div className="flex gap-10 w-full md:w-auto justify-between md:justify-end px-2">
            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kalyanotsavam Hub</p>
                <p className="text-2xl font-black text-white">{kalyanPersonCount} <span className="text-[10px] text-slate-500">Live AI Count</span></p>
            </div>
            <div className="text-right border-l border-slate-700 pl-10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">South Entrance</p>
                <p className="text-2xl font-black text-white">{realTimePersonCount} <span className="text-[10px] text-slate-500">Live AI Count</span></p>
            </div>
         </div>
      </div>

      {/* Video Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEED_SOURCES.map((f, i) => (
          <div key={f.id} className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 group shadow-2xl flex flex-col">
             {f.id === 'kalyan' ? (
                 <div className="relative flex-1 bg-slate-900 overflow-hidden">
                    {/* ENFORCED PLAYBACK: Treated as normal video mode for PoC reliability */}
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
                        onPlay={() => setVideoState(prev => ({...prev, kalyan: 'playing'}))}
                        onWaiting={() => setVideoState(prev => ({...prev, kalyan: 'loading'}))}
                        onError={(e) => {
                          // Silent suppression for simulated feed
                          setTimeout(ensureKalyanPlayback, 2000);
                        }}
                    />
                    <canvas ref={kalyanCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                    
                    {/* POLL-ONLY Label specifically for this isolated feed */}
                    <div className="absolute top-2 left-2 z-30 pointer-events-none">
                      <span className="bg-black/60 backdrop-blur-md text-[8px] font-black text-orange-400 px-2 py-1 rounded border border-orange-500/20 uppercase tracking-widest">
                        Demo Video Mode (PoC)
                      </span>
                    </div>

                    {videoState.kalyan === 'loading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-40">
                        <div className="text-center space-y-3">
                           <Loader2 className="text-orange-500 animate-spin mx-auto" size={32} />
                           <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Synchronizing Special Hub...</p>
                        </div>
                      </div>
                    )}
                 </div>
             ) : f.id === '1' ? (
                 <div className="relative flex-1 bg-slate-900 overflow-hidden">
                    <video 
                      ref={webcamRef} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      muted 
                      playsInline 
                    />
                    <canvas ref={webcamCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                 </div>
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-800 bg-slate-950">
                    <div className="text-center">
                        <Activity size={32} className="mx-auto mb-3 opacity-10" />
                        <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">SVSD_CAM_RELAY_{f.id}</p>
                    </div>
                 </div>
             )}
             
             {/* Common UI Overlay on Video Container */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/30 p-4 flex flex-col justify-between z-20 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[9px] px-3 py-1 rounded-full shadow-lg font-black uppercase tracking-widest self-start ${f.id === 'kalyan' ? 'bg-indigo-600 text-white' : 'bg-orange-600 text-white'}`}>
                        {f.name}
                      </span>
                      <span className="text-[8px] font-black text-white/50 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-start uppercase">Grid Ref: {f.zone}</span>
                    </div>
                    <span className="text-[8px] font-mono text-white/40 bg-black/20 px-2 py-1 rounded-md">{new Date().toLocaleTimeString([], {hour12: false})}</span>
                </div>
                
                <div className="flex justify-between items-end">
                    <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] text-white/50 uppercase font-black tracking-widest mb-1">Crowd Intensity</p>
                        <div className="flex items-end gap-1">
                          <p className="text-2xl text-white font-black leading-none">{metrics[i]?.density || 0}</p>
                          <span className="text-[10px] font-black text-white/40 mb-0.5">%</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5`}>
                           <div className={`w-2 h-2 rounded-full ${(metrics[i]?.density || 0) > 85 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                           <span className="text-[8px] font-black text-white uppercase tracking-tighter">STATE: {metrics[i]?.status}</span>
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
