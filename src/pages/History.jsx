import { useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { getHistoryList, deleteHistory, deleteAllHistory } from "../api/history";

export default function History({ setPage, history, setHistory, setResult }) {
  const { styles, theme } = useTheme();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getHistoryList();
        const data = await response.json();

        if (response.ok && data.data?.logs) {
          if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
            const fallbackLogs = data.data.logs.map((h) => {
              const createdAt = new Date(h.createdAt + "Z");
              return {
                id: h.id,
                address: "주소 확인 불가 (지도 로딩 지연)",
                lat: h.reqLat,
                lng: h.reqLng,
                date: `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`,
                result: h.riskLevel === "HIGH" ? "위험 · 주차 불가" : h.riskLevel === "MEDIUM" ? "주의 · 주차 가능" : "주차 가능",
                type: h.riskLevel === "HIGH" ? "danger" : h.riskLevel === "MEDIUM" ? "warning" : "safe",
                probability: h.probability,
                time: h.riskLevel === "HIGH" ? "07:00 - 22:00" : h.riskLevel === "MEDIUM" ? "일부 시간대 단속" : "단속 없음",
                zone: h.riskLevel === "HIGH" ? "주정차 금지구역" : h.riskLevel === "MEDIUM" ? "주의 구역" : "일반 구역",
                line: "-",
                imagePath: h.imagePath || null,
              };
            });
            setHistory(fallbackLogs);
            return;
          }

          const geocoder = new window.kakao.maps.services.Geocoder();
          const logsWithAddress = await Promise.all(
            data.data.logs.map((h) =>
              new Promise((resolve) => {
                geocoder.coord2Address(h.reqLng, h.reqLat, (res, status) => {
                  const address = status === window.kakao.maps.services.Status.OK
                    ? res[0].address.address_name
                    : "주소 없음";
                  const createdAt = new Date(h.createdAt + "Z");
                  resolve({
                    id: h.id,
                    address,
                    lat: h.reqLat,
                    lng: h.reqLng,
                    date: `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`,
                    result: h.riskLevel === "HIGH" ? "위험 · 주차 불가" : h.riskLevel === "MEDIUM" ? "주의 · 주차 가능" : "주차 가능",
                    type: h.riskLevel === "HIGH" ? "danger" : h.riskLevel === "MEDIUM" ? "warning" : "safe",
                    probability: h.probability,
                    time: h.riskLevel === "HIGH" ? "07:00 - 22:00" : h.riskLevel === "MEDIUM" ? "일부 시간대 단속" : "단속 없음",
                    line: h.lineColor || "-",
                    zone: h.reasoning ? h.reasoning : (h.riskLevel === "HIGH" ? "주정차 금지구역" : h.riskLevel === "MEDIUM" ? "주의 구역" : "일반 구역"),
                    imagePath: h.imagePath || null,
                  });
                });
              })
            )
          );
          setHistory(logsWithAddress);
        }
      } catch (e) {
        console.error("분석 이력 조회 실패:", e);
      }
    };
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ idx 대신 id 기반 + prev 사용으로 클로저 버그 수정
  const handleDeleteHistory = async (historyId) => {
    try {
      const response = await deleteHistory(historyId);
      if (response.ok) setHistory(prev => prev.filter((h) => h.id !== historyId));
      else alert("삭제 실패");
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  const handleDeleteAllHistory = async () => {
    try {
      const response = await deleteAllHistory();
      if (response.ok) setHistory([]);
      else alert("전체 삭제 실패");
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>
          <span style={{ color: theme.textPrimary }}>Safe</span>
          <span style={{ color: theme.accent }}>Park</span>
        </div>
      </div>

      <div style={styles.resultCard}>
        <div style={styles.title}>분석 이력</div>

        {history.length === 0 && (
          <div style={styles.emptyText}>분석 기록이 없습니다.</div>
        )}

        {history.map((h, i) => (
          <div key={h.id ?? i} style={styles.historyCard}>
            <div style={styles.historyDate}>{h.date}</div>
            <div style={styles.historyAddress}>{h.address}</div>
            <div style={{
              ...styles.badge,
              ...(h.type === "danger" && styles.badgeDanger),
              ...(h.type === "warning" && styles.badgeWarning),
              ...(h.type === "safe" && styles.badgeSafe),
              marginTop: 8, width: "fit-content"
            }}>
              {h.result}
            </div>
            <div style={styles.historyBtnRow}>
              <button
                style={styles.detailBtn}
                onClick={() => {
                  setResult({ probability: h.probability, status: h.result, type: h.type, line: h.line, time: h.time, zone: h.zone, address: h.address, lat: h.lat, lng: h.lng, imagePath: h.imagePath || null });
                  setPage("historyDetail");
                }}
                onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.accent; }}
                onMouseDown={e => e.currentTarget.style.opacity = "0.7"}
                onMouseUp={e => e.currentTarget.style.opacity = "1"}
              >
                상세 조회
              </button>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDeleteHistory(h.id)}
                onMouseEnter={e => { e.currentTarget.style.background = theme.danger; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.danger; }}
                onMouseDown={e => e.currentTarget.style.opacity = "0.7"}
                onMouseUp={e => e.currentTarget.style.opacity = "1"}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {history.length > 0 && (
          <button
            style={styles.allDeleteBtn}
            onClick={handleDeleteAllHistory}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            onMouseDown={e => e.currentTarget.style.opacity = "0.7"}
            onMouseUp={e => e.currentTarget.style.opacity = "0.85"}
          >
            전체 삭제
          </button>
        )}
      </div>

      <div style={{ height: 80 }} />
    </>
  );
}