// SCREEN_RESPONSES: Define screen data for WhatsApp Flows
export const SCREEN_RESPONSES = {
  APPOINTMENT: {
      screen: "APPOINTMENT",
      data: {
          department: [
              { id: "shopping", title: "my test" },
              { id: "clothing", title: "second test" },
              { id: "home", title: "third test" },
              { id: "electronics", title: "Electronics & Appliances" },
              { id: "beauty", title: "Beauty & Personal Care" }
          ],
          location: [
              { id: "1", title: "King’s Cross, Chennai" },
              { id: "2", title: "Oxford Street, Chennai" },
              { id: "3", title: "Covent Garden, Chennai" },
              { id: "4", title: "Piccadilly Circus, Chennai" }
          ],
          is_location_enabled: true,
          date: [
              { id: "2024-01-01", title: "Mon Jan 01 2024" },
              { id: "2024-01-02", title: "Tue Jan 02 2024" },
              { id: "2024-01-03", title: "Wed Jan 03 2024" }
          ],
          is_date_enabled: true,
          time: [
              { id: "10:30", title: "10:30" },
              { id: "11:00", title: "11:00", enabled: false },
              { id: "11:30", title: "11:30" },
              { id: "12:00", title: "12:00", enabled: false },
              { id: "12:30", title: "12:30" }
          ],
          is_time_enabled: true
      }
  },
  DETAILS: {
      screen: "DETAILS",
      data: {
          department: "beauty",
          location: "1",
          date: "2024-01-01",
          time: "11:30"
      }
  },
  SUMMARY: {
      screen: "SUMMARY",
      data: {
          appointment: "Beauty & Personal Care Department at King's Cross, Chennai\nMon Jan 01 2024 at 11:30.",
          details: "Name: John Doe\nEmail: john@example.com\nPhone: 123456789\n\nA free skin care consultation, please",
          department: "beauty",
          location: "1",
          date: "2024-01-01",
          time: "11:30",
          name: "John Doe",
          email: "john@example.com",
          phone: "123456789",
          more_details: "A free skin care consultation, please"
      }
  },
  SUCCESS: {
      screen: "SUCCESS",
      data: {
          extension_message_response: {
              params: {
                  flow_token: "REPLACE_FLOW_TOKEN",
                  some_param_name: "PASS_CUSTOM_VALUE"
              }
          }
      }
  }
};

// Function to determine the next screen in the flow
export const getNextScreen = async (decryptedBody) => {
  const { screen, data, action, flow_token } = decryptedBody;

  // Handle health check request
  if (action === "ping") {
      return { data: { status: "active" } };
  }

  // Handle error notification
  if (data?.error) {
      console.warn("Received client error:", data);
      return { data: { acknowledged: true } };
  }

  // Handle initial request when opening the flow
  if (action === "INIT") {
      return {
          ...SCREEN_RESPONSES.APPOINTMENT,
          data: {
              ...SCREEN_RESPONSES.APPOINTMENT.data,
              is_location_enabled: false,
              is_date_enabled: false,
              is_time_enabled: false
          }
      };
  }

  if (action === "data_exchange") {
      switch (screen) {
          case "APPOINTMENT":
              return {
                  ...SCREEN_RESPONSES.APPOINTMENT,
                  data: {
                      ...SCREEN_RESPONSES.APPOINTMENT.data,
                      is_location_enabled: Boolean(data.department),
                      is_date_enabled: Boolean(data.department) && Boolean(data.location),
                      is_time_enabled: Boolean(data.department) && Boolean(data.location) && Boolean(data.date),
                      location: SCREEN_RESPONSES.APPOINTMENT.data.location.slice(0, 3),
                      date: SCREEN_RESPONSES.APPOINTMENT.data.date.slice(0, 3),
                      time: SCREEN_RESPONSES.APPOINTMENT.data.time.slice(0, 3)
                  }
              };

          case "DETAILS":
              // Ensure IDs exist before accessing .title to prevent errors
              const department = SCREEN_RESPONSES.APPOINTMENT.data.department.find(dept => dept.id === data.department);
              const location = SCREEN_RESPONSES.APPOINTMENT.data.location.find(loc => loc.id === data.location);
              const date = SCREEN_RESPONSES.APPOINTMENT.data.date.find(d => d.id === data.date);

              const departmentName = department ? department.title : "Unknown";
              const locationName = location ? location.title : "Unknown";
              const dateName = date ? date.title : "Unknown";

              const appointment = `${departmentName} at ${locationName}\n${dateName} at ${data.time}`;
              const details = `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n"${data.more_details}"`;

              return {
                  ...SCREEN_RESPONSES.SUMMARY,
                  data: { appointment, details, ...data }
              };

          case "SUMMARY":
              return {
                  ...SCREEN_RESPONSES.SUCCESS,
                  data: {
                      extension_message_response: {
                          params: { flow_token }
                      }
                  }
              };

          default:
              break;
      }
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error("Unhandled endpoint request. Make sure you handle the request action & screen logged above.");
};
