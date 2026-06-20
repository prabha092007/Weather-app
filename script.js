// ===========================================================
// CONFIG
// ===========================================================
// "demo"        -> uses Open-Meteo, a free API with NO key needed.
//                  Works immediately, nothing to set up.
// "openweather" -> uses the OpenWeatherMap API named in the
//                  assignment. Requires your own free API key
//                  from https://openweathermap.org/api
//                  (paste it into API_KEY below).
const DATA_SOURCE = "demo";
const API_KEY = "YOUR_API_KEY_HERE";
// ===========================================================

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locateBtn = document.getElementById("locateBtn");
const stateMessage = document.getElementById("stateMessage");
const loadingState = document.getElementById("loadingState");
const result = document.getElementById("result");
const recentRow = document.getElementById("recentRow");
const apiNote = document.getElementById("apiNote");

const cityName = document.getElementById("cityName");
const conditionText = document.getElementById("conditionText");
const weatherIcon = document.getElementById("weatherIcon");
const emojiIcon = document.getElementById("emojiIcon");
const tempValue = document.getElementById("tempValue");
const humidityValue = document.getElementById("humidityValue");
const feelsLikeValue = document.getElementById("feelsLikeValue");
const windValue = document.getElementById("windValue");

const unitCBtn = document.getElementById("unitC");
const unitFBtn = document.getElementById("unitF");

let unit = "C";
let lastWeather = null;
const RECENT_KEY = "weatherApp_recentCities";

apiNote.textContent = DATA_SOURCE === "demo"
  ? "Running on Open-Meteo (free, no key). Switch DATA_SOURCE to \"openweather\" in script.js and paste your API key to use OpenWeatherMap instead."
  : "Running on OpenWeatherMap. Make sure your API key is pasted into API_KEY.";

// -----------------------------------------------------------
// Weather code → human label / emoji / accent theme
// (WMO codes, used by the Open-Meteo "demo" source)
// -----------------------------------------------------------
function getWeatherMeta(code, isDay) {
  if ((code === 0 || code === 1) && isDay === 0) {
    return { label: code === 0 ? "Clear sky" : "Mainly clear", emoji: "🌙", theme: "night" };
  }
  const map = {
    0: { label: "Clear sky", emoji: "☀️", theme: "sunny" },
    1: { label: "Mainly clear", emoji: "🌤️", theme: "sunny" },
    2: { label: "Partly cloudy", emoji: "⛅", theme: "cloudy" },
    3: { label: "Overcast", emoji: "☁️", theme: "cloudy" },
    45: { label: "Fog", emoji: "🌫️", theme: "fog" },
    48: { label: "Rime fog", emoji: "🌫️", theme: "fog" },
    51: { label: "Light drizzle", emoji: "🌦️", theme: "rain" },
    53: { label: "Moderate drizzle", emoji: "🌦️", theme: "rain" },
    55: { label: "Dense drizzle", emoji: "🌧️", theme: "rain" },
    56: { label: "Freezing drizzle", emoji: "🌧️", theme: "rain" },
    57: { label: "Freezing drizzle", emoji: "🌧️", theme: "rain" },
    61: { label: "Slight rain", emoji: "🌦️", theme: "rain" },
    63: { label: "Moderate rain", emoji: "🌧️", theme: "rain" },
    65: { label: "Heavy rain", emoji: "🌧️", theme: "rain" },
    66: { label: "Freezing rain", emoji: "🌧️", theme: "rain" },
    67: { label: "Freezing rain", emoji: "🌧️", theme: "rain" },
    71: { label: "Slight snow", emoji: "🌨️", theme: "snow" },
    73: { label: "Moderate snow", emoji: "🌨️", theme: "snow" },
    75: { label: "Heavy snow", emoji: "❄️", theme: "snow" },
    77: { label: "Snow grains", emoji: "❄️", theme: "snow" },
    80: { label: "Slight rain showers", emoji: "🌦️", theme: "rain" },
    81: { label: "Moderate rain showers", emoji: "🌧️", theme: "rain" },
    82: { label: "Violent rain showers", emoji: "⛈️", theme: "storm" },
    85: { label: "Slight snow showers", emoji: "🌨️", theme: "snow" },
    86: { label: "Heavy snow showers", emoji: "❄️", theme: "snow" },
    95: { label: "Thunderstorm", emoji: "⛈️", theme: "storm" },
    96: { label: "Thunderstorm with hail", emoji: "⛈️", theme: "storm" },
    99: { label: "Thunderstorm with heavy hail", emoji: "⛈️", theme: "storm" },
  };
  return map[code] || { label: "Unknown", emoji: "🌡️", theme: "cloudy" };
}

const THEME_COLORS = {
  sunny: "#c9920c", cloudy: "#7a8aa0", rain: "#2f6fae",
  storm: "#5b3aa0", snow: "#3aa6c4", fog: "#8a8f98", night: "#4a5cad",
};

// -----------------------------------------------------------
// DEMO source: Open-Meteo (no key required)
// -----------------------------------------------------------
async function fetchDemoWeather(city) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error("Could not look up that city. Try again.");
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("City not found. Check the spelling and try again.");
  }
  const place = geoData.results[0];
  const label = place.admin1 ? `${place.name}, ${place.admin1}` : place.name;
  return fetchDemoWeatherByCoords(place.latitude, place.longitude, label, place.country_code || "");
}

async function fetchDemoWeatherByCoords(lat, lon, label, countryCode) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service did not respond. Try again.");
  const data = await res.json();
  const c = data.current;
  const meta = getWeatherMeta(c.weather_code, c.is_day);
  return {
    city: label,
    country: countryCode,
    tempC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    windUnit: "km/h",
    description: meta.label,
    emoji: meta.emoji,
    theme: meta.theme,
    iconUrl: null,
  };
}

async function reverseGeocodeLabel(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (!res.ok) return "Your location";
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || "Your location";
  } catch {
    return "Your location";
  }
}

// -----------------------------------------------------------
// OpenWeatherMap source (requires your own API key)
// -----------------------------------------------------------
function mapOwmTheme(main) {
  const m = main.toLowerCase();
  if (m.includes("clear")) return "sunny";
  if (m.includes("cloud")) return "cloudy";
  if (m.includes("rain") || m.includes("drizzle")) return "rain";
  if (m.includes("thunderstorm")) return "storm";
  if (m.includes("snow")) return "snow";
  if (m.includes("fog") || m.includes("mist") || m.includes("haze")) return "fog";
  return "cloudy";
}

function normalizeOwm(data) {
  const w = data.weather[0];
  return {
    city: data.name,
    country: data.sys.country,
    tempC: data.main.temp,
    feelsLikeC: data.main.feels_like,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed * 3.6, // m/s -> km/h
    windUnit: "km/h",
    description: w.description,
    emoji: null,
    theme: mapOwmTheme(w.main),
    iconUrl: `https://openweathermap.org/img/wn/${w.icon}@2x.png`,
  };
}

async function fetchOpenWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid API key. Double check the key you pasted.");
    if (res.status === 404) throw new Error("City not found. Check the spelling and try again.");
    throw new Error("Something went wrong fetching the weather.");
  }
  return normalizeOwm(await res.json());
}

async function fetchOpenWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch weather for your location.");
  return normalizeOwm(await res.json());
}

// -----------------------------------------------------------
// Dispatchers (pick demo vs openweather based on CONFIG)
// -----------------------------------------------------------
async function getWeatherForCity(city) {
  if (DATA_SOURCE === "openweather") {
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("Add your OpenWeatherMap API key in script.js, or set DATA_SOURCE to \"demo\".");
    }
    return fetchOpenWeather(city);
  }
  return fetchDemoWeather(city);
}

async function getWeatherForCoords(lat, lon) {
  if (DATA_SOURCE === "openweather") {
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("Add your OpenWeatherMap API key in script.js, or set DATA_SOURCE to \"demo\".");
    }
    return fetchOpenWeatherByCoords(lat, lon);
  }
  const label = await reverseGeocodeLabel(lat, lon);
  return fetchDemoWeatherByCoords(lat, lon, label, "");
}

// -----------------------------------------------------------
// Rendering
// -----------------------------------------------------------
function celsiusToF(c) { return (c * 9) / 5 + 32; }

function renderWeather(weather) {
  lastWeather = weather;
  updateDisplay();
}

function updateDisplay() {
  if (!lastWeather) return;
  const w = lastWeather;

  cityName.textContent = w.country ? `${w.city}, ${w.country}` : w.city;
  conditionText.textContent = w.description;

  const temp = unit === "C" ? w.tempC : celsiusToF(w.tempC);
  const feels = unit === "C" ? w.feelsLikeC : celsiusToF(w.feelsLikeC);
  tempValue.innerHTML = `${Math.round(temp)}<sup>°${unit}</sup>`;
  feelsLikeValue.textContent = `${Math.round(feels)}°${unit}`;
  humidityValue.textContent = `${w.humidity}%`;
  windValue.textContent = `${Math.round(w.windSpeed)} ${w.windUnit}`;

  if (w.iconUrl) {
    weatherIcon.src = w.iconUrl;
    weatherIcon.alt = w.description;
    weatherIcon.style.display = "block";
    emojiIcon.style.display = "none";
  } else {
    emojiIcon.textContent = w.emoji;
    emojiIcon.style.display = "block";
    weatherIcon.style.display = "none";
  }

  document.querySelector(".card").style.setProperty(
    "--theme-color",
    THEME_COLORS[w.theme] || THEME_COLORS.cloudy
  );

  stateMessage.style.display = "none";
  loadingState.style.display = "none";
  result.classList.add("visible");
}

function showMessage(text, isError) {
  result.classList.remove("visible");
  loadingState.style.display = "none";
  stateMessage.style.display = "block";
  stateMessage.textContent = text;
  stateMessage.classList.toggle("error", isError);
}

function showLoading() {
  result.classList.remove("visible");
  stateMessage.style.display = "none";
  loadingState.style.display = "flex";
}

// -----------------------------------------------------------
// Recent searches (localStorage)
// -----------------------------------------------------------
function getRecentCities() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
  catch { return []; }
}

function saveRecentCity(city) {
  let list = getRecentCities().filter(c => c.toLowerCase() !== city.toLowerCase());
  list.unshift(city);
  list = list.slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  renderRecentChips();
}

function renderRecentChips() {
  const list = getRecentCities();
  recentRow.innerHTML = "";
  list.forEach(city => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = city;
    chip.addEventListener("click", () => {
      cityInput.value = city;
      handleSearch();
    });
    recentRow.appendChild(chip);
  });
  recentRow.style.display = list.length ? "flex" : "none";
}

// -----------------------------------------------------------
// Event handlers
// -----------------------------------------------------------
async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    showMessage("Please enter a city name.", true);
    return;
  }
  showLoading();
  try {
    const weather = await getWeatherForCity(city);
    renderWeather(weather);
    saveRecentCity(weather.city.split(",")[0]);
  } catch (err) {
    showMessage(err.message, true);
  }
}

searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showMessage("Geolocation is not supported by your browser.", true);
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const weather = await getWeatherForCoords(pos.coords.latitude, pos.coords.longitude);
        renderWeather(weather);
        saveRecentCity(weather.city.split(",")[0]);
      } catch (err) {
        showMessage(err.message, true);
      }
    },
    () => showMessage("Could not get your location. Please allow location access.", true)
  );
});

unitCBtn.addEventListener("click", () => {
  if (unit === "C") return;
  unit = "C";
  unitCBtn.classList.add("active");
  unitFBtn.classList.remove("active");
  updateDisplay();
});

unitFBtn.addEventListener("click", () => {
  if (unit === "F") return;
  unit = "F";
  unitFBtn.classList.add("active");
  unitCBtn.classList.remove("active");
  updateDisplay();
});

// Initial state
renderRecentChips();
