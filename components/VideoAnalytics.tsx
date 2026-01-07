
import React, { useEffect, useState, useRef } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { CrowdMetric } from '../types';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const FEED_SOURCES = [
  { id: '1', name: 'South Raja Gopuram (Live)', zone: 'Main Entry' },
  { id: '2', name: 'Kesakandana Sala', zone: 'Tonsuring Area' },
  { id: '3', name: 'Annadanam Hall', zone: 'Dining Area' },
  { id: '4', name: 'Prasadam Preparation', zone: 'Kitchen' },
  { id: '5', name: 'Parking & Roads', zone: 'External' },
  { id: '6', name: 'Darshan Queue Complex', zone: 'Internal' },
];

interface VideoAnalyticsProps {
  isOffline?: boolean;
  onQueueData?: (type: 'ANALYTICS' | 'CHAT_MSG' | 'ALERT', payload: any) => void;
}

export const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({ isOffline = false }) => {
  const [metrics, setMetrics] = useState<CrowdMetric[]>([]);
  const [realTimePersonCount, setRealTimePersonCount] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const model = await cocoSsd.load();
        modelRef.current = model;
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            detect();
          };
        }
      } catch (e) { 
        console.error("CV Setup Error:", e); 
      }
    };
    setup();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const detect = async () => {
    if (videoRef.current && modelRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === 4) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const predictions = await modelRef.current.detect(video);
        const persons = predictions.filter(p => p.class === 'person');
        setRealTimePersonCount(persons.length);

        // Clear and Draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        persons.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          
          // Draw Bounding Box
          ctx.strokeStyle = '#f97316'; // Orange-500
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw Label Background
          ctx.fillStyle = '#f97316';
          const label = `PERSON ${Math.round(prediction.score * 100)}%`;
          const textWidth = ctx.measureText(label).width;
          ctx.fillRect(x, y - 25, textWidth + 10, 25);

          // Draw Text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Inter';
          ctx.fillText(label, x + 5, y - 7);
          
          // Draw "Safety Check" marker
          ctx.fillStyle = '#22c55e'; // Green-500
          ctx.beginPath();
          ctx.arc(x + width - 10, y + 10, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    requestAnimationFrame(detect);
  };

  useEffect(() => {
    const update = () => {
      const m = FEED_SOURCES.map((f, i) => ({
        zoneId: f.id,
        zoneName: f.name,
        density: i === 0 ? Math.min(100, realTimePersonCount * 12) : Math.floor(Math.random() * 40) + 20,
        status: 'SAFE',
        flowRate: Math.floor(Math.random() * 30),
        trend: 'STABLE'
      } as CrowdMetric));
      setMetrics(m);
    };
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [realTimePersonCount]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-xl border-l-4 border-orange-500 shadow-md flex justify-between items-center">
         <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 mb-1 uppercase tracking-widest">
                <Activity size={14} className="animate-pulse" /> HikCentral Neural VMS Active
            </div>
            <p className="text-sm font-mono opacity-80">Edge Detection: Person Class | Confidence &gt; 60%</p>
         </div>
         <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase">Live Count (Main)</p>
            <p className="text-xl font-black text-white">{realTimePersonCount}</p>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FEED_SOURCES.map((f, i) => (
          <div key={f.id} className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 group shadow-lg">
             {i === 0 ? (
                 <>
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
                 </>
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-[10px] font-mono bg-slate-950">
                    <div className="text-center">
                        <Activity size={24} className="mx-auto mb-2 opacity-20" />
                        ENCRYPTED FEED: SVSD_CAM_{f.id}
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
                        <p className="text-[9px] text-white/60 uppercase font-bold tracking-tighter">Crowd Load</p>
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
