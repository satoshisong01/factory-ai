'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  ChevronRight,
  ArrowLeft,
  Siren,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Video,
} from 'lucide-react';
import SensorChart from './SensorChart';

interface FactoryModalProps {
  factory: any;
  onClose: () => void;
}

export default function FactoryModal({ factory, onClose }: FactoryModalProps) {
  const [selectedCCTV, setSelectedCCTV] = useState<any>(null);

  // ✅ 1. 경보음 효과 (안전한 재생 로직)
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (factory?.status === 'WARNING') {
      audio = new Audio('/sounds/alert.mp3');
      audio.loop = true;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Audio play failed:', error);
          }
        });
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [factory]);

  // ✅ 2. 공장 상태에 따라 CCTV 목록 생성
  const cctvList = useMemo(() => {
    if (!factory) return [];

    const baseCCTVs = [
      {
        id: 'c1',
        name: 'Zone A - 원료 투입구',
        status: 'NORMAL',
        detail: '특이사항 없음',
        videoUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        id: 'c2',
        name: 'Zone B - 반응기 상단',
        status: 'NORMAL',
        detail: '안전',
        videoUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
    ];

    if (factory.status === 'WARNING') {
      return [
        ...baseCCTVs,
        {
          id: 'c3',
          name: 'Zone C - 저장 탱크 배관',
          status: 'DANGER',
          detail: '⚠️ 불산(HF) 누출 감지됨',
          aiConfidence: 98.5,
          videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        },
        {
          id: 'c4',
          name: 'Zone D - 폐수 처리장',
          status: 'NORMAL',
          detail: '정상 가동 중',
          videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        },
      ];
    } else {
      return [
        ...baseCCTVs,
        {
          id: 'c3',
          name: 'Zone C - 저장 탱크 배관',
          status: 'NORMAL',
          detail: '안전',
          videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        },
        {
          id: 'c4',
          name: 'Zone D - 폐수 처리장',
          status: 'NORMAL',
          detail: '안전',
          videoUrl:
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        },
      ];
    }
  }, [factory]);

  if (!factory) return null;

  // 상태에 따른 테마 색상 설정
  const isDanger = factory.status === 'WARNING' || factory.status === 'DANGER';
  const borderColor = isDanger ? 'border-red-500' : 'border-slate-700';

  return (
    // 📱 [반응형] 배경 및 모달 컨테이너 (모바일 w-95%, PC w-full max-w-5xl)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 lg:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 w-[95%] lg:w-full max-w-5xl rounded-xl lg:rounded-2xl border ${borderColor} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* 📌 헤더 */}
        <div className="p-3 lg:p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 flex-shrink-0">
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
              {factory.name}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-[10px] lg:text-xs rounded-full font-bold ${
                isDanger
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              }`}
            >
              {isDanger ? '🚨 긴급: 유해물질 누출 경보' : '✅ 정상 가동 중'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 📌 스크롤 영역 (모바일 1열 / PC 2열 그리드) */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 🎥 좌측: CCTV 섹션 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm lg:text-base">
                <Video size={18} className="text-blue-500" />
                실시간 CCTV 모니터링
              </div>

              {selectedCCTV ? (
                // [플레이어 모드]
                <div className="flex flex-col gap-2 h-full">
                  <button
                    onClick={() => setSelectedCCTV(null)}
                    className="self-start flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors mb-1"
                  >
                    <ArrowLeft size={14} /> 목록으로 돌아가기
                  </button>

                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                    <video
                      src={selectedCCTV.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* 위험 상황 오버레이 */}
                    {selectedCCTV.status === 'DANGER' && (
                      <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none z-10"></div>
                    )}

                    {/* 카메라 정보 */}
                    <div className="absolute top-3 left-3 z-20 bg-black/60 px-2 py-1 rounded text-white text-[10px] lg:text-xs font-mono backdrop-blur-sm">
                      CAM: {selectedCCTV.name}
                    </div>

                    {/* LIVE 표시 */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-red-500 font-bold text-[10px] lg:text-xs bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      LIVE
                    </div>

                    {/* AI 감지 경고창 */}
                    {selectedCCTV.status === 'DANGER' && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg flex flex-col items-center animate-bounce min-w-[200px]">
                        <div className="flex items-center gap-2 font-bold text-xs lg:text-sm">
                          <AlertTriangle size={16} fill="white" />
                          AI HAZARD DETECTION
                        </div>
                        <span className="text-[10px] lg:text-xs mt-1">
                          Detected: Hydrofluoric Acid (HF)
                        </span>
                        <span className="text-[10px] lg:text-xs opacity-80">
                          Confidence: {selectedCCTV.aiConfidence}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // [목록 모드]
                <ul className="flex flex-col gap-2 h-full overflow-y-auto pr-1">
                  {cctvList.map((cctv) => (
                    <li
                      key={cctv.id}
                      onClick={() => setSelectedCCTV(cctv)}
                      className={`cursor-pointer p-3 rounded-lg border transition-all hover:bg-slate-800 flex items-center justify-between group ${
                        cctv.status === 'DANGER'
                          ? 'bg-red-900/10 border-red-500/30 hover:border-red-500'
                          : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            cctv.status === 'DANGER'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-700 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          {cctv.status === 'DANGER' ? (
                            <Siren size={18} />
                          ) : (
                            <Camera size={18} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-200">
                            {cctv.name}
                          </div>
                          <div className="text-xs mt-0.5">
                            {cctv.status === 'DANGER' ? (
                              <span className="flex items-center gap-1 text-red-400 font-bold">
                                <AlertTriangle size={12} /> {cctv.detail}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-500">
                                <CheckCircle2 size={12} /> {cctv.detail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-600 group-hover:text-white"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 📊 우측: 센서 데이터 섹션 (PC에서는 우측, 모바일에서는 하단) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm lg:text-base">
                <Activity size={18} className="text-blue-500" />
                IoT 센서 실시간 분석
              </div>

              <div className="flex-1 flex flex-col gap-4">
                {/* 온도 차트 */}
                <div className="flex-1 min-h-[140px]">
                  <SensorChart type="TEMP" isWarning={isDanger} />
                </div>
                {/* 가스 차트 */}
                <div className="flex-1 min-h-[140px]">
                  <SensorChart type="GAS" isWarning={isDanger} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
