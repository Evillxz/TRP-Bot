const fs = require('fs');
const path = require('path');
const readline = require('readline');
const fetch = require('node-fetch');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Evillxz';
const REPO_NAME = 'TRP-Bot';

if (!GITHUB_TOKEN) {
  console.error('\x1b[31m%s\x1b[0m', 'ERRO: GITHUB_TOKEN não encontrado no arquivo .env');
  console.log('Por favor, adicione GITHUB_TOKEN=seu_token_aqui no arquivo .env do BOT.');
  console.log('Você pode gerar um token em: https://github.com/settings/tokens (Classic)');
  console.log('Permissões necessárias: public_repo (ou repo se for privado)');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '=== Criador de Release do GitHub ===');
console.log(`Versão atual no package.json: \x1b[33m${packageJson.version}\x1b[0m`);

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkPermissions() {
  console.log('\n\x1b[36m%s\x1b[0m', '--- Diagnóstico de Permissões ---');
  
  // 1. Verifica quem é o dono do token
  const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
  });
  
  if (!userRes.ok) {
      throw new Error(`Token inválido ou expirado. O GitHub recusou a conexão. Status: ${userRes.status}`);
  }
  
  const user = await userRes.json();
  console.log(`Token autenticado como: \x1b[32m${user.login}\x1b[0m`);

  // 2. Verifica permissões no repositório específico
  const repoRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
  });

  if (!repoRes.ok) {
      if (repoRes.status === 404) {
           throw new Error(`O repositório ${REPO_OWNER}/${REPO_NAME} não foi encontrado. Verifique se o nome está correto ou se você tem acesso a ele.`);
      }
      throw new Error(`Erro ao acessar informações do repositório: ${repoRes.status}`);
  }

  const repo = await repoRes.json();
  
  // Verifica se o campo permissions existe (tokens clássicos retornam, fine-grained as vezes não)
  if (repo.permissions) {
    console.log(`Permissões de ${user.login} em ${REPO_NAME}:`);
    console.log(`- Admin: ${repo.permissions.admin ? '\x1b[32mSim\x1b[0m' : '\x1b[31mNão\x1b[0m'}`);
    console.log(`- Push (Escrita): ${repo.permissions.push ? '\x1b[32mSim\x1b[0m' : '\x1b[31mNão\x1b[0m'}`);

    if (!repo.permissions.push) {
        throw new Error(`O usuário ${user.login} NÃO tem permissão para criar releases neste repositório.\nSOLUÇÃO: Peça para o dono (${REPO_OWNER}) adicionar ${user.login} como "Collaborator" no repositório.`);
    }
  } else {
    console.log('\x1b[33m%s\x1b[0m', 'Aviso: Não foi possível ler as permissões detalhadas (comum em alguns tipos de token). Tentando continuar...');
  }
  console.log('\x1b[36m%s\x1b[0m', '---------------------------------\n');
}

async function createRelease() {
  try {
    await checkPermissions();

    const title = await question('Título da Release (ex: Atualização de Segurança): ');
    if (!title) {
      console.log('Título é obrigatório.');
      process.exit(1);
    }

    console.log('Descrição da Release (Markdown suportado).');
    console.log('\x1b[33m%s\x1b[0m', 'DICA: Para pular linha, dê um ENTER. Para FINALIZAR, dê 3 ENTERs seguidos.');
    
    let description = '';
    let emptyLines = 0;
    
    for await (const line of rl) {
      if (line.trim() === '') {
        emptyLines++;
        if (emptyLines >= 3) break; // Sai no terceiro enter
      } else {
        emptyLines = 0;
      }
      description += line + '\n';
    }

    // Remove as linhas vazias extras do final
    description = description.trim();

    if (!description) {
      description = title; // Fallback
    }

    console.log('\n\x1b[36m%s\x1b[0m', 'Resumo:');
    console.log(`Tag: ${packageJson.version}`);
    console.log(`Título: ${title}`);
    console.log(`Descrição:\n${description}\n`);

    const confirm = await question('Confirmar criação da release? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      console.log('Cancelado.');
      process.exit(0);
    }

    console.log('Criando release...');

    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        tag_name: packageJson.version,
        target_commitish: 'main', // ou a branch que você usa
        name: title,
        body: description,
        draft: false,
        prerelease: false,
        generate_release_notes: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('\x1b[32m%s\x1b[0m', 'Release criada com sucesso!');
    console.log(`URL: ${data.html_url}`);

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Erro ao criar release:', error.message);
  } finally {
    rl.close();
    process.exit(0); // Força a saída pois o loop do readline pode manter aberto
  }
}

createRelease();
