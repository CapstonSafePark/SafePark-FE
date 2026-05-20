import { useState, useEffect, useRef } from "react";
import { getNearbyParkingLots } from "../api/parking";
import { styles } from "../App";
import { HiArrowLeft } from "react-icons/hi";
import { MdSentimentVerySatisfied, MdSentimentSatisfied, MdSentimentNeutral, MdSentimentDissatisfied, MdSentimentVeryDissatisfied } from "react-icons/md";


const BASE_URL = "https://safepark.duckdns.org";

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
  const markerRef = useRef(null);
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

  const getEmoji = (probability) => {
    if (probability <= 20) return <MdSentimentVerySatisfied size={36} color="#2ECC71" />;
    if (probability <= 40) return <MdSentimentSatisfied size={36} color="#A8E063" />;
    if (probability <= 60) return <MdSentimentNeutral size={36} color="#F39C12" />;
    if (probability <= 80) return <MdSentimentDissatisfied size={36} color="#E67E22" />;
    return <MdSentimentVeryDissatisfied size={36} color="#E74D3C" />;
  };

  const getCardStyle = (probability) => {
    if (probability <= 20) return { bg: "rgba(46,204,113,0.1)",  border: "1px solid rgba(46,204,113,0.25)",  text: "#2ECC71" };
    if (probability <= 40) return { bg: "rgba(168,224,99,0.1)",  border: "1px solid rgba(168,224,99,0.25)",  text: "#A8E063" };
    if (probability <= 60) return { bg: "rgba(243,156,18,0.1)",  border: "1px solid rgba(243,156,18,0.25)",  text: "#F39C12" };
    if (probability <= 80) return { bg: "rgba(230,126,34,0.1)",  border: "1px solid rgba(230,126,34,0.25)",  text: "#E67E22" };
    return                        { bg: "rgba(231,77,60,0.1)",   border: "1px solid rgba(231,77,60,0.25)",   text: "#E74D3C" };
  };
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

      {result.imagePath && (
        <img
          src={`${BASE_URL}${result.imagePath}`}
          alt="분석 이미지"
          style={{ width: "100%", borderRadius: 10, marginBottom: 12 }}
        />
      )}

      <div style={styles.resultCard}>
        <div style={styles.rowBetween}>
          <div style={styles.title}>분석 결과</div>
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
            <div style={styles.percentText}>{getEmoji(result.probability)}</div>
          </div>
          <div style={{ ...styles.probText, color: result.type === "danger" ? "#E74D3C" : result.type === "warning" ? "#F39C12" : "#2ECC71", fontWeight: 700 }}>
            {result.status}
          </div>
        </div>

        <div style={styles.subCard}>{result.address || "주소 없음"}</div>

        <div style={styles.detailWrap}>
          {(() => {
            const c = getCardStyle(result.probability);
            const cardStyle = { ...styles.redCard, background: c.bg, border: c.border };
            const textStyle = { ...styles.redText, color: c.text };
            return (
              <>
                <div style={cardStyle}>
                  <div style={styles.label}>단속 시간대</div>
                  <div style={textStyle}>{result.time}</div>
                </div>
                <div style={cardStyle}>
                  <div style={styles.label}>분석 근거</div>
                  <div style={textStyle}>
                    {result.zone?.split('. ').map((sentence, i, arr) => (
                      <span key={i}>{sentence}{i < arr.length - 1 ? '.' : ''}<br /></span>
                    ))}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={styles.label}>주차선 판독</div>
                  <div style={textStyle}>{result.line && result.line !== "-" ? result.line : "업로드 된 사진 없음"}</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

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