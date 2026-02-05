async function getStatus(client) {
  
  const lavalinkNodes = client.manager && client.manager.shoukaku ? client.manager.shoukaku.nodes : new Map();
  const lavalinkStatus = Array.from(lavalinkNodes.values()).map(node => ({
    name: node.name,
    state: node.state,
    stats: node.stats,
    ping: node.ping || -1
  }));

  return {
    uptime: process.uptime(),
    ping: client.ws.ping,
    memory: process.memoryUsage().rss,
    lavalink: lavalinkStatus
  };
}

module.exports = { getStatus };