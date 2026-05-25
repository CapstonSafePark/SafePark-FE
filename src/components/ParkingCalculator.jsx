import { useState } from "react";
import { useTheme } from "../ThemeContext";

export default function ParkingCalculator({ lot, onClose }) {
  const { styles, theme } = useTheme();
  const [entryTime, setEntryTime] = useState("");
  const [result, setResult] = useState(null);

  const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;

  const calculate = () => {
    if (!entryTime) return alert("입차 시간을 입력해주세요");

    const now = new Date();
    const entry = new Date();
    const [hours, minutes] = entryTime.split(":").map(Number);
    entry.setHours(hours, minutes, 0, 0);

    // 입차 시간이 현재보다 미래면 전날로 처리
    if (entry > now) entry.setDate(entry.getDate() - 1);

    const diffMin = Math.floor((now - entry) / 1000 / 60);

    if (isFree) {
      setResult({ totalFee: 0, parkingTime: diffMin, message: "무료 주차장입니다" });
      return;
    }

    if (!lot.feeUnit || !lot.lotPrice) {
      setResult({ totalFee: null, parkingTime: diffMin, message: "요금 정보가 없습니다" });
      return;
    }

    let totalFee = lot.lotPrice;
    if (diffMin > lot.feeUnit) {
      const extraMin = diffMin - lot.feeUnit;
      const extraFee = Math.ceil(extraMin / lot.addUnitTime) * lot.addUnitPrice;
      totalFee += extraFee;
    }

    setResult({ totalFee, parkingTime: diffMin, message: null });
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      width: "375px", height: "100vh", background: "rgba(0,0,0,0.5)",
      zIndex: 200, display: "flex", alignItems: "flex-end",
    }}>
      <div style={{
        width: "100%", background: theme.card, borderRadius: "20px 20px 0 0",
        padding: "20px 16px 40px", border: `1px solid ${theme.border}`,
      }}>
        {/* 헤더 */}
        <div style={{ ...styles.rowBetween, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>
            요금 계산기
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", fontSize: 18, color: theme.textMuted }}>✕</div>
        </div>

        {/* 주차장 이름 */}
        <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
          📍 {lot.lotName}
        </div>

        {/* 요금 정보 */}
        <div style={{ ...styles.subCard, marginTop: 0, marginBottom: 16 }}>
          {isFree ? (
            <div style={{ color: theme.safe, fontWeight: 600 }}>무료 주차장</div>
          ) : (
            <>
              <div style={{ color: theme.textSecondary }}>기본 {lot.feeUnit}분 {lot.lotPrice?.toLocaleString()}원</div>
              {lot.addUnitTime && <div style={{ color: theme.textSecondary }}>추가 {lot.addUnitTime}분당 {lot.addUnitPrice?.toLocaleString()}원</div>}
            </>
          )}
        </div>

        {/* 입차 시간 입력 */}
        <div style={{ marginBottom: 16 }}>
          <div style={styles.label}>입차 시간</div>
          <input
            type="time"
            style={{ ...styles.input, marginTop: 6 }}
            value={entryTime}
            onChange={(e) => { setEntryTime(e.target.value); setResult(null); }}
          />
        </div>

        {/* 계산 버튼 */}
        <button style={{ ...styles.button, marginBottom: 0 }} onClick={calculate}>
          요금 계산
        </button>

        {/* 결과 */}
        {result && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: result.totalFee === 0 ? "rgba(46,204,113,0.1)" : "rgba(79,142,247,0.08)",
            border: `1px solid ${result.totalFee === 0 ? "rgba(46,204,113,0.3)" : theme.border}`,
          }}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>
              주차 시간: {formatTime(result.parkingTime)}
            </div>
            {result.message ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.safe }}>{result.message}</div>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.accent }}>
                {result.totalFee?.toLocaleString()}원
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}