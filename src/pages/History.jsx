import { useEffect } from "react";
import { styles } from "../App";
import { getHistoryList, deleteHistory, deleteAllHistory } from "../api/history";

export default function History({ setPage, history, setHistory, setResult }) {
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getHistoryList();
        const data = await response.json();
        if (response.ok && data.data?.logs) {
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
                    zone: h.riskLevel === "HIGH" ? "주정차 금지구역" : h.riskLevel === "MEDIUM" ? "주의 구역" : "일반 구역",
                    line: "-",
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

  const handleDeleteHistory = async (historyId, idx) => {
    try {
      const response = await deleteHistory(historyId);
      if (response.ok) {
        setHistory(history.filter((_, i) => i !== idx));
      } else {
        alert("삭제 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  const handleDeleteAllHistory = async () => {
    try {
      const response = await deleteAllHistory();
      if (response.ok) {
        setHistory([]);
      } else {
        alert("전체 삭제 실패");
      }
    } catch (e) {
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
      </div>

      <div style={styles.resultCard}>
        <div style={styles.title}>분석 이력</div>

        {history.length === 0 && (
          <div style={styles.emptyText}>분석 기록이 없습니다.</div>
        )}

        {history.map((h, i) => (
          <div key={i} style={styles.historyCard}>
            <div style={styles.historyDate}>{h.date}</div>
            <div style={styles.historyAddress}>{h.address}</div>
            <div style={{ ...styles.badge, ...(h.type === "danger" && styles.badgeDanger), ...(h.type === "warning" && styles.badgeWarning), ...(h.type === "safe" && styles.badgeSafe), marginTop: 8, width: "fit-content" }}>
              {h.result}
            </div>
            <div style={styles.historyBtnRow}>
              <button style={styles.detailBtn} onClick={() => {
                setResult({ probability: h.probability, status: h.result, type: h.type, line: h.line, time: h.time, zone: h.zone, address: h.address, lat: h.lat, lng: h.lng });
                setPage("historyDetail");
              }}>
                상세 조회
              </button>
              <button style={styles.deleteBtn} onClick={() => handleDeleteHistory(h.id, i)}>
                삭제
              </button>
            </div>
          </div>
        ))}

        {history.length > 0 && (
          <button style={styles.allDeleteBtn} onClick={handleDeleteAllHistory}>전체 삭제</button>
        )}
      </div>

      <div style={{ height: 80 }} />
    </>
  );
}