PROJECT := transcendence
CONTAINERS := django postgresql ganache nginx
YML_PATH = ./docker/docker-compose.yml
DB_VOLUMES := ./postgresql-data ./ganache-db
ENV_FILE := .env

DOCKER_COMPOSE := docker compose --env-file $(ENV_FILE) -f $(YML_PATH) -p $(PROJECT)

run: $(DB_VOLUMES)
	$(DOCKER_COMPOSE) up --build --remove-orphans

dt: $(DB_VOLUMES)
	$(DOCKER_COMPOSE) up --build -d --remove-orphans

down:
	$(DOCKER_COMPOSE) down

stop:
	$(DOCKER_COMPOSE) stop 

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans --rmi all

fclean: clean
	rm -rf $(DB_VOLUMES)

re: fclean run

$(DB_VOLUMES):
	mkdir -p $(DB_VOLUMES) 2>/dev/null

exec-%:
	$(DOCKER_COMPOSE) exec $* sh

$(foreach CONTAINER,$(CONTAINERS),$(eval $(CONTAINER): exec-$(CONTAINER)))

.PHONY: run dt down stop clean fclean re exec-% $(foreach CONTAINER,$(CONTAINERS),$(CONTAINER))
