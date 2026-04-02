const FINNISH_CITIES = {
    espoo: { fi: "Espoo", en: "Espoo", sv: "Esbo", lon: 24.6559 },
    helsinki: { fi: "Helsinki", en: "Helsinki", sv: "Helsingfors", lon: 24.9384 },
    hameenlinna: { fi: "Hämeenlinna", en: "Hämeenlinna", sv: "Tavastehus", lon: 24.4643 },
    joensuu: { fi: "Joensuu", en: "Joensuu", sv: "Joensuu", lon: 29.7636 },
    jyvaskyla: { fi: "Jyväskylä", en: "Jyväskylä", sv: "Jyväskylä", lon: 25.7482 },
    kajaani: { fi: "Kajaani", en: "Kajaani", sv: "Kajana", lon: 27.7288 },
    kotka: { fi: "Kotka", en: "Kotka", sv: "Kotka", lon: 26.9458 },
    kouvola: { fi: "Kouvola", en: "Kouvola", sv: "Kouvola", lon: 26.7042 },
    kuopio: { fi: "Kuopio", en: "Kuopio", sv: "Kuopio", lon: 27.6770 },
    kuusamo: { fi: "Kuusamo", en: "Kuusamo", sv: "Kuusamo", lon: 29.1851 },
    lahti: { fi: "Lahti", en: "Lahti", sv: "Lahtis", lon: 25.6615 },
    lappeenranta: { fi: "Lappeenranta", en: "Lappeenranta", sv: "Villmanstrand", lon: 28.1897 },
    mariehamn: { fi: "Maarianhamina", en: "Mariehamn", sv: "Mariehamn", lon: 19.9348 },
    mikkeli: { fi: "Mikkeli", en: "Mikkeli", sv: "Sankt Michel", lon: 27.2723 },
    oulu: { fi: "Oulu", en: "Oulu", sv: "Uleåborg", lon: 25.4651 },
    pori: { fi: "Pori", en: "Pori", sv: "Björneborg", lon: 21.7974 },
    rovaniemi: { fi: "Rovaniemi", en: "Rovaniemi", sv: "Rovaniemi", lon: 25.7294 },
    savonlinna: { fi: "Savonlinna", en: "Savonlinna", sv: "Nyslott", lon: 28.8833 },
    seinajoki: { fi: "Seinäjoki", en: "Seinäjoki", sv: "Seinäjoki", lon: 22.8403 },
    tampere: { fi: "Tampere", en: "Tampere", sv: "Tammerfors", lon: 23.7610 },
    turku: { fi: "Turku", en: "Turku", sv: "Åbo", lon: 22.2666 },
    vaasa: { fi: "Vaasa", en: "Vaasa", sv: "Vasa", lon: 21.6158 }
};

// Provided in base template
/*
function isDstInFinland(date = new Date()) {
    const year = date.getUTCFullYear();

    function lastSundayOfMonthUTC(monthIndex) {
        const d = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0));
        const day = d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - day);
        return d;
    }

    const dstStart = lastSundayOfMonthUTC(2);
    dstStart.setUTCHours(1, 0, 0, 0);

    const dstEnd = lastSundayOfMonthUTC(9);
    dstEnd.setUTCHours(1, 0, 0, 0);
    return date >= dstStart && date < dstEnd;
}
*/

function createMeridianMap({ id, center, zoom, meridians = [] }) {
    const map = L.map(id).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const lines = meridians.map(({ lon, color = "#FF0000" }) =>
        L.polyline([[-90, lon], [90, lon]], {
            color,
            weight: 2,
            dashArray: "8 8"
        }).addTo(map)
    );

    return { map, lines };
}

const map1 = createMeridianMap({
    id: "map1",
    center: [64.5, 25],
    zoom: 4,
    meridians: [
        { lon: 30, color: "#FF7700" },
        { lon: 45, color: "#FF0000" }
    ]
});

const map2 = createMeridianMap({
    id: "map2",
    center: [63.5, 23],
    zoom: 5,
    meridians: [
        { lon: 26.25, color: "#888" },
        { lon: 22.5, color: "#FF0000" }
    ]
});

function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatHMS(date) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function getHelsinkiDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Helsinki",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(date);

    const out = {};
    for (const p of parts) {
        if (p.type !== "literal") out[p.type] = p.value;
    }

    return new Date(`${out.year}-${out.month}-${out.day}T${out.hour}:${out.minute}:${out.second}`);
}

function dayOfYearUTC(date) {
    const start = Date.UTC(date.getUTCFullYear(), 0, 0);
    return Math.floor((date.getTime() - start) / 86400000);
}

function equationOfTimeMinutes(date) {
    const n = dayOfYearUTC(date);
    const B = (2 * Math.PI * (n - 81)) / 364;
    return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

function roundToNearestMinute(date) {
    return new Date(Math.round(date.getTime() / 60000) * 60000);
}

function formatUtcOffset(hours) {
    const sign = hours >= 0 ? "+" : "-";
    const abs = Math.abs(hours);
    return `UTC${sign}${abs.toFixed(2)}`;
}

function updateSolarTime() {
    const select = document.getElementById("solar-city");
    const city = FINNISH_CITIES[select.value];
    const now = new Date();

    const dst = isDstInFinland(now);
    const timezoneMeridian = dst ? 45 : 30;

    // Legal time in Helsinki, regardless of viewer locale
    const legalParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Helsinki",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(now);
    const legalHour = legalParts.find(p => p.type === "hour")?.value ?? "--";
    const legalMinute = legalParts.find(p => p.type === "minute")?.value ?? "--";
    const legalSecond = legalParts.find(p => p.type === "second")?.value ?? "--";

    // Convert the current instant to a Helsinki-based date object for arithmetic
    const helsinkiNow = getHelsinkiDate(now);

    const meanOffsetMinutes = 4 * (city.lon - timezoneMeridian);
    const meanSolar = new Date(helsinkiNow.getTime() + meanOffsetMinutes * 60000);

    const eot = equationOfTimeMinutes(now);
    const apparentSolar = new Date(meanSolar.getTime() + eot * 60000);

    const realTimezone = city.lon / 15;
    document.getElementById("solar-realzone").textContent = formatUtcOffset(realTimezone);
    document.getElementById("solar-legal").textContent = `${legalHour}:${legalMinute}:${legalSecond}`;
    document.getElementById("solar-mean").textContent = formatHMS(meanSolar);
    document.getElementById("solar-apparent").textContent = formatHMS(apparentSolar);
}

function initSolarTimeWidget() {
    const select = document.getElementById("solar-city");
    if (!select) return;

    const lang = document.documentElement.lang || "en";

    select.innerHTML = Object.entries(FINNISH_CITIES)
        .map(([key, city]) => `<option value="${key}">${city[lang] || city.en}</option>`)
        .join("");

    select.value = "helsinki";
    select.addEventListener("change", updateSolarTime);

    updateSolarTime();
    setInterval(updateSolarTime, 1000);
}

initSolarTimeWidget();

function initShareButton() {
    const button = document.getElementById("share-button");
    const status = document.getElementById("share-status");
    if (!button) return;

    const title = button.dataset.shareTitle || document.title;
    const text = button.dataset.shareText || "";
    const url = button.dataset.shareUrl || window.location.href;
    const statusShared = button.dataset.statusShared || "Shared.";
    const statusCopied = button.dataset.statusCopied || "Link copied to clipboard.";
    const statusUnsupported = button.dataset.statusUnsupported || "Sharing is not supported in this browser.";

    async function copyToClipboard(value) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }

        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const ok = document.execCommand("copy");
            document.body.removeChild(textarea);
            return ok;
        } catch {
            document.body.removeChild(textarea);
            return false;
        }
    }

    button.hidden = false;

    button.addEventListener("click", async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title, text, url });
                if (status) status.textContent = statusShared;
                return;
            }

            const copied = await copyToClipboard(url);
            if (status) {
                status.textContent = copied ? statusCopied : statusUnsupported;
            }
        } catch {
            try {
                const copied = await copyToClipboard(url);
                if (status) {
                    status.textContent = copied ? statusCopied : statusUnsupported;
                }
            } catch {
                if (status) status.textContent = statusUnsupported;
            }
        }
    });
}

initShareButton();
