# Bhashini

# Deployment Instructions

---

## Pre-requisites:
1. Python (python3.12 is preferred)
2. npm (Node Package Manager)
3. mongodb (ensure that this service is running on your system)
4. Docker
5. Docker Compose

---

## Backend

1. Navigate to `/backend/`.
2. Add the URI to a MongoDB database (ensure that you name the cluster "Bhashini", and it has "Inference\_Pipelines", "Input\_Languages" and "Model\_Zoo" collections in it) in `.env`.
2. Create a file named `.env.credentials`, and fill it with data of the following format:
```dotenv
# AWS credentials
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACL=
AWS_STORAGE_DIR=

# APIM token credentials
APIM_TOKEN_ENDPOINT='https://sts.choreo.dev/oauth2/token'
APIM_BASIC_TOKEN=
```
3. Now, build and run the main app and all the microservices using `docker compose up --build`. This command will automatically update and run your backend server whenever any changes are made.

---

## Frontend

### Note: You are recommended to start the frontend AFTER starting the backend, since the frontend depends on the backend for all of its views!

1. Navigate to `/frontend/`.
2. Run `npm i` to install all the node packages.
3. Now, run `npm start` to start up the frontend.

---

---
