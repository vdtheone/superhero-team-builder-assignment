import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotification } from "../services/NotificationContext";

function Favourites() {
  const [favourites, setFavourites] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    api.get("/teams/")
      .then((res) => setTeams(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ search: debouncedSearch, ordering, page, page_size: 12 });
    
    api.get(`/favourites/?${params.toString()}`)
      .then((res) => {
        setFavourites(res.data.results || res.data);
        if (res.data.count) setTotalPages(Math.ceil(res.data.count / 12));
        else setTotalPages(1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [debouncedSearch, ordering, page]);

  const removeFavourite = (e, favId, heroName) => {
    e.preventDefault();
    e.stopPropagation();
    api.delete(`/favourites/${favId}/delete/`)
      .then(() => {
        setFavourites((prev) => prev.filter((fav) => fav.id !== favId));
        showNotification(`${heroName} removed from favourites!`, "success");
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to remove favourite.", "error");
      });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b pb-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h1 className="text-3xl font-extrabold text-gray-900">Your Favourites</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search favourites..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
          <select 
            value={ordering} 
            onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="-created_at">Recently Added</option>
            <option value="superhero__name">Name (A-Z)</option>
            <option value="-superhero__name">Name (Z-A)</option>
            <option value="-superhero__intelligence">Intelligence</option>
            <option value="-superhero__strength">Strength</option>
            <option value="-superhero__speed">Speed</option>
            <option value="-superhero__power">Power</option>
            <option value="-superhero__combat">Combat</option>
            <option value="-superhero__durability">Durability</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-lg">Loading favourites...</div>
      ) : favourites.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4 text-lg">No favourites found.</p>
          <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Browse Heroes
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favourites.map((fav) => {
              const hero = fav.superhero_details;
              const heroName = hero?.name || fav.hero_name || "Unknown Hero";
              const heroTeams = teams
                .filter(t => t.members.some(m => m.superhero === fav.superhero || m.superhero_details?.id === fav.superhero));
              
              return (
                <Link 
                  key={fav.id} 
                  to={`/hero/${fav.superhero}`}
                  className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full group relative"
                >
                  {hero?.image_url ? (
                    <img
                      src={`http://localhost:8001/api/heroes/image-proxy/?url=${hero.image_url}`}
                      alt={heroName}
                      className="w-full h-48 object-cover bg-gray-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl">?</div>
                  )}
                  
                  <button
                    onClick={(e) => removeFavourite(e, fav.id, heroName)}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur hover:bg-red-50 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-red-100"
                    title="Remove from Favourites"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2 truncate" title={heroName}>{heroName}</h2>
                      {heroTeams.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {heroTeams.slice(0, 4).map((t, idx) => (
                            <span 
                              key={idx} 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                navigate(`/team/${t.id}`); 
                              }} 
                              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[150px] cursor-pointer" 
                              title={t.name}
                            >
                              {t.name}
                            </span>
                          ))}
                          {heroTeams.length > 4 && (
                            <span 
                              className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-help" 
                              title={heroTeams.slice(4).map(t => t.name).join(', ')}
                            >
                              +{heroTeams.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      {hero && (
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">INT: {hero.intelligence || 0}</span>
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">STR: {hero.strength || 0}</span>
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">SPD: {hero.speed || 0}</span>
                          <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">DUR: {hero.durability || 0}</span>
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">POW: {hero.power || 0}</span>
                          <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-100">CMB: {hero.combat || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-10 gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Favourites;