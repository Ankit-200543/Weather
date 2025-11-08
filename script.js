    let MainAddress="";
    let map; 
    let markers = [];

    function showMap(lat, lon) {
      if (!map) {
        map = L.map("map").setView([lat, lon], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
      } else {
        map.setView([lat, lon], 13);
      }

      // Remove old markers
      markers.forEach(marker => map.removeLayer(marker));
      markers = [];

      // Add new marker
      const newMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${MainAddress}</b> `)
        .openPopup();

      markers.push(newMarker);
    }

    async function getWeather(lat, lon) {
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = "⏳ Fetching weather data...";

      try {
        // Weather API
        const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`;
        const weatherRes = await fetch(weatherURL);
        const weatherData = await weatherRes.json();

        // Reverse geocoding
        const geoURL = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const geoRes = await fetch(geoURL);
        const geoData = await geoRes.json();

        // ✅ Extract city, state, country only
        const { city, town, village, state, country, postcode } = geoData.address || {};
        const cityName = city || town || village || (geoData.name ? geoData.name : "Location");
        const stateName = state || "";
        const countryName = country || "Unknown";
        
        // Better formatting for address
        let shortAddress = `${cityName}`;
        if (stateName && cityName !== stateName) shortAddress += `, ${stateName}`;
        shortAddress += `, ${countryName}`;


        const { temperature_2m, wind_speed_10m, relative_humidity_2m } = weatherData.current;
        MainAddress=shortAddress;

        // Show results with better visual structure
        resultDiv.innerHTML = `
          <h3>📍 ${shortAddress}</h3>
          <div class="weather-detail"><i>🌡 Temperature:</i> <span>${temperature_2m}°C</span></div>
          <div class="weather-detail"><i>💨 Wind Speed:</i> <span>${wind_speed_10m} m/s</span></div>
          <div class="weather-detail"><i>💧 Humidity:</i> <span>${relative_humidity_2m}%</span></div>
        `;

        showMap(lat, lon);
      } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "⚠️ **Error fetching data!** Please try again.";
      }
    }

    async function getCoordinatesByCity(city) {
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = "⏳ **Searching for city...**";

      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
          resultDiv.innerHTML = "❌ **City not found!** Check the spelling and try again.";
          return;
        }

        const { latitude, longitude } = data.results[0];
        getWeather(latitude, longitude);
      } catch (error) {
        console.error(error);
        resultDiv.innerHTML = "⚠️ **Error fetching city data!**";
      }
    }

    document.getElementById("getWeatherBtn").addEventListener("click", () => {
      const city = document.getElementById("cityInput").value.trim();
      if (!city) {
        document.getElementById("result").innerHTML = "⚠️ **Please enter a city name!**";
        return;
      }
      getCoordinatesByCity(city);
    });
    
    // Allow search on Enter key press
    document.getElementById("cityInput").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') {
            document.getElementById("getWeatherBtn").click();
        }
    });

    document.getElementById("autoBtn").addEventListener("click", () => {
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML = "📍 **Detecting your location...**";

      if (!navigator.geolocation) {
        resultDiv.innerHTML = "❌ **Geolocation not supported by your browser!**";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => getWeather(pos.coords.latitude, pos.coords.longitude),
        (error) => {
          let message = "⚠️ **Failed to get location!**";
          if (error.code === error.PERMISSION_DENIED) {
              message = "⚠️ **Location access denied!** Please enable it in your browser settings.";
          }
          resultDiv.innerHTML = message;
          console.error("Geolocation Error:", error);
        }
      );
    });