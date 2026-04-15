import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../services/AuthContext";
import { useNotification } from "../services/NotificationContext";

function SuperheroDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    setLoading(true);
    const requests = [api.get(`/heroes/${id}/`)];
    if (user) {
      requests.push(api.get("/teams/").catch(() => ({ data: [] })));
    }
    
    Promise.all(requests)
      .then(([heroRes, teamsRes]) => {
        setHero(heroRes.data);
        setFormData(heroRes.data);
        if (teamsRes) {
          setTeams(teamsRes.data.filter(t => t.members.some(m => m.superhero === parseInt(id, 10) || m.superhero_details?.id === parseInt(id, 10))));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, user]);

  const addToFavourites = () => {
    api.post("/favourites/add/", { superhero: hero.id })
      .then(() => {
        showNotification(`${hero.name} added to favourites!`, "success");
      })
      .catch((err) => {
        console.error(err);
        showNotification("Could not add to favourites. You may have already added this hero.", "error");
      });
  };

  const handleUpdate = () => {
    api.put(`/heroes/${id}/`, formData)
      .then((res) => {
        setHero(res.data);
        setIsEditing(false);
        showNotification("Superhero updated successfully!", "success");
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to update superhero.", "error");
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value : parseInt(value, 10) || 0,
    }));
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!hero) return <div className="p-6">Hero not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        &larr; Back to List
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="text-4xl font-bold border-b-2 border-blue-500 focus:outline-none w-full mr-4"
                />
              ) : (
                <h1 className="text-4xl font-bold">{hero.name}</h1>
              )}

              <div className="flex gap-2">
                {user && !isEditing && (
                  <button
                    onClick={addToFavourites}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    ★ Add to Favourites
                  </button>
                )}
                {user && user.is_staff && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-2 border-b pb-1">Power Stats</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
              {["intelligence", "strength", "speed", "durability", "power", "combat"].map((stat) => (
                <li key={stat} className="flex items-center">
                  <span className="font-medium capitalize w-28">{stat}:</span> 
                  {isEditing ? (
                    <input
                      type="number"
                      name={stat}
                      value={formData[stat] || 0}
                      onChange={handleChange}
                      className="border rounded px-2 py-1 w-24"
                    />
                  ) : (
                    hero[stat]
                  )}
                </li>
              ))}
            </ul>

            {teams.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-2 border-b pb-1">Teams</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {teams.map(team => (
                    <Link key={team.id} to={`/team/${team.id}`} className="bg-indigo-100 hover:bg-indigo-200 transition-colors text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-200">
                      {team.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {hero.image_url && (
            <div className="shrink-0">
              <img 
                src={`${import.meta.env.VITE_API_BASE_URL}/api/heroes/image-proxy/?url=${hero.image_url}`}
                alt={hero.name} 
                className="w-full max-w-sm h-auto rounded-lg shadow-md bg-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperheroDetails;