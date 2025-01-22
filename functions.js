

/// Permet d'avoir une liste d'event autour de l'utilisateur
/// 
/// input :
///     type -> string du type de données Ex: 'cinema'
function getFilter(type) {
    const EARTH_RADIUS_KM = 6371; 

    // Calculer la distance entre deux points (Haversine) - merci Internet :)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const toRadians = angle => angle * Math.PI / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    // Filtre les données 
    return {
        ...geojsonData,
        features: geojsonData.features.filter(feature => {
            if (feature.properties.type === type) {
                const [lon, lat] = feature.geometry.coordinates;
                return haversineDistance(userY, userX, lat, lon) <= userRayon;
            }
            return false;
        })
    };
}

/// Permet de charger le fichier GeoJson avec l'ensemble des données
/// utilise le nom de fichier dans la variable fichierGeoNom
///
async function initGeoJsonFile() {
    try {
        const response = await fetch(fichierGeoNom);
        geojsonData = await response.json();
        console.log("merged.geojson chargé");
    } catch (error) {
        console.error("[Erreur] - initGeoJsonFile - chargement fichier GeoJSON:", error);
    }
}

function getDisplayOptions(type) {
    const options = {
        cinema: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/cinema.png",
                    iconSize: displayIconSize,
                    iconAnchor: displayIconAnchor,
                    popupAnchor: displayPopupAnchor,
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(`
                        <div>
                            <div>
                                <img src="${gobalUrl + '/images/cinema.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${cinemaColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">adresse : ${feature.properties.adresse}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Propriétaire : ${feature.properties.proprietaire}</p>
                        </div>
                    `);
                }
            },
        },
        jardin: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/jardin.png",
                    iconSize: displayIconSize,
                    iconAnchor: displayIconAnchor,
                    popupAnchor: displayPopupAnchor,
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom_jardin) {
                    let siteWebLinks = '';
                    
                    if (feature.properties.site_web) {
                        try {
                            const siteWebArray = JSON.parse(feature.properties.site_web);
                            if (Array.isArray(siteWebArray)) {
                                siteWebArray.forEach(url => {
                                    siteWebLinks += `<p style="margin: 0; font-size: 0.9em;">
                                                        <a href="${url}" target="_blank">site web</a>
                                                     </p>`;
                                });
                            }
                        } catch (e) {console.error("Erreur parsing :", e);}
                    }
            
                    // Tronquer la description si elle est trop longue
                    let description = feature.properties.description || '';
                    const MAX_DESCRIPTION_LENGTH = 100; // Limite des caractères avant tronquage
                    let truncatedDescription = description;
                    let readMoreButton = '';

                    if (description.length > MAX_DESCRIPTION_LENGTH) {
                        truncatedDescription = description.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
                        readMoreButton = `<button style="background: none; border: none; color: ${jardinColor}; cursor: pointer;" class="read-more">Lire plus</button>`;
                    }
                    
                    layer.bindPopup(`
                        <div>
                            <div>
                                <img src="${gobalUrl + '/images/jardin.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${jardinColor}; display: inline; vertical-align: middle;">${feature.properties.nom_jardin}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Adresse : ${feature.properties.adresse_complete}</p>
                            ${siteWebLinks}
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type de jardin : ${feature.properties.types_jadrin}</p>
                            <span class="description">${truncatedDescription}</span>
                            ${readMoreButton}
                        </div>
                    `);

                    layer.on('popupopen', () => {
                        const button = layer.getPopup().getElement().querySelector('.read-more');
                        if (button) {
                            button.addEventListener('click', () => {
                                const descriptionSpan = layer.getPopup().getElement().querySelector('.description');
                                if (descriptionSpan) {
                                    // Afficher la description complète
                                    descriptionSpan.textContent = feature.properties.description;
                                    button.textContent = 'Lire moins';
                                    button.addEventListener('click', () => {
                                        // Réduire à la description tronquée
                                        descriptionSpan.textContent = truncatedDescription;
                                        button.textContent = 'Lire plus';
                                    });
                                }
                            });
                        }
                    });
                }
            },
                       
            
        },
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


/// Permet de retirer le layer de la map
function removeMap(){
    const baseLayer = tileLayer;
    
    map.eachLayer(function(layer) {
        if (layer !== baseLayer) {
            map.removeLayer(layer);
        }
    });
    
    console.log("removeMap - layer remove")
}

/// Permet l'ajout de données à la map
/// 
/// input :
///     type -> string du type de données Ex: 'cinema'
/// necessite :
///     La position de l'utilisateur (userX et userY)
///     Le rayon de recherche (userRayon)
async function addElementToMap(type){
    console.log("addElementToMap - start - type:",type);
    if (userX !== null && userY !== null && userRayon !== null && type !== null){
    const filteredData = getFilter(type); // type de filtrage
    const displayOptions = getDisplayOptions(type); // pour avoir un affichage diff pour chaque type.

    geojsonLayer = L.geoJSON(filteredData, {
        ...displayOptions,
    }).addTo(map);

    }else{
        console.log("[Erreur] - addElementToMap - faild - l'une des données est nulle");
        return;
    }
    console.log("addElementToMap - end - type:",type);
}




// fonction test (temporaire) :
async function showCinemas() {
    addElementToMap('cinema');
}

async function showJardins() {
    addElementToMap('jardin');
}

