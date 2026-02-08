Synapse
Synapse is a focused workspace designed to help you connect ideas, structure thoughts, and find clarity.
Built for thinkers who value intention and mindful productivity.

API Design
<img width="703" height="478" alt="API Design" src="https://github.com/user-attachments/assets/e159517d-3b3b-45b6-b1d1-c9fac8c18ea6" />
Class Diagram
<img width="763" height="773" alt="Class_Diagram drawio" src="https://github.com/user-attachments/assets/c4ed271c-9d5c-4ea9-8af5-51d4bef4d3c1" />
Deployment
<img width="493" height="257" alt="deploy" src="https://github.com/user-attachments/assets/2c34c21c-8129-4f40-ad08-3683bd1fb0a8" />

How to start the app on your localhost 
first use the local profile in application.yml 
then use your database values username password url
in your terminal generate a public and a private keys with the commend (windows) : openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048 //gen private keys using ssl 
also create in ressources a folder key then another folder loacal-only and two files private_key.pem and public_key.pem
also go to AWS and create an account the create an S3 bucket and an IAM User then put region and bucket name in application-local.yml
generate keys in your IAM user and set them to the OS (windows)
setx AWS_ACCESS_KEY_ID "YOUR_ACCESS_KEY"
setx AWS_SECRET_ACCESS_KEY "YOUR_SECRET_KEY"
setx AWS_REGION "YOUR_REGION"
also in the config pachage the MailConfi class change the email and paste your app password (you can create one by enabling 2FA into your gmail account
and then in intellij terminal go to synapse and start the database 
cd synapse 
docker-compose up -d 
