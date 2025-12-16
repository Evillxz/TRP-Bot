function formatarTextoEmbed(texto, limite = 50) {
    const palavras = texto.split(' ');
    let linhas = [];
    let linhaAtual = '';

    for (const palavra of palavras) {
        if ((linhaAtual + palavra).length <= limite) {
            linhaAtual += (linhaAtual ? ' ' : '') + palavra;
        } else {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        }
    }

    if (linhaAtual) linhas.push(linhaAtual);

    return linhas.join('\n');
}

module.exports = { formatarTextoEmbed };