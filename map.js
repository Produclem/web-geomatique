"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    /* === VARIABLES GLOBALES === */
    let geojsonData;
    let map;
    let userX = 2.3522;
    let userY = 48.8566;
    let userRayon = 15000;
    const fichierGeoNom = "merged.geojson";

    /* === AJOUT DU LOADER === */
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `<img src="images/loader2.gif" alt="Chargement...">`;
    document.body.appendChild(loader);

    /* === FONCTIONS UTILITAIRES === */
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const EARTH_RADIUS_KM = 6371;
        const toRadians = angle => angle * Math.PI / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon1 - lon2);

        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    function getFilter(type) {
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
        console.log(nbSimple, nbEquipments);

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
    }

    // Supprime une activité déselectionnée du Local Storage
    function removeActivityFromLocalStorage(activity) {
        let selectedActivities = JSON.parse(localStorage.getItem('selectedActivities')) || [];
        selectedActivities = selectedActivities.filter(act => act !== activity);
        localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
        updateActivityCount();
    }

    // Récupère toutes les activités sélectionnées sur le localstorage
    function getSelectedActivities() {
        return JSON.parse(localStorage.getItem('selectedActivities')) || [];
    }

    /* === FONCTIONS PRINCIPALES === */
    async function initGeoJsonFile() {
        try {
            const response = await fetch(fichierGeoNom);
            geojsonData = await response.json();
            console.log("Fichier GeoJSON chargé avec succès.");
        } catch (error) {
            console.error("Erreur lors du chargement du fichier GeoJSON :", error);
        }
    }

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

    function removeMap() {
        map.eachLayer(layer => {
            if (layer !== map.baseLayer) {
                map.removeLayer(layer);
            }
        });
        console.log("Carte nettoyée.");
    }

    async function addElementToMap(type) {
        const filteredData = getFilter(type);
        L.geoJSON(filteredData, {
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(`<strong>${feature.properties.nom}</strong><br>Type: ${feature.properties.type}`);
                }
            }
        }).addTo(map);
    }

    /* === GESTION DE LA CARTE === */
    window.onload = async () => {
        // Afficher le loader
        loader.style.display = "flex";

        // Initialiser la carte
        map = L.map('map', {
            center: [48.8500, 2.3500],
            zoom: 10.6
        });

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

        updateActivityCount();
    };

    /* === GESTION DES INTERACTIONS UTILISATEURS === */
    // Slider
    const slider = document.getElementById("rangeSlider");
    const rangeValue = document.getElementById("rangeValue");
    slider.addEventListener("input", () => {
        const value = slider.value;
        rangeValue.textContent = value < 1000 ? `${value}m` : `${value / 1000}km`;
    });

    // Sélection des activités
    document.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', () => {
            const isSelected = item.getAttribute('data-selected') === 'true';
            item.setAttribute('data-selected', !isSelected);
        });
    });

});