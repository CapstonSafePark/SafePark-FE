import { useState, useEffect, useRef, useMemo } from "react";
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
  const parkingMarkerOverlaysRef = useRef([]);
  const showParkingMarkersRef = useRef(false);
  const [nearbyParking, setNearbyParking] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [mapSelectedLot, setMapSelectedLot] = useState(null);
  const [parkingSortType, setParkingSortType] = useState("distance");
  const [showParkingMarkers, setShowParkingMarkers] = useState(false);

  const getParkingStyles = () => ({
    lotCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${theme.border}` },
    lotLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 },
    lotIcon: { width: 36, height: 36, borderRadius: 10, background: "rgba(79,142,247,0.15)", color: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
    lotName: { fontSize: 13, fontWeight: 600, marginBottom: 2, color: theme.textPrimary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" },
    lotInfo: { fontSize: 11, color: theme.textMuted, marginBottom: 4 },
    lotBadge: { display: "inline-block", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 },
    lotPrice: { textAlign: "right" },
    priceText: { fontSize: 14, fontWeight: 700, color: theme.accent },
    priceUnit: { fontSize: 10, color: theme.textMuted },
  });

  // ✅ useMemo 최상위 선언
  const sortedNearbyParking = useMemo(() => {
    if (!nearbyParking.length) return [];
    if (parkingSortType === "distance") {
      return [...nearbyParking].sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
    } else {
      const getPriceValue = (lot) => {
        const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;
        if (isFree) return 0;
        if (lot.lotPrice !== null && lot.lotPrice !== undefined) return Number(lot.lotPrice);
        return Number.MAX_SAFE_INTEGER;
      };
      return [...nearbyParking].sort((a, b) => getPriceValue(a) - getPriceValue(b));
    }
  }, [nearbyParking, parkingSortType]);

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

  useEffect(() => {
    const fetchNearbyParking = async () => {
      if (!result?.lat || !result?.lng) return;
      try {
        const res = await getNearbyParkingLots(result.lat, result.lng, 1.0);
        const data = await res.json();
        const lots = Array.isArray(data) ? data : (data.data || []);
        setNearbyParking(lots);
      } catch (e) {
        console.error("주변 주차장 조회 실패:", e);
      }
    };
    fetchNearbyParking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const updateMarkerVisibility = (lots, show) => {
    parkingMarkerOverlaysRef.current.forEach(m => m.setMap(null));
    parkingMarkerOverlaysRef.current = [];
    if (!show || !mapRef.current) return;
    lots.forEach((lot, idx) => {
      if (!lot.lat || !lot.lng) return;
      const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;
      const color = isFree ? "#2ECC71" : "#4F8EF7";
      const contentEl = document.createElement("div");
      contentEl.textContent = "P";
      contentEl.style.cssText = `width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer`;
      contentEl.addEventListener("click", (e) => { e.stopPropagation(); setMapSelectedLot(lots[idx]); });
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lot.lat, lot.lng),
        content: contentEl, yAnchor: 1, clickable: true,
      });
      overlay.setMap(mapRef.current);
      parkingMarkerOverlaysRef.current.push(overlay);
    });
  };

  const toggleParkingMarkers = () => {
    const next = !showParkingMarkers;
    setShowParkingMarkers(next);
    showParkingMarkersRef.current = next;
    updateMarkerVisibility(nearbyParking, next);
  };

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

  return (
    <>
      {/* 헤더 */}
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: theme.textPrimary }}>Safe</span>
          <span style={{ color: theme.accent }}>Park</span>
        </div>
        <div style={styles.profileBtn} onClick={() => setPage("history")}>
          <HiArrowLeft size={20} />
        </div>
      </div>

      {/* 지도 */}
      <div style={{ position: "relative" }}>
        <div id="detail-map" style={styles.map} />
        <div
          style={{ position: "absolute", bottom: 12, right: 10, background: showParkingMarkers ? theme.accent : theme.card, borderRadius: 8, padding: 8, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
          onClick={toggleParkingMarkers}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
          onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: showParkingMarkers ? "#fff" : theme.accent }}>🅿</span>
        </div>
      </div>

      {/* 분석 위치 카드 */}
      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: theme.accent }}>분석 위치</div>
        <div style={{ fontSize: 12, color: theme.textSecondary }}>{result.address || "주소 없음"}</div>
      </div>

      {/* 분석 이미지 */}
      {result.imagePath && (
        <img src={`${BASE_URL}${result.imagePath}`} alt="분석 이미지" style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />
      )}

      {/* 분석 결과 카드 */}
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

      {/* 주변 주차장 */}
      {nearbyParking.length > 0 && (
        <div style={{ ...styles.resultCard, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={styles.title}>주변 주차장</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setParkingSortType("distance")}
                style={{ fontSize: 11, padding: "5px 9px", borderRadius: 8, border: `1px solid ${parkingSortType === "distance" ? theme.accent : theme.border}`, background: parkingSortType === "distance" ? "rgba(79,142,247,0.15)" : "transparent", color: parkingSortType === "distance" ? theme.accent : theme.textMuted, cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
                onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
              >거리순</button>
              <button
                onClick={() => setParkingSortType("price")}
                style={{ fontSize: 11, padding: "5px 9px", borderRadius: 8, border: `1px solid ${parkingSortType === "price" ? theme.accent : theme.border}`, background: parkingSortType === "price" ? "rgba(79,142,247,0.15)" : "transparent", color: parkingSortType === "price" ? theme.accent : theme.textMuted, cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
                onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
              >요금순</button>
            </div>
          </div>
          {sortedNearbyParking.map((lot) => {
            const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;
            const priceText = lot.parkingFeeDesc
              ? lot.parkingFeeDesc.replace(/\s*추가요금:/g, " / 추가요금:").trim()
              : lot.feeUnit
              ? `기본 ${lot.feeUnit}분 ${lot.lotPrice}원 / 추가 ${lot.addUnitTime}분당 ${lot.addUnitPrice}원`
              : "요금 정보 없음";
            const unitText = lot.feeUnit ? `기본 ${lot.feeUnit}분` : "기본요금";
            return (
              <div key={lot.lotId ?? `${lot.lotName}-${lot.distanceKm}`} style={parkingStyles.lotCard}>
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
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                  <div style={{ ...parkingStyles.priceText, textAlign: "right", fontSize: 11, lineHeight: "1.5" }}>
                    {isFree ? "무료" : lot.feeUnit && lot.lotPrice ? `기본 ${lot.feeUnit}분 ${Number(lot.lotPrice).toLocaleString()}원` : "요금 정보 없음"}
                  </div>
                  {!isFree && lot.addUnitTime && lot.addUnitPrice && (
                    <div style={{ fontSize: 10, color: theme.textMuted, textAlign: "right" }}>
                      추가 {lot.addUnitTime}분당 {Number(lot.addUnitPrice).toLocaleString()}원
                    </div>
                  )}
                  {lot.tickets && lot.tickets.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginTop: 2 }}>
                      {lot.tickets.map((ticket, i) => (
                        <div key={i} style={{ fontSize: 10, color: theme.textSecondary, background: "rgba(79,142,247,0.08)", borderRadius: 6, padding: "2px 7px", border: `1px solid rgba(79,142,247,0.2)` }}>
                          {ticket.name} {ticket.price.toLocaleString()}원 · {ticket.usagePeriodLabel}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isFree && lot.feeUnit && (
                    <button
                      onClick={() => setSelectedLot(lot)}
                      style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.accent, cursor: "pointer", transition: "opacity 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                      onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
                      onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
                    >요금계산</button>
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

      {/* 마커 팝업 */}
      {mapSelectedLot && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: 400, background: theme.card, borderRadius: 16, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.textPrimary }}>{mapSelectedLot.lotName}</div>
            <div
              onClick={() => setMapSelectedLot(null)}
              style={{ cursor: "pointer", color: theme.textMuted, fontSize: 18, lineHeight: 1, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >✕</div>
          </div>
          {mapSelectedLot.address && <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>{mapSelectedLot.address}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ background: (mapSelectedLot.parkingFeeDesc?.includes("무료") || mapSelectedLot.freeYn) ? "rgba(46,204,113,0.15)" : "rgba(79,142,247,0.15)", color: (mapSelectedLot.parkingFeeDesc?.includes("무료") || mapSelectedLot.freeYn) ? "#2ECC71" : "#4F8EF7", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
              {(mapSelectedLot.parkingFeeDesc?.includes("무료") || mapSelectedLot.freeYn) ? "무료" : "유료"}
            </span>
            {mapSelectedLot.availableSpots != null && (
              <span style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: theme.textSecondary }}>
                가용 {mapSelectedLot.availableSpots} / {mapSelectedLot.totalSpaces ?? "-"} 면
              </span>
            )}
          </div>
          {mapSelectedLot.operatingHours && <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>🕐 {mapSelectedLot.operatingHours}</div>}
          <div style={{ fontSize: 12, color: theme.accent, fontWeight: 600, whiteSpace: "pre-line" }}>
            {mapSelectedLot.parkingFeeDesc
              ? mapSelectedLot.parkingFeeDesc.replace(/\s*추가요금:/g, "\n추가요금:")
              : mapSelectedLot.feeUnit
              ? `기본 ${mapSelectedLot.feeUnit}분 ${mapSelectedLot.lotPrice}원\n추가 ${mapSelectedLot.addUnitTime}분당 ${mapSelectedLot.addUnitPrice}원`
              : "요금 정보 없음"}
          </div>
          {mapSelectedLot.tickets && mapSelectedLot.tickets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>주차권</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {mapSelectedLot.tickets.map((ticket, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(79,142,247,0.08)", borderRadius: 8, padding: "5px 10px", border: `1px solid rgba(79,142,247,0.2)` }}>
                    <span style={{ fontSize: 11, color: theme.textSecondary }}>{ticket.name}</span>
                    <span style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>{ticket.price.toLocaleString()}원 · {ticket.usagePeriodLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!(mapSelectedLot.parkingFeeDesc?.includes("무료") || mapSelectedLot.freeYn) && mapSelectedLot.feeUnit && (
            <button
              onClick={() => { setSelectedLot(mapSelectedLot); setMapSelectedLot(null); }}
              style={{ marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: theme.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              onMouseDown={e => e.currentTarget.style.opacity = "0.7"}
              onMouseUp={e => e.currentTarget.style.opacity = "0.85"}
            >요금 계산하기</button>
          )}
        </div>
      )}
    </>
  );
}