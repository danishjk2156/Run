import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers } from "lucide-react";

// Vibrant anime aura palette assigned to runners in order of appearance
const RUNNER_COLORS = [
  "#ffd700", // Super Syana Gold
  "#00e5ff", // Awakened Cyan
  "#ff3d00", // Kaioken Crimson
  "#a855f7", // Syana 2 Purple
  "#10b981", // Touch Grass Emerald
  "#ec4899", // God Mode Pink
  "#f97316", // Solar Orange
  "#38bdf8", // Sky Blue
];

export default function Map({ members = [], userLocation = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const localTrailsRef = useRef(new Map());

  const maptilerKey = import.meta.env.VITE_MAPTILER_KEY?.trim();
  const [mapStyle, setMapStyle] = useState(maptilerKey ? "outdoor-v2" : "fallback");

  // Determine MapLibre style JSON
  const getStyleDefinition = (styleType) => {
    if (maptilerKey) {
      return `https://api.maptiler.com/maps/${styleType}/style.json?key=${maptilerKey}`;
    }

    // Default zero-key OpenStreetMap / CartoDB fallback
    return {
      version: 8,
      sources: {
        "carto-dark": {
          type: "raster",
          tiles: [
            "https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors © CARTO",
        },
      },
      layers: [
        {
          id: "carto-dark-layer",
          type: "raster",
          source: "carto-dark",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  // Ensure GeoJSON source and glowing trail layers exist on current style
  const ensureTrailLayers = (mapInstance) => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) return;

    if (!mapInstance.getSource("runner-trails")) {
      mapInstance.addSource("runner-trails", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    // Ambient glow layer
    if (!mapInstance.getLayer("runner-trails-glow")) {
      mapInstance.addLayer({
        id: "runner-trails-glow",
        type: "line",
        source: "runner-trails",
        paint: {
          "line-width": 8,
          "line-color": ["get", "color"],
          "line-opacity": 0.4,
          "line-blur": 3,
        },
      });
    }

    // Crisp inner core line
    if (!mapInstance.getLayer("runner-trails-core")) {
      mapInstance.addLayer({
        id: "runner-trails-core",
        type: "line",
        source: "runner-trails",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": 4,
          "line-color": ["get", "color"],
          "line-opacity": 0.95,
        },
      });
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    let initialCenter = [77.2167, 28.6315];
    if (userLocation && userLocation.lon && userLocation.lat) {
      initialCenter = [userLocation.lon, userLocation.lat];
    } else {
      const firstActive = members.find((m) => m.lon != null && m.lat != null);
      if (firstActive) {
        initialCenter = [firstActive.lon, firstActive.lat];
      }
    }

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: getStyleDefinition(mapStyle),
        center: initialCenter,
        zoom: 14,
        pitch: 25,
      });

      map.current.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.current.on("load", () => {
        if (map.current) {
          ensureTrailLayers(map.current);
          map.current.resize();
        }
      });

      map.current.on("styledata", () => {
        if (map.current) {
          ensureTrailLayers(map.current);
        }
      });
    } catch (err) {
      console.error("Error creating MapLibre instance:", err);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle MapTiler style toggling
  const switchStyle = (newStyle) => {
    if (!map.current || !maptilerKey) return;
    setMapStyle(newStyle);
    map.current.setStyle(`https://api.maptiler.com/maps/${newStyle}/style.json?key=${maptilerKey}`);
  };

  // Sync runner markers and polyline trails
  useEffect(() => {
    if (!map.current) return;

    map.current.resize();
    ensureTrailLayers(map.current);

    const activeMembers = members.filter((m) => m.lat != null && m.lon != null);
    const trailFeatures = [];

    activeMembers.forEach((member, index) => {
      const color = RUNNER_COLORS[index % RUNNER_COLORS.length];

      // Maintain trail points (merging server trail + local coordinates)
      let trail = localTrailsRef.current.get(member.id);
      if (!trail) {
        trail = member.trail && member.trail.length > 0 ? [...member.trail] : [];
        localTrailsRef.current.set(member.id, trail);
      } else if (member.trail && member.trail.length > trail.length) {
        // Sync newer points from server
        trail = [...member.trail];
        localTrailsRef.current.set(member.id, trail);
      }

      // Append latest coordinate if moved
      const lastPoint = trail[trail.length - 1];
      if (!lastPoint || lastPoint[0] !== member.lon || lastPoint[1] !== member.lat) {
        trail.push([member.lon, member.lat]);
      }

      // Build GeoJSON line if at least 2 points
      if (trail.length >= 2) {
        trailFeatures.push({
          type: "Feature",
          properties: {
            id: member.id,
            name: member.name,
            color: color,
          },
          geometry: {
            type: "LineString",
            coordinates: trail,
          },
        });
      }

      // Marker rendering
      let marker = markersRef.current.get(member.id);

      if (!marker) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center group cursor-pointer transition-transform duration-300";
        el.innerHTML = `
          <div class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/90 mb-1 shadow-lg whitespace-nowrap border" style="color: ${color}; border-color: ${color}88;">
            ${member.name} (${member.km.toFixed(1)}km)
          </div>
          <div class="w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-xs" style="background: radial-gradient(circle, ${color} 0%, #000000 100%);">
            🏃
          </div>
        `;

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([member.lon, member.lat])
          .addTo(map.current);

        markersRef.current.set(member.id, marker);
      } else {
        marker.setLngLat([member.lon, member.lat]);
        const label = marker.getElement().querySelector("div");
        if (label) {
          label.innerText = `${member.name} (${member.km.toFixed(1)}km)`;
        }
      }
    });

    // Push all trails to MapLibre GeoJSON layer
    if (map.current.getSource("runner-trails")) {
      map.current.getSource("runner-trails").setData({
        type: "FeatureCollection",
        features: trailFeatures,
      });
    }

    // Cleanup disconnected members
    const currentMemberIds = new Set(members.map((m) => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentMemberIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Auto-center or fit bounds
    if (userLocation && userLocation.lon && userLocation.lat) {
      map.current.easeTo({
        center: [userLocation.lon, userLocation.lat],
        duration: 800,
      });
    } else if (activeMembers.length > 0) {
      const first = activeMembers[0];
      map.current.easeTo({
        center: [first.lon, first.lat],
        duration: 800,
      });
    }
  }, [members, userLocation]);

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-2xl overflow-hidden border border-zinc-700/60 shadow-2xl bg-zinc-950">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />

      {/* MapTiler Style Switcher */}
      {maptilerKey && (
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 text-[10px] font-bold">
          <Layers className="w-3 h-3 text-amber-400 ml-1" />
          <button
            onClick={() => switchStyle("outdoor-v2")}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapStyle === "outdoor-v2" ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Trails
          </button>
          <button
            onClick={() => switchStyle("dataviz-dark")}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapStyle === "dataviz-dark" ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => switchStyle("hybrid")}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapStyle === "hybrid" ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
        </div>
      )}
    </div>
  );
}
