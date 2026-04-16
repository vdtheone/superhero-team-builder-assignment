import { useState } from "react";

// We use a cooldown mechanism because the upstream Superhero API frequently blocks
// or rate-limits image requests. If one image fails to load via the proxy, 
// we assume the API is blocking us and stop attempting to fetch images for a set duration.
const COOLDOWN_KEY = "proxyErrorCooldown";
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Checks if we are currently in a cooldown period due to a recent image proxy error.
 * @returns {boolean} true if we should skip fetching images and show placeholders immediately.
 */
const checkCooldown = () => {
  if (typeof window === "undefined") return false;
  try {
    const lastError = localStorage.getItem(COOLDOWN_KEY);
    if (lastError) {
      // If the time elapsed since the last error is less than the cooldown duration, we are still blocked
      if (Date.now() - parseInt(lastError, 10) < COOLDOWN_DURATION) {
        return true;
      }
      // Cooldown expired, clear the lock
      localStorage.removeItem(COOLDOWN_KEY);
    }
  } catch (e) {}
  return false;
};

function HeroImage({ name, imageUrl, className = "", textClass = "text-3xl" }) {
  // Initialize state synchronously using checkCooldown. 
  // If true, the component will render the placeholder immediately without attempting a network request.
  const [imgError, setImgError] = useState(checkCooldown);

  // Generates 1 or 2 letter initials from the hero's name (e.g., "Batman" -> "B", "Wonder Woman" -> "WW")
  const getInitial = (heroName) => {
    if (!heroName) return "?";
    const words = heroName.split(" ");
    return words.length === 1
      ? words[0][0].toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();
  };

  // Generates a consistent background color for the placeholder based on the string hash of the hero's name
  const getColorFromName = (heroName) => {
    const colors = [
      "bg-red-300",
      "bg-blue-300",
      "bg-green-300",
      "bg-yellow-300",
      "bg-purple-300",
      "bg-pink-300",
      "bg-indigo-300",
    ];

    let hash = 0;
    for (let i = 0; i < heroName.length; i++) {
      hash = heroName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Fired when the image proxy returns an error (like 403 or 429) or fails to load.
  const handleImageError = () => {
    setImgError(true);
    try {
      // Block future requests for 1 hour by saving the failure timestamp
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    } catch (e) {}
  };

  // Render the placeholder if there's no URL provided or if an error/cooldown occurred.
  if (imgError || !imageUrl) {
    return (
      <div className={`flex items-center justify-center text-white font-bold ${getColorFromName(name)} ${className} ${textClass}`}>
        {getInitial(name)}
      </div>
    );
  }

  // Attempt to load the image through the Django proxy to avoid direct CORS/mixed-content issues.
  return (
    <img
      src={`${import.meta.env.VITE_API_BASE_URL}/api/heroes/image-proxy/?url=${encodeURIComponent(imageUrl)}`}
      alt={name}
      className={className}
      onError={handleImageError}
    />
  );
}

export default HeroImage;