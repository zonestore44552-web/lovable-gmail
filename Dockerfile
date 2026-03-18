# Usa a imagem oficial do Node 24
FROM node:24

# Cria a pasta do app dentro do container
WORKDIR /app

# Copia os arquivos de dependência primeiro
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install --production

# Copia o restante dos arquivos do projeto
COPY index.js ./

# Expõe a porta que o Cloud Run vai usar
EXPOSE 8080

# Comando para iniciar seu app
CMD ["node", "index.js"]
