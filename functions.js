

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

/// Permet d'avoir un affichage pour chaque type
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
                    
                    // avoir plusieurs liens 
                    if (feature.properties.site_web) {
                        try {
                            const siteWebArray = JSON.parse(feature.properties.site_web);
                            
                            if (Array.isArray(siteWebArray)) {
                                siteWebArray.forEach(url => {
                                    siteWebLinks += `<p style="margin: 0; font-size: 0.9em;">
                                                        <a href="${url}" target="_blank">site web</a>
                                                     </p>`;
                                });
                            } else {
                                console.error("site_web n'est pas un tableau:", feature.properties.site_web);
                            }
                        } catch (e) {
                            console.error("Erreur lors du parsing de site_web:", e);
                        }
                    }
            
                    // description trop longue
                    let description = feature.properties.description || '';
                    const MAX_DESCRIPTION_LENGTH = 200;
                    let truncatedDescription = description;
                    let readMoreButton = '';
                    if (description.length > MAX_DESCRIPTION_LENGTH) {
                        truncatedDescription = description.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
                        readMoreButton = `<button style="background: none; border: none; color: ${btnColor}; cursor: pointer;" class="read-more">Lire plus</button>`;
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
            
                    // Event lire plus (merci internet)
                    layer.on('popupopen', () => {
                        const button = layer.getPopup().getElement().querySelector('.read-more');
                        if (button) {
                            button.addEventListener('click', () => {
                                const descriptionSpan = layer.getPopup().getElement().querySelector('.description');
                                if (descriptionSpan) {
                                    // Si le texte est tronqué, on l'affiche en entier
                                    if (button.textContent === 'Lire plus') {
                                        descriptionSpan.textContent = feature.properties.description;
                                        button.textContent = 'Lire moins';
                                    } else {
                                        // Sinon, on tronque de nouveau le texte
                                        descriptionSpan.textContent = truncatedDescription;
                                        button.textContent = 'Lire plus';
                                    }
                                }
                            });
                        }
                    });
                }
            },
            
                       
            
        },
        musee: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/musee.png",
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
                                <img src="${gobalUrl + '/images/musee.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${cinemaColor}; display: inline; vertical-align: middle;">${feature.properties.nom.charAt(0).toUpperCase() + feature.properties.nom.slice(1)}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Adresse : ${feature.properties.adresse}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Téléphone : ${feature.properties.tel}</p>
                            <p style="margin: 0; font-size: 0.9em;">
                                <a href="${"https://"+feature.properties.site_web}" target="_blank">Site web</a>
                            </p>
                        </div>
                    `);
                }
            },
        },
        ski: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/ski.png",
                    iconSize: displayIconSize,
                    iconAnchor: displayIconAnchor,
                    popupAnchor: displayPopupAnchor,
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    // description trop longue
                    let description = feature.properties.description || '';
                    const MAX_DESCRIPTION_LENGTH = 200;
                    let truncatedDescription = description;
                    let readMoreButton = '';
                    if (description.length > MAX_DESCRIPTION_LENGTH) {
                        truncatedDescription = description.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
                        readMoreButton = `<button style="background: none; border: none; color: ${btnColor}; cursor: pointer;" class="read-more">Lire plus</button>`;
                    }

                    // pour le moment pas de description car elles sont très mauvaises
                    layer.bindPopup(`
                        <div>
                            <div>
                                <img src="${gobalUrl + '/images/ski.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${skiColor}; display: inline; vertical-align: middle;">${feature.properties.nom.charAt(0).toUpperCase() + feature.properties.nom.slice(1)}</h3>
                            </div>
                            
                        </div>
                    `);

                    // Event lire plus (merci internet)
                    layer.on('popupopen', () => {
                        const button = layer.getPopup().getElement().querySelector('.read-more');
                        if (button) {
                            button.addEventListener('click', () => {
                                const descriptionSpan = layer.getPopup().getElement().querySelector('.description');
                                if (descriptionSpan) {
                                    // Si le texte est tronqué, on l'affiche en entier
                                    if (button.textContent === 'Lire plus') {
                                        descriptionSpan.textContent = feature.properties.description;
                                        button.textContent = 'Lire moins';
                                    } else {
                                        // Sinon, on tronque de nouveau le texte
                                        descriptionSpan.textContent = truncatedDescription;
                                        button.textContent = 'Lire plus';
                                    }
                                }
                            });
                        }
                    });
                }
            },
        },
        attraction: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/attraction.png",
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
                                <img src="${gobalUrl + '/images/attraction.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${attractionColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                            </div>
                        </div>
                    `);
                }
            },
        },
        equipement: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/equipement.png",
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
                                <img src="${gobalUrl + '/images/equipement.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${equipementColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Ville : ${feature.properties.departement} - ${feature.properties.commune}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type équipement : ${feature.properties.famille_equipement}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Zone : ${feature.properties.zone}</p>

                        </div>
                    `);
                }
            },
        },
        festival: {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: gobalUrl+"/images/festival.png",
                    iconSize: displayIconSize,
                    iconAnchor: displayIconAnchor,
                    popupAnchor: displayPopupAnchor,
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                console.log(feature.properties && feature.properties.nom );
                if (feature.properties) {
                    layer.bindPopup(`
                        <div>
                            <div>
                                <img src="${gobalUrl + '/images/festival.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${festivalColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Ville : ${feature.properties.departement} - ${feature.properties.commune}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type festival : ${feature.properties.types_festival}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Periode : ${feature.properties.periode}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Création : ${feature.properties.annee_creation}</p>
                            <p style="margin: 0; font-size: 0.9em;">
                                <a href="${feature.properties.site_web}" target="_blank">Site web</a>
                            </p>
                        </div>
                    `);
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

async function showMusees() {
    addElementToMap('musee');
}

async function showAttractions() {
    addElementToMap('attraction');
}

async function showSki() {
    addElementToMap('ski');
}

async function showFestivals() {
    addElementToMap('festival');
}

async function showEquipements() {
    addElementToMap('equipement');
}
