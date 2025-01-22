function getDisplayOptions(type) {
    const options = {
        cinema: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/cinema.png",
                    iconSize: [25, 25],
                    iconAnchor: [12, 25],
                    popupAnchor: [0, -25],
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(`
                        <div>
                            <h3 style="margin: 0; color: #f00;">${feature.properties.nom}</h3>
                            <p style="margin: 0; font-size: 0.9em; color: #555;">Pomme</p>
                        </div>
                    `);
                }
            },
        },
        jardin: {
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: '#77dd77',
                    color: '#2a6b2a',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(`
                        <div>
                            <h3 style="margin: 0; color: #2a6b2a;">${feature.properties.nom}</h3>
                        </div>
                    `);
                }
            },
        },
        // Ajoutez d'autres types ici avec leurs propres structures
    };

    // Defaut :
    return options[type] || {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng),
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.nom) {
                layer.bindPopup(`<strong>${feature.properties.nom}</strong><br>Type: ${feature.properties.type}`);
            }
        },
    };
}
