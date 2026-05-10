import { useState, useEffect, useRef } from "react";
import { getNearbyParkingLots } from "../api/parking";
import { styles } from "../App";
import { HiArrowLeft } from "react-icons/hi";

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

export default function HistoryDetail({ setPage, result }) {
  const mapRef = useRef(null);
    const [nearbyParking, setNearbyParking] = useState([]);

    useEffect(() => {
    const fetchNearbyParking = async () => {
        if (!result?.lat || !result?.lng) return;
        try {
        const response = await getNearbyParkingLots(result.lat, result.lng);
        const data = await response.json();
        if (Array.isArray(data)) {
            setNearbyParking(data);
        } else if (Array.isArray(data.data)) {
            setNearbyParking(data.data);
        }
        } catch (e) {
        console.error("주변 주차장 조회 실패:", e);
        }
    };
    fetchNearbyParking();
    }, [result]);  
  const markerRef = useRef(null);

  useEffect(() => {
    if (!result || !window.kakao || !window.kakao.maps) return;

    const lat = result.lat || 37.5665;
    const lng = result.lng || 126.9780;

    const container = document.getElementById("detail-map");
    if (!container) return;

    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
    const map = new window.kakao.maps.Map(container, {
      center: moveLatLon,
      level: 3,
    });
    const marker = new window.kakao.maps.Marker({ position: moveLatLon });
    marker.setMap(map);
    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [result]);

  if (!result) return null;

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: "#fff" }}>Safe</span>
          <span style={{ color: "#4F8EF7" }}>Park</span>
        </div>
        <div style={styles.profileBtn} onClick={() => setPage("history")}><HiArrowLeft size={20} /></div>
      </div>

      <div id="detail-map" style={styles.map} />

      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: "#4F8EF7" }}>분석 위치</div>
        <div style={{ fontSize: 12, color: "#C8C8E0" }}>{result.address || "주소 없음"}</div>
      </div>

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

        <div style={styles.subCard}>{result.address || "주소 없음"}</div>

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
            <div style={styles.yellowText}>{result.line && result.line !== "-" ? result.line : "업로드 된 사진 없음"}</div>
          </div>
        </div>
      </div>

      {result.nearbyParking && result.nearbyParking.length > 0 && (
        <div style={{ ...styles.resultCard, marginTop: 12 }}>
          <div style={styles.title}>주변 주차장</div>
          {result.nearbyParking.map((lot) => (
            <div key={lot.id} style={parkingStyles.lotCard}>
              <div style={parkingStyles.lotLeft}>
                <div style={parkingStyles.lotIcon}>P</div>
                <div>
                  <div style={parkingStyles.lotName}>{lot.lotName}</div>
                  <div style={parkingStyles.lotInfo}>{(lot.distanceKm * 1000).toFixed(0)}m</div>
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
                <div style={parkingStyles.priceText}>{lot.freeYn ? "무료" : `${lot.lotPrice}원`}</div>
                <div style={parkingStyles.priceUnit}>/ 5분</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {nearbyParking.length > 0 && (
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