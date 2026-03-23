import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "./api"; // Use the configured axios instance
import { useNotification } from "./NotificationContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const navigate = useNavigate();

  const loginUser = async (username, password) => {
    try {
      const response = await api.post("/users/login/", {
        username,
        password,
      });

      const data = response.data;

      // Save tokens
      setAuthTokens(data);
      localStorage.setItem("authTokens", JSON.stringify(data));

      // Fetch real user details
      const userResponse = await api.get("/users/profile/");
      setUser(userResponse.data);

      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      showNotification("Something went wrong during login!", "error");
    }
  };

  const registerUser = async (username, email, password, password2) => {
    if (password !== password2) {
      showNotification("Passwords do not match!", "error");
      return;
    }
    try {
      await api.post("/users/register/", {
        username,
        email,
        password,
        password2,
      });
      showNotification("Registration successful! Please log in.", "success");
      navigate("/login"); // Redirect to login page after registration
    } catch (error) {
      console.error("Registration failed:", error);
      showNotification("Something went wrong during registration!", "error");
    }
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login"); // Redirect to login page after logout
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    registerUser,
  };

  useEffect(() => {
    setLoading(false); // Set loading to false once initial state is determined
  }, []);

  return (
    <AuthContext.Provider value={contextData}>{loading ? null : children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);