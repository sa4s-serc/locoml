# Base image with Python and dependencies
FROM python:3.12 AS base
RUN apt-get update && apt-get install -y libsasl2-dev python3-dev libldap2-dev libssl-dev slapd ffmpeg

# Create a virtual environment and install dependencies
FROM base AS dependencies
ENV VIRTUAL_ENV=/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
WORKDIR /cache/
# Copy only requirements.txt first to leverage caching
COPY requirements.txt .
RUN python -m venv /venv
RUN pip install -r requirements.txt

# Create the final image
FROM python:3.12-slim AS final
EXPOSE 5000
RUN apt-get update && apt-get install -y libldap-2.5.0 libsasl2-dev python3-dev libldap2-dev libssl-dev slapd ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
ENV VIRTUAL_ENV=/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
WORKDIR /app
COPY --from=dependencies /venv /venv
COPY . /app
