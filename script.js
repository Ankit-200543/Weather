let MainAddress = "";
let map;
let markers = [];

// Show map & marker
function showMap(lat, lon) {
    if (!map) {
        map = L.map("map").setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);
    } else {
        map.setView([lat, lon], 13);
    }

    // Remove existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add new marker
    const newMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${MainAddress}</b>`)
        .openPopup();

    markers.push(newMarker);
}

// Single Weather API Function
async function getWeather(lat, lon) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "⏳ Fetching weather data...";

    try {
        // ✔ Single API call
        const url = `https://weather-api-ashen-three.vercel.app/getWeather/${lat}/${lon}`;
        const res = await fetch(url);
        const data = await res.json();

        // Extract returned values
        MainAddress = data.pata || "Unknown Location";
        const temperature = data.Temperature;
        const wind = data.windSpeed;
        const humidity = data.Humidity;

        // Weather UI
        resultDiv.innerHTML = `
            <h3>📍 ${MainAddress}</h3>
            <div class="weather-detail"><i>🌡 Temperature:</i> <span>${temperature}°C</span></div>
            <div class="weather-detail"><i>💨 Wind Speed:</i> <span>${wind} m/s</span></div>
            <div class="weather-detail"><i>💧 Humidity:</i> <span>${humidity}%</span></div>
        `;

        // Map update
        showMap(lat, lon);

    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "⚠️ Error fetching data! Try again.";
    }
}

// City to Coordinates → Weather
async function getCoordinatesByCity(city) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "⏳ Searching city...";

    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            resultDiv.innerHTML = "❌ City not found!";
            return;
        }

        const { latitude, longitude } = data.results[0];

        // Now call weather API
        getWeather(latitude, longitude);

    } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "⚠️ Error fetching city data!";
    }
}

// Button search
document.getElementById("getWeatherBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        document.getElementById("result").innerHTML = "⚠️ Please enter a city name!";
        return;
    }
    getCoordinatesByCity(city);
});

// Press Enter to search
document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
        document.getElementById("getWeatherBtn").click();
    }
});

// Auto detect location
document.getElementById("autoBtn").addEventListener("click", () => {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "📍 Detecting your location...";

    if (!navigator.geolocation) {
        resultDiv.innerHTML = "❌ Geolocation not supported!";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => getWeather(pos.coords.latitude, pos.coords.longitude),
        (error) => {
            let msg = "⚠️ Could not get location.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "⚠️ Location access denied!";
            }
            resultDiv.innerHTML = msg;
        }
    );
});
