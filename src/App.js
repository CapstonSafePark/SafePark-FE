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

  const handleSetPage = (newPage) => {
    setPage(newPage);
    setTimeout(() => {
      const frame = document.querySelector(".dark-mode, .light-mode");
      if (frame) frame.scrollTop = 0;
    }, 0);
  };
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [fromHistory, setFromHistory] = useState(false);

  return (
    <div style={styles.wrapper}>
      <div style={styles.frame} className={isDark ? "dark-mode" : "light-mode"}>
        {page === "login" && <Login setPage={handleSetPage} setUser={setUser} />}
        {page === "register" && <Register setPage={handleSetPage} />}
        {page === "main" && (
          <Main
            setPage={handleSetPage}
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
            setPage={handleSetPage}
            history={history}
            setHistory={setHistory}
            setResult={setResult}
          />
        )}
        {page === "historyDetail" && (
          <HistoryDetail setPage={handleSetPage} result={result} />
        )}
        {page === "mypage" && (
          <MyPage
            setPage={handleSetPage}
            user={user}
            setUser={setUser}
            history={history}
            setHistory={setHistory}
            setResult={setResult}
            setFromHistory={setFromHistory}
          />
        )}
        {page !== "login" && page !== "register" && (
          <TabBar page={page} setPage={handleSetPage} />
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