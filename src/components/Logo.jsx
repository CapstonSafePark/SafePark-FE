import { useTheme } from "../ThemeContext";

export default function Logo() {
  const { theme } = useTheme();
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 48, fontWeight: 800 }}>
        <span style={{ color: theme.textPrimary }}>Safe</span>
        <span style={{ color: theme.accent }}>Park</span>
      </div>
    </div>
  );
}