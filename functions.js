/// Permet d'avoir une liste d'event autour de l'utilisateur
/// 
/// input :
/// type -> string du type de données Ex: 'cinema'
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
/// type -> string du type de données Ex: 'cinema'
/// necessite :
/// La position de l'utilisateur (userX et userY)
/// Le rayon de recherche (userRayon)
async function addElementToMap(type){
    console.log("addElementToMap - start - type:",type);
    if (userX !== null && userY !== null && userRayon !== null && type !== null){

    geojsonLayer = L.geoJSON(getFilter(type), {
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.nom) {
                layer.bindPopup(`<strong>${feature.properties.nom}</strong><br>Type: ${feature.properties.type}`);
            }
        }
    }).addTo(map);
    }else{
        console.log("[Erreur] - addElementToMap - faild - l'une des données est nulle");
        return;
    }
    console.log("addElementToMap - end - type:",type);
}


// Charger tous les types de données :
// 1. types (cinema, ski, musee, jardin, festival, equipement)
// 2. equipmentTypes (terrain de petanque, mur à gauche ...)

// Pour récup faire un :
// const { types, equipmentTypes } = getAllTypes();
function getAllTypes() {
    if (!geojsonData || !geojsonData.features) {
        console.error("[Erreur chargement des types] - Les données GeoJSON ne sont pas chargées.");
        return { types: [], equipmentTypes: [] };
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
    // console.log("Types trouvés :", Array.from(typesSet));
    // console.log("Types d'équipements trouvés :", Array.from(equipmentTypesSet));
    return {
        types: Array.from(typesSet), // Convertir le Set en tableau
        equipmentTypes: Array.from(equipmentTypesSet) // Convertir le Set en tableau
    };
}


async function showCinemas() {
    addElementToMap('cinema');
}

