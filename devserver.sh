#!/bin/sh
source .venv/bin/activate
python -m pip install python-dotenv
python -m flask --app main run -p $PORT --debug