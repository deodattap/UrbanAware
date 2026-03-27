// src/routes/dashboard.js
const router = require('express').Router();
const axios = require('axios');

// Helper: get AQI data from WAQI API
async function fetchAQI(city = 'delhi') {
  const token = process.env.WAQI_API_TOKEN;
  if (!token || token === 'your_waqi_token_here') {
    // Return mock data if no token
    return getMockAQI();
  }
  try {
    const res = await axios.get(`https://api.waqi.info/feed/${city}/?token=${token}`, { timeout: 5000 });
    if (res.data.status === 'ok') {
      const d = res.data.data;
      return {
        aqi: d.aqi,
        city: d.city.name,
        dominentPol: d.dominentpol,
        iaqi: d.iaqi,
        time: d.time.s
      };
    }
  } catch (e) {}
  return getMockAQI();
}

function getMockAQI() {
  const aqi = Math.floor(Math.random() * 80) + 80; // 80–160
  return { aqi, city: 'Demo City', dominentPol: 'pm25', iaqi: { pm25: { v: aqi }, pm10: { v: Math.floor(aqi * 0.7) } }, time: new Date().toISOString() };
}

// Helper: get Weather from OpenWeatherMap
async function fetchWeather(city = 'Delhi') {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key || key === 'your_openweather_key_here') {
    return getMockWeather();
  }
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`,
      { timeout: 5000 }
    );
    return {
      temp: Math.round(res.data.main.temp),
      feelsLike: Math.round(res.data.main.feels_like),
      humidity: res.data.main.humidity,
      description: res.data.weather[0].description,
      city: res.data.name
    };
  } catch (e) {}
  return getMockWeather();
}

function getMockWeather() {
  return { temp: 30 + Math.floor(Math.random() * 5), feelsLike: 32, humidity: 60, description: 'partly cloudy', city: 'Demo City' };
}

// GET /api/dashboard/data
router.get('/data', async (req, res) => {
  const city = req.query.city || 'delhi';

  const [aqiData, weatherData] = await Promise.all([
    fetchAQI(city),
    fetchWeather(city)
  ]);

  // AQI status
  const aqiStatus = aqiData.aqi <= 50 ? 'Good' : aqiData.aqi <= 100 ? 'Moderate' : aqiData.aqi <= 150 ? 'Unhealthy for Sensitive' : 'Poor';
  const aqiColor = aqiData.aqi <= 50 ? 'emerald' : aqiData.aqi <= 100 ? 'amber' : 'pink';

  // Traffic mock (can be replaced with real API)
  const trafficLevel = Math.floor(Math.random() * 30) + 50; // 50–80%
  const trafficStatus = trafficLevel > 70 ? 'Heavy' : trafficLevel > 40 ? 'Moderate' : 'Light';

  res.json({
    success: true,
    data: {
      aqi: { value: aqiData.aqi, status: aqiStatus, color: aqiColor, city: aqiData.city },
      weather: { temp: weatherData.temp, feelsLike: weatherData.feelsLike, humidity: weatherData.humidity, description: weatherData.description },
      traffic: { level: trafficLevel, status: trafficStatus },
      waste: { level: 85, status: 'Good' },
      lastUpdated: new Date().toISOString()
    }
  });
});

// GET /api/dashboard/aqi-trend  — returns last 24h mock trend data
router.get('/aqi-trend', (req, res) => {
  const hours = [];
  const values = [];
  let baseAQI = 90;
  for (let h = 0; h < 24; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
    baseAQI += Math.floor(Math.random() * 20) - 8;
    baseAQI = Math.max(40, Math.min(200, baseAQI));
    values.push(baseAQI);
  }
  res.json({ success: true, labels: hours, values });
});

module.exports = router;
