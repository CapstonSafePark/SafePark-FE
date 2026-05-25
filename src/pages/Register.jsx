import { useState } from "react";
import { register } from "../api/auth";
import Logo from "../components/Logo";
import { useTheme } from "../ThemeContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Register({ setPage }) {
  const { styles, theme } = useTheme();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!form.username.trim()) return alert("아이디를 입력해주세요");
    if (!form.email.trim()) return alert("이메일을 입력해주세요");
    if (!form.password.trim()) return alert("비밀번호를 입력해주세요");
    if (!form.name.trim()) return alert("이름을 입력해주세요");
    if (!form.phone.trim()) return alert("전화번호를 입력해주세요");

    try {
      const response = await register(form);
      const data = await response.json();
      if (response.ok) {
        alert("회원가입 완료!");
        setPage("login");
      } else {
        alert(data.message || "회원가입 실패");
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  return (
    <>
      <Logo />
      <div style={styles.inputWrap}>
        <input
          style={styles.input}
          placeholder="아이디"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="이메일"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <div style={{ position: "relative" }}>
          <input
            style={{ ...styles.input, paddingRight: 40 }}
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
          >
            {showPassword
              ? <AiOutlineEyeInvisible size={18} color={theme.textMuted} />
              : <AiOutlineEye size={18} color={theme.textMuted} />}
          </span>
        </div>
        <input
          style={styles.input}
          placeholder="이름"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="전화번호"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <button style={styles.button} onClick={handleRegister}>회원가입</button>
      <div style={styles.switchText}>
        이미 계정이 있으신가요?{" "}
        <span onClick={() => setPage("login")} style={styles.link}>로그인</span>
      </div>
    </>
  );
}