const API_BASE = "https://whatsappphagwaraapi.softelsolutions.in/api/Bot";
const WEBHOOK_URL = "https://webhook.site/fc10df7f-3399-48cb-82ce-4680c80ad218";

const ENDPOINTS = {
  departments: `${API_BASE}/GetDepartments`,
  wards: `${API_BASE}/GetWards`,
  complaints: (deptId) => `${API_BASE}/GetComplaintTypes/${deptId}`,
};

const DEFAULT_SCREEN_TWO_DATA = {
  Department: [],
  Ward: [],
  Name: "",
  Mobile: "",
  Property_House: "",
  Address: "",
  Ward_Id: "",
  Select_Complaint: [],
  Selected_Department_Id: "",
  Selected_Complaint_Id: "",
  Selected_Complaint_Title: "",
  Landmark: "",
  Complaint_Details: "",
};

export const SCREEN_RESPONSES = {
  SCREENONE: { screen: "screenone", data: {} },
  SCREENTWO: { screen: "screentwo", data: { ...DEFAULT_SCREEN_TWO_DATA } },
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

const mapList = (list, idKey, titleKey) =>
  Array.isArray(list)
    ? list.map((item) => ({
        id: item[idKey]?.toString() || "",
        title: item[titleKey] || "",
      }))
    : [];

const fetchDepartments = async () => {
  const result = await fetchAPI(ENDPOINTS.departments);
  return result?.status === 1 ? mapList(result.data, "departmentId", "department") : [];
};

const fetchWards = async () => {
  const result = await fetchAPI(ENDPOINTS.wards);
  return result?.status === 1 ? mapList(result.data, "wardId", "ward") : [];
};

const fetchComplaints = async (departmentId) => {
  if (!departmentId) return [];
  const result = await fetchAPI(ENDPOINTS.complaints(departmentId));
  return result?.status === 1 ? mapList(result.data, "complaintTypeId", "complaintType") : [];
};

const submitComplaint = async (complaintData) => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaint: complaintData,
        metadata: { submissionTime: new Date().toISOString() },
      }),
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return { referenceNumber: `COMP-${Date.now()}` };
  } catch (error) {
    console.error("Error submitting complaint:", error);
    throw error;
  }
};

// ----------- SCREEN DATA INITIALIZER -----------
const initializeScreenTwoData = async (userData = {}) => {
  const [Department, Ward] = await Promise.all([fetchDepartments(), fetchWards()]);
  const Select_Complaint = userData.Selected_Department_Id
    ? await fetchComplaints(userData.Selected_Department_Id)
    : [];
  return {
    ...SCREEN_RESPONSES.SCREENTWO,
    data: {
      ...DEFAULT_SCREEN_TWO_DATA,
      ...userData,
      Department,
      Ward,
      Select_Complaint,
    },
  };
};

// ----------- SCREEN NAVIGATION -----------
export const getNextScreen = async (decryptedBody) => {
  const { screen, data, action } = decryptedBody;

  if (action === "ping") return { data: { status: "active" } };
  if (data?.error) return { data: { acknowledged: true } };
  if (action === "INIT") return SCREEN_RESPONSES.SCREENONE;

  if (action === "data_exchange") {
    if (screen === "screenone") {
      return await initializeScreenTwoData({
        Name: data.Name,
        Mobile: data.Mobile,
        Property_House: data["Property/House"],
        Address: data.Address,
      });
    }
    if (screen === "screentwo") {
      if (data.trigger === "Department_selected") {
        const complaints = await fetchComplaints(data.departmentId);
        return {
          ...(await initializeScreenTwoData({
            ...data,
            Selected_Department_Id: data.departmentId,
            Selected_Complaint_Id: "",
            Selected_Complaint_Title: "",
          })),
          data: {
            ...(await initializeScreenTwoData({
              ...data,
              Selected_Department_Id: data.departmentId,
            })).data,
            Select_Complaint: complaints,
            Selected_Department_Id: data.departmentId,
            Selected_Complaint_Id: "",
            Selected_Complaint_Title: "",
          },
        };
      }
      if (data.trigger === "Select_Complaint_selected") {
        const currentData = await initializeScreenTwoData({
          ...data,
          Selected_Department_Id: data.departmentId,
        });
        const selectedComplaint = currentData.data.Select_Complaint.find(
          (c) => c.id === data.complaintId
        );
        return {
          ...currentData,
          data: {
            ...currentData.data,
            Selected_Complaint_Id: data.complaintId,
            Selected_Complaint_Title: selectedComplaint?.title || "",
          },
        };
      }
      return await initializeScreenTwoData(data);
    }
  }

  if (action === "complete" && screen === "screentwo") {
    const complaintData = {
      name: data.Name,
      mobile: data.Mobile,
      propertyNo: data.Property_House,
      address: data.Address,
      departmentId: data.Selected_Department_Id,
      ward: data.Ward_Id,
      complaintTypeId: data.Selected_Complaint_Id,
      landmark: data.Landmark,
      details: data.Complaint_Details,
      timestamp: new Date().toISOString(),
    };
    return await submitComplaint(complaintData);
  }

  // Default fallback
  return SCREEN_RESPONSES.SCREENONE;
};
