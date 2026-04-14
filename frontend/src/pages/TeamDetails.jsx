import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../services/NotificationContext";

const Icons = {
  Trash2: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

function TeamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingHeroes, setSearchingHeroes] = useState(false);
  
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchTeam();
  }, [id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch) {
      fetchHeroesSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const fetchTeam = () => {
    setLoading(true);
    api.get(`/teams/${id}/`)
      .then((res) => {
        setTeam(res.data);
        setMembers(res.data.members.map(m => m.superhero_details));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to load team.", "error");
        setLoading(false);
      });
  };

  const fetchHeroesSearch = () => {
    setSearchingHeroes(true);
    const params = new URLSearchParams({
      search: debouncedSearch,
      page_size: 12
    });
    api.get(`/heroes/?${params.toString()}`)
      .then(res => {
        setSearchResults(res.data.results || res.data);
        setSearchingHeroes(false);
      })
      .catch(err => {
        console.error(err);
        setSearchingHeroes(false);
      });
  };

  const updateTeam = (newMembers) => {
    const payload = {
      name: team.name,
      member_ids: newMembers.map(m => m.id)
    };
    api.put(`/teams/${id}/`, payload)
      .then((res) => {
        setTeam(res.data);
        setMembers(res.data.members.map(m => m.superhero_details));
        showNotification("Team updated successfully!", "success");
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to update team.", "error");
      });
  };

  const removeMember = (heroId) => {
    const newMembers = members.filter(m => m.id !== heroId);
    updateTeam(newMembers);
  };

  const addMember = (hero) => {
    if (members.find(m => m.id === hero.id)) {
      showNotification("Hero is already in the team", "info");
      return;
    }
    if (members.length >= 6) {
      showNotification("Max 6 heroes per team", "warning");
      return;
    }
    const newMembers = [...members, hero];
    updateTeam(newMembers);
  };

  const getHeroPower = (hero) => {
    if (hero.total_power !== undefined) return hero.total_power;
    return (hero.intelligence || 0) + (hero.strength || 0) + (hero.speed || 0) + 
           (hero.durability || 0) + (hero.power || 0) + (hero.combat || 0);
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading team...</div>;
  if (!team) return <div className="p-6 text-center text-gray-500">Team not found.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
        &larr; Back
      </button>

      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Icons.Search /> Find Heroes to Add
        </h2>
        
        <input 
          type="text" 
          placeholder="Search hero by name..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 w-full md:w-1/2 mb-6"
        />

        {searchingHeroes ? (
          <div className="text-center text-gray-400 py-8">Searching...</div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {searchResults.map(hero => {
              const inTeam = members.some(m => m.id === hero.id);
              return (
                <div key={hero.id} className={`border rounded-lg p-3 flex flex-col items-center text-center transition-all ${inTeam ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:shadow-md cursor-pointer hover:border-blue-400'}`} onClick={() => !inTeam && addMember(hero)}>
                  {hero.image_url ? (
                    <img
                    src={`http://13.235.67.104/api/heroes/image-proxy/?url=${hero.image_url}`}
                    alt={hero.name} 
                    className="w-16 h-16 rounded-full object-cover mb-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-400 mb-2">?</div>
                  )}
                  <h3 className="font-bold text-sm truncate w-full">{hero.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">Pow: {getHeroPower(hero)}</p>
                  
                  {inTeam ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">In Team</span>
                  ) : (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100">Add to Team</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : search ? (
          <div className="text-center text-gray-400 py-8">No heroes found.</div>
        ) : (
          <div className="text-center text-gray-400 py-8">Type to search for heroes.</div>
        )}
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{team.name}</h1>
        <p className="text-gray-500 mb-6">Manage your team members (Max 6)</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length === 0 ? (
            <p className="col-span-full text-gray-500 italic">No members in this team.</p>
          ) : (
            members.map(hero => (
              <div key={hero.id} className="border rounded-lg p-3 flex items-center justify-between bg-gray-50 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  {hero.image_url ? (
                    <img src={`http://13.235.67.104/api/heroes/image-proxy/?url=${hero.image_url}`} alt={hero.name} className="w-12 h-12 rounded-full object-cover bg-gray-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">?</div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{hero.name}</p>
                    <p className="text-xs text-gray-500">Power: {getHeroPower(hero)}</p>
                  </div>
                </div>
                <button onClick={() => removeMember(hero.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Remove Member">
                  <Icons.Trash2 />
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t text-right">
          <span className="font-bold text-gray-700">Total Power: </span>
          <span className="font-mono text-xl text-blue-600">
            {members.reduce((sum, h) => sum + getHeroPower(h), 0).toLocaleString()}
          </span>
        </div>
      </div>

      
    </div>
  );
}

export default TeamDetails;