// flowToken.js
export function decodeFlowToken(flow_token) {
  let decoded = "";
  let category = "RES"; // default
  let mobile = "";

  try {
    decoded = Buffer.from(flow_token, "base64").toString("utf8");
    let parsed = JSON.parse(decoded);
    if (parsed.userToken) {
      const [cat, mob] = parsed.userToken.split(",");
      category = cat || "RES";
      mobile = mob || "";
      return { category, mobile, rawDecoded: decoded };
    }
  } catch {
    decoded = flow_token;
    const [cat, mob] = flow_token.split(",");
    category = cat || "RES";
    mobile = mob || "";
  }

  return { category, mobile, rawDecoded: decoded };
}
