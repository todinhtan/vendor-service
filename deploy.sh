#!/bin/bash

if [ "$1" == "dev" ]; then
    scp -i ~/.ssh/marketplace-dev.pem ./* ec2-user@marketplace.datademocrats.org:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-dev.pem -r ./models ec2-user@marketplace.datademocrats.org:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-dev.pem -r ./routes ec2-user@marketplace.datademocrats.org:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-dev.pem -r ./utils  ec2-user@marketplace.datademocrats.org:/home/ec2-user/payload/vendor-service
    ssh -i ~/.ssh/marketplace-dev.pem ec2-user@marketplace.datademocrats.org "
        cd /home/ec2-user/payload/vendor-service
        pm2 stop all
        npm i
        pm2 start index.js --watch
        exit
    "
elif [ "$1" == "staging" ]; then
    scp -i ~/.ssh/marketplace-stg.pem ./* ec2-user@marketplace-stg.noggin.space:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-stg.pem -r ./models ec2-user@marketplace-stg.noggin.space:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-stg.pem -r ./routes ec2-user@marketplace-stg.noggin.space:/home/ec2-user/payload/vendor-service
    scp -i ~/.ssh/marketplace-stg.pem -r ./utils  ec2-user@marketplace-stg.noggin.space:/home/ec2-user/payload/vendor-service
    ssh -i ~/.ssh/marketplace-stg.pem ec2-user@marketplace-stg.noggin.space "
        cd /home/ec2-user/payload/vendor-service
        pm2 stop all
        npm i
        pm2 start index.js --watch
        exit
    "

elif [ "$1" == "prod" ]; then
    scp -i ~/.ssh/marketplace-prod.pem target/rpm/RPMS/noarch/*.rpm ec2-user@marketplace-prod.noggin.space:/home/ec2-user/payload
    ssh -i ~/.ssh/marketplace-prod.pem ec2-user@marketplace-prod.noggin.space "
        cd /home/ec2-user/payload
        sudo kill $(lsof -P | grep ':9010' | awk '{print $2}')
        sudo yum -y remove card-service
        sudo yum -y install card-service*
        sudo chown -R card-service:card-service /var/log/card-service/
        sudo service card-service restart
        sudo rm card-service*
        exit
    "
else
    echo "Other environments not supported"
fi
echo "Done"