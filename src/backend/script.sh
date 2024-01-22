#!/bin/bash

# Install app dependencies
npm i

npm i cors

npx prisma generate
if [ ! -d "prisma/migrations" ]; then
  # Create the initial migration
  npx prisma migrate dev --name init
else
  # Run the migrations
  npx prisma migrate deploy
fi

exec "$@"
