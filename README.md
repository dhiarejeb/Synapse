# Synapse

**Synapse** is a focused workspace designed to help you **connect ideas, structure thoughts, and find clarity**.  
Built for thinkers who value **intention** and **mindful productivity**.

---

## API Design

<img width="703" height="478" alt="API Design" src="https://github.com/user-attachments/assets/e159517d-3b3b-45b6-b1d1-c9fac8c18ea6" />

---

## Class Diagram

<img width="763" height="773" alt="Class Diagram" src="https://github.com/user-attachments/assets/c4ed271c-9d5c-4ea9-8af5-51d4bef4d3c1" />

---

## Deployment

<img width="493" height="257" alt="Deployment" src="https://github.com/user-attachments/assets/2c34c21c-8129-4f40-ad08-3683bd1fb0a8" />

---

## Setup Instructions : How to Start the App Locally 

1. **Configure the application profile**  
   - Use the `local` profile in `application.yaml`.  
   - Update your database values: `username`, `password`, and `URL`.
   - Also update the in the backend synapse/docker-copose.yml

2. **Generate RSA keys (Windows)**  
   Open your terminal and run:  
   ```bash
   openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
Then create the folder structure in resources:

resources/
  └── keys/
      └── local-only/
          ├── private_key.pem
          └── public_key.pem

- paste your generated keys there and provide the path for them in application-local.yaml
- app:
  security:
    jwt:
      private-key-path: PASTE YOUR PATH 
      public-key-path: PASTE YOUR PATH                   # e.g., /ressources/keys/local-only/public_key.pem


 3. **Set up AWS S3 and IAM**

 - Create an AWS account, an S3 bucket, and an IAM user.
 - Add the bucket name and region to `application-local.yaml`.
 - Generate IAM keys and set them as environment variables (Windows):
   
   - setx AWS_ACCESS_KEY_ID "YOUR_ACCESS_KEY"
   - setx AWS_SECRET_ACCESS_KEY "YOUR_SECRET_KEY"
   - setx AWS_REGION "YOUR_REGION"



4. **Configure Email**

 - In the `config` package, open the `MailConfig` class.
 - Update the email and paste your **App Password** (requires enabling 2FA on your Gmail account). or provide them in application-local.yml 

5. **Start the Database and App**

 In the IntelliJ terminal, navigate to the `synapse` directory:
   
   - cd synapse
   - docker-compose up -d
   - and then run the app
   - cd synapse-ui
   - ng serve

## Prerequisites

Make sure you have the following installed:

- Java JDK 17+
- Docker
- Node.js & Angular CLI
- OpenSSL
- IntelliJ IDEA
  
