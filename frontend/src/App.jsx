import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Favourites from "./pages/Favourites";
import Teams from "./pages/Teams";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SuperheroDetails from "./pages/SuperheroDetails";
import TeamDetails from "./pages/TeamDetails";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./services/AuthContext";
import { NotificationProvider } from "./services/NotificationContext";

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hero/:id" element={<SuperheroDetails />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/favourites" element={<Favourites />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/team/:id" element={<TeamDetails />} />
            </Route>
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;