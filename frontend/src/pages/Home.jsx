import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../services/AuthContext";
import { useNotification } from "../services/NotificationContext";

function Home() {

  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [favouritesMap, setFavouritesMap] = useState({});

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchHeroes();
  }, [debouncedSearch, ordering, page]);

  // Fetch User's Favourites
  useEffect(() => {
    if (user) {
      fetchFavourites();
    } else {
      setFavouritesMap({});
    }
  }, [user]);

  const fetchFavourites = () => {
    api.get("/favourites/?page_size=100")
      .then(res => {
        const fMap = {};
        const results = res.data.results || res.data;
        results.forEach(fav => {
          const heroId = fav.superhero_details?.id || fav.superhero;
          if (heroId) fMap[heroId] = fav.id;
        });
        setFavouritesMap(fMap);
      })
      .catch(err => console.error("Error fetching favourites:", err));
  };

  const fetchHeroes = () => {
    setLoading(true);
    const params = new URLSearchParams({
      search: debouncedSearch,
      ordering: ordering,
      page: page,
      page_size: 12
    });

    api.get(`/heroes/?${params.toString()}`)
      .then(res => {
        if (res.data.results) {
          // Paginated response
          setHeroes(res.data.results);
          setTotalPages(Math.ceil(res.data.count / 12));
        } else {
          // Fallback for non-paginated response
          setHeroes(res.data);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const toggleFavourite = (e, hero) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showNotification("Please login to manage favourites", "info");
      return;
    }

    const favId = favouritesMap[hero.id];
    if (favId) {
      api.delete(`/favourites/${favId}/delete/`)
        .then(() => {
          showNotification(`${hero.name} removed from favourites!`, "success");
          setFavouritesMap(prev => {
            const newMap = { ...prev };
            delete newMap[hero.id];
            return newMap;
          });
        })
        .catch((err) => console.error(err) || showNotification("Could not remove from favourites.", "error"));
    } else {
      api.post("/favourites/add/", { superhero: hero.id })
        .then(() => {
          showNotification(`${hero.name} added to favourites!`, "success");
          fetchFavourites();
        })
        .catch((err) => console.error(err) || showNotification("Could not add to favourites.", "error"));
    }
  };

  const handleSearchChange = (e) => setSearch(e.target.value);
  
  const handleOrderingChange = (e) => {
    setOrdering(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Superheroes</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search heroes..." 
            value={search}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
          <select 
            value={ordering} 
            onChange={handleOrderingChange}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="-intelligence">Intelligence</option>
            <option value="-strength">Strength</option>
            <option value="-speed">Speed</option>
            <option value="-power">Power</option>
            <option value="-combat">Combat</option>
            <option value="-durability">Durability</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-lg">Loading heroes...</div>
      ) : (
        <>
          {heroes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-lg">No heroes found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {heroes.map(hero => (
                <Link
                  key={hero.id}
                  to={`/hero/${hero.id}`}
                  className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full"
                >
                  {hero.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/heroes/image-proxy/?url=${hero.image_url}`}
                      alt={hero.name}
                      className="w-full h-48 object-cover bg-gray-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl">?</div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">{hero.name}</h2>
                        {user && (
                          <button
                            onClick={(e) => toggleFavourite(e, hero)}
                            className={`focus:outline-none transition-colors ${favouritesMap[hero.id] ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                            title={favouritesMap[hero.id] ? "Remove from Favourites" : "Add to Favourites"}
                          >
                            {favouritesMap[hero.id] ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                          INT: {hero.intelligence}
                        </span>
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                          STR: {hero.strength}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                          SPD: {hero.speed}
                        </span>
                        <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                          DUR: {hero.durability}
                        </span>
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                          POW: {hero.power}
                        </span>
                        <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-100">
                          CMB: {hero.combat}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-10 gap-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
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

export default Home;