FROM node:18
RUN mkdir app
WORKDIR /app
COPY --chown=node:node index.js index.js
COPY --chown=node:node login.js login.js
COPY --chown=node:node api.js api.js
COPY --chown=node:node search.js search.js
COPY --chown=node:node package.json package.json
RUN npm install
CMD ["npm", "start"]