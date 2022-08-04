# Setup (Enterprise Lite)

## Gateway

1. Attach the ethernet cable to LAN #2 on the gateway and connect this ethernet cable to your network.
1. Power the gateway with the 5V DC adapter.
1. Go onto the webapp to create a setup for your gateway https://app.pozyx.io.

## Anchors

*Use only CAT6 Ethernet Cables. (CAT5 doesn't have the speed required)*

1. Connect a ethernet cable to the ANCHOR IN (PORT #1) and GATEWAY (PORT #1)
1. Daisy Chain until the last anchor.

## Web App > Setup

Go through the following setup
1. Network Validation, Network Topology, Anchor Connectivity and Anchor Coordinates

## Activate Tag
Use the NFC reader to activate the tag.

1. Go to settings of the Pozyx Web App and get the CLOUD API Key and the topic.
1. Set an environment variable POZYX_CLOUD_API as the CLOUD_API Key that was obtained in step 1 and set the POZYX_CLOUD_TOPIC as the topic.
1. Run the run_ingest_data python manage.py command to get the stream of data.