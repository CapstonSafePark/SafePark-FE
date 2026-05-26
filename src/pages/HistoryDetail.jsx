import { useState, useEffect, useRef } from "react";
import { getNearbyParkingLots } from "../api/parking";
import { useTheme } from "../ThemeContext";
import { HiArrowLeft } from "react-icons/hi";
import { MdSentimentVerySatisfied, MdSentimentSatisfied, MdSentimentNeutral, MdSentimentDissatisfied, MdSentimentVeryDissatisfied } from "react-icons/md";
import ParkingCalculator from "../components/ParkingCalculator";

const BASE_URL = "https://safepark.duckdns.org";

export default function HistoryDetail({ setPage, result }) {
  const { styles, theme } = useTheme();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [nearbyParking, setNearbyParking] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [parkingSortType, setParkingSortType] = useState("distance");


  const getParkingStyles = () => ({
    lotCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${theme.border}` },
    lotLeft: { display: "flex", alignItems: "center", gap: 12 },
    lotIcon: { width: 36, height: 36, borderRadius: 10, background: "rgba(79,142,247,0.15)", color: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
    lotName: { fontSize: 13, fontWeight: 600, marginBottom: 2, color: theme.textPrimary },
    lotInfo: { fontSize: 11, color: theme.textMuted, marginBottom: 4 },
    lotBadge: { display: "inline-block", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 },
    lotPrice: { textAlign: "right" },
    priceText: { fontSize: 14, fontWeight: 700, color: theme.accent },
    priceUnit: { fontSize: 10, color: theme.textMuted },
  });

  useEffect(() => {
    const fetchNearbyParking = async () => {
      if (!result?.lat || !result?.lng) return;
      try {
        const response = await getNearbyParkingLots(result.lat, result.lng);
        const data = await response.json();
        if (Array.isArray(data)) setNearbyParking(data);
        else if (Array.isArray(data.data)) setNearbyParking(data.data);
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
    const map = new window.kakao.maps.Map(container, { center: moveLatLon, level: 3 });
    const marker = new window.kakao.maps.Marker({ position: moveLatLon });
    marker.setMap(map);
    mapRef.current = map;
    markerRef.current = marker;
    return () => { mapRef.current = null; markerRef.current = null; };
  }, [result]);

  const getEmoji = (probability) => {
    if (probability <= 20) return <MdSentimentVerySatisfied size={36} color="#2ECC71" />;
    if (probability <= 40) return <MdSentimentSatisfied size={36} color="#A8E063" />;
    if (probability <= 60) return <MdSentimentNeutral size={36} color="#F39C12" />;
    if (probability <= 80) return <MdSentimentDissatisfied size={36} color="#E67E22" />;
    return <MdSentimentVeryDissatisfied size={36} color="#E74D3C" />;
  };

  const getCardStyle = (probability) => {
    if (probability <= 20) return { bg: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.25)", text: "#2ECC71" };
    if (probability <= 40) return { bg: "rgba(168,224,99,0.1)", border: "1px solid rgba(168,224,99,0.25)", text: "#A8E063" };
    if (probability <= 60) return { bg: "rgba(243,156,18,0.1)", border: "1px solid rgba(243,156,18,0.25)", text: "#F39C12" };
    if (probability <= 80) return { bg: "rgba(230,126,34,0.1)", border: "1px solid rgba(230,126,34,0.25)", text: "#E67E22" };
    return { bg: "rgba(231,77,60,0.1)", border: "1px solid rgba(231,77,60,0.25)", text: "#E74D3C" };
  };

  if (!result) return null;

  const parkingStyles = getParkingStyles();
  const getParkingPriceValue = (lot) => {
    const isFree =
        (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) ||
        lot.freeYn === true;

    if (isFree) return 0;

    if (lot.lotPrice !== null && lot.lotPrice !== undefined) {
      return Number(lot.lotPrice);
    }

    return Number.MAX_SAFE_INTEGER;
  };

  const sortedNearbyParking = [...nearbyParking].sort((a, b) => {
    if (parkingSortType === "price") {
      return getParkingPriceValue(a) - getParkingPriceValue(b);
    }

    return (
        (a.distanceKm ?? Number.MAX_SAFE_INTEGER) -
        (b.distanceKm ?? Number.MAX_SAFE_INTEGER)
    );
  });

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: theme.textPrimary }}>Safe</span>
          <span style={{ color: theme.accent }}>Park</span>
        </div>
        <div style={styles.profileBtn} onClick={() => setPage("history")}>
          <HiArrowLeft size={20} />
        </div>
      </div>

      <div id="detail-map" style={styles.map} />

      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: theme.accent }}>분석 위치</div>
        <div style={{ fontSize: 12, color: theme.textSecondary }}>{result.address || "주소 없음"}</div>
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
              <circle cx="50" cy="50" r="42" stroke={theme.circleBg} strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42"
                stroke={result.type === "danger" ? theme.danger : result.type === "warning" ? theme.warning : theme.safe}
                strokeWidth="8" fill="none" strokeDasharray={264}
                strokeDashoffset={264 - (264 * result.probability) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div style={styles.percentText}>{getEmoji(result.probability)}</div>
          </div>
          <div style={{ ...styles.probText, color: result.type === "danger" ? theme.danger : result.type === "warning" ? theme.warning : theme.safe, fontWeight: 700 }}>
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
                    {result.zone?.split(". ").map((sentence, i, arr) => (
                      <span key={i}>{sentence}{i < arr.length - 1 ? "." : ""}<br /></span>
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
          <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
          >
            <div style={styles.title}>주변 주차장</div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                  onClick={() => setParkingSortType("distance")}
                  style={{
                    fontSize: 11,
                    padding: "5px 9px",
                    borderRadius: 8,
                    border: `1px solid ${
                        parkingSortType === "distance"
                            ? theme.accent
                            : theme.border
                    }`,
                    background:
                        parkingSortType === "distance"
                            ? "rgba(79,142,247,0.15)"
                            : "transparent",
                    color:
                        parkingSortType === "distance"
                            ? theme.accent
                            : theme.textMuted,
                    cursor: "pointer",
                  }}
              >
                거리순
              </button>

              <button
                  onClick={() => setParkingSortType("price")}
                  style={{
                    fontSize: 11,
                    padding: "5px 9px",
                    borderRadius: 8,
                    border: `1px solid ${
                        parkingSortType === "price"
                            ? theme.accent
                            : theme.border
                    }`,
                    background:
                        parkingSortType === "price"
                            ? "rgba(79,142,247,0.15)"
                            : "transparent",
                    color:
                        parkingSortType === "price"
                            ? theme.accent
                            : theme.textMuted,
                    cursor: "pointer",
                  }}
              >
                요금순
              </button>
            </div>
          </div>
          {sortedNearbyParking.map((lot) => {
            const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;
            const priceText = lot.parkingFeeDesc
              ? lot.parkingFeeDesc.replace(/\s*추가요금:/g, "\n추가요금:").trim()
              : lot.feeUnit
              ? `기본 ${lot.feeUnit}분 ${lot.lotPrice}원\n추가 ${lot.addUnitTime}분당 ${lot.addUnitPrice}원`
              : "요금 정보 없음";
            const unitText = lot.feeUnit ? `기본 ${lot.feeUnit}분` : "기본요금";
            return (
              <div key={lot.id} style={parkingStyles.lotCard}>
                <div style={parkingStyles.lotLeft}>
                  <div style={parkingStyles.lotIcon}>P</div>
                  <div>
                    <div style={parkingStyles.lotName}>{lot.lotName}</div>
                    <div style={parkingStyles.lotInfo}>{lot.distanceKm ? (lot.distanceKm * 1000).toFixed(0) + "m" : "거리 정보 없음"}</div>
                    <div style={{ ...parkingStyles.lotBadge, background: isFree ? "rgba(46,204,113,0.15)" : "rgba(79,142,247,0.15)", color: isFree ? "#2ECC71" : theme.accent, border: isFree ? "1px solid rgba(46,204,113,0.3)" : "1px solid rgba(79,142,247,0.3)" }}>
                      {isFree ? "무료" : "유료"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ ...parkingStyles.priceText, whiteSpace: "pre-line", wordBreak: "keep-all", textAlign: "right", fontSize: 11, lineHeight: "1.5" }}>
                    {isFree ? "무료" : priceText}
                  </div>
                  <div style={parkingStyles.priceUnit}>{isFree ? "" : unitText}</div>
                  {!isFree && lot.feeUnit && (
                  <button
                    onClick={() => setSelectedLot(lot)}
                    style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.accent, cursor: "pointer" }}
                  >
                    요금계산
                  </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 80 }} />
      {selectedLot && (
        <ParkingCalculator lot={selectedLot} onClose={() => setSelectedLot(null)} />
      )}
    </>
  );
}