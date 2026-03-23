import { Link } from "react-router-dom";
import { useAuth } from "../services/AuthContext";

function Navbar() {
  const { user, logoutUser } = useAuth();
  return (
    <div className="bg-gray-900 text-white p-4 flex gap-6">
      <Link to="/">Heroes</Link>
      <Link to="/favourites">Favourites</Link>
      <Link to="/teams">Teams</Link>
      {user ? (
        <>
          <span className="ml-auto">Hello, {user.username}!</span>
          <button onClick={logoutUser} className="text-white hover:underline">
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="ml-auto">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </div>
  );
}

export default Navbar;