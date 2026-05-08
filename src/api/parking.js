const BASE_URL = "http://52.79.227.161:8080";

// 주변 주차장 목록
export const getNearbyParkingLots = async (lat, lng) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(
    `${BASE_URL}/api/parking-lots/nearby?latitude=${lat}&longitude=${lng}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response;
};

// 주차 가능 여부 확인 ← 핵심 수정: Query String → JSON Body
export const checkParking = async (lat, lng, address) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/location/check-parking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ latitude: lat, longitude: lng, address }),
  });
  return response;
};

// 주차장 상세 조회
export const getParkingLotDetail = async (parkingLotId) => {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${BASE_URL}/api/parking-lots/${parkingLotId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};
