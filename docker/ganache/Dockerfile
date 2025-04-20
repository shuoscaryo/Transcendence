FROM node:18

# Install Ganache CLI globally
RUN npm install -g ganache

# Expose Ganache port
EXPOSE 7545

# Use init script as entrypoint
COPY ./docker/ganache/init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh
CMD ["sh", "/usr/local/bin/init.sh"]
