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
} from 'lucide-react';
import styles from './FactoryModal.module.css';
import SensorChart from './SensorChart'; // ✅ 차트 컴포넌트 임포트

interface FactoryModalProps {
  factory: any;
  onClose: () => void;
}

export default function FactoryModal({ factory, onClose }: FactoryModalProps) {
  const [selectedCCTV, setSelectedCCTV] = useState<any>(null);

  // ✅ 1. 경보음 효과 (안전한 재생 로직 적용)
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (factory?.status === 'WARNING') {
      audio = new Audio('/sounds/alert.mp3');
      audio.loop = true;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // 재생 중단 에러(AbortError)는 무시하고, 진짜 에러만 출력
          if (error.name !== 'AbortError') {
            console.error('Audio play failed:', error);
          }
        });
      }
    }

    // 모달 닫을 때 소리 끄기
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [factory]);

  // ✅ 2. 공장 상태에 따라 CCTV 목록 및 영상 URL 생성
  const cctvList = useMemo(() => {
    if (!factory) return [];

    // 기본 CCTV 목록 (영상 URL 포함)
    const baseCCTVs = [
      {
        id: 'c1',
        name: 'Zone A - 원료 투입구',
        status: 'NORMAL',
        detail: '특이사항 없음',
        // 구글 클라우드 샘플 영상 (테스트용)
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
      // 🚨 경고 상태일 때: 위험 감지 CCTV 포함
      return [
        ...baseCCTVs,
        {
          id: 'c3',
          name: 'Zone C - 저장 탱크 배관',
          status: 'DANGER',
          detail: '⚠️ 불산(HF) 누출 감지됨',
          aiConfidence: 98.5,
          // 긴박한 느낌의 샘플 영상
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
      // ✅ 정상 상태일 때
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

  return (
    <div className={styles.modalContainer}>
      {/* 📌 헤더 (고정) */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>{factory.name}</h3>
          <span
            className={`${styles.statusBadge} ${
              factory.status === 'WARNING'
                ? styles.statusDanger
                : styles.statusNormal
            }`}
          >
            {factory.status === 'WARNING'
              ? '🚨 긴급: 유해물질 누출 경보'
              : '✅ 정상 가동 중'}
          </span>
        </div>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      {/* 📌 스크롤 영역 */}
      <div className={styles.scrollArea}>
        {/* 본문 (CCTV 영상 플레이어 or 목록) */}
        <div className={styles.body}>
          {selectedCCTV ? (
            // [뷰어 모드] - 비디오 플레이어
            <div className={styles.playerContainer}>
              <button
                onClick={() => setSelectedCCTV(null)}
                className={styles.backButton}
              >
                <ArrowLeft size={14} /> 목록으로
              </button>

              <div
                className={styles.videoArea}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  backgroundColor: 'black',
                }}
              >
                {/* 🎥 비디오 태그 */}
                <video
                  src={selectedCCTV.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* 위험 상황일 때 빨간색 오버레이 효과 */}
                {selectedCCTV.status === 'DANGER' && (
                  <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none z-10"></div>
                )}

                {/* 좌측 상단: 카메라 정보 */}
                <div className="absolute top-4 left-4 z-20 bg-black/50 px-3 py-1 rounded text-white text-xs font-mono">
                  CAM: {selectedCCTV.name}
                </div>

                {/* 우측 상단: LIVE 표시 */}
                <div
                  className={styles.liveIndicator}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 20,
                  }}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>{' '}
                  LIVE
                </div>

                {/* 중앙 하단: AI 감지 경고창 (위험할 때만) */}
                {selectedCCTV.status === 'DANGER' && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-red-600/90 text-white px-6 py-3 rounded-lg shadow-lg flex flex-col items-center animate-bounce">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertTriangle size={20} fill="white" />
                      AI HAZARD DETECTION
                    </div>
                    <span className="text-xs mt-1">
                      Detected: Hydrofluoric Acid (HF)
                    </span>
                    <span className="text-xs">
                      Confidence: {selectedCCTV.aiConfidence}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // [목록 모드]
            <ul className={styles.cctvList}>
              {cctvList.map((cctv) => (
                <li
                  key={cctv.id}
                  className={`${styles.cctvItem} ${
                    cctv.status === 'DANGER' ? styles.itemDanger : ''
                  }`}
                  onClick={() => setSelectedCCTV(cctv)}
                >
                  <div className={styles.cctvInfo}>
                    <div
                      className={`${styles.iconBox} ${
                        cctv.status === 'DANGER' ? styles.iconDanger : ''
                      }`}
                    >
                      {cctv.status === 'DANGER' ? (
                        <Siren size={18} />
                      ) : (
                        <Camera size={18} />
                      )}
                    </div>
                    <div>
                      <div className={styles.cctvName}>{cctv.name}</div>
                      <div
                        className={styles.cctvDetail}
                        style={{
                          color:
                            cctv.status === 'DANGER' ? '#ef4444' : '#64748b',
                        }}
                      >
                        {cctv.status === 'DANGER' ? (
                          <span className="flex items-center gap-1 font-bold">
                            <AlertTriangle size={12} /> {cctv.detail}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} /> {cctv.detail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`${styles.statusDot} ${
                        cctv.status === 'DANGER'
                          ? styles.dotRed
                          : styles.dotGreen
                      }`}
                    ></span>
                    <ChevronRight size={16} className="text-slate-600" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ 센서 데이터 (실시간 차트 적용) */}
        <div className={styles.sensorSection}>
          <div className={styles.sensorTitle}>REAL-TIME SENSOR ANALYTICS</div>
          <div className="grid grid-cols-2 gap-4">
            {/* 온도 차트 */}
            <SensorChart type="TEMP" isWarning={factory.status === 'WARNING'} />
            {/* 가스 차트 */}
            <SensorChart type="GAS" isWarning={factory.status === 'WARNING'} />
          </div>
        </div>
      </div>{' '}
      {/* End of scrollArea */}
    </div>
  );
}
