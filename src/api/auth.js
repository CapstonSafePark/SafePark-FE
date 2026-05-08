const BASE_URL = "http://52.79.227.161:8080";

// 로그인
export const login = async (username, password) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  console.log("로그인 응답:", data); // 구조 확인 후 제거

  if (response.ok) {
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
  }

  return { ok: response.ok, status: response.status, data };
};

// 회원가입
export const register = async (form) => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  return response;
};

// 로그아웃
export const logout = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return response;
};

// 토큰 갱신
export const refreshToken = async () => {
  const storedRefreshToken = localStorage.getItem("refreshToken");
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: storedRefreshToken }),
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
  }
  return response;
};

// 내 정보 조회
export const getMyInfo = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

// 내 정보 수정
export const updateMyInfo = async (form) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });
  return response;
};

// 비밀번호 변경
export const changePassword = async (userId, currentPassword, newPassword) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/users/me/password?userId=${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return response;
};
