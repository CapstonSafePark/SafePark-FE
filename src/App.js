import { useState } from "react";
import { ThemeProvider } from "./ThemeContext";
import { useTheme } from "./ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Main from "./pages/Main";
import MyPage from "./pages/MyPage";
import HistoryDetail from "./pages/HistoryDetail";
import TabBar from "./components/TabBar";
import History from "./pages/History";

function AppInner() {
  const { styles, isDark } = useTheme();
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [fromHistory, setFromHistory] = useState(false);

  return (
    <div style={styles.wrapper}>
      <div style={styles.frame} className={isDark ? "dark-mode" : "light-mode"}>
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
        {page === "history" && (
          <History
            setPage={setPage}
            history={history}
            setHistory={setHistory}
            setResult={setResult}
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
        {page !== "login" && page !== "register" && (
          <TabBar page={page} setPage={setPage} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}