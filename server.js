require('dotenv').config({ path: '.env' })
const express = require('express')
const app = express()
const path = require('path')
const { NCCOBuilder, Stream, Voice, Talk, HttpMethod } = require('@vonage/voice');

const TO_NUMBER = process.env.TO_NUMBER
const VONAGE_NUMBER = process.env.VONAGE_NUMBER
const BASE_URL = process.env.BASE_URL
const VONAGE_APPLICATION_ID = process.env.VONAGE_APPLICATION_ID
const VONAGE_APPLICATION_PRIVATE_KEY_PATH = process.env.VONAGE_APPLICATION_PRIVATE_KEY_PATH

// const vonage = new Vonage({
//   applicationId: VONAGE_APPLICATION_ID,
//   privateKey: VONAGE_APPLICATION_PRIVATE_KEY_PATH
// })

const voice = new Voice({
  applicationId: VONAGE_APPLICATION_ID,
  privateKey: VONAGE_APPLICATION_PRIVATE_KEY_PATH
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve contents of public folder in the /audio path
app.use('/audio', express.static(path.join(__dirname, 'public')))

const answer_url = BASE_URL + '/audio/answer'
const audio_url = BASE_URL + '/audio/music.mp3'
const event_url = BASE_URL + '/webhooks/events'

const makeOutboundCall = async (req, res) => {
  console.log('Making the outbound call...')

  try {
    console.log("Making the outbound call...");

    const resp = await voice.createOutboundCall(
      {
        to: [{ type: "phone", number: TO_NUMBER }],
        from: { type: "phone", number: VONAGE_NUMBER },
        answer_url: [answer_url],
        answer_method: HttpMethod.POST, // This will hit the NCCO response
        event_url: [event_url], // Event URL to track events like answered
      }
    );

    console.log("Outbound call response:", resp);
    res.status(200).send("Call initiated!");
  } catch (error) {
    console.error("Error making the outbound call:", error);
    res.status(500).send("Failed to make call.");
  }
}

app.get('/call', makeOutboundCall)

app.post("/audio/answer", (req, res) => {
  const builder = new NCCOBuilder();

  builder.addAction(
    new Talk('Here is some soothing music for you')
  )

  builder.addAction(
    new Stream(audio_url)
  );

  // Send back the generated NCCO
  res.json(builder.build());
});

// Event webhook to manage call events (like 'answered')
app.post("/webhooks/events", (req, res) => {
  if (req.body.status == "answered") {
    const call_uuid = req.body.uuid;
    console.log(`Call answered with UUID: ${call_uuid}`);
  }
  res.status(200).end();
});

// Serve app on port 3000
app.listen(3000, () => {
  console.log('Vonage Voice Server Demo running on port 3000')
})