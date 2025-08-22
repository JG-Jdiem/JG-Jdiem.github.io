
let allMatches = [];

/* Trova giornata attuale */
function currentDay(matches){
    //console.log(matches.length);
    for(let i=9; i<matches.length; i+=10){
        const isFuture = isFutureMatch(matches[i]);
        //console.log(isFuture);
        if(isFuture == true){
            return i-8;
        }
    }
    return 1;
}

function isFutureMatch(match) {
    const matchDate = new Date(match.status.utcTime);
    const now = new Date();        
    return matchDate > now;
}


/* Search Player */
document.addEventListener('DOMContentLoaded', () => {
    const searchIcon = document.querySelector('.search-icon');
    const searchBox = document.querySelector('.search-box');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    // Mostra/nascondi il campo di ricerca
    searchIcon.addEventListener('click', () => {
        searchBox.classList.toggle('hidden');
        if (!searchBox.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    // Chiudi la ricerca quando si clicca fuori
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && !searchIcon.contains(e.target)) {
            searchBox.classList.add('hidden');
        }
    });

    // Gestisci la ricerca mentre l'utente digita
    searchInput.addEventListener('input', async () => {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            // Qui dovrai caricare il tuo file JSON con i giocatori
            const response = await fetch('data.json'); // Assicurati di avere questo file
            const players = await response.json();

            const filteredPlayers = players.filter(player => 
                player.ParticipantName.toLowerCase().includes(searchTerm)
            );

            searchResults.innerHTML = filteredPlayers
                .slice(0, 10) // Mostra solo i primi 10 risultati
                .map(player => `
                    <div class="search-result-item" data-player-id="${player.ParticipantId}">
                        ${player.ParticipantName} - ${player.TeamName}
                    </div>
                `).join('');

            // Gestisci il click sui risultati
            document.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const playerId = item.dataset.playerId;
                    // Qui puoi aggiungere la logica per navigare alla pagina del giocatore
                    window.location.href = `player.html?id=${playerId}`;
                });
            });

        } catch (error) {
            console.error('Errore nel caricamento dei giocatori:', error);
            searchResults.innerHTML = '<div class="error">Errore nel caricamento dei giocatori</div>';
        }
    });
});


/* Calcolo */
let years = [2024];
let lastYearData = [];
let lastYearGfgs = [];

// Calcolo originale
function calc(player, squadraCasa, squadraTrasferta, gfgs){
    const day = currentDay(allMatches);
    const mediaxG = 1.5;
    let forzaOffensiva = 0;
    let debolezzaDifensiva = 0;

    if(day<=3){
        forzaOffensiva = (lastYearGfgs.filter(x => x.id == squadraCasa).map(x => x.GF90)[0] ?? 0.8) / mediaxG;
        debolezzaDifensiva = (lastYearGfgs.filter(x => x.id == squadraTrasferta).map(x => x.GS90)[0] ?? 1.5) / mediaxG;
    }
    else{
        forzaOffensiva = gfgs.filter(x => x.id == squadraCasa).map(x => x.GF90) / mediaxG;
        debolezzaDifensiva = gfgs.filter(x => x.id == squadraTrasferta).map(x => x.GS90) / mediaxG;
    }

    if(player.MinutesPlayed < 270){
        if (lastYearData.findIndex(x => x.ParticipantId == player.ParticipantId) != -1)
            player = lastYearData.filter(x => x.ParticipantId == player.ParticipantId).map(x => x)[0];
        else
            return "NaN"
    }

    console.log(player);

    if(player.role == 'P'){
        let DifStab = gfgs.filter(x => x.id == squadraCasa).map(x => x.GS90)/mediaxG; // Stabilità difensiva
        let OffAvv = gfgs.filter(x => x.id == squadraTrasferta).map(x => x.GF90)/mediaxG; // Forza offensiva avversari
        console.log("--"+DifStab);
        console.log("--"+OffAvv);
        let probCS = (2*(player.CleanS/player.MatchesPlayed) + 1*(player.SavePercentage) + 1*DifStab - 1*OffAvv)/5;
        return Math.round(probCS * 100) / 100;
    }
    
    console.log(`${player.Tiri}*${player.MinutesPlayed}/90+1`);
    let tt = Math.floor((player.Tiri * (player.MinutesPlayed / 90)) + 1);
    let ts = Math.floor((player.TiriInPorta * (player.MinutesPlayed / 90)) + 1);
    let precisione = ts / tt;
    console.log(`${ts}, ${tt}, ${player.XG / (player.MinutesPlayed / 90)}, ${forzaOffensiva}`);
    let forma = player.XG / (player.MinutesPlayed / 90);
    console.log(`${player.XG90}*${forma}*${precisione}*${forzaOffensiva}*${debolezzaDifensiva}`);
    let ValAttGol = player.XG90 * forma * precisione * forzaOffensiva * debolezzaDifensiva;
    if((Math.round(ValAttGol * 10000) / 100) == "Infinity"){
        return "NaN";
    }
    return Math.round(ValAttGol * 10000) / 100;
    //console.log(`Possibilità di gol -> ${Math.round(ValAttGol * 10000) / 100}%`);
}

// Nuovo calcolo
function newCalc(player, squadraCasa, squadraTrasferta, gfgs){
    const day = currentDay(allMatches);
    const V = (day<30) ? 1 : 1.5;  // Volontà di segnare (aggiumgere calcolo in lotta (1.5) o non (0.5))
    const mediaxG = 1.5;
    let forzaOffensiva = 0;
    let debolezzaDifensiva = 0;

    if(day<=3){
        forzaOffensiva = (lastYearGfgs.filter(x => x.id == squadraCasa).map(x => x.GF90)[0] ?? 0.8) / mediaxG;
        debolezzaDifensiva = (lastYearGfgs.filter(x => x.id == squadraTrasferta).map(x => x.GS90)[0] ?? 1.5) / mediaxG;
    }
    else{
        forzaOffensiva = gfgs.filter(x => x.id == squadraCasa).map(x => x.GF90) / mediaxG;
        debolezzaDifensiva = gfgs.filter(x => x.id == squadraTrasferta).map(x => x.GS90) / mediaxG;
    }

    /*for (let i = 0; i < gfgs.length; i++) {
        //console.log(idAgainst + " - " + gfgs[i].id);
        if (squadraCasa == gfgs[i].id) {
            forzaOffensiva = gfgs[i].GF90 / mediaxG;
        }
        if (squadraTrasferta == gfgs[i].id) {
            debolezzaDifensiva = gfgs[i].GS90 / mediaxG;
        }
        //console.log(`${gfgs[i].id}   ${squadraTrasferta}`);
    }*/

    if(player.MinutesPlayed < 270){
        if (lastYearData.findIndex(x => x.ParticipantId == player.ParticipantId) != -1)
            player = lastYearData.filter(x => x.ParticipantId == player.ParticipantId).map(x => x)[0];
        else
            return "NaN"
    }
    console.log(player);

    if(player.role == 'P'){
        let DifStab = gfgs.filter(x => x.id == squadraCasa).map(x => x.GS90)/mediaxG; // Stabilità difensiva
        let OffAvv = gfgs.filter(x => x.id == squadraTrasferta).map(x => x.GF90)/mediaxG; // Forza offensiva avversari
        /*console.log("--"+DifStab);
        console.log("--"+OffAvv);*/
        let probCS = (2*(player.CleanS/player.MatchesPlayed) + 1*(player.SavePercentage) + 1*DifStab - 1*OffAvv)/5;
        return Math.round(probCS * 100) / 100;
    }


    let tt = Math.floor((player.Tiri * (player.MinutesPlayed / 90)) + 1);
    let ts = Math.floor((player.TiriInPorta * (player.MinutesPlayed / 90)) + 1);

    let precisione = (player.Tiri == 0 && player.TiriInPorta == 0) ? 0.5 : ts / tt;

    console.log(`${V}*(${player.XG90}*${precisione}*${forzaOffensiva}*${debolezzaDifensiva})`);
    let ValAttGol;
    if(player.GF > player.XG+2)
        ValAttGol = V * ((player.GF/(player.MinutesPlayed/90)) * precisione * forzaOffensiva * debolezzaDifensiva);
    else
        ValAttGol = V * (player.XG90 * precisione * forzaOffensiva * debolezzaDifensiva);
    console.log(ValAttGol);
    /*if((Math.round(ValAttGol * 10000) / 100) == "Infinity"){
        return "NaN";
    }*/
    ValAttGol = (1 - Math.exp(-ValAttGol / 2.5)) * 100
    return Math.round(ValAttGol * 10)/10;
    //console.log(`Possibilità di gol -> ${Math.round(ValAttGol * 10000) / 100}%`);
}

/* Calcolo abbinamento portieri */
function calcKeepers(keepers){
    difficolta = Array(38).fill('H');
    console.log(keepers);
    for(let i=0; i<allMatches.length; i++){
        if(keepers.includes(allMatches[i].home.name)){
            const defQual = gfgs.filter(x => x.id == allMatches[i].away.id).map(x => x.attackQuality);
            if(difficolta[parseInt(i/10)] == 'H' && defQual <= 4)
                difficolta[parseInt(i/10)] = (defQual <= 3) ? 'E' : 'M';
            if(difficolta[parseInt(i/10)] == 'M' && defQual <= 3)
                difficolta[parseInt(i/10)] = 'E';                    
        }

        if(keepers.includes(allMatches[i].away.name)){
            const defQual = gfgs.filter(x => x.id == allMatches[i].home.id).map(x => x.attackQuality);
            if(difficolta[parseInt(i/10)] == 'H' && defQual <= 4)
                difficolta[parseInt(i/10)] = (defQual <= 3) ? 'E' : 'M';
            if(difficolta[parseInt(i/10)] == 'M' && defQual <= 3)
                difficolta[parseInt(i/10)] = 'E';                    
        }
    }
    let sum = difficolta.reduce((_sum, x) => _sum + ((x == 'E') ? 1 : (x == 'M') ? 0.5 : 0), 0)
    console.log(sum);
    let difPerc = 100 * sum / 38;
    difPerc = Math.round(difPerc);
    console.log(difPerc);
    return difPerc;
}

/* Divisioni per ruolo */

// Funzione per raggruppare i giocatori per ruolo
function raggruppaPerId(giocatori) {
    // Ordine desiderato dei ruoli
    const ordineRuoli = ['portieri', 'difensori', 'centrocampisti', 'attaccanti'];

    // Prima raggruppa i giocatori
    const gruppi = giocatori.reduce((acc, giocatore) => {
        const ruolo = convertiRuolo(giocatore.role);
        if (!acc[ruolo]) {
            acc[ruolo] = [];
        }
        acc[ruolo].push(giocatore);
        //console.log(acc);
        return acc;
    }, {});

    // Poi crea un nuovo oggetto con l'ordine corretto
    const gruppiOrdinati = {};
    ordineRuoli.forEach(ruolo => {
        if (gruppi[ruolo]) {
            gruppiOrdinati[ruolo] = gruppi[ruolo];
        }
    });

    //console.log(gruppiOrdinati);
    return gruppiOrdinati;
}

// Funzione per convertire i codici ruolo
function convertiRuolo(ruolo) {
    const ruoli = {
        'P': 'portieri',
        'D': 'difensori',
        'C': 'centrocampisti',
        'A': 'attaccanti'
    };
    return ruoli[ruolo] || 'altri';
}


/* Calcolo colori */

function lightenColor(hex, percent) {
    // Rimuovi il # se presente
    hex = hex.replace('#', '');

    // Converti in RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Aumenta ogni componente della percentuale specificata
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    // Riconverti in hex
    const newHex = '#' + 
        r.toString(16).padStart(2, '0') + 
        g.toString(16).padStart(2, '0') + 
        b.toString(16).padStart(2, '0');

    return newHex;
}
