import { HiHome, HiClipboardList, HiUser } from "react-icons/hi";

export default function TabBar({ page, setPage }) {
  const tabs = [
    { id: "main", label: "홈", icon: HiHome },
    { id: "history", label: "기록", icon: HiClipboardList },
    { id: "mypage", label: "내 정보", icon: HiUser },
  ];

  return (
    <div style={tabStyles.container}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            ...tabStyles.tab,
            color: page === tab.id ? "#4F8EF7" : "#9898B8",
          }}
          onClick={() => setPage(tab.id)}
        >
          <tab.icon size={22} />
          <div style={tabStyles.label}>{tab.label}</div>
        </div>
      ))}
    </div>
  );
}

const tabStyles = {
  container: {
    position: "fixed",
    bottom: 0,
    width: "375px",
    background: "#0D0D1A",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-around",
    padding: "10px 0",
    zIndex: 100,
  },
  tab: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
  },
};