"use strict";


window.onload = async () => {
    let map = L.map('map', {
        center: [48.8500, 2.3500],
        zoom: 10.6
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OSM</a> B.Rodrigues ─ C.Guerin'
    }).addTo(map);

    document.getElementById('searchInput').addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            const cityName = document.getElementById('searchInput').value;

            if (cityName) {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`);
                const data = await response.json();

                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 12);
                } else {
                    alert('Ville introuvable. Vérifie l’orthographe.');
                }
            } else {
                alert('Entre un nom de ville.');
            }
        }
    });
};