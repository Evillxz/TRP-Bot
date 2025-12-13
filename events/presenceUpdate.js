const { Events } = require('discord.js');
const { client } = require('../config/client');

// Cache em memória para saber quem está online agora: { 'userID': DataDeInicio }
const activeSessions = new Map(); 

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    const memberId = newPresence.userId;
    
    // Tenta encontrar a atividade do Legacy/FiveM
    const activity = newPresence.activities.find(act => 
        act.name === 'LGC - LEGACY ROLEPLAY' || act.name === 'Grand Theft Auto San Andreas'
    );
    
    // CASO 1: Usuário COMEÇOU a jogar (não estava no Map, mas agora tem atividade)
    if (activity && !activeSessions.has(memberId)) {
        console.log(`${memberId} começou a patrulhar/jogar.`);
        activeSessions.set(memberId, new Date());
    }
    
    // CASO 2: Usuário PAROU de jogar (estava no Map, mas agora não tem atividade ou ficou offline)
    else if (!activity && activeSessions.has(memberId)) {
        const startTime = activeSessions.get(memberId);
        const endTime = new Date();
        const durationMs = endTime - startTime;
        const durationMinutes = Math.floor(durationMs / 1000 / 60);

        // Remove do cache
        activeSessions.delete(memberId);

        // Só salva se jogou mais de 5 minutos (evita "abrir e fechar" rápido)
        if (durationMinutes > 5) {
            console.log(`${memberId} jogou por ${durationMinutes} minutos. Salvando no BD...`);
            
            // AQUI VOCÊ CHAMA SUA API OU QUERY SQL
            // 1. Insert na tabela game_sessions (para histórico do mês)
            // 2. Update na tabela member_profile (somando ao total geral)
        }
    }
});