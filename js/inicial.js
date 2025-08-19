// --------- MENU DO ACADÊMICO ---------
const academicButton = document.getElementById("academicButton");
const optionsAcademico = document.getElementById("optionsAcademico");

academicButton.addEventListener("click", () => {
    optionsAcademico.classList.toggle("active");
});

// -------- MENU DO MAPA --------
const mapButton = document.getElementById("mapButton");
const optionsMapa = document.getElementById("optionsMapa");

mapButton.addEventListener("click", () => {
    optionsMapa.classList.toggle("active");
});

// -------- MENU DO USUÁRIO --------
const userMenu = document.getElementById("userMenu");
const dropdownMenu = document.getElementById("dropdownMenu");

userMenu.addEventListener("click", (e) => {
    e.stopPropagation(); // evita conflito com o clique fora
    dropdownMenu.classList.toggle("active");
});

// Fecha menus se clicar fora
document.addEventListener("click", (e) => {
    // Fecha o menu do mapa se clicar fora
    if (!mapButton.contains(e.target) && !optionsMapa.contains(e.target)) {
        optionsMapa.classList.remove("active");
    }

    // Fecha o menu acadêmico se clicar fora
    if (!academicButton.contains(e.target) && !optionsAcademico.contains(e.target)) {
        optionsAcademico.classList.remove("active");
    }

    // Fecha o menu do usuário se clicar fora
    if (!userMenu.contains(e.target)) {
        dropdownMenu.classList.remove("active");
    }
});

