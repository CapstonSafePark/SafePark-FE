const BASE_URL = "http://52.79.227.161:8080";

// 분석 이력 목록 조회
export const getHistoryList = async (page = 0, limit = 10) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/history?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

// 분석 이력 상세 조회
export const getHistoryDetail = async (historyId) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/history/${historyId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

// 분석 이력 삭제
export const deleteHistory = async (historyId) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/history/${historyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

// 전체 분석 이력 삭제
export const deleteAllHistory = async () => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/analysis/history`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};