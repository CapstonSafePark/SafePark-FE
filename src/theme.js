export const darkTheme = {
  // 배경
  wrapper: "#0F0F1E",
  frame: "#0F0F1E",
  card: "#1A1A2E",
  cardSub: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",

  // 텍스트
  textPrimary: "#F0F0FF",
  textSecondary: "#A0A0C0",
  textMuted: "#606080",

  // 포인트
  accent: "#4F8EF7",
  accentDark: "#2D6BE4",

  // 상태
  danger: "#E74D3C",
  warning: "#F39C12",
  safe: "#2ECC71",

  // 입력
  inputBg: "#1A1A2E",
  inputBorder: "rgba(255,255,255,0.12)",

  // 탭바
  tabBar: "#0F0F1E",
  tabBarBorder: "rgba(255,255,255,0.08)",

  // 버튼
  smallBtnBg: "#2A2A44",
  circleBg: "#2A2A40",
};

export const lightTheme = {
  // 배경
  wrapper: "#F0F4FF",
  frame: "#F0F4FF",
  card: "#FFFFFF",
  cardSub: "rgba(0,0,0,0.03)",
  border: "rgba(0,0,0,0.08)",

  // 텍스트
  textPrimary: "#1A1A2E",
  textSecondary: "#555577",
  textMuted: "#9090AA",

  // 포인트
  accent: "#2D6BE4",
  accentDark: "#1A4FC0",

  // 상태
  danger: "#D93025",
  warning: "#E67E00",
  safe: "#1BA354",

  // 입력
  inputBg: "#FFFFFF",
  inputBorder: "rgba(0,0,0,0.15)",

  // 탭바
  tabBar: "#FFFFFF",
  tabBarBorder: "rgba(0,0,0,0.08)",

  // 버튼
  smallBtnBg: "#E8EAFF",
  circleBg: "#E0E4F0",
};

export const getStyles = (t) => ({
  wrapper: { minWidth: "100vw", minHeight: "100vh", display: "flex", justifyContent: "center", background: t.wrapper },  
  frame: { width: "400px", height: "100vh", background: t.frame, padding: "16px", paddingBottom: "80px", color: t.textPrimary, fontFamily: "Noto Sans KR", position: "relative", overflowY: "auto" },
  topbar: { marginBottom: 10, fontWeight: 800, fontSize: 18 },
  topbarRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  logoText: { fontWeight: 800, fontSize: 18 },
  profileBtn: { cursor: "pointer", fontSize: 18, color: t.textPrimary },
  map: { width: "100%", height: "220px", borderRadius: "14px", marginBottom: "12px" },
  locationCard: { background: t.card, padding: "12px", borderRadius: "14px", marginBottom: "12px", border: `1px solid ${t.border}` },
  uploadRow: { display: "flex", gap: "10px", marginBottom: "12px" },
  uploadBox: { flex: 1, background: `rgba(79,142,247,0.06)`, border: `1px solid rgba(79,142,247,0.3)`, borderRadius: "12px", padding: "12px", textAlign: "center", fontSize: "12px", cursor: "pointer", color: t.accent },
  button: { width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`, color: "#fff", fontWeight: "bold", marginBottom: "12px", cursor: "pointer", fontSize: 14 },
  resultCard: { background: t.card, padding: "16px", borderRadius: "14px", border: `1px solid ${t.border}` },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "700", color: t.textPrimary },
  subCard: { marginTop: "10px", padding: "10px", background: t.cardSub, borderRadius: "8px", fontSize: "11px", color: t.textSecondary, border: `1px solid ${t.border}` },
  detailWrap: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" },
  redCard: { padding: "12px", background: "rgba(231,77,60,0.07)", borderRadius: "10px" },
  yellowCard: { padding: "12px", background: "rgba(239,153,39,0.07)", borderRadius: "10px" },
  label: { fontSize: "11px", color: t.textMuted, marginBottom: 2 },
  redText: { color: t.danger, fontSize: "12px" },
  yellowText: { color: t.warning, fontSize: "12px" },
  inputWrap: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  input: { padding: "12px", borderRadius: "10px", border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.textPrimary, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  switchText: { textAlign: "center", fontSize: "12px", color: t.textSecondary },
  link: { color: t.accent, cursor: "pointer", fontWeight: 600 },
  smallBtn: { marginTop: "8px", padding: "10px", width: "100%", borderRadius: "8px", border: "none", background: t.smallBtnBg, color: t.textPrimary, cursor: "pointer", fontSize: 13, transition: "opacity 0.15s" },
  badge: { borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "600" },
  badgeDanger: { background: "rgba(231,77,60,0.15)", border: "1px solid rgba(231,77,60,0.3)", color: t.danger },
  badgeWarning: { background: "rgba(243,156,18,0.15)", border: "1px solid rgba(243,156,18,0.3)", color: t.warning },
  badgeSafe: { background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: t.safe },
  probabilityWrap: { marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" },
  circleWrapper: { position: "relative", width: "100px", height: "100px" },
  percentText: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "20px", fontWeight: "700" },
  probText: { fontSize: "12px", color: t.textSecondary, marginTop: "6px" },
  emptyText: { marginTop: 10, color: t.textMuted, fontSize: 12 },
  historyCard: { background: t.cardSub, borderRadius: "12px", padding: "12px", marginTop: "12px", border: `1px solid ${t.border}` },
  historyDate: { fontSize: "11px", color: t.textMuted },
  historyAddress: { marginTop: 4, fontSize: "13px", fontWeight: "600", color: t.textPrimary },
  historyBtnRow: { display: "flex", gap: "8px", marginTop: "10px" },
  detailBtn: { flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, cursor: "pointer", fontSize: 13, transition: "background 0.15s, color 0.15s" },
  deleteBtn: { flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${t.danger}`, background: "transparent", color: t.danger, cursor: "pointer", fontSize: 13, transition: "background 0.15s, color 0.15s" },
  allDeleteBtn: { marginTop: "12px", width: "100%", padding: "10px", borderRadius: "10px", border: "none", background: t.danger, color: "#fff", cursor: "pointer", fontSize: 13, transition: "opacity 0.15s" },  
  withdrawBtn: { marginTop: "8px", padding: "10px", width: "100%", borderRadius: "8px", border: `1px solid rgba(231,77,60,0.4)`, background: "transparent", color: t.danger, cursor: "pointer", fontSize: 13, transition: "background 0.15s, color 0.15s" },  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.border}` },
  infoValue: { fontSize: 13, color: t.textSecondary },
});