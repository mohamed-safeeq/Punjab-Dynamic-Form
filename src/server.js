import express from "express";
import crypto from "crypto";
import dotenv from "dotenv-flow";

import { decryptRequest, encryptResponse, FlowEndpointException } from "./encryption.js";
// main flow logic (alias imports)
import { getNextScreen as FLOW_getNextScreen, SCREEN_RESPONSES as FLOW_SCREEN_RESPONSES } from "./Flow.js";
// ESSAE-specific flow + screens
import { getNextScreen as ESSAE_getNextScreen, SCREEN_RESPONSES as ESSAE_SCREEN_RESPONSES } from "./ESSAE/department_option.js";

dotenv.config({
  node_env: process.env.NODE_ENV,
  default_node_env: "development",
});

export function appointmentHandler(req, res) {
  console.log("➡️ Received request for APPOINTMENT screen (handler)");
  return res.json(ESSAE_SCREEN_RESPONSES.APPOINTMENT);
}

const app = express();

const {
  LOG_DATA = "true",
  PASSPHRASE = "test",
  APP_SECRET = "",
  PORT = "5001",
} = process.env;

// simple logging helpers
const logInfo = (message, meta) => {
  if (LOG_DATA === "true") {
    console.log("INFO:", message, meta ?? "");
  }
};
const logError = (message, meta) => {
  console.error("ERROR:", message, meta ?? "");
};

// Private key (for local/dev). In production load from env/secret store.
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,48A7D2BFFC7510C3

UJwoQJMgKGH3tOsi3S0ZFLkHhiCyxLnL/nGo0O+vEnqFcSTZQRF0oRdzymP0oy0L
WPk6EXMRGw6cdkSikdvqqlPhzvjZTx+nV1ESGaHoswo7cgagMfCCgzLbmww9akxs
Oh+eftZAjObDjSWXHZqZzpJJiJ5Yf/0fGSNmsLSGkOPNHYpP8Io14AZmFcztKf5J
nhEx+SQqbAVwB/5y31Nscfm25xl6S0kjUrtjCopYoIU7KM3zgBbtJPTid5sb1zlF
uZRB7PeSZjnosY8pe9zCASBvBkOREwqZ2RbSDdDzCqY007hUYKnKhFk+tXVCgZxu
v1GO1AuJIi+syhsAI5L0NTcZpldV8MDKQqCQv1xGIEbaNt0Cq4LgeaGRAGkpY3iz
eUBYi5YLaZDo5omSfuPmq3Ds7A4pV+pCcBZ+Yha7QQClbQGRL41D/QP34l7ziAMh
in0pzv9b0zEErkPfqTGor0sz8gn18IXYsTwGl83+wkdbywhGwMAh/aw0PPhV0SeP
FWr6klKfakEtttmlfItRWu9SX9otIDSsLCqtNlYkRHUZm993BzBt+dW6/wCAnili
qCdr377QCFl8PxbFKA3Rzcu8rAGZQwO+Xw6ARAouI3m/twM23ucZARclKDzNsWyX
seZmf2GYc+P4/mXXcspxTMt/1b8U+UU6RmaIRQsLsnv9A+sx/pLQ+msF8+5rv7i7
bTryyEC98tefngWrN7rcg5XmzLqwV62iSQPvCO4I86qPa7etki2FzmoSPDW/gjjR
9I/mSk3uEnQjl1I3ne1tvqqj9XNyLz/WDQji+gTr/Jb9UqRWXhyCIFPBKK4b3Qyn
oP2yhomN9XuE0qHe4YmaTYsB82CVnMwDH4HpIFR+GgfsaTCJzZebn7VBmpfRt6f+
D3oYbPxhMI4D6LitPD2dmfTdxdaT7y6YI6EICULtwMA6R3qxuj/WYmMqKcn/guGz
3ofeYKxACwNBUxR8RcjKsMJgk38x7VNtGyFPsNGpjjlJbrFrzgKzLPNccpYe0Xdb
6U5Hl0C52tjzjEXT1cDZXyQdqxaYcLC1g5n3r9EryZ0TmBIA9bjH7bI90rhqgDsE
I1bJlabAOQWbXin8lNdTmUyHMER+vveMHl/Y75uOGwxUu+Ti3HLXiPRlnE0vrb9S
CrxTLyKILSR2w5Wk04QfdwdVy46Xe/+p+pVySHuMem/dFuzyXGYX6VTybEHGWzpu
wjXt1wwCtylSMvtkolIvtFNNcOoYep/o/iOTgc+QHt/mRJpjW/bZYm9KT6I2+JcQ
2EjMVDa3xPl0il+gvIDLOEw8e+yYPGgRKKeLzE3R2M5JHgryAv9UjvSTOt8W/y9s
KrEpgVBbE99XebnpMpo8F5mYErb5YEvON9wp/ZRziaG0RiVrhu7xZHIipI/bXzQO
9hegJrtkMzxvdxwmW0uScdLBCxYoSf7X57TAre+dfaiz7m568nTTBhqlb3hhjwlA
tQ9wwfTXJbrCMy+Pb5hIo3JwdmCk8zU9JBTSzAZ5T++K2eySPCa/59Ec4xrD09gX
xxC5lN7tnsgZK5R+S2ao+V9bkQT82zfBKw5FeqCFFkzCpKPZDVCGtZTvNZPbvBMA
-----END RSA PRIVATE KEY-----`;

app.use(
  express.json({
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      // avoid logging full req object here (can be large)
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  }),
);

/* example comment block omitted */

const reqBodyLengthLogger = (req, res, next) => {
  const originalBody = req.rawBody;

  if (originalBody) {
    const bodyString = JSON.stringify(originalBody);
    const sizeInBytes = Buffer.byteLength(bodyString, "utf8");
    logInfo("Request body size", { sizeInBytes, path: req.path });
  } else {
    logInfo("Request has no body or body is empty", { path: req.path });
  }

  next();
};

const resTimeLogger = (req, res, next) => {
  const startHrTime = process.hrtime();
  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    logInfo("Request completed", { path: req.path, elapsedTimeInMs });
  });
  next();
};

const reqParserMiddleware = async (req, res, next) => {
  // Decrypt the request
  let decryptedRequestBody = null;
  try {
    if (!PRIVATE_KEY) {
      throw new Error(
        'Private key is empty. Please check your env variable "PRIVATE_KEY".'
      );
    }

    // decryptRequest expects the incoming encrypted payload (object with encrypted_key, initial_vector, data, etc.)
    decryptedRequestBody = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    logError("Failed to decrypt the request.", err);
    if (err instanceof FlowEndpointException) {
      return res.status(421).send();
    }
    return res.status(500).send();
  }

  // attach decrypted content to req.body for downstream handlers
  req.body = decryptedRequestBody;
  next();
};

app.use(reqBodyLengthLogger);
app.use(resTimeLogger);

/**
 * ESSAE handler wrapper (calls ESSAE flow getNextScreen)
 */
async function handleESSAE(decryptedBody) {
  // you can add additional orchestration here if needed
  return await ESSAE_getNextScreen(decryptedBody);
}

/**
 * Route Handlers
 */

app.get("/test", (req, res) => {
  console.log("➡️ Received request for APPOINTMENT screen");
  res.send("This is a test responsdcdde!");
});

// use the exported handler function too if needed
app.get("/flow/APPOINTMENT", appointmentHandler);

// ESSAE reservation flow
app.post("/ESSAE", reqParserMiddleware, async (req, res) => {
  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = req.body;

  if (LOG_DATA === "true") {
    logInfo("ESSAE Request", {
      screen: decryptedBody.screen,
      body: decryptedBody,
    });
  }

  const screenResponse = await handleESSAE(decryptedBody);

  if (LOG_DATA === "true") {
    logInfo("ESSAE Response", { response: screenResponse });
  }

  res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});

app.post("/", async (req, res) => {
  if (!isRequestSignatureValid(req)) {
    return res.status(432).send();
  }

  let decryptedRequest = null;
  try {
    decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
  } catch (err) {
    console.error(err);
    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }
    return res.status(500).send();
  }

  const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
  console.log("💬 Decrypted Request:", decryptedBody);

  const screenResponse = await FLOW_getNextScreen(decryptedBody);
  console.log("👉 Response to Encrypt:", screenResponse);

  res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
});

app.get("/", (req, res) => {
  res.send(`<pre>Nothing to see here from vscode.
Checkout README.md to start.</pre>`);
});

app.get("/health", (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  };

  res.status(200).json(data);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// request signature validation
function isRequestSignatureValid(req) {
  if (!APP_SECRET) {
    console.warn("App Secret is not set. Skipping signature validation.");
    return true;
  }

  const signatureHeader = req.get("x-hub-signature-256");
  if (!signatureHeader) {
    console.error("Missing x-hub-signature-256 header");
    return false;
  }

  const signatureHex = signatureHeader.replace(/^sha256=/, "");
  const signatureBuffer = Buffer.from(signatureHex, "hex");

  const hmac = crypto.createHmac("sha256", APP_SECRET);
  const digestBuffer = hmac.update(req.rawBody || "").digest();

  if (signatureBuffer.length !== digestBuffer.length) {
    console.error("Signature length mismatch");
    return false;
  }

  if (!crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
    console.error("Error: Request Signature did not match");
    return false;
  }

  return true;
}