import { useEffect, useState, useRef } from "react";
import { styles } from "../App";
import { getNearbyParkingLots, checkParking } from "../api/parking";
import { uploadImage } from "../api/analysis";

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
  const [imageFile, setImageFile] = useState(null);
  const [address, setAddress] = useState("위치 불러오는 중...");
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [nearbyParking, setNearbyParking] = useState([]);

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

      setCurrentLat(lat);
      setCurrentLng(lng);

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
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    console.log("분석 시작", imageFile, currentLat, currentLng);
    const lat = currentLat || 37.5665;
    const lng = currentLng || 126.9780;

    try {
      let newResult;

      if (imageFile) {
        // 이미지 있으면 이미지 분석 API 호출
        const uploadResponse = await uploadImage(imageFile, lat, lng);
        const uploadData = await uploadResponse.json();
        const data = uploadData.data;

        if (data.riskLevel === "HIGH") {
          newResult = { probability: data.probability, status: "위험 · 주차 불가", type: "danger", line: data.lineColor || "업로드 된 사진 없음", time: "07:00 - 22:00 단속", zone: "주정차 금지구역" };
        } else if (data.riskLevel === "MEDIUM") {
          newResult = { probability: data.probability, status: "주의 · 주차 가능", type: "warning", line: data.lineColor || "업로드 된 사진 없음", time: "단속 없음", zone: "주의 구역" };
        } else {
          newResult = { probability: data.probability, status: "주차 가능", type: "safe", line: data.lineColor || "업로드 된 사진 없음", time: "단속 없음", zone: "일반 구역" };
        }
      } else {
        // 이미지 없으면 위치 기반 분석
        const checkResponse = await checkParking(lat, lng);
        const checkData = await checkResponse.json();
        const data = checkData.data;

        if (data.riskLevel === "HIGH") {
          newResult = { probability: data.probability, status: "위험 · 주차 불가", type: "danger", line: null, time: "07:00 - 22:00 단속", zone: "주정차 금지구역" };
        } else if (data.riskLevel === "MEDIUM") {
          newResult = { probability: data.probability, status: "주의 · 주차 가능", type: "warning", line: null, time: "단속 없음", zone: "주의 구역" };
        } else {
          newResult = { probability: data.probability, status: "주차 가능", type: "safe", line: null, time: "단속 없음", zone: "일반 구역" };
        }
      }

      setResult(newResult);
      setHistory([
        { address, date: new Date().toLocaleDateString(), result: newResult.status, type: newResult.type, probability: newResult.probability, time: newResult.time, zone: newResult.zone, line: newResult.line },
        ...history,
      ]);

      const parkingResponse = await getNearbyParkingLots(lat, lng);
      const parkingData = await parkingResponse.json();
      if (Array.isArray(parkingData)) {
        setNearbyParking(parkingData);
      } else if (Array.isArray(parkingData.data)) {
        setNearbyParking(parkingData.data);
      }

    } catch (e) {
      console.error("분석 오류:", e);
      alert("서버 연결 실패");
    }
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

          <div style={styles.subCard}>{result.address || address}</div>

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
              <div style={styles.yellowText}>{result.line || "업로드 된 사진 없음"}</div>
            </div>
          </div>
        </div>
      )}

      {result && nearbyParking.length > 0 && (
        <div style={{ ...styles.resultCard, marginTop: 12 }}>
          <div style={styles.title}>주변 주차장</div>
          {nearbyParking.map((lot) => (
            <div key={lot.id} style={parkingStyles.lotCard}>
              <div style={parkingStyles.lotLeft}>
                <div style={parkingStyles.lotIcon}>P</div>
                <div>
                  <div style={parkingStyles.lotName}>{lot.lotName}</div>
                  <div style={parkingStyles.lotInfo}>{lot.distanceKm ? (lot.distanceKm * 1000).toFixed(0) + "m" : "거리 정보 없음"}</div>
                  <div style={{
                    ...parkingStyles.lotBadge,
                    background: lot.freeYn ? "rgba(46,204,113,0.15)" : "rgba(79,142,247,0.15)",
                    color: lot.freeYn ? "#2ECC71" : "#4F8EF7",
                    border: lot.freeYn ? "1px solid rgba(46,204,113,0.3)" : "1px solid rgba(79,142,247,0.3)",
                  }}>
                    {lot.freeYn ? "무료" : "유료"}
                  </div>
                </div>
              </div>
              <div style={parkingStyles.lotPrice}>
                <div style={parkingStyles.priceText}>{lot.freeYn ? "무료" : lot.lotPrice ? `${lot.lotPrice}원` : "요금 정보 없음"}</div>
                <div style={parkingStyles.priceUnit}>/ 5분</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}