FROM python:3.9-buster

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client

# Install dependencies
COPY ./docker/django/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
RUN rm requirements.txt

EXPOSE 8000

COPY ./django /app
COPY ./docker/django/deploy.py /ganache/
COPY ./docker/django/Tournaments.sol /ganache/
COPY ./docker/django/init.sh /usr/local/bin/init.sh

CMD ["bash", "/usr/local/bin/init.sh"]