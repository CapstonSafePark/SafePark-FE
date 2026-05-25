import { useEffect, useState, useRef } from "react";
import { useTheme } from "../ThemeContext";
import { getNearbyParkingLots, checkParking } from "../api/parking";
import { uploadImage } from "../api/analysis";
import { MdMyLocation, MdSentimentVerySatisfied, MdSentimentSatisfied, MdSentimentNeutral, MdSentimentDissatisfied, MdSentimentVeryDissatisfied } from "react-icons/md";
import ParkingCalculator from "../components/ParkingCalculator";

export default function Main({ setPage, history, setHistory, result, setResult, fromHistory, setFromHistory }) {
  const { styles, theme } = useTheme();

  const getParkingStyles = () => ({
    lotCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${theme.border}` },
    lotLeft: { display: "flex", alignItems: "center", gap: 12 },
    lotIcon: { width: 36, height: 36, borderRadius: 10, background: `rgba(79,142,247,0.15)`, color: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
    lotName: { fontSize: 13, fontWeight: 600, marginBottom: 2, color: theme.textPrimary },
    lotInfo: { fontSize: 11, color: theme.textMuted, marginBottom: 4 },
    lotBadge: { display: "inline-block", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 },
    lotPrice: { textAlign: "right" },
    priceText: { fontSize: 14, fontWeight: 700, color: theme.accent },
    priceUnit: { fontSize: 10, color: theme.textMuted },
  });

  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [address, setAddress] = useState("위치 불러오는 중...");
  const [currentLat, setCurrentLat] = useState(null);
  const [currentLng, setCurrentLng] = useState(null);
  const [realLat, setRealLat] = useState(null);
  const [realLng, setRealLng] = useState(null);
  const [nearbyParking, setNearbyParking] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);


  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    mapRef.current = null;
    markerRef.current = null;

    if (!fromHistory) setResult(null);
    setFromHistory(false);

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    let watchId = null;

    const initMap = (lat, lng) => {
      const container = document.getElementById("map");
      if (!container) return;

      setCurrentLat(lat);
      setCurrentLng(lng);
      setRealLat(lat);
      setRealLng(lng);

      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

      if (!mapRef.current) {
        const map = new window.kakao.maps.Map(container, { center: moveLatLon, level: 3 });
        const marker = new window.kakao.maps.Marker({ position: moveLatLon, draggable: true });
        marker.setMap(map);

        window.kakao.maps.event.addListener(map, "click", (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          setCurrentLat(latlng.getLat());
          setCurrentLng(latlng.getLng());
          marker.setPosition(latlng);
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (res, status) => {
            if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
          });
        });

        window.kakao.maps.event.addListener(marker, "dragend", () => {
          const pos = marker.getPosition();
          setCurrentLat(pos.getLat());
          setCurrentLng(pos.getLng());
          geocoder.coord2Address(pos.getLng(), pos.getLat(), (res, status) => {
            if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
          });
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.setCenter(moveLatLon);
        markerRef.current.setPosition(moveLatLon);
      }

      geocoder.coord2Address(lng, lat, (res, status) => {
        if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const MAX_SIZE = 800;
      let width = img.width, height = img.height;
      if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
      else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
        setImageFile(compressedFile);
        setImage(URL.createObjectURL(compressedFile));
      }, "image/jpeg", 0.7);
    };
    img.src = URL.createObjectURL(file);
  };

  const formatReasoning = (reasoning) => {
    if (!reasoning) return "-";
    const zoneMatch = reasoning.match(/반경 내 단속구역 [^.]*/);
    const zone = zoneMatch ? zoneMatch[0] : "";
    const probMatch = reasoning.match(/과태료 확률: (\d+)%/);
    const prob = probMatch ? `과태료 확률 ${probMatch[1]}%` : "";
    const result = [zone, prob].filter(Boolean).join(" / ");
    return result || reasoning;
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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const lat = currentLat || 37.5665;
    const lng = currentLng || 126.9780;

    try {
      let newResult;
      if (imageFile) {
        const uploadResponse = await uploadImage(imageFile, lat, lng);
        const uploadData = await uploadResponse.json();
        const data = uploadData.data;
        const lineColorMap = {
          yellow_double: "황색 이중선", yellow_single: "황색 단선", yellow_dashed: "황색 점선", none: "차선 감지 불가",
          "황색이중선": "황색 이중선", "황색단선": "황색 단선", "백색점선": "백색 점선", "없음": "차선 감지 불가",
        };
        const lineText = data.lineColor ? (lineColorMap[data.lineColor] || data.lineColor) : null;
        if (data.riskLevel === "HIGH") {
          newResult = { probability: data.probability, status: "위험 · 주차 불가", type: "danger", line: lineText, time: "07:00 - 22:00", zone: formatReasoning(data.reasoning), imagePath: data.imagePath };
        } else if (data.riskLevel === "MEDIUM") {
          newResult = { probability: data.probability, status: "주의 · 주차 가능", type: "warning", line: lineText, time: "일부 시간대 단속", zone: formatReasoning(data.reasoning), imagePath: data.imagePath };
        } else {
          newResult = { probability: data.probability, status: "주차 가능", type: "safe", line: lineText, time: "단속 없음", zone: formatReasoning(data.reasoning), imagePath: data.imagePath };
        }
      } else {
        const checkResponse = await checkParking(lat, lng);
        const checkData = await checkResponse.json();
        const data = checkData.data;
        if (data.riskLevel === "HIGH") {
          newResult = { probability: data.probability, status: "위험 · 주차 불가", type: "danger", line: null, time: "07:00 - 22:00 단속", zone: formatReasoning(data.reasoning) };
        } else if (data.riskLevel === "MEDIUM") {
          newResult = { probability: data.probability, status: "주의 · 주차 가능", type: "warning", line: null, time: "단속 없음", zone: formatReasoning(data.reasoning) };
        } else {
          newResult = { probability: data.probability, status: "주차 가능", type: "safe", line: null, time: "단속 없음", zone: formatReasoning(data.reasoning) };
        }
      }

      setResult(newResult);
      setHistory([
        { address, date: new Date().toLocaleDateString(), result: newResult.status, type: newResult.type, probability: newResult.probability, time: newResult.time, zone: newResult.zone, line: newResult.line, lat: currentLat, lng: currentLng, imagePath: newResult.imagePath || null },
        ...history,
      ]);

      const parkingResponse = await getNearbyParkingLots(lat, lng);
      const parkingData = await parkingResponse.json();
      if (Array.isArray(parkingData)) setNearbyParking(parkingData);
      else if (Array.isArray(parkingData.data)) setNearbyParking(parkingData.data);

    } catch (e) {
      console.error("분석 오류:", e);
      alert("서버 연결 실패");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parkingStyles = getParkingStyles();

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: theme.textPrimary }}>Safe</span>
          <span style={{ color: theme.accent }}>Park</span>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div id="map" style={styles.map} />
        <div
          style={{ position: "absolute", bottom: 12, right: 10, background: theme.card, borderRadius: 8, padding: 8, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => {
            if (mapRef.current && markerRef.current && realLat && realLng) {
              const moveLatLon = new window.kakao.maps.LatLng(realLat, realLng);
              mapRef.current.setCenter(moveLatLon);
              markerRef.current.setPosition(moveLatLon);
              setCurrentLat(realLat);
              setCurrentLng(realLng);
              const geocoder = new window.kakao.maps.services.Geocoder();
              geocoder.coord2Address(realLng, realLat, (res, status) => {
                if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
              });
            }
          }}
        >
          <MdMyLocation size={20} color={theme.accent} />
        </div>
      </div>

      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: theme.accent }}>현재 위치</div>
        <div style={{ fontSize: 12, color: theme.textSecondary }}>{address}</div>
      </div>

      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <input type="file" ref={cameraInputRef} capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      <div style={styles.uploadRow}>
        <div style={styles.uploadBox} onClick={() => cameraInputRef.current.click()}>카메라 촬영</div>
        <div style={styles.uploadBox} onClick={() => fileInputRef.current.click()}>갤러리 업로드</div>
      </div>

      {image && <img src={image} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button style={{ ...styles.button, marginBottom: 0, flex: 1, transition: "opacity 0.2s" }} onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{
                width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                borderTop: "2px solid #fff", borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite"
              }} />
              분석 중...
            </span>
          ) : "여기 주차해도 되나요?"}
        </button>
        {result && (
          <button
            style={{ ...styles.button, marginBottom: 0, flex: 1, background: theme.smallBtnBg, color: theme.textPrimary }}
            onClick={() => { setResult(null); setImage(null); setImageFile(null); setNearbyParking([]); }}
          >
            재분석
          </button>
        )}
      </div>

      {result && (
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
          <div style={styles.subCard}>{result.address || address}</div>
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
                    <div style={textStyle}>{result.line || "업로드 된 사진 없음"}</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {result && nearbyParking.length > 0 && (
        <div style={{ ...styles.resultCard, marginTop: 12 }}>
          <div style={styles.title}>주변 주차장</div>
          {nearbyParking.map((lot) => {
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
                    <div style={{ ...parkingStyles.lotBadge, background: isFree ? "rgba(46,204,113,0.15)" : "rgba(79,142,247,0.15)", color: isFree ? "#2ECC71" : theme.accent, border: isFree ? "1px solid rgba(46,204,113,0.3)" : `1px solid rgba(79,142,247,0.3)` }}>
                      {isFree ? "무료" : "유료"}
                    </div>
                  </div>
                </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{ ...parkingStyles.priceText, whiteSpace: "pre-line", textAlign: "right", fontSize: 11, lineHeight: "1.5" }}>{isFree ? "무료" : priceText}</div>
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
      {selectedLot && (
        <ParkingCalculator lot={selectedLot} onClose={() => setSelectedLot(null)} />
      )}
    </>
  );
}