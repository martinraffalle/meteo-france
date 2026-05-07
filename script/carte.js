
  const btn = document.querySelector('.menu-toggle');
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');



  btn.onclick = () => {
    menu.classList.add('active');
    overlay.classList.add('active');
  };

  overlay.onclick = () => {
    menu.classList.remove('active');
    overlay.classList.remove('active');
  };

const CITIES = {
  "Île-de-France": [
    { name:"Paris", lat:48.8566, lng:2.3522 },
    { name:"Versailles", lat:48.8014, lng:2.1301 },
    { name:"Boulogne-B.", lat:48.8353, lng:2.2408 }
  ],
  "Auvergne-Rhône-Alpes": [
    { name:"Lyon", lat:45.7640, lng:4.8357 },
    { name:"Grenoble", lat:45.1885, lng:5.7245 },
    { name:"Clermont-Fd", lat:45.7772, lng:3.0870 },
    { name:"Saint-Étienne", lat:45.4397, lng:4.3872 }
  ],
  "Provence-Alpes-Côte d'Azur": [
    { name:"Marseille", lat:43.2965, lng:5.3698 },
    { name:"Nice", lat:43.7102, lng:7.2620 },
    { name:"Toulon", lat:43.1242, lng:5.9280 },
    { name:"Aix-en-P.", lat:43.5297, lng:5.4474 }
  ],
  "Occitanie": [
    { name:"Toulouse", lat:43.6047, lng:1.4442 },
    { name:"Montpellier", lat:43.6108, lng:3.8767 },
    { name:"Nîmes", lat:43.8367, lng:4.3601 }
  ],
  "Nouvelle-Aquitaine": [
    { name:"Bordeaux", lat:44.8378, lng:-0.5792 },
    { name:"Limoges", lat:45.8336, lng:1.2611 },
    { name:"Pau", lat:43.2951, lng:-0.3708 }
  ],
  "Grand Est": [
    { name:"Strasbourg", lat:48.5734, lng:7.7521 },
    { name:"Metz", lat:49.1193, lng:6.1757 },
    { name:"Reims", lat:49.2583, lng:4.0317 },
    { name:"Nancy", lat:48.6921, lng:6.1844 }
  ],
  "Hauts-de-France": [
    { name:"Lille", lat:50.6292, lng:3.0573 },
    { name:"Amiens", lat:49.8941, lng:2.2958 },
    { name:"Dunkerque", lat:51.0347, lng:2.3765 }
  ],
  "Normandie": [
    { name:"Rouen", lat:49.4432, lng:1.0993 },
    { name:"Caen", lat:49.1829, lng:-0.3707 },
    { name:"Le Havre", lat:49.4944, lng:0.1079 }
  ],
  "Bretagne": [
    { name:"Rennes", lat:48.1173, lng:-1.6778 },
    { name:"Brest", lat:48.3904, lng:-4.4861 },
    { name:"Quimper", lat:47.9960, lng:-4.1039 }
  ],
  "Pays de la Loire": [
    { name:"Nantes", lat:47.2184, lng:-1.5536 },
    { name:"Le Mans", lat:47.9960, lng:0.1966 },
    { name:"Angers", lat:47.4784, lng:-0.5632 }
  ],
  "Centre-Val de Loire": [
    { name:"Orléans", lat:47.9029, lng:1.9039 },
    { name:"Tours", lat:47.3941, lng:0.6848 },
    { name:"Bourges", lat:47.0810, lng:2.3988 }
  ],
  "Bourgogne-Franche-Comté": [
    { name:"Dijon", lat:47.3220, lng:5.0415 },
    { name:"Besançon", lat:47.2378, lng:6.0241 },
    { name:"Belfort", lat:47.6397, lng:6.8630 }
  ],
  "Corse": [
    { name:"Ajaccio", lat:41.9192, lng:8.7386 },
    { name:"Bastia", lat:42.6976, lng:9.4507 }
  ]
};

const COLORS = [
  { min:-Infinity, max:0,  fill:'#93c5fd', label:'< 0' },
  { min:0,  max:5,  fill:'#60a5fa', label:'0–5' },
  { min:5,  max:10, fill:'#34d399', label:'5–10' },
  { min:10, max:15, fill:'#a3e635', label:'10–15' },
  { min:15, max:20, fill:'#fde047', label:'15–20' },
  { min:20, max:25, fill:'#fb923c', label:'20–25' },
  { min:25, max:Infinity, fill:'#ef4444', label:'> 25' },
];

function getColor(temp) {
  for (const c of COLORS) if (temp > c.min && temp <= c.max) return c.fill;
  return COLORS[0].fill;
}

const legend = document.getElementById('legend');
COLORS.forEach(c => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;';
  row.innerHTML = `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${c.fill};flex-shrink:0;"></span><span style="color:var(--color-text-secondary)">${c.label} °C</span>`;
  legend.appendChild(row);
});

const map = L.map('map', {
  maxBoundsViscosity: 0.9,
  minZoom: 5,
  maxZoom: 12,
  zoomControl: true
}).setView([46.6, 2.4], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '©OpenStreetMap ©CartoDB',
  noWrap: true,
  subdomains: 'abcd'
}).addTo(map);

const cityMarkersGroup = L.layerGroup().addTo(map);
let activeRegion = null;
const cityTempData = {};
const regionTempData = {};

function setProgress(p) {
  document.getElementById('loading-progress').style.width = p + '%';
}

async function fetchTemp(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=Europe%2FParis`;
  const r = await fetch(url);
  const d = await r.json();
  return Math.round(d.current.temperature_2m);
}

async function loadAllTemps() {
  const allCities = [];
  for (const [region, cities] of Object.entries(CITIES)) {
    cities.forEach(city => allCities.push({ region, city }));
  }

  let done = 0;
  const total = allCities.length;

  const BATCH = 6;
  for (let i = 0; i < allCities.length; i += BATCH) {
    const batch = allCities.slice(i, i + BATCH);
    await Promise.all(batch.map(async ({ region, city }) => {
      try {
        const temp = await fetchTemp(city.lat, city.lng);
        if (!cityTempData[region]) cityTempData[region] = {};
        cityTempData[region][city.name] = temp;
      } catch(e) {
        if (!cityTempData[region]) cityTempData[region] = {};
        cityTempData[region][city.name] = null;
      }
      done++;
      setProgress(Math.round((done / total) * 80));
    }));
  }

  for (const [region, cities] of Object.entries(CITIES)) {
    const temps = cities.map(c => cityTempData[region][c.name]).filter(t => t !== null);
    regionTempData[region] = temps.length ? Math.round(temps.reduce((a,b) => a+b, 0) / temps.length) : 15;
  }

  setProgress(100);
  setTimeout(() => {
    document.getElementById('loading-overlay').style.display = 'none';
  }, 300);
}

function showCitiesForRegion(regionName) {
  cityMarkersGroup.clearLayers();
  const cities = CITIES[regionName];
  if (!cities) return;

  cities.forEach(city => {
    const temp = cityTempData[regionName]?.[city.name];
    if (temp === null || temp === undefined) return;
    const color = getColor(temp);

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background:${color};
        border:2px solid #fff;
        border-radius:50%;
        width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
        flex-direction:column;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        line-height:1.1;text-align:center;
      ">
        <span style="font-size:8px;font-weight:600;color:#1a1a1a;">${city.name.length > 7 ? city.name.substring(0,6)+'.' : city.name}</span>
        <span style="font-size:12px;font-weight:700;color:#1a1a1a;">${temp}°</span>
      </div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([city.lat, city.lng], { icon });
    marker.bindTooltip(`<b>${city.name}</b><br>${temp} °C`, { sticky: true, opacity: 0.92 });
    cityMarkersGroup.addLayer(marker);
  });
}

async function init() {
  setProgress(5);
  const [geojsonRes] = await Promise.all([
    fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-version-simplifiee.geojson'),
    loadAllTemps()
  ]);
  setProgress(90);
  const data = await geojsonRes.json();

  const geojsonLayer = L.geoJSON(data, {
    style: function(feature) {
      const nom = feature.properties.nom;
      const temp = regionTempData[nom] ?? 15;
      return {
        color: '#ffffff',
        weight: 1.5,
        fillColor: getColor(temp),
        fillOpacity: 0.75
      };
    },
    onEachFeature: function(feature, layer) {
      const nom = feature.properties.nom;
      const temp = regionTempData[nom] ?? '?';

      layer.on({
        mouseover: function(e) {
          if (activeRegion !== nom) e.target.setStyle({ weight: 3, color: '#222', fillOpacity: 0.9 });
          const panel = document.getElementById('info-panel');
          document.getElementById('info-name').textContent = nom;
          document.getElementById('info-temp').textContent = `${temp} °C (moy. région)`;
          panel.style.display = 'block';
        },
        mouseout: function(e) {
          if (activeRegion !== nom) geojsonLayer.resetStyle(e.target);
          document.getElementById('info-panel').style.display = 'none';
        },
        click: function(e) {
          geojsonLayer.resetStyle();
          if (activeRegion === nom) {
            activeRegion = null;
            cityMarkersGroup.clearLayers();
            map.fitBounds(geojsonLayer.getBounds());
          } else {
            activeRegion = nom;
            e.target.setStyle({ weight: 3, color: '#222', fillOpacity: 0.95 });
            map.fitBounds(e.target.getBounds(), { padding: [60, 60] });
            showCitiesForRegion(nom);
          }
        }
      });

      layer.bindTooltip(`<b>${nom}</b><br>${temp} °C`, { sticky: true, opacity: 0.92 });
    }
  }).addTo(map);

  const bounds = geojsonLayer.getBounds();
  map.setMaxBounds(bounds.pad(0.15));
  map.fitBounds(bounds);
  setProgress(100);
  setTimeout(() => { document.getElementById('loading-overlay').style.display = 'none'; }, 300);
}

init().catch(err => {
  document.getElementById('loading-overlay').innerHTML = '<div style="padding:2rem;color:var(--color-text-secondary);text-align:center;">Erreur de chargement des données météo.</div>';
});







const bienvenue = document.querySelectorAll(".Bienvenue");
const sousTitre = document.querySelectorAll(".Sous-titre");

const isMobile = window.matchMedia("(max-width: 768px)").matches;

// 💻 PC animation
function animatePC(elements) {
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add("visible");
    }, index * 200);
  });
}

// 📱 Mobile animation
function animateMobile(elements) {
  function checkScroll() {
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();

      if (rect.top < window.innerHeight - 100) {
        el.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", checkScroll);
  checkScroll();
}

// 🚀 lancement propre
window.addEventListener("load", () => {

  if (isMobile) {
    animateMobile(bienvenue);
    animateMobile(sousTitre);
  } else {
    animatePC(bienvenue);
    animatePC(sousTitre);
  }

});

console.log("JS chargé");