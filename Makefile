PROJECT := transcendence
CONTAINERS := django postgresql ganache nginx
YML_PATH = ./docker/docker-compose.yml
ENV_FILE := .env

DOCKER_COMPOSE := docker compose --env-file $(ENV_FILE) -f $(YML_PATH) -p $(PROJECT)

run:
	$(DOCKER_COMPOSE) up --build --remove-orphans

dt:
	$(DOCKER_COMPOSE) up --build -d --remove-orphans

down:
	$(DOCKER_COMPOSE) down

stop:
	$(DOCKER_COMPOSE) stop 

clean:
	$(DOCKER_COMPOSE) down --remove-orphans --rmi all

fclean:
	$(DOCKER_COMPOSE) down -v --remove-orphans --rmi all
	docker network rm Transcendence_network 2>/dev/null || true

re: fclean run

exec-%:
	$(DOCKER_COMPOSE) exec $* sh

$(foreach CONTAINER,$(CONTAINERS),$(eval $(CONTAINER): exec-$(CONTAINER)))

.PHONY: run dt down stop clean fclean re exec-% $(foreach CONTAINER,$(CONTAINERS),$(CONTAINER))
