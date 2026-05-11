const BASE_URL = "http://52.79.227.161:8080";
// 이미지 분석
export const uploadImage = async (imageFile, lat, lng) => {
  const token = localStorage.getItem("accessToken");
  
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("latitude", lat);
  formData.append("longitude", lng);

  const response = await fetch(`${BASE_URL}/api/analysis/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return response;
};