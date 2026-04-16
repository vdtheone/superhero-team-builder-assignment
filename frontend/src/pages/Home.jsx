import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../services/AuthContext";
import { useNotification } from "../services/NotificationContext";
import HeroImage from "../components/HeroImage";
import { Heart } from "lucide-react";

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
  const [pageSize, setPageSize] = useState(12);
  const [jumpToPage, setJumpToPage] = useState("1");

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
  }, [debouncedSearch, ordering, page, pageSize]);

  // Sync jump to page input with current page
  useEffect(() => {
    setJumpToPage(page.toString());
  }, [page]);

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
      page_size: pageSize
    });

    api.get(`/heroes/?${params.toString()}`)
      .then(res => {
        if (res.data.results) {
          // Paginated response
          setHeroes(res.data.results);
          setTotalPages(Math.ceil(res.data.count / pageSize));
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
  
  const handleJumpToPage = (e) => {
    e.preventDefault();
    const newPage = parseInt(jumpToPage, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    } else {
      setJumpToPage(page.toString());
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
                  {/* {hero.image_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/api/heroes/image-proxy/?url=${encodeURIComponent(hero.image_url)}`}
                      alt={hero.name}
                      className="w-full h-48 object-cover bg-gray-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl">?</div>
                  )} */}

                  <HeroImage 
                    name={hero.name} 
                    imageUrl={hero.image_url} 
                    className="w-full h-48 object-cover" 
                  />

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">{hero.name}</h2>
                        {user && (
                          <button
                            onClick={(e) => toggleFavourite(e, hero)}
                            className={`focus:outline-none transition-all duration-300 transform hover:scale-110
                              ${
                                favouritesMap[hero.id]
                                  ? "text-red-500"
                                  : "text-gray-300 hover:text-red-400"
                              }
                            `}
                            title={
                              favouritesMap[hero.id]
                                ? "Remove from Favourites"
                                : "Add to Favourites"
                            }
                          >
                            <Heart
                              className={`h-6 w-6 transition-all duration-300 ${
                                favouritesMap[hero.id]
                                  ? "fill-current scale-110"
                                  : "scale-100"
                              }`}
                            />
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
            <div className="flex flex-col sm:flex-row justify-center items-center mt-10 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white text-sm"
                >
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                  <option value={32}>32</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                <span className="text-gray-700 font-medium text-sm">
                  Page {page} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>

              <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Go to page:</span>
                <input
                  type="number"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onBlur={() => { if (jumpToPage === '') setJumpToPage(page.toString()) }}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  min="1"
                  max={totalPages}
                />
                <button type="submit" className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm">Go</button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;