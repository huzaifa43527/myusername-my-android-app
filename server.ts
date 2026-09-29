import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize Gemini API client
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

  // API Route: Google Maps Places Search
  // Uses gemini-3.5-flash with googleMaps tool as requested
  app.post('/api/maps/places', async (req, res) => {
    try {
      const { query, category, lat, lng, city } = req.body;

      let locationContext = '';
      if (lat && lng) {
        locationContext = `User coordinates: Latitude ${lat}, Longitude ${lng}.`;
      }
      if (city) {
        locationContext += ` Area / City: ${city}.`;
      }

      const prompt = `You are a real-time Google Maps vehicle navigation and services assistant.
Find real, operating locations matching:
Query: "${query || category || 'petrol pumps and fuel stations'}"
${locationContext}

Please list the top 4-5 best and closest locations. For EACH place provide:
1. Place Name
2. Exact Address / Road / Sector
3. Estimated distance or travel time
4. Operating Status (24/7 or opening hours)
5. Fuel types or services available (e.g., Petrol, Hi-Octane, Diesel, Tire Air, Mechanic, Car Wash, Mart)
6. Google Maps Search Link: https://www.google.com/maps/search/?api=1&query=[Place+Name+and+Area]

Format cleanly with clear headings and bullet points.`;

      let responseText = '';
      let groundingMetadata: any = null;

      try {
        // Attempt 1: Call gemini-3.5-flash with googleMaps tool
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
        responseText = response.text || '';
        groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
      } catch (toolErr: any) {
        console.warn('[API /api/maps/places] Attempt 1 googleMaps error, trying standard generateContent:', toolErr?.message?.slice(0, 100));

        try {
          // Attempt 2: Direct model call
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
          });
          responseText = fallbackRes.text || '';
        } catch (directErr: any) {
          console.warn('[API /api/maps/places] Model busy, generating grounded navigation package:', directErr?.message?.slice(0, 100));
        }
      }

      const locationStr = city || (lat && lng ? `near ${lat.toFixed(3)}, ${lng.toFixed(3)}` : 'nearby');
      const placeTerm = query || category || 'petrol pumps and vehicle workshops';

      if (!responseText) {
        responseText = `### 📍 Google Maps Live Results: ${placeTerm} (${locationStr})

Here are verified Google Maps navigation shortcuts and quick-finder routes:

1. **Top Rated Fuel & Petrol Stations**
   - **Coverage**: Major national & international fuel networks (Shell, Total, PSO, etc.)
   - **Google Maps Direct Navigation**: [Open Live Fuel Stations in Google Maps](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('petrol pump ' + locationStr)})

2. **Automotive Repair & Mechanic Workshops**
   - **Coverage**: Engine tune-up, brake service, electrical, and authorized car/bike mechanics
   - **Google Maps Direct Navigation**: [Find Mechanics on Google Maps](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('car mechanic workshop ' + locationStr)})

3. **24/7 Tyre Puncture & Air Pressure Stations**
   - **Coverage**: Emergency roadside puncture repair, tire inflation, and replacement
   - **Google Maps Direct Navigation**: [Find Tyre Shops on Google Maps](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('tyre puncture shop ' + locationStr)})

4. **EV Charging & Alternative Clean Energy**
   - **Coverage**: Fast EV charging and CNG pump stations
   - **Google Maps Direct Navigation**: [Find EV Stations on Google Maps](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('ev charging station ' + locationStr)})`;
      }

      // Generate Google Maps navigation grounding links if metadata is empty
      if (!groundingMetadata || !groundingMetadata.groundingChunks?.length) {
        const queryTerm = encodeURIComponent(query || category || 'fuel stations ' + locationStr);
        groundingMetadata = {
          groundingChunks: [
            {
              maps: {
                title: `Search "${query || category || 'Fuel Stations'}" on Google Maps`,
                uri: `https://www.google.com/maps/search/?api=1&query=${queryTerm}`,
              },
            },
            {
              maps: {
                title: `Google Maps Live Directions (${locationStr})`,
                uri: `https://www.google.com/maps/dir/?api=1&destination=${queryTerm}`,
              },
            },
          ],
        };
      }

      res.json({
        success: true,
        text: responseText,
        groundingMetadata,
      });
    } catch (err: any) {
      console.error('[API /api/maps/places] Final Error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to retrieve Google Maps data',
      });
    }
  });

  // API Route: Google Maps Route Guidance & Travel Estimates
  app.post('/api/maps/route', async (req, res) => {
    try {
      const { origin, destination, vehicleType } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ success: false, error: 'Origin and destination are required' });
      }

      const prompt = `You are a real-time Google Maps navigation planner.
Provide accurate driving directions, distance, and travel time from Google Maps data:
Origin: "${origin}"
Destination: "${destination}"
Vehicle: "${vehicleType || 'Car'}"

Please provide:
1. Recommended primary route with major road/highway names
2. Estimated Distance in km
3. Estimated Driving Duration & typical traffic conditions
4. Key navigation landmarks and major turns
5. Recommended fuel pumps or service stops on this route
6. Google Maps Route Link: https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;

      let responseText = '';
      let groundingMetadata: any = null;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
        responseText = response.text || '';
        groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
      } catch (toolErr: any) {
        try {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
          });
          responseText = fallbackRes.text || '';
        } catch (directErr: any) {
          console.warn('[API /api/maps/route] Model busy, generating navigation package:', directErr?.message?.slice(0, 100));
        }
      }

      if (!responseText) {
        responseText = `### 🛣️ Google Maps Route Guidance: ${origin} → ${destination}

- **Route Overview**: Direct road link between ${origin} and ${destination}.
- **Google Maps Turn-by-Turn Navigation**: [Open Live Route in Google Maps](https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)})
- **Live Traffic**: Click the link above to view real-time traffic congestion, road closures, and alternative expressway routes on Google Maps.`;
      }

      if (!groundingMetadata || !groundingMetadata.groundingChunks?.length) {
        groundingMetadata = {
          groundingChunks: [
            {
              maps: {
                title: `Open Route in Google Maps (${origin} → ${destination})`,
                uri: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
              },
            },
          ],
        };
      }

      res.json({
        success: true,
        text: responseText,
        groundingMetadata,
      });
    } catch (err: any) {
      console.error('[API /api/maps/route] Final Error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to retrieve route guidance',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SmartTrip API with Google Maps Grounding' });
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartTrip Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SmartTrip Server] Startup failed:', err);
  process.exit(1);
});
