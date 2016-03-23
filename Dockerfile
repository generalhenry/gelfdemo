FROM atomiq/node:onbuild

# gelf
EXPOSE 12201

CMD ["node", "server.js"]
