import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Main from "./pages/Main";
import MyPage from "./pages/MyPage";
import HistoryDetail from "./pages/HistoryDetail";

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [fromHistory, setFromHistory] = useState(false);

  return (
    <div style={styles.wrapper}>
      <div style={styles.frame}>
        {page === "login" && <Login setPage={setPage} setUser={setUser} />}
        {page === "register" && <Register setPage={setPage} />}
        {page === "main" && (
          <Main
            setPage={setPage}
            history={history}
            setHistory={setHistory}
            result={result}
            setResult={setResult}
            fromHistory={fromHistory}
            setFromHistory={setFromHistory}
          />
        )}
        {page === "historyDetail" && (
         <HistoryDetail setPage={setPage} result={result} />
        )}
        {page === "mypage" && (
          <MyPage
            setPage={setPage}
            user={user}
            setUser={setUser}
            history={history}
            setHistory={setHistory}
            setResult={setResult}
            setFromHistory={setFromHistory}
          />
        )}
      </div>
    </div>
  );
}

export const styles = {
  wrapper: { width: "100vw", height: "100vh", display: "flex", justifyContent: "center", background: "#ffffff" },
  frame: { width: "375px", height: "100vh", background: "#0D0D1A", padding: "16px", color: "#fff", fontFamily: "Noto Sans KR", position: "relative", overflowY: "auto" },
  topbar: { marginBottom: 10, fontWeight: 800, fontSize: 18 },
  topbarRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  logoText: { fontWeight: 800, fontSize: 18 },
  profileBtn: { cursor: "pointer", fontSize: 18 },
  map: { width: "100%", height: "220px", borderRadius: "14px", marginBottom: "12px" },
  locationCard: { background: "#141425", padding: "12px", borderRadius: "14px", marginBottom: "12px" },
  uploadRow: { display: "flex", gap: "10px", marginBottom: "12px" },
  uploadBox: { flex: 1, background: "rgba(79,142,247,0.05)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: "12px", padding: "12px", textAlign: "center", fontSize: "12px", cursor: "pointer" },
  button: { width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #4F8EF7, #2D6BE4)", color: "#fff", fontWeight: "bold", marginBottom: "12px", cursor: "pointer" },
  resultCard: { background: "#141425", padding: "16px", borderRadius: "14px" },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "14px", fontWeight: "700" },
  subCard: { marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "11px", color: "#9898B8" },
  detailWrap: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" },
  redCard: { padding: "12px", background: "rgba(231,77,60,0.07)", borderRadius: "10px" },
  yellowCard: { padding: "12px", background: "rgba(239,153,39,0.07)", borderRadius: "10px" },
  label: { fontSize: "11px", color: "#9898B8" },
  redText: { color: "#E74D3C", fontSize: "12px" },
  yellowText: { color: "#F39C12", fontSize: "12px" },
  inputWrap: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "#141425", color: "#fff" },
  switchText: { textAlign: "center", fontSize: "12px", color: "#9898B8" },
  link: { color: "#4F8EF7", cursor: "pointer" },
  smallBtn: { marginTop: "8px", padding: "8px", width: "100%", borderRadius: "8px", border: "none", background: "#2D2D44", color: "#fff", cursor: "pointer" },
  badge: { borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "600" },
  badgeDanger: { background: "rgba(231,77,60,0.15)", border: "1px solid rgba(231,77,60,0.3)", color: "#E74D3C" },
  badgeWarning: { background: "rgba(243,156,18,0.15)", border: "1px solid rgba(243,156,18,0.3)", color: "#F39C12" },
  badgeSafe: { background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ECC71" },
  probabilityWrap: { marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" },
  circleWrapper: { position: "relative", width: "100px", height: "100px" },
  percentText: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "20px", fontWeight: "700" },
  probText: { fontSize: "12px", color: "#9898B8", marginTop: "6px" },
  emptyText: { marginTop: 10, color: "#9898B8", fontSize: 12 },
  historyCard: { background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px", marginTop: "12px" },
  historyDate: { fontSize: "11px", color: "#9898B8" },
  historyAddress: { marginTop: 4, fontSize: "13px", fontWeight: "600" },
  historyBtnRow: { display: "flex", gap: "8px", marginTop: "10px" },
  detailBtn: { flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#4F8EF7", color: "#fff", cursor: "pointer" },
  deleteBtn: { flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid rgba(231,77,60,0.4)", background: "transparent", color: "#E74D3C", cursor: "pointer" },
  allDeleteBtn: { marginTop: "12px", width: "100%", padding: "10px", borderRadius: "10px", border: "none", background: "#2D2D44", color: "#fff", cursor: "pointer" },
  withdrawBtn: { marginTop: "8px", padding: "8px", width: "100%", borderRadius: "8px", border: "1px solid rgba(231,77,60,0.4)", background: "transparent", color: "#E74D3C", cursor: "pointer" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  infoValue: { fontSize: 13, color: "#C8C8E0" },
};