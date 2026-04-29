import { useEffect, useState, useRef } from "react";
import { styles } from "../App";

const parkingLots = [
  { id: 1, name: "강남 공영주차장", type: "공영", distance: "180m", walkTime: "3분", price: 200 },
  { id: 2, name: "테헤란로 민영주차장", type: "민영", distance: "320m", walkTime: "5분", price: 300 },
  { id: 3, name: "선릉역 환승주차장", type: "공영", distance: "510m", walkTime: "8분", price: 400 },
];

const parkingStyles = {
  lotCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  lotLeft: { display: "flex", alignItems: "center", gap: 12 },
  lotIcon: { width: 36, height: 36, borderRadius: 10, background: "rgba(79,142,247,0.15)", color: "#4F8EF7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  lotName: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  lotInfo: { fontSize: 11, color: "#9898B8", marginBottom: 4 },
  lotBadge: { display: "inline-block", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 },
  lotPrice: { textAlign: "right" },
  priceText: { fontSize: 14, fontWeight: 700, color: "#4F8EF7" },
  priceUnit: { fontSize: 10, color: "#9898B8" },
};

export default function Main({ setPage, history, setHistory, result, setResult, fromHistory, setFromHistory }) {
  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("위치 불러오는 중...");

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    mapRef.current = null;
    markerRef.current = null;

    if (!fromHistory) {
      setResult(null);
    }
    setFromHistory(false);

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    let watchId = null;

    const initMap = (lat, lng) => {
      const container = document.getElementById("map");
      if (!container) return;

      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

      if (!mapRef.current) {
        const map = new window.kakao.maps.Map(container, {
          center: moveLatLon,
          level: 3,
        });
        const marker = new window.kakao.maps.Marker({ position: moveLatLon });
        marker.setMap(map);
        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.setCenter(moveLatLon);
        markerRef.current.setPosition(moveLatLon);
      }

      geocoder.coord2Address(lng, lat, (res, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setAddress(res[0].address.address_name);
        }
      });
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => { initMap(pos.coords.latitude, pos.coords.longitude); },
      (err) => { console.error("위치 오류:", err); setAddress("위치를 불러올 수 없습니다"); },
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
  };

  const handleAnalyze = () => {
    const random = Math.random();
    let newResult;

    if (random < 0.33) {
      newResult = { probability: 85, status: "위험 · 주차 불가", type: "danger", line: "황색 실선 감지됨", time: "07:00 - 22:00 단속", zone: "버스정류소 10m 이내" };
    } else if (random < 0.66) {
      newResult = { probability: 50, status: "주의 · 주차 가능", type: "warning", line: "점선 감지됨", time: "단속 없음", zone: "주의 구역" };
    } else {
      newResult = { probability: 10, status: "주차 가능", type: "safe", line: "주차선 확인", time: "단속 없음", zone: "일반 구역" };
    }

    setResult(newResult);
    setHistory([
      { address, date: new Date().toLocaleDateString(), result: newResult.status, type: newResult.type, probability: newResult.probability, time: newResult.time, zone: newResult.zone, line: newResult.line },
      ...history,
    ]);
  };

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: "#fff" }}>Safe</span>
          <span style={{ color: "#4F8EF7" }}>Park</span>
        </div>
        <div style={styles.profileBtn} onClick={() => setPage("mypage")}>👤</div>
      </div>

      <div id="map" style={styles.map} />

      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: "#4F8EF7" }}>현재 위치</div>
        <div style={{ fontSize: 12, color: "#C8C8E0" }}>{address}</div>
      </div>

      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <input type="file" ref={cameraInputRef} capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      <div style={styles.uploadRow}>
        <div style={styles.uploadBox} onClick={() => cameraInputRef.current.click()}>카메라 촬영</div>
        <div style={styles.uploadBox} onClick={() => fileInputRef.current.click()}>갤러리 업로드</div>
      </div>

      {image && <img src={image} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />}

      <button style={styles.button} onClick={handleAnalyze}>여기 주차해도 되나요?</button>

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.rowBetween}>
            <div style={styles.title}>분석 결과</div>
            <div style={{ ...styles.badge, ...(result.type === "danger" && styles.badgeDanger), ...(result.type === "warning" && styles.badgeWarning), ...(result.type === "safe" && styles.badgeSafe) }}>
              {result.status}
            </div>
          </div>

          <div style={styles.probabilityWrap}>
            <div style={styles.circleWrapper}>
              <svg width="100" height="100">
                <circle cx="50" cy="50" r="42" stroke="#2A2A40" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="42"
                  stroke={result.type === "danger" ? "#E74D3C" : result.type === "warning" ? "#F39C12" : "#2ECC71"}
                  strokeWidth="8" fill="none" strokeDasharray={264}
                  strokeDashoffset={264 - (264 * result.probability) / 100}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={styles.percentText}>{result.probability}%</div>
            </div>
            <div style={styles.probText}>단속 걸릴 확률</div>
          </div>

          <div style={styles.subCard}>{address}</div>

          <div style={styles.detailWrap}>
            <div style={styles.redCard}>
              <div style={styles.label}>단속 시간대</div>
              <div style={styles.redText}>{result.time}</div>
            </div>
            <div style={styles.redCard}>
              <div style={styles.label}>주정차 금지구역</div>
              <div style={styles.redText}>{result.zone}</div>
            </div>
            <div style={styles.yellowCard}>
              <div style={styles.label}>주차선 판독</div>
              <div style={styles.yellowText}>{result.line}</div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div style={{ ...styles.resultCard, marginTop: 12 }}>
          <div style={styles.title}>주변 주차장</div>
          {parkingLots.map((lot) => (
            <div key={lot.id} style={parkingStyles.lotCard}>
              <div style={parkingStyles.lotLeft}>
                <div style={parkingStyles.lotIcon}>P</div>
                <div>
                  <div style={parkingStyles.lotName}>{lot.name}</div>
                  <div style={parkingStyles.lotInfo}>도보 {lot.walkTime} · {lot.distance}</div>
                  <div style={{
                    ...parkingStyles.lotBadge,
                    background: lot.type === "공영" ? "rgba(79,142,247,0.15)" : "rgba(46,204,113,0.15)",
                    color: lot.type === "공영" ? "#4F8EF7" : "#2ECC71",
                    border: lot.type === "공영" ? "1px solid rgba(79,142,247,0.3)" : "1px solid rgba(46,204,113,0.3)",
                  }}>
                    {lot.type}
                  </div>
                </div>
              </div>
              <div style={parkingStyles.lotPrice}>
                <div style={parkingStyles.priceText}>{lot.price}원</div>
                <div style={parkingStyles.priceUnit}>/ 5분</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}