const slider = document.getElementById("rangeSlider");
const rangeValue = document.getElementById("rangeValue");
const transportIcons = document.querySelectorAll(".transport-icons img");

// Fonction pour mettre à jour la valeur affichée
const updateRangeValue = (value) => {
    if (value < 1000) {
        rangeValue.textContent = `${value}m`;
    } else {
        rangeValue.textContent = `${value / 1000}km`;
    }
};

// Écoute les clics sur les icônes
transportIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        const value = icon.getAttribute("data-value");
        slider.value = value;
        updateRangeValue(value);
    });
});

// Met à jour la valeur lors du déplacement du slider
slider.addEventListener("input", () => {
    updateRangeValue(slider.value);
});