import { useState } from "react";
import { login } from "../api/auth";
import Logo from "../components/Logo";
import { styles } from "../App";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Login({ setPage, setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) return alert("아이디를 입력해주세요");
    if (!password.trim()) return alert("비밀번호를 입력해주세요");

    try {
      const result = await login(username, password);

      if (result.ok) {
        // 유저 정보 세팅 (auth.js에서 받은 data 활용)
        setUser({
          name: result.data?.data?.name || "",
          email: result.data?.data?.email || "",
          phone: result.data?.data?.phone || "",
          password: "",
        });
        setPage("main");
      } else {
        alert("로그인 실패: " + (result.data?.message || "아이디/비밀번호 확인"));
      }
    } catch (e) {
      console.error("로그인 에러:", e);
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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div style={{ position: "relative" }}>
          <input
            style={{ ...styles.input, width: "100%", boxSizing: "border-box", paddingRight: 40 }}
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 16 }}
          >
            {showPassword ? <AiOutlineEyeInvisible size={18} color="#9898B8" /> : <AiOutlineEye size={18} color="#9898B8" />}
          </span>
        </div>
      </div>

      <button style={styles.button} onClick={handleLogin}>
        로그인
      </button>

      <div style={styles.switchText}>
        계정이 없으신가요?{" "}
        <span onClick={() => setPage("register")} style={styles.link}>
          회원가입
        </span>
      </div>
    </>
  );
}
