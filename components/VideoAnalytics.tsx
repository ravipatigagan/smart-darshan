
import React, { useEffect, useState, useRef } from 'react';
import { Activity, ShieldCheck, Eye, Loader2 } from 'lucide-react';
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
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const kalyanVideoRef = useRef<HTMLVideoElement>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
  const kalyanCanvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const model = await cocoSsd.load();
        modelRef.current = model;
        setIsModelLoading(false);
        
        // Setup Webcam for Feed 1
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
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
        detect();
      } catch (e) { 
        console.error("CV Setup Error:", e); 
      }
    };
    setup();
    return () => {
      if (webcamRef.current?.srcObject) {
        (webcamRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detect = async () => {
    if (modelRef.current) {
      // Detect on Webcam
      if (webcamRef.current && webcamCanvasRef.current && webcamRef.current.readyState >= 2) {
        const predictions = await modelRef.current.detect(webcamRef.current);
        const persons = predictions.filter(p => p.class === 'person');
        setRealTimePersonCount(persons.length);
        drawPredictions(webcamRef.current, webcamCanvasRef.current, persons);
      }

      // Detect on Kalyanotsavam Video
      if (kalyanVideoRef.current && kalyanCanvasRef.current && kalyanVideoRef.current.readyState >= 2) {
        const predictions = await modelRef.current.detect(kalyanVideoRef.current);
        const persons = predictions.filter(p => p.class === 'person');
        setKalyanPersonCount(persons.length);
        drawPredictions(kalyanVideoRef.current, kalyanCanvasRef.current, persons);
      }
    }
    requestAnimationFrame(detect);
  };

  const drawPredictions = (video: HTMLVideoElement, canvas: HTMLCanvasElement, predictions: cocoSsd.DetectedObject[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scaleX = displayWidth / video.videoWidth;
    const scaleY = displayHeight / video.videoHeight;

    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledW = width * scaleX;
      const scaledH = height * scaleY;

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

      ctx.fillStyle = '#f97316';
      const label = `PILGRIM ${Math.round(prediction.score * 100)}%`;
      ctx.font = 'bold 10px Inter';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(scaledX, scaledY - 18, textWidth + 8, 18);

      ctx.fillStyle = 'white';
      ctx.fillText(label, scaledX + 4, scaledY - 5);
    });
  };

  useEffect(() => {
    const update = () => {
      const m = FEED_SOURCES.map((f, i) => {
        let density = 0;
        if (f.id === 'kalyan') density = Math.min(100, kalyanPersonCount * 8 + (Math.random() * 5)); 
        else if (f.id === '1') density = Math.min(100, realTimePersonCount * 12 + (Math.random() * 10));
        else density = Math.floor(Math.random() * 30) + 30;

        return {
          zoneId: f.id,
          zoneName: f.name,
          density: Math.round(density),
          status: density > 80 ? 'CRITICAL' : density > 50 ? 'MODERATE' : 'SAFE',
          flowRate: Math.floor(Math.random() * 30) + 10,
          trend: Math.random() > 0.5 ? 'UP' : 'DOWN'
        } as CrowdMetric;
      });
      setMetrics(m);
    };
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [realTimePersonCount, kalyanPersonCount]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-xl border-l-4 border-orange-500 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-500/30">
                {isModelLoading ? <Loader2 className="text-orange-500 animate-spin" size={24} /> : <Eye className="text-orange-500" size={24} />}
            </div>
            <div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-0.5 uppercase tracking-widest">
                    <Activity size={14} className="animate-pulse" /> {isModelLoading ? 'Initializing Neural Engines...' : 'Multi-Neural Vision Active'}
                </div>
                <p className="text-sm font-mono opacity-80">Processing: Standard & Kalyanotsavam Streams</p>
            </div>
         </div>
         <div className="flex gap-8">
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase">Kalyanotsavam Count</p>
                <p className="text-xl font-black text-white">{kalyanPersonCount} Souls</p>
            </div>
            <div className="text-right border-l border-slate-700 pl-8">
                <p className="text-[10px] text-slate-400 uppercase">South Gate Count</p>
                <p className="text-xl font-black text-white">{realTimePersonCount} Souls</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEED_SOURCES.map((f, i) => (
          <div key={f.id} className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 group shadow-lg">
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
                        crossOrigin="anonymous"
                    />
                    <canvas ref={kalyanCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                 </>
             ) : f.id === '1' ? (
                 <>
                    <video ref={webcamRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                    <canvas ref={webcamCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                 </>
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-[10px] font-mono bg-slate-950">
                    <div className="text-center">
                        <Activity size={24} className="mx-auto mb-2 opacity-20" />
                        ENCRYPTED FEED: SVSD_CAM_{f.id}
                    </div>
                 </div>
             )}
             
             {isModelLoading && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                     <div className="text-center space-y-2">
                        <Loader2 className="text-orange-500 animate-spin mx-auto" size={24} />
                        <p className="text-[10px] text-white font-mono uppercase tracking-widest">Loading AI Model...</p>
                     </div>
                 </div>
             )}

             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 p-3 flex flex-col justify-between z-20 pointer-events-none">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded shadow-sm font-bold uppercase">{f.name}</span>
                    <span className="text-[8px] font-mono text-white/50">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] text-white/60 uppercase font-bold tracking-tighter">AI Crowd Index</p>
                        <p className="text-lg text-white font-black leading-none">{metrics[i]?.density || 0}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(metrics[i]?.density || 0) > 80 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                        <ShieldCheck size={16} className="text-blue-400" />
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
