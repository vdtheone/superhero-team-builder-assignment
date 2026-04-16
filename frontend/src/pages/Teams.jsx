import { useEffect, useState } from "react";
import api from "../services/api";
import { useNotification } from "../services/NotificationContext";
import { Link } from "react-router-dom";
import HeroImage from "../components/HeroImage";

// --- Icons (Simple SVGs) ---
const Icons = {
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Zap: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Shuffle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Swords: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/><line x1="7" y1="17" x2="4" y2="20"/><line x1="3" y1="19" x2="5" y2="21"/></svg>,
  Trash2: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const STRATEGIES = [
  { id: "balanced", label: "Balanced", desc: "Mix of heroes, villains & neutrals.", icon: Icons.Shield },
  { id: "power", label: "Power", desc: "Top specialists in a chosen stat.", icon: Icons.Zap },
  { id: "random", label: "Random", desc: "Chaotic wildcard. Expect surprises.", icon: Icons.Shuffle },
];

const STATS = ["intelligence", "strength", "speed", "power", "durability", "combat"];

const generateRandomTeamName = () => {
  const adjectives = ["Crimson", "Shadow", "Quantum", "Cosmic", "Neon", "Void", "Iron", "Mystic", "Savage", "Silent", "Thunder", "Omega", "Alpha", "Apex", "Prime", "Phantom", "Spectral"];
  const nouns = ["Vanguard", "Syndicate", "Legion", "Alliance", "Watch", "Outcasts", "Titans", "Guardians", "Sentinels", "Avengers", "Defenders", "Force", "Squad", "Knights", "Rebels"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

function Teams() {
  const { showNotification } = useNotification();

  // --- State ---
  // Builder State
  const [strategy, setStrategy] = useState("balanced");
  const [stat, setStat] = useState("strength");
  const [teamSize, setTeamSize] = useState(6);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState("recommendations"); // 'recommendations', 'favourites', 'search'

  // Search & Fav State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordering, setOrdering] = useState("name");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingHeroes, setSearchingHeroes] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Teams State
  const [initialNames] = useState(() => {
    let name1 = generateRandomTeamName();
    let name2 = generateRandomTeamName();
    while (name1 === name2) name2 = generateRandomTeamName();
    return [name1, name2];
  });
  const [teamA, setTeamA] = useState([]);
  const [teamAName, setTeamAName] = useState(initialNames[0]);
  const [teamB, setTeamB] = useState([]);
  const [teamBName, setTeamBName] = useState(initialNames[1]);
  const [activeTeam, setActiveTeam] = useState("A"); // 'A' or 'B'
  
  // Saved Teams
  const [savedTeams, setSavedTeams] = useState([]);

  // Comparison
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchHeroesSearch();
  }, [debouncedSearch, ordering]);

  useEffect(() => {
    fetchSavedTeams();
    generateRecommendation(); // Initial fetch
    fetchFavourites();
  }, [strategy, stat, teamSize]); // Re-fetch when strategy changes

  // --- API Calls ---

  const fetchHeroesSearch = () => {
    setSearchingHeroes(true);
    const params = new URLSearchParams({
      search: debouncedSearch,
      ordering: ordering,
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

  const fetchFavourites = () => {
    setLoadingFavs(true);
    api.get("/favourites/?page_size=100")
      .then((res) => {
        const results = res.data.results || res.data;
        setFavourites(results.map(fav => fav.superhero_details).filter(Boolean));
        setLoadingFavs(false);
      })
      .catch((err) => console.error(err) || setLoadingFavs(false));
  };

  const fetchSavedTeams = () => {
    api.get("/teams/")
      .then((res) => setSavedTeams(res.data))
      .catch((err) => console.error(err));
  };

  const generateRecommendation = () => {
    setLoadingRecs(true);
    const size = teamSize || 6;
    api.get(`/teams/recommend/?strategy=${strategy}&stat=${stat}&size=${size}&refresh=true`)
      .then((res) => {
        setRecommendation(res.data);
        setLoadingRecs(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingRecs(false);
      });
  };

  const handleSaveTeam = (slot) => {
    const name = slot === "A" ? teamAName : teamBName;
    const heroes = slot === "A" ? teamA : teamB;

    if (!name.trim()) return showNotification("Enter a team name", "error");
    if (heroes.length === 0) return showNotification("Team is empty", "error");

    const trimmedName = name.trim();

    const isDuplicate = savedTeams.some(
      (team) => team.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      return showNotification("You already have a team with this name. Please choose a different name.", "error");
    }

    const payload = { name: trimmedName, member_ids: heroes.map(h => h.id) };

    api.post("/teams/", payload)
      .then((res) => {
        showNotification("Team created successfully!", "success");
        fetchSavedTeams();
      })
      .catch((err) => {
        console.error(err);
        showNotification("Failed to save team", "error");
      });
  };

  const handleDeleteSavedTeam = (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    api.delete(`/teams/${teamId}/delete/`)
      .then(() => {
        setSavedTeams(savedTeams.filter(t => t.id !== teamId));
        showNotification("Team deleted", "success");
      })
      .catch((err) => console.error(err));
  };

  const handleCompare = () => {
    if (teamA.length === 0 || teamB.length === 0) {
      return showNotification("Both teams need members to compare", "error");
    }
    setComparing(true);
    const payload = {
      teams: [
        { name: teamAName, members: teamA },
        { name: teamBName, members: teamB }
      ]
    };

    api.post("/teams/compare/", payload)
      .then((res) => {
        setComparisonResult(res.data);
        setComparing(false);
        // Scroll to results
        setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch((err) => {
        console.error(err);
        showNotification("Comparison failed", "error");
        setComparing(false);
      });
  };

  // --- Actions ---

  const addToActiveTeam = (hero) => {
    const [team, setTeam] = activeTeam === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    if (team.find(h => h.id === hero.id)) return; // Already in team
    if (team.length >= 6) {
      showNotification("Max 6 heroes per team", "info");
      return;
    }
    setTeam([...team, hero]);
  };

  const addAllToActiveTeam = () => {
    if (!recommendation?.members) return;

    const [team, setTeam] = activeTeam === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    
    // Filter out heroes already in the team
    const uniqueNewHeroes = recommendation.members.filter(
      (recHero) => !team.some((teamHero) => teamHero.id === recHero.id)
    );

    if (uniqueNewHeroes.length === 0) {
      showNotification("All available heroes are already in the team.", "info");
      return;
    }

    const spacesLeft = 6 - team.length;
    if (spacesLeft <= 0) {
      showNotification("Team is already full.", "warning");
      return;
    }

    const heroesToAdd = uniqueNewHeroes.slice(0, spacesLeft);
    setTeam([...team, ...heroesToAdd]);
    showNotification(`Added ${heroesToAdd.length} heroes.`, "success");
  };

  const removeFromTeam = (slot, heroId) => {
    const [team, setTeam] = slot === "A" ? [teamA, setTeamA] : [teamB, setTeamB];
    setTeam(team.filter(h => h.id !== heroId));
  };

  const loadSavedTeam = (savedTeam, slot) => {
    // Map saved members (which have nested details) to simple hero objects
    const heroes = savedTeam.members.map(m => m.superhero_details);
    if (slot === "A") {
      setTeamA(heroes);
      setTeamAName(savedTeam.name);
      if (teamB.length === 0) setActiveTeam("B");
    } else {
      setTeamB(heroes);
      setTeamBName(savedTeam.name);
      if (teamA.length === 0) setActiveTeam("A");
    }
    showNotification(`Loaded ${savedTeam.name} into Team ${slot}`, "success");
  };

  const getHeroPower = (hero) => {
    if (hero.total_power !== undefined) return hero.total_power;
    return (hero.intelligence || 0) + (hero.strength || 0) + (hero.speed || 0) + 
           (hero.durability || 0) + (hero.power || 0) + (hero.combat || 0);
  };

  const isHeroInActiveTeam = (heroId) => {
    const team = activeTeam === "A" ? teamA : teamB;
    return !!team.find(h => h.id === heroId);
  };

  const isHeroFavorite = (heroId) => {
    return favourites.some(h => h.id === heroId);
  };

  const HeroMiniCard = ({ hero }) => (
    <div
      onClick={() => addToActiveTeam(hero)}
      className="group relative cursor-pointer border rounded-lg p-2 hover:border-blue-400 hover:shadow-md transition-all bg-gray-50 flex items-center gap-3"
    >
      {isHeroFavorite(hero.id) && activeTab !== "favourites" && (
        <div
          className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md z-10 flex items-center justify-center"
          title="Favourite Hero"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                    2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.22 2.56 
                    C11.09 5.01 12.76 4 14.5 4 
                    17 4 19 6 19 8.5 
                    c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}
      <HeroImage 
        name={hero.name} 
        imageUrl={hero.image_url} 
        className="w-10 h-10 rounded object-cover bg-gray-200 shrink-0" 
        textClass="text-base"
      />
      <div className="overflow-hidden flex-1">
        <p className="font-bold text-sm truncate">{hero.name}</p>
        <p className="text-xs text-gray-500">Pow: {getHeroPower(hero)}</p>
      </div>
      {isHeroInActiveTeam(hero.id) && (
        <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm"><Icons.Check /></div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-800">
      
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">TEAM BUILDER</h1>
        <p className="text-gray-500 max-w-2xl">
          Construct your dream team using our strategy engine. Compare squads and predict the winner based on power stats and alignment synergy.
        </p>
      </div>

      {/* Strategy Selector */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            onClick={
              () => {
                setStrategy(s.id)
                setActiveTab("recommendations");
              }
            }
            className={`p-4 border rounded-lg text-left transition-all flex items-start gap-3 hover:shadow-md ${
              strategy === s.id ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-gray-200"
            }`}
          >
            <div className={`p-2 rounded ${strategy === s.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <s.icon />
            </div>
            <div>
              <span className="font-bold block text-gray-900">{s.label}</span>
              <span className="text-xs text-gray-500">{s.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Stat Selector (Only for Power) */}
      {strategy === "power" && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {STATS.map(s => (
            <button
              key={s}
              onClick={() => setStat(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${
                stat === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Team Size Selector */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Heroes to Generate</label>
        <div className="flex flex-wrap items-center gap-2">
          {[4, 5, 6, 8].map((size) => (
            <button
              key={size}
              onClick={() => {
                setTeamSize(size);
                setActiveTab("recommendations");
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                teamSize === size 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Selection Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b bg-gray-50 flex-col sm:flex-row">
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`flex-1 py-3 px-4 font-bold text-sm flex justify-center items-center gap-2 transition-colors ${activeTab === 'recommendations' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <Icons.Zap /> RECOMMENDED HEROES
          </button>
          <button
            onClick={() => setActiveTab("favourites")}
            className={`flex-1 py-3 px-4 font-bold text-sm flex justify-center items-center gap-2 transition-colors ${activeTab === 'favourites' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <Icons.Star /> YOUR FAVOURITES {favourites.length > 0 && `(${favourites.length})`}
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 px-4 font-bold text-sm flex justify-center items-center gap-2 transition-colors ${activeTab === 'search' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
          >
            <Icons.Search /> SEARCH HEROES
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Recommendations Content */}
          {activeTab === "recommendations" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-normal text-gray-400">Click a hero to add to the active team</span>
                <div className="flex gap-4">
                  <button onClick={addAllToActiveTeam} className="text-green-600 text-sm hover:underline flex items-center gap-1 font-medium">
                    <Icons.Check /> Select All
                  </button>
                  <button onClick={generateRecommendation} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <Icons.Shuffle /> Refresh
                  </button>
                </div>
              </div>
              {loadingRecs ? (
                <div className="h-32 flex items-center justify-center text-gray-400">Loading recommendations...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {recommendation?.members.map((hero) => <HeroMiniCard key={hero.id} hero={hero} />)}
                </div>
              )}
            </div>
          )}

          {/* Favourites Content */}
          {activeTab === "favourites" && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <span className="text-xs font-normal text-gray-400">Click a hero to add to the active team</span>
              </div>
              {loadingFavs ? (
                <div className="h-32 flex items-center justify-center text-gray-400">Loading favourites...</div>
              ) : favourites.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-400 italic">You haven't added any favourites yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {favourites.map((hero) => <HeroMiniCard key={hero.id} hero={hero} />)}
                </div>
              )}
            </div>
          )}

          {/* Search Content */}
          {activeTab === "search" && (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <span className="text-xs font-normal text-gray-400 w-full md:w-auto text-center md:text-left">Click a hero to add to the active team</span>
                <div className="flex gap-2 w-full md:w-auto">
                  <input 
                    type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-48 text-sm"
                  />
                  <select 
                    value={ordering} onChange={(e) => setOrdering(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 bg-white text-sm"
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
              {searchingHeroes ? (
                <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-400 italic">No heroes found matching your search.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {searchResults.map((hero) => <HeroMiniCard key={hero.id} hero={hero} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Builder Panels */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {[{ id: "A", team: teamA, name: teamAName, setName: setTeamAName }, { id: "B", team: teamB, name: teamBName, setName: setTeamBName }].map((slot) => (
          <div 
            key={slot.id}
            onClick={() => setActiveTeam(slot.id)}
            className={`border-2 rounded-xl p-4 transition-all relative ${
              activeTeam === slot.id ? "border-blue-500 bg-blue-50/50 shadow-lg" : "border-dashed border-gray-300 hover:border-gray-400"
            }`}
          >
            {activeTeam === slot.id && (
              <span className="absolute -top-3 left-4 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Active Editing
              </span>
            )}

            <div className="flex justify-between items-center mb-4 mt-2 gap-2">
              <div className="flex items-center gap-2 flex-1">
                <input 
                  value={slot.name}
                  onChange={(e) => slot.setName(e.target.value)}
                  className="font-bold text-xl bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); slot.setName(generateRandomTeamName()); }} 
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  title="Randomize Name"
                >
                  <Icons.Shuffle />
                </button>
              </div>
              <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{slot.team.length} / 6</span>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {slot.team.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <Icons.Users />
                  <p className="mt-2">Click heroes above to add</p>
                </div>
              ) : (
                slot.team.map(hero => (
                  <div key={hero.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <HeroImage 
                        name={hero.name} 
                        imageUrl={hero.image_url} 
                        className="w-10 h-10 rounded-full object-cover bg-gray-200 shrink-0" 
                        textClass="text-base"
                      />
                      <span className="font-medium text-sm truncate">{hero.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono">{getHeroPower(hero)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFromTeam(slot.id, hero.id); }} className="text-gray-300 hover:text-red-500">
                        <Icons.Trash2 />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Power</p>
                <p className="font-mono font-bold text-lg">{slot.team.reduce((sum, h) => sum + getHeroPower(h), 0).toLocaleString()}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleSaveTeam(slot.id); }}
                className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-black flex items-center gap-1"
              >
                <Icons.Save /> Save
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Compare Action */}
      <div className="text-center mb-12">
        <button
          onClick={handleCompare}
          disabled={comparing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 mx-auto"
        >
          <Icons.Swords /> {comparing ? "Analyzing..." : "PREDICT WINNER"}
        </button>
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div
          id="results"
          className="bg-gray-900 text-white rounded-xl p-8 mb-12 shadow-2xl border border-gray-700"
        >
          {/* Winner Section */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-yellow-400 flex justify-center items-center gap-2">
              <Icons.Trophy /> Winner: {comparisonResult.winner}
            </h2>

            <p className="text-gray-300 mt-3 max-w-3xl mx-auto leading-relaxed">
              {comparisonResult.narrative}
            </p>
          </div>

          {/* Teams */}
          <div className="grid md:grid-cols-2 gap-6">
            {comparisonResult.teams.map((t, i) => (
              <div
                key={i}
                className={`p-6 rounded-lg border shadow-md transition ${
                  t.name === comparisonResult.winner
                    ? "bg-gray-800 border-yellow-400"
                    : "bg-gray-800 border-gray-700"
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{t.name}</h3>

                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Battle Score
                    </p>

                    <p className="text-3xl font-mono text-blue-400 font-bold">
                      {Math.round(t.battle_score)}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Total Power: {t.total_power}
                    </p>
                  </div>
                </div>

                {/* Advantage Bar */}
                <div className="mb-5">
                  <div className="w-full bg-gray-700 h-3 rounded">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded"
                      style={{
                        width: `${(t.battle_score /
                          Math.max(
                            ...comparisonResult.teams.map((team) => team.battle_score)
                          )) *
                          100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Team Stats */}
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Dominant Stat</span>
                    <span className="text-white capitalize font-medium">
                      {t.dominant_stat}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Star Player</span>
                    <span className="text-white font-medium">
                      {t.star_player?.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Saved Teams List */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Saved Roster</h2>
        {savedTeams.length === 0 ? (
          <p className="text-gray-500 italic">No saved teams found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTeams.map((team) => (
              <div key={team.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <Link to={`/team/${team.id}`} className="font-bold text-lg hover:text-blue-600 hover:underline">
                    {team.name}
                  </Link>
                  <button onClick={() => handleDeleteSavedTeam(team.id)} className="text-gray-300 hover:text-red-500">
                    <Icons.Trash2 />
                  </button>
                </div>
                
                <div className="flex -space-x-2 overflow-hidden mb-4 py-1">
                  {team.members.slice(0, 5).map(m => (
                    <HeroImage 
                      key={m.id}
                      name={m.superhero_details?.name || m.superhero_name} 
                      imageUrl={m.superhero_details?.image_url} 
                      className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 object-cover" 
                      textClass="text-xs"
                    />
                  ))}
                  {team.members.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => loadSavedTeam(team, "A")} 
                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded font-medium border border-gray-200"
                  >
                    Load A
                  </button>
                  <button 
                    onClick={() => loadSavedTeam(team, "B")} 
                    className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded font-medium border border-gray-200"
                  >
                    Load B
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;