FROM jenkins/jenkins:lts

USER root

# ติดตั้ง Docker CLI
RUN apt-get update && apt-get install -y docker.io && apt-get install -y git

# ติดตั้ง Docker Compose (v2)
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# ให้สิทธิ์ user 'jenkins' ใช้ docker
RUN usermod -aG docker jenkins

USER jenkins