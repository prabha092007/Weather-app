Weather App
CodeAlpha Web Development Internship — Week 3 Assignment Focus: DOM manipulation, JSON parsing, API integration

What it does
Search any city and get current temperature, humidity, "feels like", wind speed, and condition
📍 button fetches weather for your current location via browser geolocation
°C / °F unit toggle
Last 5 searched cities saved locally and shown as quick-access chips
Clean card-based UI with a loading state and error handling for invalid cities / empty input
Project structure
weather-app/
├── index.html
├── style.css
├── script.js
└── README.md
How to run it in VS Code
Open the weather-app folder in VS Code (File > Open Folder...)
Install the Live Server extension (by Ritwick Dey) if you don't have it
Right-click index.html → Open with Live Server
(You can also just double-click index.html to open it directly in a browser — geolocation may ask for permission either way.)

API setup
This project ships with two data sources, configured at the top of script.js:

const DATA_SOURCE = "demo";        // change to "openweather" before submitting
const API_KEY = "YOUR_API_KEY_HERE";
demo — uses Open-Meteo, a free API that needs no signup. Good for instant local testing.
openweather — uses OpenWeatherMap, the API named in the assignment brief. Requires a free account and API key.
Before submitting: sign up at openweathermap.org/api, copy your key into API_KEY, set DATA_SOURCE = "openweather", and test a search. New keys can take 10–15 minutes to activate.

Skills demonstrated
fetch() for asynchronous API calls
Parsing and rendering JSON responses
DOM manipulation (creating/updating elements dynamically)
localStorage for persisting recent searches
Browser Geolocation API
Responsive, card-based UI design
