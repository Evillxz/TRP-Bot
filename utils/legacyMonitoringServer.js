const Gamedig = require('gamedig');

async function statusMTA() {
    try {
        const state = await Gamedig.query({
            type: 'mtasa',
            host: '143.14.179.71',
            port: 22003
        });

        console.log({
            online: true,
            nome: state.name,
            playersOnline: state.players.length,
            maxPlayers: state.maxplayers,
            map: state.map,
            players: state.players
        });
    } catch (err) {
        console.log('Erro ao buscar status:', err);
    }
}

statusMTA();
