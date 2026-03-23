import axios from "axios";
import { jwtDecode } from "jwt-decode";

const api = axios.create({
  baseURL: "http://localhost:8001/api", // Your Django backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const authTokens = JSON.parse(localStorage.getItem("authTokens"));
    if (authTokens?.access) {
      const user = jwtDecode(authTokens.access);
      const isExpired = user.exp < Date.now() / 1000;

      if (isExpired) {
        // Try to refresh token
        try {
          const response = await axios.post("http://localhost:8001/api/users/token/refresh/", {
            refresh: authTokens.refresh,
          });
          localStorage.setItem("authTokens", JSON.stringify(response.data));
          config.headers.Authorization = `Bearer ${response.data.access}`;
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem("authTokens");
          // You might want to dispatch a global event or use history.push here
          // For now, a simple reload might suffice, but it's not ideal UX
          window.location.href = "/login"; 
        }
      } else {
        config.headers.Authorization = `Bearer ${authTokens.access}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;