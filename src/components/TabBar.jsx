import { HiHome, HiClipboardList, HiUser } from "react-icons/hi";
import { useTheme } from "../ThemeContext";

export default function TabBar({ page, setPage, onScrollToTop }) {
  const { theme } = useTheme();

  const tabs = [
    { id: "main", label: "홈", icon: HiHome },
    { id: "history", label: "기록", icon: HiClipboardList },
    { id: "mypage", label: "마이페이지", icon: HiUser },
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",                        // ← 수정
      transform: "translateX(-50%)",      // ← 추가
      width: "100%",                     // ← 수정
      maxWidth: "480px",                   // ← 추가
      background: theme.tabBar,
      borderTop: `1px solid ${theme.tabBarBorder}`,
      display: "flex",
      justifyContent: "space-around",
      padding: "6px 0 0 0",
      paddingBottom: "calc(8px + env(safe-area-inset-bottom))", // ← Safe Area 대응
      zIndex: 100,
    }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
            flex: 1,
            color: page === tab.id ? theme.accent : theme.textMuted,
          }}
          onClick={() => {
            if (page === tab.id) {
              // 현재 페이지 탭 한 번 더 누르면 맨 위로
              if (onScrollToTop) onScrollToTop();
            } else {
              setPage(tab.id);
            }
          }}
        >
          <tab.icon size={22} />
          <div style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</div>
        </div>
      ))}
    </div>
  );
}