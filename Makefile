PROJECT := transcendence
CONTAINERS := django postgresql
YML_PATH = ./docker/docker-compose.yml
VOLUMES := ./postgresql-data
ENV_FILE := .env

DOCKER_COMPOSE := sudo ENV_FILE=$(ENV_FILE) docker compose --env-file $(ENV_FILE) -f $(YML_PATH) -p $(PROJECT)

run: $(VOLUMES)	
	$(DOCKER_COMPOSE) up --build --remove-orphans

dt: $(VOLUMES)
	$(DOCKER_COMPOSE) up --build -d --remove-orphans

down:
	$(DOCKER_COMPOSE) down

stop:
	$(DOCKER_COMPOSE) stop 

clean:
	$(DOCKER_COMPOSE) down -v --remove-orphans --rmi all

fclean: clean
	sudo rm -rf $(VOLUMES)

re: fclean run

$(VOLUMES):
	mkdir -p $(VOLUMES) 2>/dev/null

exec-%:
	$(DOCKER_COMPOSE) exec $* sh

$(foreach CONTAINER,$(CONTAINERS),$(eval $(CONTAINER): exec-$(CONTAINER)))

.PHONY: run dt down stop clean fclean re exec-% $(foreach CONTAINER,$(CONTAINERS),$(CONTAINER))
