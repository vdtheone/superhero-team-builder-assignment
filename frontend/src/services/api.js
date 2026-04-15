import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const authTokens = JSON.parse(localStorage.getItem("authTokens"));

    if (authTokens?.access) {
      const user = jwtDecode(authTokens.access);
      const isExpired = user.exp < Date.now() / 1000;

      if (isExpired) {
        try {
          const response = await axios.post(
            `${BASE_URL}/api/users/token/refresh/`,
            { refresh: authTokens.refresh }
          );

          localStorage.setItem("authTokens", JSON.stringify(response.data));
          config.headers.Authorization = `Bearer ${response.data.access}`;
        } catch (error) {
          localStorage.removeItem("authTokens");
          window.location.href = "/login";
        }
      } else {
        config.headers.Authorization = `Bearer ${authTokens.access}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;