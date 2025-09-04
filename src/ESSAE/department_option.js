import fetch from "node-fetch";
import { logError } from "../utils/logger.js";
import { decodeFlowToken } from "../utils/flowToken.js";


const API_BASE_URL = "https://pilots.automatecrm.io/dev/002/essae/listeners/gallaboxapi.php?type=";

// Screen responses
export const SCREEN_RESPONSES = {
  APPOINTMENT: { screen: "screenone", data: { department: [], screen_name: "", screen_heading: "" } },
  SCREENONE: { screen: "screenone", data: {} },
};

// ----------- API UTILS -----------
const fetchAPI = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`API error (${url}):`, error);
    return null;
  }
};

// ----------- MAIN FUNCTION -----------
export const getNextScreen = async (flowData) => {
  const { action, data, flow_token } = flowData || {};

  // Handle ping
  if (action === "ping") return { data: { status: "active" } };

  if (!flow_token) {
    logError("No flow_token provided", null, { flowData });
    throw new Error("Missing flow_token");
  }

  // Decode the flow token using the reusable utility
  const { category, mobile, rawDecoded } = decodeFlowToken(flow_token);
  console.log("Decoded Token:", rawDecoded);
  console.log("Extracted values:", { category, mobile });

  // Handle client-side errors
  if (data?.error) return { data: { acknowledged: true } };

  // Handle initial request or data exchange
  if (action === "INIT" || action === "data_exchange") {
    const url = `${API_BASE_URL}${category}&mobile=${mobile}`;
    const result = await fetchAPI(url);

    console.log("API raw result:", JSON.stringify(result, null, 2));
    const category_new = category === "RES" ? "Reseller" : category === "BUH" ? "BUH" : category;
    console.log(url)

    return {
      
        screen: "SCREENONE",
        data: {
          department: result?.result || [],
          screen_name: category_new,
          screen_heading: `Select one ${category_new} from following`,
        },
      };
  }

  // Fallback for unhandled requests
  logError("Unhandled request body", null, { flowData });
  throw new Error("Unhandled endpoint request. Check action & screen.");
};
