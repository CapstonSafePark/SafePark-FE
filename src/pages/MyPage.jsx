import { useState } from "react";
import { logout } from "../api/auth";
import { styles } from "../App";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function MyPage({ setPage, user, setUser, history, setHistory, setResult, setFromHistory }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSave = () => {
    if (!editForm.name.trim()) return alert("이름을 입력해주세요");
    if (!editForm.email.trim()) return alert("이메일을 입력해주세요");
    if (!editForm.phone.trim()) return alert("전화번호를 입력해주세요");
    setUser({ ...user, ...editForm });
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
    setPage("login");
  };

  return (
    <>
      <div style={styles.topbarRow}>
        <div style={styles.logoText}>마이페이지</div>
        <div style={styles.profileBtn} onClick={() => setPage("main")}>←</div>
      </div>

      {/* 내 정보 */}
      <div style={styles.resultCard}>
        <div style={styles.rowBetween}>
          <div style={styles.title}>내 정보</div>
          {!isEditing && (
            <span style={{ fontSize: 12, color: "#4F8EF7", cursor: "pointer" }} onClick={() => setIsEditing(true)}>
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
                    style={{ ...styles.input, width: "100%", boxSizing: "border-box", paddingRight: 40 }}
                    type={showCurrent ? "text" : "password"}
                    placeholder="현재 비밀번호 입력"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <span onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                    {showCurrent ? <AiOutlineEyeInvisible size={18} color="#9898B8" /> : <AiOutlineEye size={18} color="#9898B8" />}
                  </span>
                </div>
              </div>
              <div>
                <div style={styles.label}>새 비밀번호</div>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...styles.input, width: "100%", boxSizing: "border-box", paddingRight: 40 }}
                    type={showNew ? "text" : "password"}
                    placeholder="새 비밀번호 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                    {showNew ? <AiOutlineEyeInvisible size={18} color="#9898B8" /> : <AiOutlineEye size={18} color="#9898B8" />}
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

      {/* 분석 이력 */}
      <div style={styles.resultCard}>
        <div style={styles.title}>분석 이력</div>

        {history.length === 0 && (
          <div style={styles.emptyText}>분석 이력이 없습니다.</div>
        )}

        {history.map((h, i) => (
          <div key={i} style={styles.historyCard}>
            <div style={styles.historyDate}>{h.date}</div>
            <div style={styles.historyAddress}>{h.address}</div>
            <div style={{ ...styles.badge, ...(h.type === "danger" && styles.badgeDanger), ...(h.type === "warning" && styles.badgeWarning), ...(h.type === "safe" && styles.badgeSafe), marginTop: 8, width: "fit-content" }}>
              {h.result}
            </div>
            <div style={styles.historyBtnRow}>
              <button style={styles.detailBtn} onClick={() => {
                setResult({ probability: h.probability, status: h.result, type: h.type, line: h.line, time: h.time, zone: h.zone });
                setFromHistory(true);
                setPage("main");
              }}>
                상세 조회
              </button>
              <button style={styles.deleteBtn} onClick={() => setHistory(history.filter((_, idx) => idx !== i))}>
                삭제
              </button>
            </div>
          </div>
        ))}

        {history.length > 0 && (
          <button style={styles.allDeleteBtn} onClick={() => setHistory([])}>전체 삭제</button>
        )}
      </div>

      <div style={{ height: 12 }} />

      {/* 계정 관리 */}
      <div style={styles.resultCard}>
        <div style={styles.title}>계정 관리</div>
        <button style={styles.smallBtn} onClick={handleLogout}>로그아웃</button>
        <button style={styles.withdrawBtn}>회원 탈퇴</button>
      </div>
    </>
  );
}