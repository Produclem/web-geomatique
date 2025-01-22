
// PARTIE RANGE SLIDER
const slider = document.getElementById("rangeSlider");
const rangeValue = document.getElementById("rangeValue");
const transportIcons = document.querySelectorAll(".transport-icons img");
const updateRangeValue = (value) => {
    if (value < 1000) {
        rangeValue.textContent = `${value}m`;
    } else {
        rangeValue.textContent = `${value / 1000}km`;
    }
};
transportIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        const value = icon.getAttribute("data-value");
        slider.value = value;
        updateRangeValue(value);
    });
});
slider.addEventListener("input", () => {
    updateRangeValue(slider.value);
});

// PARTIE TYPE D'ACTIVITÉ
document.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
        const isSelected = item.getAttribute('data-selected') === 'true';
        item.setAttribute('data-selected', !isSelected);

        const listDiv = document.querySelector("#listActivities");
        if (!isSelected) {
            const li = document.createElement('li');
            li.textContent = item.textContent;
            li.setAttribute('data-activity', item.textContent); // Ajout d'un attribut pour la gestion
            listDiv.appendChild(li);
        } else {
            const liToRemove = listDiv.querySelector(`[data-activity="${item.textContent}"]`);
            if (liToRemove) {
                listDiv.removeChild(liToRemove);
            }
        }
    });
});