# Start from the official NGINX base image
FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

COPY ssl/cert.pem /etc/ssl/certs/cert.pem
COPY ssl/key.pem /etc/ssl/private/key.pem

# Port 80 for HTTP and port 443 for HTTPS
EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
