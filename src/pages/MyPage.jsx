import { useState, useEffect } from "react";
import { logout, getMyInfo, updateMyInfo, changePassword, deleteAccount } from "../api/auth";
import { useTheme } from "../ThemeContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export default function MyPage({ setPage, user, setUser, setHistory }) {
  const { styles, theme, isDark, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await getMyInfo();
        const data = await response.json();
        const info = data.data || data;
        if (response.ok) {
          setUser({ name: info.name, email: info.email, phone: info.phone || "" });
          setEditForm({ name: info.name, email: info.email, phone: info.phone || "" });
        }
      } catch (e) {
        console.error("내 정보 조회 실패:", e);
      }
    };
    fetchMyInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!editForm.name.trim()) return alert("이름을 입력해주세요");
    if (!editForm.email.trim()) return alert("이메일을 입력해주세요");
    if (!editForm.phone.trim()) return alert("전화번호를 입력해주세요");

    try {
      const response = await updateMyInfo({ name: editForm.name, email: editForm.email, phone: editForm.phone });
      if (response.ok) {
        setUser({ ...user, ...editForm });
        alert("정보가 수정되었습니다!");
      } else {
        alert("정보 수정 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }

    if (currentPassword.trim() && newPassword.trim()) {
      try {
        const pwResponse = await changePassword(user.id, currentPassword, newPassword);
        const pwData = await pwResponse.json();
        if (pwResponse.ok) alert(pwData.message || "비밀번호가 변경되었습니다!");
        else alert(pwData.message || "비밀번호 변경 실패");
      } catch (e) {
        alert("비밀번호 변경 중 오류 발생");
      }
    }

    setCurrentPassword("");
    setNewPassword("");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    setCurrentPassword("");
    setNewPassword("");
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setHistory([]);
    setPage("login");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) return;
    try {
      const response = await deleteAccount(user.id);
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "회원 탈퇴가 완료되었습니다.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setHistory([]);
        setPage("login");
      } else {
        alert("회원 탈퇴 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>마이페이지</div>
      </div>

      {/* 화면 설정 */}
      <div style={{ ...styles.resultCard, marginBottom: 12 }}>
        <div style={styles.rowBetween}>
          <div style={styles.title}>화면 설정</div>
        </div>
        <div style={{ ...styles.infoRow, borderBottom: "none", marginTop: 8 }}>
          <span style={{ fontSize: 13, color: theme.textSecondary }}>
            {isDark ? "다크 모드" : "라이트 모드"}
          </span>
          <div
            onClick={toggleTheme}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: isDark ? theme.smallBtnBg : "#E8EAFF",
              border: `1px solid ${theme.border}`,
              borderRadius: 20, padding: "6px 14px",
              cursor: "pointer", fontSize: 12,
              color: theme.textPrimary, fontWeight: 600,
            }}
          >
            {isDark
              ? <><MdLightMode size={16} color="#F39C12" /> 라이트로 전환</>
              : <><MdDarkMode size={16} color="#4F8EF7" /> 다크로 전환</>
            }
          </div>
        </div>
      </div>

      {/* 내 정보 */}
      <div style={styles.resultCard}>
        <div style={styles.rowBetween}>
          <div style={styles.title}>내 정보</div>
          {!isEditing && (
            <span style={{ fontSize: 12, color: theme.accent, cursor: "pointer" }} onClick={() => setIsEditing(true)}>
              수정
            </span>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {isEditing ? (
            <>
              <div>
                <div style={styles.label}>이름</div>
                <input style={styles.input} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>이메일</div>
                <input style={styles.input} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>전화번호</div>
                <input style={styles.input} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <div style={styles.label}>현재 비밀번호</div>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...styles.input, paddingRight: 40 }}
                    type={showCurrent ? "text" : "password"}
                    placeholder="현재 비밀번호 입력"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <span onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                    {showCurrent ? <AiOutlineEyeInvisible size={18} color={theme.textMuted} /> : <AiOutlineEye size={18} color={theme.textMuted} />}
                  </span>
                </div>
              </div>
              <div>
                <div style={styles.label}>새 비밀번호</div>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...styles.input, paddingRight: 40 }}
                    type={showNew ? "text" : "password"}
                    placeholder="새 비밀번호 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                    {showNew ? <AiOutlineEyeInvisible size={18} color={theme.textMuted} /> : <AiOutlineEye size={18} color={theme.textMuted} />}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button style={styles.detailBtn} onClick={handleSave}>저장</button>
                <button style={styles.deleteBtn} onClick={handleCancel}>취소</button>
              </div>
            </>
          ) : (
            <>
              <div style={styles.infoRow}>
                <span style={styles.label}>이름</span>
                <span style={styles.infoValue}>{user?.name}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>이메일</span>
                <span style={styles.infoValue}>{user?.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>전화번호</span>
                <span style={styles.infoValue}>{user?.phone || "-"}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>비밀번호</span>
                <span style={styles.infoValue}>{"•".repeat(8)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* 계정 관리 */}
      <div style={styles.resultCard}>
        <div style={styles.title}>계정 관리</div>
        <button style={styles.smallBtn} onClick={handleLogout}>로그아웃</button>
        <button style={styles.withdrawBtn} onClick={handleDeleteAccount}>회원 탈퇴</button>
      </div>

      <div style={{ height: 80 }} />
    </>
  );
}