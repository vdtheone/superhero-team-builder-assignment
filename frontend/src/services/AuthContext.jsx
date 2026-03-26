import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "./api";
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

  // ✅ LOGIN
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

      showNotification("Login successful!", "success");
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      showNotification("Invalid credentials!", "error");
    }
  };

  // ✅ REGISTER
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

      showNotification("Registration successful! Please login.", "success");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      showNotification("Something went wrong!", "error");
    }
  };

  // ✅ LOGOUT
  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login");
  };

  // ✅ LOAD USER ON REFRESH (VERY IMPORTANT FIX)
  useEffect(() => {
    const loadUser = async () => {
      if (authTokens) {
        try {
          const res = await api.get("/users/profile/");
          setUser(res.data);
        } catch (error) {
          console.error("Token invalid:", error);
          logoutUser();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [authTokens]);

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    registerUser,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <h3>Loading...</h3> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);