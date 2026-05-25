import { useTheme } from "../ThemeContext";

export default function Logo() {
  const { styles, theme } = useTheme();
  return (
    <div style={styles.topbar}>
      <span style={{ color: theme.textPrimary }}>Safe</span>
      <span style={{ color: theme.accent }}>Park</span>
    </div>
  );
}