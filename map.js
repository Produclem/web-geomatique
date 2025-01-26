"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    // fichier avec l'ensemble des données 
    const fichierGeoNom = 'merged.geojson';

    const baseUrl = window.location.origin;

    // position de l'utilisateur (par defaut sur paris)
    if (localStorage.getItem('userX') === null || localStorage.getItem('userY') === null) {
        localStorage.setItem("userY",48.8566);
        localStorage.setItem('userX',2.3522);
        localStorage.setItem("userRayon",15);
    }
    let geojsonData;
    let geojsonLayer;

    let geojsonLayers = {};

    // rayon de recherche de l'utilisateur en Km (pas defaut à 40km)
    let map = L.map('map').setView([localStorage.getItem("userY"), localStorage.getItem("userX")], 12);

    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
    }).addTo(map);

    // display :
    const displayIconSize = [22, 22];
    const displayIconAnchor = [12, 25];
    const displayPopupAnchor = [0, -25];

    const cinemaColor = "#f00"
    const jardinColor = "0f0"
    const museeColor = "#f0a80e"
    const skiColor ="#34d8eb"
    const attractionColor = "#aa65c7"
    const equipementColor = "#7da18f"
    const festivalColor = "#c44c27"

    const greyColor = "#555"
    const btnColor = "00f"

    /* === AJOUT DU LOADER === */
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `<img src="images/loader2.gif" alt="Chargement...">`;
    document.body.appendChild(loader);

    /* === AJOUT DU POINTEUR === */
    const IconPointeur = L.icon({
        iconUrl: baseUrl+"/images/pointer.png",
        iconSize: [displayIconSize[0]+5,displayIconSize[1]+5],  
        iconAnchor: displayIconAnchor,
        popupAnchor: displayPopupAnchor  
    });
    const pointeur = document.getElementById('pointer');
    // pointer.style.cursor = "grab";
    let displayPointeur;
    let pointer_on = false;
    pointeur.addEventListener('click', () => {
        if(!pointer_on){
            pointer_on = true;
            displayPointeur = L.marker([localStorage.getItem("userY"), localStorage.getItem("userX")], { icon: IconPointeur, draggable: true }).addTo(map);

            displayPointeur.on('dragend', (event) => {
                const position = event.target.getLatLng();
                console.log("pointeur nouvelle position de recherche ", position);
                localStorage.setItem("userX", position.lng);
                localStorage.setItem("userY", position.lat);
                updateDisplayActivity();
                populateActivities();
            });

        }
        else{
            map.setView([localStorage.getItem("userY"),localStorage.getItem("userX")],map.getZoom());
        }
        
    });    
    /* === FONCTIONS UTILITAIRES === */
    // Calculer la distance entre deux points (Haversine) - merci Internet :)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const EARTH_RADIUS_KM = 6371; 
        const toRadians = angle => angle * Math.PI / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }
    /// Permet d'avoir une liste d'event autour de l'utilisateur
    /// 
    /// input :
    ///     type -> string du type de données Ex: 'cinema'
    function getFilter(type) {
        if(type === "cinema" || type === "jardin" ||type === "musee" ||type === "ski" ||type === "attraction" ||type === "festival"){
           return {
                ...geojsonData,
                features: geojsonData.features.filter(feature => {
                    if (feature.properties.type === type) {
                        const [lon, lat] = feature.geometry.coordinates;
                        return haversineDistance(localStorage.getItem('userY'), localStorage.getItem('userX'), lat, lon) <= localStorage.getItem('userRayon');
                    }
                    return false;
                })
            }; 
        }else{// c'est un équipement
            return getFilterEquipement(type);
        }
    }

    /// Permet d'avoir les équipements d'une certaine catégorie
    /// input :
    ///     typeEquipement -> string de types_equipement Ex : "Aire d'atterrissage"
    function getFilterEquipement(typeEquipement){
        return{
            ...geojsonData,
            features: geojsonData.features.filter(feature =>{
                if(feature.properties.type == "equipement" && feature.properties.types_equipement === typeEquipement){
                    const [lon, lat] = feature.geometry.coordinates;
                    return haversineDistance(localStorage.getItem('userY'), localStorage.getItem('userX'), lat, lon) <= localStorage.getItem('userRayon');                    
                }
            })
        }
    }

    /// Permet de charger le fichier GeoJson avec l'ensemble des données
    /// utilise le nom de fichier dans la variable fichierGeoNom
    ///
    async function initGeoJsonFile() {
        try {
            const response = await fetch(fichierGeoNom);
            geojsonData = await response.json();
            console.log("✅ ─ Fichier GeoJSON chargé avec succès.");
            populateActivities();
        } catch (error) {
            console.error("Erreur lors du chargement du fichier GeoJSON :", error);
        }
    }

    /// Permet d'avoir un affichage pour chaque type
    function getDisplayOptions(type) {
        const options = {
            cinema: {
                pointToLayer: (feature, latlng) => {
                    const cinemaIcon = L.icon({
                        iconUrl: baseUrl+"/images/cinema.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                        layer.bindPopup(`
                            <div>
                                <div>
                                    <img src="${baseUrl + '/images/cinema.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${cinemaColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                                </div>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">adresse : ${feature.properties.adresse}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Propriétaire : ${feature.properties.proprietaire}</p>
                                <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                            </div>
                        `);
                    }
                },
            },
            jardin: {
                pointToLayer: (feature, latlng) => {
                    const cinemaIcon = L.icon({
                        iconUrl: baseUrl+"/images/jardin.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
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
                                    <img src="${baseUrl + '/images/jardin.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${jardinColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                                </div>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Adresse : ${feature.properties.adresse_complete}</p>
                                ${siteWebLinks}
                                <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
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
                        iconUrl: baseUrl+"/images/musee.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                        layer.bindPopup(`
                            <div>
                                <div>
                                    <img src="${baseUrl + '/images/musee.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${cinemaColor}; display: inline; vertical-align: middle;">${feature.properties.nom.charAt(0).toUpperCase() + feature.properties.nom.slice(1)}</h3>
                                </div>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Adresse : ${feature.properties.adresse}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Téléphone : ${feature.properties.tel}</p>
                                <p style="margin: 0; font-size: 0.9em;">
                                    <a href="${"https://"+feature.properties.site_web}" target="_blank">Site web</a>
                                </p>
                                <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                            </div>
                        `);
                    }
                },
            },
            ski: {
                pointToLayer: (feature, latlng) => {
                    const cinemaIcon = L.icon({
                        iconUrl: baseUrl+"/images/ski.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
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
                                    <img src="${baseUrl + '/images/ski.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${skiColor}; display: inline; vertical-align: middle;">${feature.properties.nom.charAt(0).toUpperCase() + feature.properties.nom.slice(1)}</h3>
                                    <br><a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
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
                        iconUrl: baseUrl+"/images/attraction.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                        layer.bindPopup(`
                            <div>
                                <div>
                                    <img src="${baseUrl + '/images/attraction.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${attractionColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                                    <br><a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                                </div>
                            </div>
                        `);
                    }
                },
            },
            equipement: {
                pointToLayer: (feature, latlng) => {
                    const cinemaIcon = L.icon({
                        iconUrl: baseUrl+"/images/equipement.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                        layer.bindPopup(`
                            <div>
                                <div>
                                    <img src="${baseUrl + '/images/equipement.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${equipementColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                                </div>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Ville : ${feature.properties.departement} - ${feature.properties.commune}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type équipement : ${feature.properties.famille_equipement}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Zone : ${feature.properties.zone}</p>
                                <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                            </div>
                        `);
                    }
                },
            },
            festival: {
                pointToLayer: (feature, latlng) => {
                    const cinemaIcon = L.icon({
                        iconUrl: baseUrl+"/images/festival.png",
                        iconSize: displayIconSize,
                        iconAnchor: displayIconAnchor,
                        popupAnchor: displayPopupAnchor,
                    });
                    return L.marker(latlng, { icon: cinemaIcon });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nom) {
                        const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                        layer.bindPopup(`
                            <div>
                                <div>
                                    <img src="${baseUrl + '/images/festival.png'}" width="20" height="20" style="vertical-align: middle;">
                                    <h3 style="margin: 0; color: ${festivalColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                                </div>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Ville : ${feature.properties.departement} - ${feature.properties.commune}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type festival : ${feature.properties.types_festival}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Periode : ${feature.properties.periode}</p>
                                <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Création : ${feature.properties.annee_creation}</p>
                                <p style="margin: 0; font-size: 0.9em;">
                                    <a href="${feature.properties.site_web}" target="_blank">Site web</a>
                                </p>
                                <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                            </div>
                        `);
                    }
                },
            },
        };

        // Defaut :
        return options[type] || {
            pointToLayer: (feature, latlng) => {
                const cinemaIcon = L.icon({
                    iconUrl: baseUrl+"/images/equipement.png",
                    iconSize: displayIconSize,
                    iconAnchor: displayIconAnchor,
                    popupAnchor: displayPopupAnchor,
                });
                return L.marker(latlng, { icon: cinemaIcon });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    const googleMapsLink = `https://www.google.com/maps/dir/${localStorage.getItem('userY')},${localStorage.getItem('userX')}/${feature.geometry.coordinates[1]},${feature.geometry.coordinates[0]}`;
                    layer.bindPopup(`
                        <div>
                            <div>
                                <img src="${baseUrl + '/images/equipement.png'}" width="20" height="20" style="vertical-align: middle;">
                                <h3 style="margin: 0; color: ${equipementColor}; display: inline; vertical-align: middle;">${feature.properties.nom}</h3>
                            </div>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Ville : ${feature.properties.departement} - ${feature.properties.commune}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Type équipement : ${feature.properties.famille_equipement}</p>
                            <p style="margin: 0; font-size: 0.9em; color: ${greyColor};">Zone : ${feature.properties.zone}</p>
                            <a href="${googleMapsLink}" target="_blank" style="color: blue; text-decoration: underline;">Itinéraire Google Maps</a>
                        </div>
                    `);
                }
            },
        };
    }

    /// Permet de retirer le layer de la map
    function removeMap() {
        const baseLayer = tileLayer;
    
        map.eachLayer(function(layer) {
            if (layer !== baseLayer) {
                map.removeLayer(layer);
            }
        });
        if(displayPointeur !== undefined){displayPointeur.addTo(map);}
        console.log("Map clear")
    }

    /// Permet l'ajout de données à la map
    /// 
    /// input :
    ///     type -> string du type de données Ex: 'cinema'
    /// necessite :
    ///     La position de l'utilisateur (userX et userY)
    ///     Le rayon de recherche (userRayon)
    async function addElementToMap(type) {
        if (localStorage.getItem('userX') !== null && localStorage.getItem('userY') !== null && localStorage.getItem('userRayon') !== null && type !== null) {
            const filteredData = getFilter(type);
            const displayOptions = getDisplayOptions(type);
            console.log("✅ ─ \x1b[32m" + type + "\x1b[0m ajouté à la map.");
            if (geojsonLayers[type]) {
                map.removeLayer(geojsonLayers[type]);
            }
            geojsonLayers[type] = L.geoJSON(filteredData, {
                ...displayOptions,
            }).addTo(map);
        } else {
            console.log("[Erreur] - addElementToMap - faild - l'une des données est nulle");
            return;
        }
    }

    function updateActivityCount() {
        const selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        const simpleActivities = selectedActivities.filter(activity =>
            ['ski', 'musee', 'jardin', 'festival', 'cinema', 'attraction'].includes(activity)
        );
        const equipmentActivities = selectedActivities.filter(activity =>
            !['ski', 'musee', 'jardin', 'festival', 'cinema', 'attraction'].includes(activity)
        );

        const nbSimple = simpleActivities.length;
        const nbEquipments = equipmentActivities.length;
        //console.log(nbSimple, nbEquipments);

        const nbActivitesDiv = document.getElementById('nbActivites');
        if (nbActivitesDiv) {
            nbActivitesDiv.innerHTML = `<b>${nbSimple}</b> activités et <b>${nbEquipments}</b> équipements sportifs sont sélectionnés.`;
        }
    }

    // Ajoute une activité selectionnée au Local Storage
    function addActivityToLocalStorage(activity) {
        let selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        if (!selectedActivities.includes(activity)) {
            selectedActivities.push(activity);
            localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
        }
        updateActivityCount();
        updateDisplayActivity();
        populateActivities();
    }

    /// Permet de mettre à jour la carte selon les activités sélectionnées
    /// necessite:
    ///     les types d'actitivés sélectionnées doivent être dans le localStorage
    function updateDisplayActivity(){
        removeMap();
        let selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        selectedActivities.forEach(type => {
            addElementToMap(type);
        });
    }

    // Supprime une activité déselectionnée du Local Storage
    function removeActivityFromLocalStorage(activity) {
        let selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        selectedActivities = selectedActivities.filter(act => act !== activity);
        localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
        updateActivityCount();
        updateDisplayActivity();
        populateActivities();
    }

    // Récupère toutes les activités sélectionnées sur le localstorage
    function getSelectedActivities() {
        return JSON.parse(localStorage.getItem('selectedActivities')) || [];
    }

    function attachSubItemToggleEvent() {
        document.querySelectorAll('.child-toggle').forEach(toggle => {
            toggle.addEventListener('click', event => {
                event.stopPropagation();
                const subItem = toggle.closest('.accordion-subitem');
                const subContent = subItem.querySelector('.accordion-subcontent');

                if (subItem.classList.contains('open')) {
                    subItem.classList.remove('open');
                    subContent.style.maxHeight = null;
                } else {
                    subItem.classList.add('open');
                    subContent.style.maxHeight = subContent.scrollHeight + 'px';
                }

                // Gérer la rotation de la flèche uniquement pour le sous-menu
                const arrow = toggle.querySelector('.arrow-icon');
                arrow.style.transform = subItem.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        });
    }


    function populateActivities() {
        const selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        const userX = parseFloat(localStorage.getItem('userX')) || 2.3522;
        const userY = parseFloat(localStorage.getItem('userY')) || 48.8566;
        const userRayon = parseFloat(localStorage.getItem('userRayon')) || 8;

        const accordionItems = document.querySelectorAll('.accordion-item');
        accordionItems.forEach(item => {
            const category = item.dataset.category;
            const content = item.querySelector('.accordion-content');
            content.innerHTML = '';

            if (selectedActivities.includes(category)) {
                const filteredData = geojsonData.features.filter(feature => {
                    const [lon, lat] = feature.geometry.coordinates;
                    const distance = haversineDistance(userY, userX, lat, lon);
                    return (
                        distance <= userRayon &&
                        feature.properties.type.toLowerCase() === category.toLowerCase()
                    );
                });

                if (filteredData.length > 0) {
                    filteredData.forEach(feature => {
                        const activityHTML = `
                    <div class="activity">
                        <div class="activity_principal">
                            <div class="activity_title">${feature.properties.nom}</div>
                            <div class="activity_place">${feature.properties.commune || 'Lieu inconnu'}</div>
                        </div>
                        <div class="activity_distance">à ${haversineDistance(userY, userX, feature.geometry.coordinates[1], feature.geometry.coordinates[0]).toFixed(2)} km</div>
                    </div>
                `;
                        content.innerHTML += activityHTML;
                    });
                } else {
                    content.innerHTML = `<p>Aucune activité "${category}" n'existe dans ce périmètre.</p>`;
                }
            } else {
                content.innerHTML = `<p>Vous n'avez pas sélectionné d'activités "${category}".</p>`;
            }
        });

        // Gestion des équipements sportifs
        const equipmentsContent = document.querySelector('.accordion-item[data-category="equipements"] .accordion-content');
        equipmentsContent.innerHTML = '';

        const selectedEquipments = selectedActivities.filter(activity => {
            return !['cinema', 'musee', 'jardin', 'festival', 'ski', 'attraction'].includes(activity.toLowerCase());
        });

        selectedEquipments.forEach(equipement => {
            const filteredEquipments = geojsonData.features.filter(feature => {
                const [lon, lat] = feature.geometry.coordinates;
                const distance = haversineDistance(userY, userX, lat, lon);
                return (
                    distance <= userRayon &&
                    feature.properties.types_equipement &&
                    feature.properties.types_equipement.toLowerCase() === equipement.toLowerCase()
                );
            });

            if (filteredEquipments.length > 0) {
                const subItemHTML = `
            <div class="accordion-subitem">
                <div class="accordion-subheader child-toggle">
                    <span class="subitem-title">${equipement}</span>
                    <div class="accordion-toggle">
                        <img src="images/arrow_down.png" class="arrow-icon" alt="Toggle">
                    </div>
                </div>
                ${filteredEquipments.map(feature => `
                    <div class="accordion-subcontent">
                        <div class="activity">
                            <div class="activity_principal">
                                <div class="activity_title">${feature.properties.nom}</div>
                                <div class="activity_place">${feature.properties.commune || 'Lieu inconnu'}</div>
                            </div>
                            <div class="activity_distance">à ${haversineDistance(userY, userX, feature.geometry.coordinates[1], feature.geometry.coordinates[0]).toFixed(2)} km</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
                equipmentsContent.innerHTML += subItemHTML;
            }
        });

        attachSubItemToggleEvent();
        centerMapOnActivity();
    }

    function centerMapOnActivity() {
        const activityElements = document.querySelectorAll('.activity');
        activityElements.forEach(activity => {
            activity.addEventListener('click', () => {
                const activityTitle = activity.querySelector('.activity_title').textContent;

                const activityType = activity.closest('.accordion-item').dataset.category;
                const matchingFeature = geojsonData.features.find(feature =>
                    feature.properties.nom === activityTitle
                );

                if (matchingFeature) {
                    const [lon, lat] = matchingFeature.geometry.coordinates;
                    map.setView([lat, lon], 14);

                    Object.values(geojsonLayers).forEach(layerGroup => {
                        layerGroup.eachLayer(layer => {
                            if (
                                layer.feature.properties.nom === activityTitle &&
                                layer.feature.properties.type.toLowerCase() === activityType.toLowerCase()
                            ) {
                                layer.openPopup();
                            }
                        });
                    });
                } else {
                    console.warn(`Aucune activité trouvée pour le titre : ${activityTitle}`);
                }
            });
        });
    }


    function filterActivities() {
        const searchInput = document.getElementById('activity-searchInput');
        const searchTerm = searchInput.value.toLowerCase();

        const accordionItems = document.querySelectorAll('.accordion-item');

        accordionItems.forEach(item => {
            const category = item.dataset.category;
            const content = item.querySelector('.accordion-content');
            const activities = content.querySelectorAll('.activity');
            let hasMatchingActivity = false;

            activities.forEach(activity => {
                const title = activity.querySelector('.activity_title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    activity.style.display = ''; // Afficher l'activité
                    hasMatchingActivity = true;
                } else {
                    activity.style.display = 'none'; // Masquer l'activité
                }
            });
            if (!hasMatchingActivity) {
                content.innerHTML = `<p>Aucune activité correspondante dans "${category}".</p>`;
            }
        });
    }

    /* === FONCTIONS PRINCIPALES === */
    function getAllTypes() {
        if (!geojsonData || !geojsonData.features) {
            console.error("Les données GeoJSON ne sont pas chargées.");
            return {types: [], equipmentTypes: []};
        }

        const typesSet = new Set();
        const equipmentTypesSet = new Set();

        geojsonData.features.forEach(feature => {
            if (feature.properties && feature.properties.type) {
                const type = feature.properties.type;
                typesSet.add(type);
                if (type === "equipement" && feature.properties.types_equipement) {
                    equipmentTypesSet.add(feature.properties.types_equipement);
                }
            }
        });

        return {
            types: Array.from(typesSet),
            equipmentTypes: Array.from(equipmentTypesSet)
        };
    }

    /* === GESTION DE LA CARTE === */
    window.onload = async () => {

        // Afficher le loader
        loader.style.display = "flex";

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
            attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OSM</a>'
        }).addTo(map);

        document.getElementById('searchInput').addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                const cityName = document.getElementById('searchInput').value;

                if (cityName) {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=1`);
                    const data = await response.json();

                    if (data.length > 0) {
                        const { lat, lon } = data[0];
                        localStorage.setItem("userX",lon);
                        localStorage.setItem("userY",lat);
                        updateDisplayActivity();
                        populateActivities();
                        map.setView([lat, lon], 12);
                    } else {
                        alert('Ville introuvable. Vérifie l’orthographe.');
                    }
                } else {
                    alert('Entre un nom de ville.');
                }
            }
        });

        // Charger le GeoJSON
        await initGeoJsonFile();
        // populateActivities();
        const {types, equipmentTypes} = getAllTypes();

        loader.style.display = "none";

        const column1 = document.getElementById('column1');
        const column2 = document.getElementById('column2');

        // Ajouter les types aux colonnes
        types.forEach((type, index) => {
            if (type !== "equipement") {
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'activity-checkbox';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `type-${type}`;
                checkbox.name = 'activity';
                checkbox.value = type;

                const label = document.createElement('label');
                label.htmlFor = `type-${type}`;
                label.textContent = type.charAt(0).toUpperCase() + type.slice(1);

                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(label);

                // Ajouter dans la bonne colonne (genre 4 types par colonne)
                if (index < 4) {
                    column1.appendChild(checkboxContainer);
                } else {
                    column2.insertBefore(checkboxContainer, column2.querySelector('#equipment-button'));
                }
            }
        });

        const simpleActivities = document.querySelectorAll('.activity-checkbox input');
        simpleActivities.forEach(checkbox => {
            // si déjà dans localstorage -> checked
            const selectedActivities = getSelectedActivities();
            if (selectedActivities.includes(checkbox.value)) {
                checkbox.checked = true;
            }
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    addActivityToLocalStorage(checkbox.value);
                } else {
                    removeActivityFromLocalStorage(checkbox.value);
                }
            });
        });

        // Gestion du modal
        const modal = document.getElementById('modal');
        const overlay = document.getElementById('overlay');
        const openModal = () => {
            modal.style.display = 'block';
            overlay.style.display = 'block';
            populateEquipmentList(equipmentTypes);
        };
        const closeModal = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        };
        document.getElementById('modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        const equipmentButton = document.getElementById('equipment-button');
        equipmentButton.addEventListener('click', openModal);

        // Gestion de la recherche dans le modal
        const searchBar = document.getElementById('search-bar');
        searchBar.addEventListener('input', () => {
            const query = searchBar.value.toLowerCase();
            const filteredEquipmentTypes = equipmentTypes.filter(equip =>
                equip.toLowerCase().includes(query)
            );
            populateEquipmentList(filteredEquipmentTypes);
        });

        function populateEquipmentList(equipmentTypes) {    
            const equipmentList = document.getElementById('equipment-list');
            equipmentList.innerHTML = '';

            const selectedActivities = getSelectedActivities();

            equipmentTypes.forEach(equip => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `equip-${equip}`;
                checkbox.name = 'equipment';
                checkbox.value = equip;

                if (selectedActivities.includes(equip)) {
                    checkbox.checked = true;
                }

                const label = document.createElement('label');
                label.htmlFor = `equip-${equip}`;
                label.innerText = equip;

                const container = document.createElement('div');
                container.appendChild(checkbox);
                container.appendChild(label);

                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        addActivityToLocalStorage(equip);
                    } else {
                        removeActivityFromLocalStorage(equip);
                    }
                });

                equipmentList.appendChild(container);
            });
        }
        let showOnlyChecked = false;
        document.querySelector('#modal>div:nth-child(2)>div').addEventListener('click', () => {
            const equipmentList = document.getElementById('equipment-list');
            const checkboxes = equipmentList.querySelectorAll('input[type="checkbox"]');

            checkboxes.forEach(checkbox => {
                const parentDiv = checkbox.parentElement;

                if (showOnlyChecked) {
                    parentDiv.style.display = 'block';
                } else {
                    parentDiv.style.display = checkbox.checked ? 'block' : 'none';
                }
            });
            showOnlyChecked = !showOnlyChecked;
        });

        document.getElementById('reset-equipments').addEventListener('click', () => {
            let selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
            selectedActivities = selectedActivities.filter(activity =>
                ['ski', 'musee', 'jardin', 'festival', 'cinema', 'attraction'].includes(activity)
            );
            localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
            const equipmentCheckboxes = document.querySelectorAll('#equipment-list input[type="checkbox"]');
            equipmentCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateActivityCount();
            updateDisplayActivity();
            populateActivities();
        });

        document.getElementById('activity-searchInput').addEventListener('input', filterActivities);

        updateActivityCount();
        updateDisplayActivity();
    };

    /* === GESTION DES INTERACTIONS UTILISATEURS === */
    // Slider
    const slider = document.getElementById("rangeSlider");
    const rangeValue = document.getElementById("rangeValue");
    slider.addEventListener("input", () => {
        const value = slider.value;
        rangeValue.textContent = value < 1000 ? `${value}m` : `${(value / 1000).toFixed(1)}km`;
        localStorage.setItem("userRayon", (value / 1000));
        updateDisplayActivity();
        populateActivities();
    });

    // distances static avec les boutons
    const staticElements = document.querySelectorAll(".static-distance");
    let selectedDistance = 0;
    staticElements.forEach(button => {
        button.addEventListener('click', function() {
            selectedDistance = parseInt(button.getAttribute('data-value'));
            localStorage.setItem("userRayon",(selectedDistance/1000));
            slider.value = selectedDistance;
            rangeValue.textContent = selectedDistance < 1000 ? `${selectedDistance}m` : `${(selectedDistance / 1000).toFixed(1)}km`;
            updateDisplayActivity();
            populateActivities();
        });
    });

    // Sélection des activités
    document.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
            const isSelected = item.getAttribute('data-selected') === 'true';
            item.setAttribute('data-selected', !isSelected);

        });
    });

    // gestion des accordéons sur la droite
    document.querySelectorAll('.parent-toggle').forEach(toggle => {
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            const parentItem = toggle.closest('.accordion-item');
            const content = parentItem.querySelector('.accordion-content');

            if (parentItem.classList.contains('open')) {
                parentItem.classList.remove('open');
                closeAllChildren(content);
                content.style.maxHeight = null;
            } else {
                parentItem.classList.add('open');
            }

            const arrow = toggle.querySelector('.arrow-icon');
            arrow.style.transform = parentItem.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    document.querySelectorAll('.child-toggle').forEach(toggle => {
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            const subItem = toggle.closest('.accordion-subitem');
            const subContent = subItem.querySelector('.accordion-subcontent');

            if (subItem.classList.contains('open')) {
                subItem.classList.remove('open');
                subContent.style.maxHeight = null;
            } else {
                subItem.classList.add('open');
                subContent.style.maxHeight = subContent.scrollHeight + 'px';
            }

            const arrow = toggle.querySelector('.arrow-icon');
            arrow.style.transform = subItem.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    function closeAllChildren(content) {
        const children = content.querySelectorAll('.accordion-item.open, .accordion-subitem.open');
        children.forEach(child => {
            child.classList.remove('open');
            const childContent = child.querySelector('.accordion-content, .accordion-subcontent');
            if (childContent) {
                childContent.style.maxHeight = null;
            }
        });
    }
});