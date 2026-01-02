'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import styles from './KakaoMap.module.css';
import FactoryModal from './FactoryModal';
import { createBrowserClient } from '@supabase/ssr';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Factory {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: string;
  address?: string;
}

export default function KakaoMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ✅ [추가됨] 페이지 이동 후 돌아왔을 때, 이미 스크립트가 있다면 로드 상태로 변경
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setIsScriptLoaded(true);
    }
  }, []);

  // 1. 초기 데이터 로드 및 실시간 구독
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }

      const { data: factoryData } = await supabase
        .from('factories')
        .select('*');
      if (factoryData) setFactories(factoryData);
    };

    init();

    const channel = supabase
      .channel('map-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'factories' },
        (payload) => {
          supabase
            .from('factories')
            .select('*')
            .then(({ data }) => {
              if (data) setFactories(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. 지도 그리기
  const initializeMap = () => {
    // mapContainerRef가 없거나 userProfile이 로딩 안됐으면 대기
    if (!mapContainerRef.current || !userProfile) return;

    // window.kakao가 없으면 대기 (Script 로드 될 때까지)
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      let displayFactories: Factory[] = [];

      if (userProfile.role === 'super_admin') {
        displayFactories = factories;
      } else if (userProfile.factory_id) {
        displayFactories = factories.filter(
          (f) => f.id === userProfile.factory_id
        );
      }

      const centerLat =
        displayFactories.length > 0 ? displayFactories[0].lat : 36.5;
      const centerLng =
        displayFactories.length > 0 ? displayFactories[0].lng : 127.8;
      const level = displayFactories.length === 1 ? 4 : 12;

      const mapOption = {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level: level,
      };

      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(
          mapContainerRef.current,
          mapOption
        );
      } else {
        // 데이터 변경 시 중심 이동 (선택 사항)
        // mapRef.current.setCenter(new window.kakao.maps.LatLng(centerLat, centerLng));
      }

      const map = mapRef.current;

      // 마커를 새로 그리기 위해 기존 로직 유지 (실무에선 기존 마커 삭제 로직 필요)
      displayFactories.forEach((factory) => {
        const position = new window.kakao.maps.LatLng(factory.lat, factory.lng);

        let markerOptions: any = {
          map: map,
          position: position,
          title: factory.name,
          clickable: true,
        };

        if (factory.status === 'WARNING' || factory.status === 'DANGER') {
          const redMarkerUrl = '/icon/marker-red.svg';
          const imageSize = new window.kakao.maps.Size(40, 40);
          const imageOption = { offset: new window.kakao.maps.Point(20, 40) };
          const markerImage = new window.kakao.maps.MarkerImage(
            redMarkerUrl,
            imageSize,
            imageOption
          );
          markerOptions.image = markerImage;
        }

        const marker = new window.kakao.maps.Marker(markerOptions);

        const content = `
          <div style="padding:5px; color:black; font-size:12px; border-radius:4px; background:white; border:1px solid #ccc;">
            ${factory.name} 
            ${factory.status !== 'NORMAL' ? '<b style="color:red;">(!)' : ''}
          </div>`;
        const infowindow = new window.kakao.maps.InfoWindow({ content });

        window.kakao.maps.event.addListener(marker, 'mouseover', () =>
          infowindow.open(map, marker)
        );
        window.kakao.maps.event.addListener(marker, 'mouseout', () =>
          infowindow.close()
        );
        window.kakao.maps.event.addListener(marker, 'click', () => {
          setSelectedFactory(factory);
          map.panTo(position);
        });
      });
    });
  };

  // 3. 상태 변경 감지하여 지도 그리기
  useEffect(() => {
    // 스크립트가 로드되었고, 프로필도 있고, 팩토리 데이터도 있으면 지도 그리기
    if (isScriptLoaded && userProfile) {
      initializeMap();
    }
  }, [isScriptLoaded, userProfile, factories]);

  return (
    <div className={styles.mapContainer}>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        onLoad={() => setIsScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
        {!isScriptLoaded ? (
          <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900/50 backdrop-blur">
            <div className="animate-pulse">지도 로딩 중...</div>
          </div>
        ) : null}
      </div>

      {selectedFactory && (
        <FactoryModal
          factory={selectedFactory}
          onClose={() => setSelectedFactory(null)}
        />
      )}
    </div>
  );
}
