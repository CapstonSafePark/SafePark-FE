import { useState } from "react";
import { useTheme } from "../ThemeContext";

export default function ParkingCalculator({ lot, onClose }) {
  const { styles, theme } = useTheme();

  const isFree = (lot.parkingFeeDesc && lot.parkingFeeDesc.includes("무료")) || lot.freeYn === true;

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [entryDate, setEntryDate] = useState(today);
  const [entryTime, setEntryTime] = useState(nowTime);
  const [exitDate, setExitDate] = useState(today);
  const [exitTime, setExitTime] = useState(nowTime);
  const [isAllDay, setIsAllDay] = useState(false);
  const [result, setResult] = useState(null);

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}시간 ${m}분`;
    if (h > 0) return `${h}시간`;
    return `${m}분`;
  };

  const findAllDayTicket = () => {
    if (!lot.tickets || lot.tickets.length === 0) return null;
    return lot.tickets.find(t =>
      t.name && (t.name.includes("종일") || t.name.includes("당일"))
    ) || null;
  };

  const findMonthlyTicket = () => {
    if (!lot.tickets || lot.tickets.length === 0) return null;
    return lot.tickets.find(t => t.name && t.name.includes("월정기")) || null;
  };

  const allDayTicket = findAllDayTicket();
  const monthlyTicket = findMonthlyTicket();

  const calculate = () => {
    if (isFree) {
      setResult({ totalFee: 0, duration: 0, breakdown: [], message: "무료 주차장입니다" });
      return;
    }

    if (isAllDay) {
      const ticketFee = allDayTicket ? allDayTicket.price : null;
      const fallbackFee = lot.allDayPrice || lot.maxDayPrice || null;
      const allDayFee = ticketFee ?? fallbackFee;
      const ticketLabel = allDayTicket ? allDayTicket.name : "종일권";
      const usageLabel = allDayTicket ? allDayTicket.usagePeriodLabel : null;

      setResult({
        totalFee: allDayFee,
        duration: 1440,
        breakdown: allDayFee
          ? [{ label: ticketLabel + (usageLabel ? ` (${usageLabel})` : ""), fee: allDayFee }]
          : [],
        message: allDayFee ? null : "종일권 요금 정보가 없습니다",
      });
      return;
    }

    const entry = new Date(`${entryDate}T${entryTime}`);
    const exit = new Date(`${exitDate}T${exitTime}`);

    if (exit <= entry) {
      alert("출차 시간이 입차 시간보다 늦어야 해요");
      return;
    }

    const diffMin = Math.floor((exit - entry) / 1000 / 60);

    if (!lot.feeUnit || !lot.lotPrice) {
      setResult({ totalFee: null, duration: diffMin, breakdown: [], message: "요금 정보가 없습니다" });
      return;
    }

    const feeUnit = Number(lot.feeUnit);
    const lotPrice = Number(lot.lotPrice);
    const addUnitTime = Number(lot.addUnitTime);
    const addUnitPrice = Number(lot.addUnitPrice);

    const breakdown = [];
    let totalFee = 0;

    breakdown.push({ label: `기본 ${feeUnit}분`, fee: lotPrice });
    totalFee += lotPrice;

    if (diffMin > feeUnit && addUnitTime && addUnitPrice) {
      const extraMin = diffMin - feeUnit;
      const extraUnits = Math.ceil(extraMin / addUnitTime);
      const extraFee = extraUnits * addUnitPrice;
      breakdown.push({ label: `추가 ${extraMin}분 (${addUnitTime}분 × ${extraUnits}회)`, fee: extraFee });
      totalFee += extraFee;
    }

    if (lot.maxDayPrice && totalFee > Number(lot.maxDayPrice)) {
      const capped = Number(lot.maxDayPrice);
      breakdown.push({ label: "일일 최대 요금 적용", fee: null, note: `${capped.toLocaleString()}원으로 제한` });
      totalFee = capped;
    }

    setResult({ totalFee, duration: diffMin, breakdown, message: null });
  };

  const inputStyle = {
    background: theme.inputBg || "rgba(255,255,255,0.05)",
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: theme.textPrimary,
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  };

  const rowStyle = { display: "flex", gap: 8 };

  return (
    // ✅ 바텀 시트 → 화면 중앙 모달로 변경
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
      }}
    >
      <div style={{
        width: "100%",
        maxWidth: "375px",
        background: theme.card,
        borderRadius: 20,
        padding: "20px 16px 32px",
        border: `1px solid ${theme.border}`,
        maxHeight: "85vh",
        overflowY: "auto",
      }}>
        {/* 헤더 */}
        <div style={{ ...styles.rowBetween, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>요금 계산기</div>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", fontSize: 18, color: theme.textMuted, transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >✕</div>
        </div>

        {/* 주차장 이름 */}
        <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 12 }}>📍 {lot.lotName}</div>

        {/* 요금 정보 */}
        <div style={{ ...styles.subCard, marginTop: 0, marginBottom: 16 }}>
          {isFree ? (
            <div style={{ color: "#2ECC71", fontWeight: 600 }}>무료 주차장</div>
          ) : (
            <>
              {lot.feeUnit && <div style={{ color: theme.textSecondary, fontSize: 12 }}>기본 {lot.feeUnit}분 {Number(lot.lotPrice).toLocaleString()}원</div>}
              {lot.addUnitTime && <div style={{ color: theme.textSecondary, fontSize: 12 }}>추가 {lot.addUnitTime}분당 {Number(lot.addUnitPrice).toLocaleString()}원</div>}
              {lot.maxDayPrice && <div style={{ color: theme.textSecondary, fontSize: 12 }}>일일 최대 {Number(lot.maxDayPrice).toLocaleString()}원</div>}
              {allDayTicket && (
                <div style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {allDayTicket.name} {Number(allDayTicket.price).toLocaleString()}원 ({allDayTicket.usagePeriodLabel})
                </div>
              )}
              {monthlyTicket && (
                <div style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {monthlyTicket.name} {Number(monthlyTicket.price).toLocaleString()}원 ({monthlyTicket.usagePeriodLabel})
                </div>
              )}
            </>
          )}
        </div>

        {/* 종일권 토글 */}
        {(allDayTicket || lot.allDayPrice || lot.maxDayPrice) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: `1px solid ${theme.border}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>종일권</div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>
                {allDayTicket
                  ? `${Number(allDayTicket.price).toLocaleString()}원 · ${allDayTicket.usagePeriodLabel}`
                  : "하루 종일 주차 요금"}
              </div>
            </div>
            <div
              onClick={() => { setIsAllDay(!isAllDay); setResult(null); }}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isAllDay ? theme.accent : theme.border,
                position: "relative", cursor: "pointer", transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: isAllDay ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </div>
          </div>
        )}

        {!isAllDay && (
          <>
            {/* 입차 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 4 }}>🅿 입차</div>
              <div style={rowStyle}>
                <input type="date" style={inputStyle} value={entryDate} onChange={(e) => { setEntryDate(e.target.value); setResult(null); }} />
                <input type="time" style={inputStyle} value={entryTime} onChange={(e) => { setEntryTime(e.target.value); setResult(null); }} />
              </div>
            </div>

            {/* 출차 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 4 }}>🚗 출차</div>
              <div style={rowStyle}>
                <input type="date" style={inputStyle} value={exitDate} onChange={(e) => { setExitDate(e.target.value); setResult(null); }} />
                <input type="time" style={inputStyle} value={exitTime} onChange={(e) => { setExitTime(e.target.value); setResult(null); }} />
              </div>
            </div>
          </>
        )}

        {/* 계산 버튼 */}
        <button
          style={{ ...styles.button, marginBottom: 0, transition: "opacity 0.15s" }}
          onClick={calculate}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onMouseDown={e => e.currentTarget.style.opacity = "0.7"}
          onMouseUp={e => e.currentTarget.style.opacity = "0.85"}
        >
          요금 계산
        </button>

        {/* 결과 */}
        {result && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: result.totalFee === 0 ? "rgba(46,204,113,0.1)" : "rgba(79,142,247,0.08)",
            border: `1px solid ${result.totalFee === 0 ? "rgba(46,204,113,0.3)" : theme.border}`,
          }}>
            {result.message ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2ECC71" }}>{result.message}</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                  🕐 주차 시간: {formatDuration(result.duration)}
                </div>
                {result.breakdown.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    {result.breakdown.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < result.breakdown.length - 1 ? `1px solid ${theme.border}` : "none" }}>
                        <div style={{ fontSize: 12, color: theme.textSecondary }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: item.note ? theme.warning : theme.textPrimary, fontWeight: 600 }}>
                          {item.note ? item.note : item.fee != null ? `${Number(item.fee).toLocaleString()}원` : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>총 요금</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>
                    {result.totalFee != null ? `${Number(result.totalFee).toLocaleString()}원` : "정보 없음"}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}