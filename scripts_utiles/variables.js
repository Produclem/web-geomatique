
// fichier avec l'ensemble des données 
const fichierGeoNom = 'merged.geojson';

const gobalUrl ="http://0.0.0.0:8000";

let geojsonData;
let geojsonLayer;
let map = L.map('map').setView([48.8566, 2.3522], 11); // Cpar defaut sur paris

// position de l'utilisateur (par defaut sur paris)
localStorage.setItem("userY",48.8566);
localStorage.setItem('userX',2.3522);
// rayon de recherche de l'utilisateur en Km (par defaut à 40km)
localStorage.setItem("userRayon",8);

const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
    attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 19,
}).addTo(map);



// display :
const displayIconSize = [20, 20];
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