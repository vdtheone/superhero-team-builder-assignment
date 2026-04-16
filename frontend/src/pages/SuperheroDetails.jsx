import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../services/AuthContext";
import { useNotification } from "../services/NotificationContext";
import HeroImage from "../components/HeroImage";
import { Heart } from "lucide-react";


const StatBar = ({ label, value, color, isEditing, onChange }) => {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="flex items-center gap-4">
      <span className="font-medium capitalize w-28 text-sm text-gray-600">{label}</span>
      {isEditing ? (
        <input
          type="number"
          name={label}
          value={value || 0}
          onChange={onChange}
          className="border rounded px-2 py-1 w-20 text-sm"
        />
      ) : (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`${colorClasses[color]} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${value || 0}%` }}
            ></div>
          </div>
          <span className="font-bold text-sm w-8 text-right">{value || 0}</span>
        </>
      )}
    </div>
  );
};

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
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteId, setFavouriteId] = useState(null);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const requests = [api.get(`/heroes/${id}/`)];
    if (user) {
      requests.push(api.get("/teams/").catch(() => ({ data: [] })));
      requests.push(api.get("/favourites/?page_size=100").catch(() => ({ data: { results: [] } })));
    }
    
    Promise.all(requests)
      .then(([heroRes, teamsRes, favRes]) => {
        setHero(heroRes.data);
        setFormData(heroRes.data);
        if (teamsRes) {
          setTeams(teamsRes.data.filter(t => t.members.some(m => m.superhero === parseInt(id, 10) || m.superhero_details?.id === parseInt(id, 10))));
        }
        if (favRes) {
          const results = favRes.data.results || favRes.data;
          const fav = results.find(f => (f.superhero === parseInt(id, 10) || f.superhero_details?.id === parseInt(id, 10)));
          if (fav) {
            setIsFavourite(true);
            setFavouriteId(fav.id);
          } else {
            setIsFavourite(false);
            setFavouriteId(null);
          }
        } else {
          // If favRes is undefined (e.g., user not logged in), reset favourite state
          setIsFavourite(false);
          setFavouriteId(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, user]);

  const toggleFavourite = () => {
    if (!user) {
      showNotification("Please login to manage favourites", "info");
      return;
    }

    setFavLoading(true);
    if (isFavourite && favouriteId) {
      // Remove from favourites
      api.delete(`/favourites/${favouriteId}/delete/`)
        .then(() => {
          setIsFavourite(false);
          setFavouriteId(null);
          showNotification(`${hero.name} removed from favourites!`, "success");
          setFavLoading(false);
        })
        .catch((err) => {
          console.error(err);
          showNotification("Failed to remove favourite.", "error");
          setFavLoading(false);
        });
    } else {
      // Add to favourites
      api.post("/favourites/add/", { superhero: hero.id })
        .then((res) => {
          setIsFavourite(true);
          setFavouriteId(res.data.id);
          showNotification(`${hero.name} added to favourites!`, "success");
          setFavLoading(false);
        })
        .catch((err) => {
          console.error(err);
          showNotification("Could not add to favourites. You may have already added this hero.", "error");
          setFavLoading(false);
        });
    }
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

  const STAT_COLORS = {
    intelligence: "blue",
    strength: "red",
    speed: "green",
    durability: "yellow",
    power: "purple",
    combat: "gray",
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!hero) return <div className="p-6">Hero not found.</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Back
      </button>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Left Column: Image & Appearance */}
          <div className="md:col-span-1 p-6 bg-gray-50/70 border-r border-gray-200">
            <div className="sticky top-6">
              <HeroImage
                name={hero.name}
                imageUrl={hero.image_url}
                className="w-full h-auto object-cover rounded-lg shadow-lg"
                textClass="text-6xl"
              />
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Appearance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Gender</span> <span className="font-medium">{hero.gender || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Race</span> <span className="font-medium">{hero.race || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Height</span> <span className="font-medium">{hero.height_cm ? `${hero.height_cm} cm` : 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Weight</span> <span className="font-medium">{hero.weight_kg ? `${hero.weight_kg} kg` : 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Eye Color</span> <span className="font-medium">{hero.eye_color || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Hair Color</span> <span className="font-medium">{hero.hair_color || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-2 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="text-4xl font-bold border-b-2 border-blue-500 focus:outline-none w-full"
                />
              ) : (
                <h1 className="text-4xl font-extrabold text-gray-900">{hero.name}</h1>
              )}
              <div className="flex gap-2 items-center">
                {/* ❤️ Favourite Button */}
                {user && !isEditing && (
                  <button
                    onClick={toggleFavourite}
                    disabled={favLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 shadow-sm
                      ${
                        isFavourite
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }
                      ${favLoading ? "opacity-50 cursor-not-allowed" : ""}
                    }`}
                  >
                    <Heart
                      className={`transition-all duration-300 ${
                        isFavourite
                          ? "fill-white scale-110"
                          : "scale-100"
                      }`}
                    />
                    <span>
                      {favLoading
                        ? "Processing..."
                        : isFavourite
                        ? "Remove Favourite"
                        : "Add to Favourites"}
                    </span>
                  </button>
                )}

                {/* Edit */}
                {user && user.is_staff && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Biography */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Biography</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Full Name</span> <span className="font-medium text-right">{hero.full_name || 'N/A'}</span></div>
                <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Alignment</span> <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${hero.alignment === 'good' ? 'bg-green-100 text-green-800' : hero.alignment === 'bad' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{hero.alignment || 'N/A'}</span></div>
                <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">Publisher</span> <span className="font-medium text-right">{hero.publisher || 'N/A'}</span></div>
                <div className="flex justify-between py-1 border-b border-gray-100"><span className="text-gray-500">First Appearance</span> <span className="font-medium text-right">{hero.first_appearance || 'N/A'}</span></div>
                <div className="flex justify-between py-1 border-b border-gray-100 sm:col-span-2"><span className="text-gray-500">Place of Birth</span> <span className="font-medium text-right">{hero.place_of_birth || 'N/A'}</span></div>
              </div>
            </div>

            {/* Power Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Power Stats</h3>
              <div className="space-y-3 mt-4">
                {Object.entries(STAT_COLORS).map(([stat, color]) => (
                  <StatBar
                    key={stat}
                    label={stat}
                    value={formData[stat]}
                    color={color}
                    isEditing={isEditing}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>

            {/* Teams */}
            {teams.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Member Of</h3>
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
        </div>
      </div>
    </div>
  );
}

export default SuperheroDetails;