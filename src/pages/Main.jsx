import { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { getNearbyParkingLots, checkParking } from "../api/parking";
import { uploadImage } from "../api/analysis";
import {
  MdMyLocation, MdCameraAlt, MdPhotoLibrary, MdStreetview,
  MdSentimentVerySatisfied, MdSentimentSatisfied, MdSentimentNeutral,
  MdSentimentDissatisfied, MdSentimentVeryDissatisfied
} from "react-icons/md";
import ParkingCalculator from "../components/ParkingCalculator";

const BASE_URL = "https://safepark.duckdns.org";

export default function Main({ setPage, history, setHistory, result, setResult, fromHistory, setFromHistory }) {
  const { styles, theme } = useTheme();

  const getParkingStyles = () => ({
    lotCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${theme.border}` },
    lotLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 },
    lotIcon: { width: 36, height: 36, borderRadius: 10, background: `rgba(79,142,247,0.15)`, color: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
    lotName: { fontSize: 13, fontWeight: 600, marginBottom: 2, color: theme.textPrimary, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.4" },
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
  const [mapSelectedLot, setMapSelectedLot] = useState(null);
  const [parkingSortType, setParkingSortType] = useState("distance");
  const [showParkingMarkers, setShowParkingMarkers] = useState(false);
  const [showRoadview, setShowRoadview] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const parkingMarkersRef = useRef([]);
  const showParkingMarkersRef = useRef(false);
  const nearbyParkingRef = useRef([]);

  // ✅ useMemo 최상위 선언
  const sortedNearbyParking = useMemo(() => {
    if (!nearbyParking.length) return [];
    if (parkingSortType === "distance") {
      return [...nearbyParking].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else {
      return [...nearbyParking].sort((a, b) => {
        const aFree = (a.parkingFeeDesc && a.parkingFeeDesc.includes("무료")) || a.freeYn;
        const bFree = (b.parkingFeeDesc && b.parkingFeeDesc.includes("무료")) || b.freeYn;
        if (aFree && !bFree) return -1;
        if (!aFree && bFree) return 1;
        return (a.lotPrice ?? 9999) - (b.lotPrice ?? 9999);
      });
    }
  }, [nearbyParking, parkingSortType]);

  const updateMarkerVisibility = (lots, show) => {
    parkingMarkersRef.current.forEach(m => m.setMap(null));
    parkingMarkersRef.current = [];
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
      parkingMarkersRef.current.push(overlay);
    });
  };

  const fetchParkingData = async (lat, lng) => {
    try {
      const res = await getNearbyParkingLots(lat, lng, 1.0);
      const data = await res.json();
      const lots = Array.isArray(data) ? data : (data.data || []);
      nearbyParkingRef.current = lots;
      setNearbyParking(lots);
      updateMarkerVisibility(lots, showParkingMarkersRef.current);
    } catch (e) {
      console.error("주차장 마커 로드 실패:", e);
    }
  };
  const roadviewRef = useRef(null);
  const roadviewClientRef = useRef(null);
  const roadviewPositionRef = useRef(null);

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
      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

      if (!mapRef.current) {
        // 최초 지도 생성 시에만 중심 이동 및 마커 생성
        setCurrentLat(lat);
        setCurrentLng(lng);
        setRealLat(lat);
        setRealLng(lng);

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

        geocoder.coord2Address(lng, lat, (res, status) => {
          if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
        });
      } else {
        // 이후 GPS 업데이트 시에는 realLat/realLng(내 위치 버튼용)만 갱신, 지도는 그대로 유지
        setRealLat(lat);
        setRealLng(lng);
      }
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
  const handleRoadview = () => {
    if (!window.kakao || !window.kakao.maps) {
      alert("카카오 지도를 불러오지 못했습니다.");
      return;
    }
    if (!currentLat || !currentLng) {
      alert("현재 위치 정보가 없습니다.");
      return;
    }
    setShowRoadview(true);
    setTimeout(() => {
      const containerId = "roadview";
      const container = document.getElementById(containerId);
      if (!container) return;
      const position = new window.kakao.maps.LatLng(currentLat, currentLng);
      roadviewPositionRef.current = position;
      roadviewRef.current = new window.kakao.maps.Roadview(container);
      roadviewClientRef.current = new window.kakao.maps.RoadviewClient();
      roadviewClientRef.current.getNearestPanoId(position, 50, (panoId) => {
        if (panoId) {
          roadviewRef.current.setPanoId(panoId, position);
          // 로드뷰 내 이동 시 지도 마커 위치도 함께 업데이트
          window.kakao.maps.event.addListener(roadviewRef.current, "position_changed", () => {
            const rvPosition = roadviewRef.current.getPosition();
            roadviewPositionRef.current = rvPosition;
            if (mapRef.current && markerRef.current) {
              markerRef.current.setPosition(rvPosition);
              mapRef.current.setCenter(rvPosition);
            }
            setCurrentLat(rvPosition.getLat());
            setCurrentLng(rvPosition.getLng());
            const geocoder = new window.kakao.maps.services.Geocoder();
            geocoder.coord2Address(rvPosition.getLng(), rvPosition.getLat(), (res, status) => {
              if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
            });
          });
        } else {
          alert("해당 위치 근처 로드뷰를 찾을 수 없습니다.");
        }
      });
    }, 100);
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
      await fetchParkingData(lat, lng);
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
      {/* 상단 로고 */}
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: theme.textPrimary }}>Safe</span>
          <span style={{ color: theme.accent }}>Park</span>
        </div>
      </div>

      {/* 지도 */}
      <div style={{ position: "relative" }}>
        <div id="map" style={styles.map} />
        <div style={{ position: "absolute", bottom: 12, right: 10, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
          <div
            style={{ background: showParkingMarkers ? theme.accent : theme.card, borderRadius: 8, padding: 8, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
            onClick={() => {
              const next = !showParkingMarkers;
              setShowParkingMarkers(next);
              showParkingMarkersRef.current = next;
              if (next) {
                // 항상 현재 지도 화면 중심 기준으로 주차장 조회
                if (mapRef.current) {
                  const center = mapRef.current.getCenter();
                  fetchParkingData(center.getLat(), center.getLng());
                }
              } else {
                parkingMarkersRef.current.forEach(m => m.setMap(null));
                parkingMarkersRef.current = [];
              }
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
            onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: showParkingMarkers ? "#fff" : theme.accent }}>🅿</span>
          </div>
          <div
            style={{ background: theme.card, borderRadius: 8, padding: 8, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }}
            onClick={() => {
              if (mapRef.current && markerRef.current && realLat && realLng) {
                const moveLatLon = new window.kakao.maps.LatLng(realLat, realLng);
                mapRef.current.setCenter(moveLatLon);
                mapRef.current.setLevel(3);
                markerRef.current.setPosition(moveLatLon);
                setCurrentLat(realLat);
                setCurrentLng(realLng);
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.coord2Address(realLng, realLat, (res, status) => {
                  if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
                });
              }
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
            onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
          >
            <MdMyLocation size={20} color={theme.accent} />
          </div>
        </div>
      </div>

      {/* 현재 위치 카드 */}
      <div style={styles.locationCard}>
        <div style={{ fontSize: 10, color: theme.accent, fontWeight: "600" }}>현재 위치</div>
        <div style={{ fontSize: 12, color: theme.textSecondary, fontWeight: "600" }}>{address}</div>
      </div>

      {/* 파일 입력 */}
      <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <input type="file" ref={cameraInputRef} capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      {/* 업로드 버튼 */}
      <div style={styles.uploadRow}>
        <div
          style={{ ...styles.uploadBox, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s" }}
          onClick={() => cameraInputRef.current.click()}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
          onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
        >
          <MdCameraAlt size={16} color={theme.accent} />
          <span>카메라 촬영</span>
        </div>
        <div
          style={{ ...styles.uploadBox, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s" }}
          onClick={() => fileInputRef.current.click()}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
          onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
        >
          <MdPhotoLibrary size={16} color={theme.accent} />
          <span>갤러리 업로드</span>
        </div>
      </div>

      {/* 로드뷰 버튼 */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          style={{ ...styles.uploadBox, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity 0.15s", background: "rgba(79,142,247,0.04)" }}
          onClick={handleRoadview}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = "0.75";
            document.getElementById("roadview-tooltip").style.display = "block";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = "1";
            document.getElementById("roadview-tooltip").style.display = "none";
          }}
          onMouseDown={e => e.currentTarget.style.opacity = "0.5"}
          onMouseUp={e => e.currentTarget.style.opacity = "0.75"}
        >
          <MdStreetview size={16} color={theme.accent} />
          <span style={{ fontSize: 12, color: theme.accent }}>로드뷰</span>
        </div>
        <div
          id="roadview-tooltip"
          style={{
            display: "none",
            position: "absolute",
            bottom: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            fontSize: 11,
            padding: "6px 10px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          로드뷰에서 캡처한 사진을 갤러리에 저장 후 업로드해보세요
        </div>
      </div>
      {showRoadview && (
        <>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div id="roadview" style={{ width: "100%", height: "220px", borderRadius: "14px" }} />
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
              <div
                style={{ background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#fff", fontSize: 12 }}
                onClick={() => {
                  // 로드뷰 내에서 이동한 현재 위치 기준으로 전체화면 열기
                  const rvPos = roadviewPositionRef.current || new window.kakao.maps.LatLng(currentLat, currentLng);
                  setShowRoadview("full");
                  setTimeout(() => {
                    const container = document.getElementById("roadview-full");
                    if (!container) return;
                    const rv = new window.kakao.maps.Roadview(container);
                    const client = new window.kakao.maps.RoadviewClient();
                    client.getNearestPanoId(rvPos, 50, (panoId) => {
                      if (panoId) {
                        rv.setPanoId(panoId, rvPos);
                        // 전체화면에서도 이동 시 지도 마커 연동
                        window.kakao.maps.event.addListener(rv, "position_changed", () => {
                          const newPos = rv.getPosition();
                          roadviewPositionRef.current = newPos;
                          if (mapRef.current && markerRef.current) {
                            markerRef.current.setPosition(newPos);
                            mapRef.current.setCenter(newPos);
                          }
                          setCurrentLat(newPos.getLat());
                          setCurrentLng(newPos.getLng());
                          const geocoder = new window.kakao.maps.services.Geocoder();
                          geocoder.coord2Address(newPos.getLng(), newPos.getLat(), (res, status) => {
                            if (status === window.kakao.maps.services.Status.OK) setAddress(res[0].address.address_name);
                          });
                        });
                      } else {
                        alert("해당 위치 근처 로드뷰를 찾을 수 없습니다.");
                      }
                    });
                  }, 100);
                }}
              >⛶ 전체화면</div>
              <div
                style={{ background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#fff", fontSize: 12 }}
                onClick={() => setShowRoadview(false)}
              >닫기</div>
            </div>
          </div>

          {showRoadview === "full" && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000", zIndex: 999 }}>
              <div id="roadview-full" style={{ width: "100%", height: "100%" }} />
              <div
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 1000 }}
                onClick={() => setShowRoadview(true)}
              >✕ 닫기</div>
            </div>
          )}
        </>
      )}

      {/* 갤러리 업로드 이미지 미리보기 */}
      {image && <img src={image} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 12 }} />}

      {/* 분석/재분석 버튼 */}
      <button
        style={{ ...styles.button, transition: "opacity 0.2s" }}
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        onMouseEnter={e => { if (!isAnalyzing) e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        onMouseDown={e => { if (!isAnalyzing) e.currentTarget.style.opacity = "0.7"; }}
        onMouseUp={e => e.currentTarget.style.opacity = "0.85"}
      >
        {isAnalyzing ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
            분석 중...
          </span>
        ) : result ? "재분석" : "여기 주차해도 되나요?"}
      </button>      

      {/* 분석 결과 */}
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      {result.zone?.split(". ").filter(s => s.trim()).map((sentence, i, arr) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ color: c.text, fontSize: 10, marginTop: 3, flexShrink: 0 }}>•</span>
                          <span style={{ ...textStyle, fontSize: 12, lineHeight: "1.5" }}>
                            {sentence}{i < arr.length - 1 ? "." : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={styles.label}>주차선 판독</div>
                    <div style={textStyle}>{result.line || "업로드 된 사진 없음"}</div>
                  </div>
                  {result.imagePath && (
                    <div style={cardStyle}>
                      <div style={styles.label}>업로드한 사진</div>
                      <img
                        src={`${BASE_URL}${result.imagePath}`}
                        alt="분석 이미지"
                        style={{ width: "100%", borderRadius: 10, marginTop: 6, objectFit: "cover" }}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 주변 주차장 */}
      {result && nearbyParking.length > 0 && (
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
                  <div style={{ minWidth: 0, flex: 1 }}>
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

      {selectedLot && <ParkingCalculator lot={selectedLot} onClose={() => setSelectedLot(null)} />}
    </>
  );
}