FROM atomiq/node:onbuild

# gelf
EXPOSE 12201

# NOTE
#  requires docker daemon access

CMD ["node", "server.js"]
